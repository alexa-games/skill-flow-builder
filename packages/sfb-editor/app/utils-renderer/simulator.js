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

import { ABCDebugger } from '@alexa-games/sfb-story-debugger';
import { EventEmitter } from 'events';
import { CoreExtensionLoader, ConfigAccessor } from '@alexa-games/sfb-skill';
import path from 'path';
import log from 'electron-log';
import { remote } from 'electron';

import { getResourcesPath, readJson } from '../utils-main';

import { DEFAULT_LOCALE, EDITOR_FFMPEG_LOCATION_PROPERTY } from '../data/constants';
import { getDefaultPollyVoiceForLocale } from '../data/polly-voices';

const fs = require('fs');
const fse = require('fs-extra');
const {app} = remote;

class Logger {
  buffer = '';

  listeners = [];

  log = input => {
    this.buffer += `${input}\n`;
    this.listeners.forEach(fn => fn('LOG', input));
  };

  clear = () => {
    this.buffer = '';
    this.listeners.forEach(fn => fn('CLEAR'));
  };

  logError = err => {
    this.buffer += `${err}\n`;
    this.listeners.forEach(fn => fn('ERROR', err));

    if (typeof this.responseHandler === 'function') {
      this.responseHandler({
        error: err,
        type: 'error',
        dedup: false,
        triggerToast: true,
        message: err.message
      });
    }
  };

  outputResponse = (response, gameState) => {
    if (typeof this.responseHandler === 'function') {
      this.responseHandler(response, gameState);
    }
    this.listeners.forEach(fn => fn('OUTPUT', response));
  };

  addListener = fn => this.listeners.push(fn);
}

const DEBUG_LOGGER = (...args) => {
  if (args[0] !== 'OUTPUT') return;
  log.info();
  log.info(
    `---------------------------------------------------------------`
  );
  log.info(...args);
  log.info(
    `---------------------------------------------------------------`
  );
  log.info();
};

let logger;
let emitter;
let abcDebugger;

export async function startSimulator(
  storyJson,
  projectPath,
  languageStrings,
  locale,
  debug,
  polly,
  dispatch
) {
  const currentLocale = locale || DEFAULT_LOCALE;

  const resourcesPath = getResourcesPath(projectPath, currentLocale);

  if (abcDebugger) {
    sendSimulatorCommand(() => null, '!x');
  }

  let storyConfigPath = path.resolve(projectPath, 'abcConfig.json');
  if (!fs.existsSync(storyConfigPath)) {
    const oldConfigPath = path.resolve(
      projectPath,
      '..',
      '..',
      '..',
      'lib',
      'dist',
      'abcConfig',
      'abcConfig.json'
    );

    storyConfigPath = oldConfigPath;
  }

  let customExtensionPath = path.resolve(
    projectPath,
    'code',
    'dist',
    'extensions',
    'ExtensionLoader.js'
  );
  if (!fs.existsSync(customExtensionPath)) {
    const oldExtensionPath = path.resolve(
      projectPath,
      '..',
      '..',
      '..',
      'lib',
      'dist',
      'extensions',
      'ExtensionLoader.js'
    );

    customExtensionPath = oldExtensionPath;
  }

  const hasCustomExtension = fs.existsSync(customExtensionPath);

  let customExtensionLoader;

  const contentSource = path.resolve(projectPath, "content");

  if (hasCustomExtension) {
    const {ExtensionLoader} = global.require(customExtensionPath);
    customExtensionLoader = new ExtensionLoader({
      locale: currentLocale,
      configAccessor: new ConfigAccessor(global.require(storyConfigPath), contentSource)
    });
  }

  const customStoryExtensions = customExtensionLoader
    ? customExtensionLoader
      .getExtensions()
    : [];

  let pollyConfig = {};

  // Should we enable polly config for this preview mode?
  if (polly.pollyPreview) {

    const userDataDir = app.getPath("userData");
    const workingDir = path.join(userDataDir, "pollyPreview");

    // Ignoring the promise handle here intentionally
    const audioResourcesPath = path.resolve(resourcesPath, 'public', 'audio');
    copyAudioResources(audioResourcesPath, workingDir);

    if (!fs.existsSync(workingDir)) {
      fs.mkdirSync(workingDir);
    }

    // Get the right default polly voice for 'Alexa' given the current locale.
    const previewPollyVoice = getDefaultPollyVoiceForLocale(currentLocale) || 'Joanna';

    pollyConfig = {
      enabled: true,
      enabledInPreview: true,
      previewPollyVoice,
      combineAudioTags: true,
      dontUseCache: false,
      s3DomainName: '',
      bucketName: 'no-bucket-name',
      dontCombineIfAudioTagSeperatedBySpace: false,
      dontUploadToS3: true,
      engine: 'standard',
      workingDir: workingDir,
      usePollyProxy: false,
      awsRegion: polly.awsRegionName,
      awsProfileName: polly.awsProfileName,
      FFMPEGLocation: await getFFmpegLocation(storyConfigPath)
    };

    console.log("pollyConfig: " + JSON.stringify(pollyConfig));
  }

  abcDebugger = new ABCDebugger(
    storyJson,
    customStoryExtensions,
    undefined,
    pollyConfig,
    projectPath
  );
  emitter = new EventEmitter();
  logger = new Logger();

  if (
    process.env.NODE_ENV === 'development' ||
    process.env.DEBUG_PROD === 'true'
  ) {
    logger.addListener(DEBUG_LOGGER);
  }

  try {
    abcDebugger.run(emitter, logger);
  } catch (err) {
    log.error(err);
  }

  return abcDebugger;
}

