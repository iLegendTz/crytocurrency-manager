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
    document.getElementById("info-container").setAttribute("hidden", true);
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
      console.log(cryptos);
      for (const [key, value] of Object.entries(cryptos)) {
        let opt = document.createElement("option");
        opt.value = value.symbol;
        opt.innerText = value.symbol;
        selectCrypto.appendChild(opt);
      }
    })
    .then(() => {
      setCurrentPriceIndicator(platform, selectCrypto.value);
      selectCrypto.removeAttribute("disabled");
    });

  selectCrypto.onchange = () => {
    if (currentPriceInterval != null) {
      clearInterval(currentPriceInterval);
    }

    document.getElementById("info-container").setAttribute("hidden", true);

    setCurrentPriceIndicator(platform, selectCrypto.value);
  };
};

const setCurrentPriceIndicator = (platform, crypto) => {
  currentPriceInterval = setInterval(async () => {
    let ticker = await platform.fetchTicker(crypto);
    document.getElementById("actual-price").innerText = formatPrice(
      ticker.last.toString()
    );
    document.getElementById("info-container").removeAttribute("hidden");

    console.log(ticker);
  }, 2000);
};

function formatPrice(price) {
  if (price.charAt(0) === "0") return price;
  let formatedPrice = "0.0";
  formatedPrice =
    price.slice(0, price.indexOf(".")) +
    price.toString().slice(price.indexOf("."), price.indexOf(".") + 3);

  return formatedPrice;
}
