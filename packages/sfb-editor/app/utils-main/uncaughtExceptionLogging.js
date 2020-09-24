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

import log from 'electron-log';
const { app, dialog, ipcMain, ipcRenderer } = require('electron');

let exiting = false;

export function initUncaughtExceptionLogging() {
  if (process.type === 'renderer') {
    window.addEventListener('error', onRendererError);
    window.addEventListener('unhandledrejection', onRendererRejection);
  } else {
    process.on('uncaughtException', onError);
    process.on('unhandledRejection', onRejection);
    ipcMain.on('show-fatal-error-dialog', handleFatalErrorDialogMessage);
  }
}

function handleFatalErrorDialogMessage() {
  if (!exiting) {
    exiting = true;
    showDialogErrorBox();
    exitProcess();
  }
}

function handleError() {
  if (process.type === 'renderer') {
    ipcRenderer.send('show-fatal-error-dialog');
  } else {
    showDialogErrorBox();
    exitProcess();
  }
}

function onError(e) {
  log.error(e);
  handleError();
}

function onRejection(reason) {
  log.error(reason);
  handleError();
}

function onRendererError(event) {
  event.preventDefault();
  onError(event.error);
}

function onRendererRejection(event) {
  event.preventDefault();
  onRejection(event.reason);
}

function showDialogErrorBox() {
  dialog.showErrorBox(
    'An Error Occurred',
    `Please, report this error along with the log file, ${log.transports.file.findLogPath()}, to the Amazon Alexa Games team.`);
}

function exitProcess() {
  app.exit(-1);
}
