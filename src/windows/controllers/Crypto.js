const ccxt = require("ccxt");
const Chart = require("chart.js");
const zoomPlugin = require("chartjs-plugin-zoom");

let currentPriceInterval, updateChartInterval;
let closingChart;
let isTimePassedToUpdateChart = false;

exports.initMarketList = () => {
  let selectPlatform = document.getElementById("platforms");
  const exchanges = ccxt.exchanges;

  exchanges.forEach((e) => {
    let opt = document.createElement("option");
    opt.value = e;
    opt.innerText = e;
    selectPlatform.appendChild(opt);
  });

  selectPlatform.onchange = () => {
    destroyChart();
    clearAllIntervals();
    [...document.getElementsByClassName("invisible")].forEach((element) => {
      element.style.visibility = "hidden";
    });

    initCryptoList(selectPlatform.value);
  };

  initCryptoList(exchanges[0]);
};

const initCryptoList = async (platformOption) => {
  let platform = new ccxt[platformOption]({ enableRateLimit: true });
  let selectCrypto = document.getElementById("cryptos");

  selectCrypto.setAttribute("disabled", true);

  while (selectCrypto.length > 0) {
    selectCrypto.remove(0);
  }

  await platform
    .loadMarkets()
    .then((cryptos) => {
      for (const [key, value] of Object.entries(cryptos)) {
        let opt = document.createElement("option");
        opt.value = value.symbol;
        opt.innerText = value.symbol;
        selectCrypto.appendChild(opt);
      }
    })
    .then(() => {
      setCurrentValues(platform, selectCrypto.value);
      setChart(platform, selectCrypto.value);
      selectCrypto.removeAttribute("disabled");
    });

  document.getElementById("timeframes").onchange = async (option) => {
    [...document.getElementsByClassName("invisible")].forEach((element) => {
      element.style.visibility = "hidden";
    });

    clearInterval(updateChartInterval);
    destroyChart();

    await setChart(platform, selectCrypto.value).then(() => {
      [...document.getElementsByClassName("invisible")].forEach((element) => {
        element.style.visibility = "visible";
      });
    });
  };

  selectCrypto.onchange = () => {
    clearAllIntervals();
    destroyChart();

    [...document.getElementsByClassName("invisible")].forEach((element) => {
      element.style.visibility = "hidden";
    });
    setCurrentValues(platform, selectCrypto.value);
    setChart(platform, selectCrypto.value);
  };
};

const setCurrentValues = (platform, crypto) => {
  currentPriceInterval = setInterval(async () => {
    await platform
      .fetchTicker(crypto)
      .then((ticker) => {
        try {
          document.getElementById("last-price").innerText =
            "$" + formatValue(ticker.last.toString()).toLocaleString();
        } catch (e) {
          document.getElementById("last-price").innerText = "No info";
        }

        try {
          document.getElementById("change-price-value").innerText =
            formatValue(ticker.change.toString()).toLocaleString() +
            " | " +
            ticker.percentage.toFixed(2) +
            "%";
        } catch (e) {
          document.getElementById("change-price-value").innerText = "No info";
        }

        try {
          document.getElementById("max-price-value").innerHTML =
            "$" + formatValue(ticker.last.toString()).toLocaleString();
        } catch (e) {
          document.getElementById("max-price-value").innerHTML = "No info";
        }

        try {
          document.getElementById("min-price-value").innerHTML =
            "$" + formatValue(ticker.low.toString()).toLocaleString();
        } catch (e) {
          document.getElementById("min-price-value").innerHTML = "No info";
        }

        configureChartInterval(ticker);
      })
      .then(() => {
        if (closingChart) {
          [...document.getElementsByClassName("invisible")].forEach(
            (element) => {
              element.style.visibility = "visible";
            }
          );
        }
      });
  }, 2000);
};

const setChart = async (platform, crypto) => {
  let chartTimeFrame = "1m";
  switch (document.getElementById("timeframes").value) {
    case "1":
      chartTimeFrame = "1m";
      break;

    case "60":
      chartTimeFrame = "1h";
      break;

    case "1440":
      chartTimeFrame = "1d";
      break;
  }

  await platform.fetchOHLCV(crypto, chartTimeFrame).then((ohlcv) => {
    let labels = [];
    let data = [];

    ohlcv.forEach((e) => {
      labels.push(timestampToFormatedDate(e[0]));
      data.push(e[4]);
    });

    const chartData = {
      labels: labels,
      datasets: [
        {
          label: crypto,
          data: data,
          fill: false,
          borderColor: "rgb(75, 192, 192)",
          tension: 0.1,
        },
      ],
    };

    const config = {
      type: "line",
      data: chartData,
      options: {
        plugins: {
          zoom: {
            zoom: {
              wheel: {
                enabled: true,
              },
              pinch: {
                enabled: true,
              },
              mode: "x",
            },
          },
        },
      },
    };

    if (!closingChart) {
      closingChart = new Chart(
        document.getElementById("closing-chart"),
        config
      );
    }
  });
};

const configureChartInterval = (ticker) => {
  const time = document.getElementById("timeframes").value;

  if (!updateChartInterval) {
    updateChartInterval = setInterval(() => {
      isTimePassedToUpdateChart = true;
    }, 1000 * 60 * time);
  }

  if (closingChart && isTimePassedToUpdateChart) {
    addChartData(
      closingChart,
      timestampToFormatedDate(ticker.timestamp),
      formatValue(ticker.last.toString())
    );

    isTimePassedToUpdateChart = false;
    clearInterval(updateChartInterval);
    updateChartInterval = null;
  }
};

const addChartData = (chart, label, data) => {
  chart.data.datasets[0].data.push(data);
  chart.data.labels.push(label);
  chart.update();
};

const destroyChart = () => {
  closingChart.destroy();
  closingChart = null;
};

const formatValue = (value) => {
  if (value.charAt(0) === "0" || value.slice(0, 2) === "-0") return value;
  let formatedValue = 0.0;
  formatedValue =
    value.slice(0, value.indexOf(".")) +
    value.toString().slice(value.indexOf("."), value.indexOf(".") + 3);

  return parseFloat(formatedValue);
};

const timestampToFormatedDate = (timestamp) => {
  const date = new Date(timestamp);
  const dateValues =
    date.getFullYear() +
    "/" +
    date.getMonth() +
    1 +
    "/" +
    date.getDate() +
    " " +
    date.getHours() +
    ":" +
    date.getMinutes() +
    ":" +
    date.getSeconds();

  return dateValues;
};

const clearAllIntervals = () => {
  if (currentPriceInterval != null) {
    clearInterval(currentPriceInterval);
  }
  if (updateChartInterval != null) {
    clearInterval(updateChartInterval);
  }
};
