/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import os from 'os';
import fs from 'fs';
import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import Store from 'electron-store'
import {
  createOrRewritePythonFile,
  resolveHtmlPath,
  generateDockerfile,
  runDocker,
  getFreePortInRange,
  stopDockerContainer,
  rerunDocker
} from './util';

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;
const store = new Store()

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});

ipcMain.on('reRunDocker', async (event, port) => {
  rerunDocker(port).then((activeUrl) => {
    mainWindow && mainWindow.loadURL(activeUrl);
    setTimeout(() => {
      mainWindow && mainWindow.loadURL(activeUrl);
    }, 2000)
  });
})

ipcMain.on('renderAndRunDocker', async (event, arg) => {
  const port = Number(store.get('port')) || 30000;
  const srcPath = path.join(os.homedir(), 'chatgpt_academic_data');

  if (app.isPackaged && !fs.existsSync(srcPath)) {
    fs.mkdirSync(srcPath);
  }

  const configPath = app.isPackaged ? path.join(srcPath, 'config.py') : 'config.py';
  const dockerPath = app.isPackaged ? path.join(srcPath, 'Dockerfile') : 'Dockerfile';
  createOrRewritePythonFile(configPath, arg);
  generateDockerfile(dockerPath);

  // run docker
  runDocker(app.isPackaged ? srcPath : './', port).then((activeUrl) => {
    mainWindow && mainWindow.loadURL(activeUrl);
    setTimeout(() => {
      mainWindow && mainWindow.loadURL(activeUrl);
    }, 2000)
  });
});

ipcMain.on('runByUrl', async (event, arg) => {
  const activeUrl = arg;
  if (typeof activeUrl === 'string') {
    mainWindow && mainWindow.loadURL(activeUrl);
  }
})

ipcMain.on('setStore', (_, key, value) => {
  store.set(key, value)
})

ipcMain.on('getStore', (_, key) => {
  let value = store.get(key)
  _.returnValue = value || ""
})

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  stopDockerContainer();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    getFreePortInRange(30000, 40000).then((port) => {
      store.set('port', port)
    })

    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