async function getFFmpegLocation(storyConfigPath) {
  const abcConfig = await readJson(storyConfigPath);
  if (abcConfig
    && abcConfig.default
    && abcConfig.default[EDITOR_FFMPEG_LOCATION_PROPERTY]
    && typeof abcConfig.default[EDITOR_FFMPEG_LOCATION_PROPERTY] === 'string') {
      return abcConfig.default[EDITOR_FFMPEG_LOCATION_PROPERTY];
  }

  // default to the user's locally installed version of FFmpeg found in the PATH variable
  return process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';
}

export function sendSimulatorCommand(responseHandler, input) {
  try {
    logger.responseHandler = responseHandler;
    emitter.emit('data', `${input}\n`);
  } catch (err) {
    log.error(err);
  }
}

export async function copyAudioResources(resourcesDirectory, workingDir) {
  if (!fs.existsSync(resourcesDirectory) || !fs.existsSync(workingDir)) {
    log.warn('Default audio resources path does not exist. Cannot copy local audio resources.');
    return null;
  }
  const filesToCopy = await getNewOrDifferentFiles(resourcesDirectory, workingDir);
  // eslint-disable-next-line no-restricted-syntax,no-await-in-loop
  for (const fileName of filesToCopy) {
    // eslint-disable-next-line no-await-in-loop
    await fse.copy(path.resolve(resourcesDirectory, fileName), path.resolve(workingDir, fileName));
  }
}

export async function areFilesTheSameSize(fullFilePath1, fullFilePath2) {
  // Until needed otherwise, we will just compare file size in bytes.
  const f1 = await fse.stat(fullFilePath1);
  const f2 = await fse.stat(fullFilePath2);
  return f1.size === f2.size;
}

export async function getNewOrDifferentFiles(sourceDir, targetDir) {
  const sourceFiles = await fse.readdir(sourceDir);
  const destinationFiles = await fse.readdir(targetDir);

  const destinationFileSet =
    new Set(destinationFiles);

  const sourceFilesReturn = [];
  // eslint-disable-next-line no-restricted-syntax
  for (const fileName of sourceFiles) {
    if (destinationFileSet.has(fileName)) {
      const sourceFilePath = path.resolve(sourceDir, fileName);
      const destinationFilePath = path.resolve(targetDir, fileName);

      // eslint-disable-next-line no-await-in-loop
      const filesAreSameSize = await areFilesTheSameSize(sourceFilePath, destinationFilePath);

      if (!filesAreSameSize) {
        sourceFilesReturn.push(fileName);
      }
    } else {
      sourceFilesReturn.push(fileName);
    }
  }
  return sourceFilesReturn;
}
