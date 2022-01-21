const ccxt = require("ccxt");

let currentPriceInterval;

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
    if (currentPriceInterval != null) {
      clearInterval(currentPriceInterval);
    }
    document.getElementById("info-container").style.visibility = "hidden";

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
      selectCrypto.removeAttribute("disabled");
    });

  selectCrypto.onchange = () => {
    if (currentPriceInterval != null) {
      clearInterval(currentPriceInterval);
    }

    document.getElementById("info-container").style.visibility = "hidden";
    setCurrentValues(platform, selectCrypto.value);
  };
};

const setCurrentValues = (platform, crypto) => {
  currentPriceInterval = setInterval(async () => {
    // console.log(await platform.fetchOrderBook(crypto));
    await platform
      .fetchTicker(crypto)
      .then((ticker) => {
        document.getElementById("last-price").innerText =
          "$" + formatValue(ticker.last.toString());

        document.getElementById("change-price-value").innerText =
          formatValue(ticker.change.toString()) +
          " | " +
          ticker.percentage.toFixed(2) +
          "%";

        document.getElementById("max-price-value").innerHTML =
          "$" + formatValue(ticker.last.toString());

        document.getElementById("min-price-value").innerHTML =
          "$" + formatValue(ticker.low.toString());
      })
      .then(() => {
        document.getElementById("info-container").style.visibility = "visible";
      });
  }, 2000);
};

function formatValue(value) {
  if (value.charAt(0) === "0") return value;
  let formatedValue = 0.0;
  formatedValue =
    value.slice(0, value.indexOf(".")) +
    value.toString().slice(value.indexOf("."), value.indexOf(".") + 3);

  return parseFloat(formatedValue).toLocaleString();
}
