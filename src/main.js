const { app, BrowserWindow, Menu } = require("electron");

const isProduction = process.env.NODE_ENV === "production";

if (!isProduction) {
  require("electron-reload")(__dirname);
}

const path = require("path");

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(
        __dirname,
        "windows",
        "controllers",
        "preloadIndex.js"
      ),
    },
    show: false,
  });

  createMenu(win);

  win.loadFile(path.join(__dirname, "windows/views/index.html"));
  win.once("ready-to-show", () => {
    win.show();
  });
};

const createMenu = (win) => {
  let menu = Menu.buildFromTemplate([]);

  if (!isProduction) {
    const template = [
      {
        label: "devTools",
        click: () => {
          win.webContents.openDevTools();
        },
      },
    ];
    menu = Menu.buildFromTemplate(template);
  }

  Menu.setApplicationMenu(menu);
};

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
