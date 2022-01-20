const ccxt = require("ccxt");

const { initMarketList } = require("./Crypto");

window.addEventListener("DOMContentLoaded", () => {
  initMarketList();
});
