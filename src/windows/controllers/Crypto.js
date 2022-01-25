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
    destroyChart(closingChart);
    clearAllIntervals();
    document.getElementsByName("info-container").forEach((element) => {
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
    document.getElementById("timeframes").style.visibility = "hidden";
    clearInterval(updateChartInterval);
    destroyChart(closingChart);
    await setChart(platform, selectCrypto.value);

    document.getElementById("timeframes").style.visibility = "visible";
  };

  selectCrypto.onchange = () => {
    clearAllIntervals();
    destroyChart(closingChart);

    document.getElementsByName("info-container").forEach((element) => {
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
        document.getElementById("last-price").innerText =
          "$" + formatValue(ticker.last.toString()).toLocaleString();

        document.getElementById("change-price-value").innerText =
          formatValue(ticker.change.toString()).toLocaleString() +
          " | " +
          ticker.percentage.toFixed(2) +
          "%";

        document.getElementById("max-price-value").innerHTML =
          "$" + formatValue(ticker.last.toString()).toLocaleString();

        document.getElementById("min-price-value").innerHTML =
          "$" + formatValue(ticker.low.toString()).toLocaleString();

        configureChartInterval(ticker);
      })
      .then(() => {
        document.getElementsByName("info-container").forEach((element) => {
          element.style.visibility = "visible";
        });
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

    case "43800":
      chartTimeFrame = "1M";
      break;

    case "525600":
      chartTimeFrame = "1y";
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

const destroyChart = (chart) => {
  chart.destroy();
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
