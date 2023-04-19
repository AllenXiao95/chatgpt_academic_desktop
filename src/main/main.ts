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
import { app, BrowserWindow, shell, ipcMain, dialog } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import Store from 'electron-store'
import {
  writeToFile,
  resolveHtmlPath,
  generateDockerfile,
  runDocker,
  getFreePortInRange,
  rerunDocker,
  checkDockerStatus,
  checkDockerContainerStatus
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

// Listen for IPC messages with the channel 'ipc-example'
ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});

// Listen for IPC messages with the channel 'reRunDocker'
ipcMain.on('reRunDocker', async (event, port) => {
  rerunDocker(port).then((activeUrl) => {
    store.set("lastRedirectUrl", activeUrl);
    mainWindow && mainWindow.loadURL(activeUrl);
    setTimeout(() => {
      mainWindow && mainWindow.loadURL(activeUrl);
    }, 3000)
  });
})

// Listen for IPC messages with the channel 'renderAndRunDocker'
ipcMain.on('renderAndRunDocker', async (event, arg) => {
  let isListening = true;
  const port = Number(store.get('port')) || 30000;
  const srcPath = path.join(os.homedir(), 'chatgpt_academic_data');

  if (app.isPackaged && !fs.existsSync(srcPath)) {
    fs.mkdirSync(srcPath);
  }

  const configPath = app.isPackaged ? path.join(srcPath, 'config.py') : 'config.py';
  const dockerPath = app.isPackaged ? path.join(srcPath, 'Dockerfile') : 'Dockerfile';
  await writeToFile(configPath, arg);
  await generateDockerfile(dockerPath);

  // run docker
  runDocker(app.isPackaged ? srcPath : './', port).catch((err) => {
    isListening = false
    console.log("runDocker::", err);
  });

  const activeUrl = `http://localhost:${port}`;
  // set interval to fetch container is exist or not
  let interval = setInterval(async () => {
    checkDockerContainerStatus().then((isPass) => {
      console.log("checkDockerContainerStatus::", isPass);
      if (isPass) {
        clearInterval(interval)
        isListening = false
        store.set("lastRedirectUrl", activeUrl);
        mainWindow && mainWindow.loadURL(activeUrl);
        setTimeout(() => {
          mainWindow && mainWindow.loadURL(activeUrl);
        }, 3000)
      }
    })
  }, 5000)

});

// Listen for IPC messages with the channel 'runByUrl'
ipcMain.on('runByUrl', async (event, arg) => {
  const activeUrl = arg;
  if (typeof activeUrl === 'string') {
    mainWindow && mainWindow.loadURL(activeUrl);
  }
})

// Listen for IPC messages with the channel 'setStore'
ipcMain.on('setStore', (_, key, value) => {
  store.set(key, value)
})

// Listen for IPC messages with the channel 'getStore'
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

// Create the main window
const createWindow = async () => {
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

  // Load the main HTML file
  mainWindow.loadURL(resolveHtmlPath('index.html'));

  // Check the status of Docker
  checkDockerStatus().then(() => {
    // wait for other process
  }).catch(() => {
    // Show a warning dialog if Docker is not ready
    dialog.showMessageBox({
      type: 'warning',
      title: 'Warning',
      message: 'Dcoker方式可能无法使用, 请检查Docker Service是否就绪!',
    })
  })

  // Show the main window when it is ready
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

  // Close the main window when it is closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Build the menu
  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Start the app updater
  new AppUpdater();
};

// Quit the app when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Create the main window and get a free port
app
  .whenReady()
  .then(() => {
    createWindow();
    getFreePortInRange(30000).then((port) => {
      store.set('port', port)
    })

    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
