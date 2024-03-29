// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import path from 'path';
import os from 'os';
import fs from 'fs';
import { EventEmitter } from 'events';
import {
  app,
  BrowserWindow,
  Tray,
  Menu,
  shell,
  dialog,
  ipcMain
} from 'electron';
import isDev from 'electron-is-dev';
import log from 'electron-log';
import contextMenu from 'electron-context-menu';
import MenuBuilder from './menu';
import iConfig from './mainWindow/constants/config';
import packageInfo from '../package.json';
import MessageRelayer from './MessageRelayer';
import {autoUpdater} from 'electron-updater';

const windowEvents = new EventEmitter();

export let messageRelayer = null;

let quitTimeout = null;

/** disable background throttling so our sync
 *   speed doesn't crap out when minimized
 */
app.commandLine.appendSwitch('disable-background-timer-throttling');

const { version } = packageInfo;

let isQuitting;
let tray = null;
let trayIcon = null;
let config = null;
const homedir = os.homedir();
let frontendReady = false;
let backendReady = false;
let configReady = false;

const directories = [
  `${homedir}/.protonwallet`,
  `${homedir}/.protonwallet/logs`
];

const [programDirectory] = directories;

log.debug('Checking if program directories are present...');
directories.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
    log.debug(`${dir} directories not detected, creating...`);
  }
});

if (fs.existsSync(`${programDirectory}/config.json`)) {
  const rawUserConfig = fs
    .readFileSync(`${programDirectory}/config.json`)
    .toString();

  // check if the user config is valid JSON before parsing it
  try {
    config = JSON.parse(rawUserConfig);
  } catch {
    // if it isn't, set the internal config to the user config
    config = iConfig;
  }
  configReady = true;
  if (frontendReady && backendReady) windowEvents.emit('bothWindowsReady');
} else {
  config = iConfig;
  configReady = true;
  if (frontendReady && backendReady) windowEvents.emit('bothWindowsReady');
}

if (fs.existsSync(`${programDirectory}/addressBook.json`)) {
  const rawAddressBook = fs
    .readFileSync(`${programDirectory}/addressBook.json`)
    .toString();

  // check if the user addressBook is valid JSON before parsing it
  try {
    JSON.parse(rawAddressBook);
  } catch {
    // if it isn't, backup the invalid JSON and overwrite it with an empty addressBook
    fs.copyFileSync(
      `${programDirectory}/addressBook.json`,
      `${programDirectory}/addressBook.notvalid.json`
    );
    fs.writeFileSync(`${programDirectory}/addressBook.json`, '[]');
  }
} else {
  fs.writeFileSync(`${programDirectory}/addressBook.json`, '[]');
}

const daemonLogFile = path.resolve(directories[1], 'TurtleCoind.log');
const backendLogFile = path.resolve(directories[1], 'wallet-backend.log');
fs.closeSync(fs.openSync(daemonLogFile, 'w'));

try {
  fs.closeSync(fs.openSync(backendLogFile, 'wx'));
} catch {
  log.debug('Backend log file found.');
}

if (config) {
  isQuitting = !config.closeToTray;
}

if (os.platform() !== 'win32') {
  trayIcon = path.join(__dirname, './mainWindow/images/icon_color_64x64.png');
} else {
  trayIcon = path.join(__dirname, './mainWindow/images/icon.ico');
}

if (os.platform() === 'darwin') {
  isQuitting = true;
}

let mainWindow = null;
let backendWindow = null;

if (process.env.NODE_ENV === 'production') {
  // eslint-disable-next-line global-require
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

require('electron-debug')();

let submenu;

const installExtensions = async () => {
  // eslint-disable-next-line global-require
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS', 'REDUX_DEVTOOLS'];

  return Promise.all(
    extensions.map(name => installer.default(installer[name], forceDownload))
  ).catch(console.log);
};

/**
 * Add event listeners...
 */

const isSingleInstance = app.requestSingleInstanceLock();

if (!isSingleInstance) {
  log.debug(
    "There's an instance of the application already locked, terminating..."
  );
  app.quit();
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  }
}

app.on('before-quit', () => {
  log.debug('Exiting application.');
  isQuitting = true;
});

app.on('window-all-closed', () => {
  app.quit();
});

