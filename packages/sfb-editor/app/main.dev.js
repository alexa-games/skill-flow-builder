/* 
 * Copyright 2018 Amazon.com, Inc. and its affiliates. All Rights Reserved.
 *
 * SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
 *
 * Licensed under the Amazon Software License (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at
 *
 *   http://aws.amazon.com/asl/
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

/* eslint global-require: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `yarn build` or `yarn build-main`, this file is compiled to
 * `./app/main.prod.js` using webpack. This gives us some performance wins.
 *
 */

import log from 'electron-log';
import { app, BrowserWindow, ipcMain, shell, dialog } from 'electron';
const windowStateKeeper = require('electron-window-state');

import MenuBuilder from './menu';

import { initUncaughtExceptionLogging } from './utils-main';


let mainWindow = null;

log.transports.console.level = false;
log.transports.file.level = 'info';
// initUncaughtExceptionLogging();

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

if (
  process.env.NODE_ENV === 'development' ||
  process.env.DEBUG_PROD === 'true'
) {
  log.transports.console.level = 'debug';
  require('electron-debug')();

  initUserDataPathForDebugMode();
}

function initUserDataPathForDebugMode() {
  const appName = 'SFB Editor';
  app.setName(appName);
  app.setPath('userData', app.getPath('userData').replace(/Electron/i, appName));
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS', 'REDUX_DEVTOOLS'];

  return Promise.all(
    extensions.map(name => installer.default(installer[name], forceDownload))
  ).catch(err => {
    log.error(err);
  });
};

const initApp = async () => {
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.DEBUG_PROD === 'true'
  ) {
    await installExtensions();
  }

  const mainWindowState = windowStateKeeper({
    defaultWidth: 1024,
    defaultHeight: 780
  });

  mainWindow = new BrowserWindow({
    show: false,
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    minWidth: 960,
    minHeight: 780,
    titleBarStyle: 'default',
    webPreferences: {
      webviewTag: true,
      nodeIntegration: true,
      enableRemoteModule: true
    }
  });

  mainWindow.loadURL(`file://${__dirname}/app.html`);
  mainWindowState.manage(mainWindow);

  // @TODO: Use 'ready-to-show' event
  //        https://github.com/electron/electron/blob/master/docs/api/browser-window.md#using-ready-to-show-event
  mainWindow.webContents.on('dom-ready', async () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }

    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  // Send message to redux to toggle the stack views
  mainWindow.toggleStackViews = () => {
    mainWindow.webContents.send('toggle-stack-views');
  };

  // Send message to redux to toggle the stack views
  mainWindow.clearVoicePreviewCache = () => {
    mainWindow.webContents.send('clear-voice-preview-cache');
  };

  // Send message to redux to save project
  mainWindow.sendMenuCommand = command => {
    mainWindow.webContents.send(command);
  };


  // Clear local storage settings and refresh the editor
  mainWindow.clearLocalSettingsAndRefresh = () => {

    const options = {
      buttons: ["Yes", "Cancel"],
      title: "Reset Editor?",
      message: "Please save any unfinished changes or they will be lost.\n\nThis will reset the editor to its original state, but will not delete your saved projects or data.\n\n Continue?"
    }

    // Make a modal dialog box
    dialog.showMessageBox(mainWindow, options, response => {
      if (response === 0) {
        mainWindow.webContents.session.clearStorageData({}, () => {
          mainWindow.webContents.reload();
        });
      }
    });
  };

  mainWindow.on('close', e => {
    // handled in App component
    e.preventDefault();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();
};

const focusApp = () => {
  // Someone tried to run a second instance, we should focus our window.
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
};

/**
 * Add event listeners...
 */

// Avoid additional instances starting up.
// https://github.com/electron/electron/blob/master/docs/api/app.md#apprequestsingleinstancelock
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', focusApp);
  app.on('ready', initApp);
  app.on('window-all-closed', async () => {
    app.quit();
  });
  // Listen for web view links being clicked that want to open a new window
  app.on('web-contents-created', (e, contents) => {
    // Check for a webview
    if (contents.getType() === 'webview') {
      // Listen for any new window events
      contents.on('new-window', (err, url) => {
        err.preventDefault();
        shell.openExternal(url);
      });
    }
  });
  ipcMain.on('polly-preview-login', (event, arg) => {
    log.info('Received Polly Preview Login');
    mainWindow.webContents.send('access-token-updated', arg);
  });
  ipcMain.on('update-title', (event, arg) => {
    mainWindow.setTitle(arg);
  })
}