contextMenu({
  showInspectElement: isDev,
  showSaveImage: false,
  showCopyImage: false,
  showCopyLink: false,
  prepend: (defaultActions, params) => [
    {
      label: 'Search block explorer for this hash',
      // Only show it when right-clicking a hash
      visible: params.selectionText.trim().length === 64,
      click: () => {
        shell.openExternal(
          `https://explorer.kryptokrona.se/transaction.html?hash=${encodeURIComponent(
            params.selectionText
          )}`
        );
      }
    },
    {
      label: 'Cut',
      role: 'cut',
      enabled: false,
      visible:
        params.linkURL.includes('#addressinput') &&
        params.inputFieldType !== 'plainText'
    },
    {
      label: 'Copy',
      role: 'copy',
      enabled: false,
      visible:
        params.linkURL.includes('#addressinput') &&
        params.inputFieldType !== 'plainText'
    },
    {
      label: 'Paste',
      role: 'paste',
      visible:
        params.linkURL.includes('#addressinput') &&
        params.inputFieldType !== 'plainText'
    }
  ]
});

let frameActivated = true;
if (os.platform() == 'darwin') {
  frameActivated = false;
 }


 autoUpdater.on('update-downloaded', () => {

   autoUpdater.quitAndInstall()

 });

app.on('ready', async () => {
  await installExtensions();

  autoUpdater.checkForUpdates();



  mainWindow = new BrowserWindow({
    title: `Kryptokrona Wallet v${version}`,
    useContentSize: true,
    show: false,
    resizable: false,
    width: 500,
    height: 725,
    minWidth: 500,
    minHeight: 725,
    frame: false,
    transparent: true,
    icon: path.join(__dirname, 'images/icon.png'),
    webPreferences: {
      nativeWindowOpen: true,
      nodeIntegrationInWorker: true,
      nodeIntegration: true
    }
  });

  backendWindow = new BrowserWindow({
    show: false,
    frame: false,
    webPreferences: {
      nodeIntegration: true
    }
  });

  if (os.platform() !== 'darwin') {
    tray = new Tray(trayIcon);

    tray.setContextMenu(
      Menu.buildFromTemplate([
        {
          label: 'Show App',
          click() {
            if (mainWindow) {
              mainWindow.show();
            }
          }
        },
        {
          label: 'Quit',
          click() {
            isQuitting = true;
            quitTimeout = setTimeout(app.exit, 1000 * 10);
            messageRelayer.sendToBackend('stopRequest');
          }
        }
      ])
    );

    tray.on('click', () => showMainWindow());
  }

  mainWindow.loadURL(`file://${__dirname}/mainWindow/app.html`);
  backendWindow.loadURL(`file://${__dirname}/backendWindow/app.html`);

  mainWindow.webContents.on('did-finish-load', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    frontendReady = true;
    if (backendReady && configReady) windowEvents.emit('bothWindowsReady');
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  backendWindow.webContents.on('did-finish-load', () => {
    if (!backendWindow) {
      throw new Error('"backendWindow" is not defined');
    }
    backendReady = true;
    if (frontendReady && configReady) windowEvents.emit('bothWindowsReady');
    log.debug('Backend window finished loading.');
  });

  mainWindow.on('close', event => {
    event.preventDefault();

    if (!isQuitting && mainWindow) {
      log.debug('Closing to system tray or dock.');
      mainWindow.hide();
    } else {
      try {
      isQuitting = true;
      quitTimeout = setTimeout(app.exit, 1000 * 1);
    }
   catch (err) {
    console.log(err);
  }
}
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    backendWindow = null;
  });

  mainWindow.on('unresponsive', () => {
    // catch the unresponsive event
    const userSelection = dialog.showMessageBox(mainWindow, {
      type: 'error',
      buttons: ['Kill', `Don't Kill`],
      title: 'Unresponsive Application',
      message: 'The application is unresponsive. Would you like to kill it?'
    });
    if (userSelection === 0) {
      process.exit(1);
    }
  });

  process.on('uncaughtException', () => {
    // catch uncaught exceptions in the main process
    dialog.showErrorBox(
      'Uncaught Error',
      'An unexpected error has occurred. Please report this error, and what you were doing to cause it.'
    );
    process.exit(1);
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  submenu = menuBuilder.buildMenu();
});

function showMainWindow() {
  if (mainWindow) {
    mainWindow.show();
  }
}

ipcMain.on('open-submenu', () => {
  submenu.popup();
});


windowEvents.on('bothWindowsReady', () => {
  messageRelayer = new MessageRelayer(mainWindow, backendWindow);
  messageRelayer.sendToBackend('config', config);
  messageRelayer.sendToFrontend('config', {
    config,
    configPath: directories[0]
  });
});

ipcMain.on('closeToTrayToggle', (event: any, state: boolean) => {
  toggleCloseToTray(state);
});

ipcMain.on('backendStopped', () => {
  clearTimeout(quitTimeout);
  app.exit();
});


function toggleCloseToTray(state: boolean) {
  isQuitting = !state;
}
