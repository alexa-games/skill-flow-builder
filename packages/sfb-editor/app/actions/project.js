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

import fs from 'fs';
import path from 'path';
import { debounce } from 'lodash';
import { ipcRenderer, remote } from 'electron';
import log from 'electron-log';
import uuid from 'uuid/v4';
import { SFBDriver, SFBImporter, DefaultFormatImportPlugin, SceneDirectionType } from '@alexa-games/sfb-f';
import * as sfbCli from '@alexa-games/sfb-cli';
import { readUtf8FileExcludingBomSync } from '@alexa-games/sfb-util';
// eslint-disable-next-line import/no-cycle
import { startSimulator } from '../utils-renderer';

import { WorkspaceSecondaryMode } from '../data/enums';

import { SfbCliBuildOutputLogger, SfbCliBuiltOutputStdOut, clearBuildOutput, closeBuildOutput } from './build';
import { loggerClearErrorsAndMessages, loggerNotification } from './logger';
import {
  RESET_WORKSPACE,
  setRecentProjectList,
  setSecondaryMode,
  setSelectedSceneId,
  setSyntaxErrors
} from './workspace';

import { fetchLanguageStrings, saveLanguageStrings } from './languageStrings';
import { fetchAudio } from './audio';
import { fetchImages } from './images';
import { fetchSnippets } from './snippets';

import { fetchSlotTypes, saveSlotTypes, SLOT_TYPES_RESET } from './slot-types';

import { getResourcesPath, makeDir, readFile, readJson, writeFile } from '../utils-main';

import {
  DEFAULT_LOCALE,
  TMP_FOLDER_PATH,
  TMP_LANGUAGE_STRINGS_FILE_PATH,
  TMP_NOTES_FILE_PATH,
  TMP_PROJECT_FILE_PATH,
  TMP_SLOTS_FILE_PATH
} from '../data/constants';
import { getCoreExtensionLoader, getCustomExtensionLoader } from '../utils-renderer/extensionLoaders';
import { getContentPath } from '../utils-main/getPaths';
import { findFiles } from '../utils-main/fs';
import { addNewScene, renameScene, updateActionCommand, updateHearCommand } from './editor';

SFBDriver.SSML_AUDIO_LIMIT = 1;

export const UPDATE_PROJECT_JSON = 'UPDATE_PROJECT_JSON';
export const UPDATE_PROJECT_JSON_WITH_EXTENSIONS = 'UPDATE_PROJECT_JSON_WITH_EXTENSIONS';
export const UPDATE_PROJECT_IMPORT_SUCCESSFUL =
  'UPDATE_PROJECT_IMPORT_SUCCESSFUL';
export const UPDATE_PROJECT_SOURCE = 'UPDATE_PROJECT_SOURCE';
export const UPDATE_PROJECT_LOCATION = 'UPDATE_FOLDER_LOCATION';
export const UPDATE_PROJECT_FILE_NAMES = 'UPDATE_PROJECT_FILE_NAMES';
export const UPDATE_PROJECT_FILE_SOURCE = 'UPDATE_PROJECT_FILE_SOURCE';
export const UPDATE_PROJECT_CURRENT_FILE = 'UPDATE_PROJECT_CURRENT_FILE';
export const OPEN_RESTORE_BACKUP_MODAL = 'OPEN_RESTORE_BACKUP_MODAL';
export const CLOSE_RESTORE_BACKUP_MODAL = 'CLOSE_RESTORE_BACKUP_MODAL';
export const OPEN_NEW_PROJECT_MODAL = 'OPEN_NEW_PROJECT_MODAL';
export const CLOSE_NEW_PROJECT_MODAL = 'CLOSE_NEW_PROJECT_MODAL';
export const SET_PROJECT_OPENING = 'SET_PROJECT_OPENING';
export const SET_PROJECT_OPENED = 'SET_PROJECT_OPENED';
export const SET_PROJECT_CLOSED = 'SET_PROJECT_CLOSED';
export const UPDATE_PROJECT_NAME = 'UPDATE_PROJECT_NAME';
export const UPDATE_AWS_PROFILE_NAME = 'UPDATE_AWS_PROFILE_NAME';
export const UPDATE_VOICE_PREVIEW_AWS_REGION_NAME = 'UPDATE_VOICE_PREVIEW_AWS_REGION_NAME';
export const SET_NEW_PROJECT_SESSION_ID = 'SET_NEW_PROJECT_SESSION_ID';
export const CLEAR_PROJECT_SESSION_ID = 'CLEAR_PROJECT_SESSION_ID';
export const UPDATE_PROJECT_FILE_MAP = 'UPDATE_PROJECT_FILE_MAP';

// DO NOT MOVE THIS!
// IT WILL BREAK THE APP!
const {history} = require('../store/configureStore');

const customImportPlugins = [];

// list of scene names which should not have the global scene applied.
// const globalSceneExceptions = []

export function updateProjectSource(payload) {
  return dispatch => {
    dispatch({
      type: UPDATE_PROJECT_SOURCE,
      payload
    });
    // attempt to save back of project (func is  debounced)
    dispatch(saveProjectBackup());
  };
}

export function updateProjectJson(payload) {
  return {
    type: UPDATE_PROJECT_JSON,
    payload
  };
}

export function updateProjectJsonWithExtensions(payload) {
  return {
    type: UPDATE_PROJECT_JSON_WITH_EXTENSIONS,
    payload
  };
}

export function updateProjectImportSuccessful(payload) {
  return {
    type: UPDATE_PROJECT_IMPORT_SUCCESSFUL,
    payload
  };
}

function updateProjectFileName(payload) {
  return {
    type: UPDATE_PROJECT_CURRENT_FILE,
    payload
  };
}

export function updateProjectFileMap(payload) {
  return {
    type: UPDATE_PROJECT_FILE_MAP,
    payload
  };
}

export function updateAWSProfileName(payload) {
  return {
    type: UPDATE_AWS_PROFILE_NAME,
    payload
  };
}

export function updateVoicePreviewAWSRegionName(payload) {
  return {
    type: UPDATE_VOICE_PREVIEW_AWS_REGION_NAME,
    payload
  };
}

function getSlotMap(slotTypes) {
  if (slotTypes && slotTypes.types) {
    return slotTypes.types.reduce((acc, slot) => {
      acc[slot.name] = slot.values;
      return acc;
    }, {});
  }
  return {};
}

export function importProjectSource(payload, saveToDisk = false) {
  return (dispatch) => {
    dispatch(updateProjectSource(payload));
    dispatch(reimportProject());

    if (saveToDisk) {
      dispatch(saveProjectFile());
    }
  };
}

function getSkillName(configPath) {
  return readJson(path.resolve(configPath, 'abcConfig.json')).then(
    config => config.default['skill-invocation-name']
  );
}

function getAWSProfileName(abcConfig) {
  if (!abcConfig) {
    log.warn('Missing abcConfig.json file from root of project.');
  }

  let awsProfileName = '';
  if (
    abcConfig &&
    abcConfig.default &&
    abcConfig.default['aws-profile-name']
  ) {
    awsProfileName = abcConfig.default['aws-profile-name'];
  } else if (
    abcConfig &&
    abcConfig.default &&
    abcConfig.default['ask-profile-name']
  ) {
    awsProfileName = abcConfig.default['ask-profile-name'];
  }
  return awsProfileName;
}

function getVoicePreviewAWSRegionName(abcConfig) {
  if (!abcConfig) {
    log.warn('Missing abcConfig.json file from root of project.');
  }

  let awsRegionName = '';
  if (
    abcConfig &&
    abcConfig.default &&
    abcConfig.default['voice-preview-aws-region']
  ) {
    awsRegionName = abcConfig.default['voice-preview-aws-region'];
  } 

  return awsRegionName;
}

export function openProjectFile(fileName, selectedSceneId) {
  return (dispatch, getState) => openProjectFileAsync(fileName, selectedSceneId, dispatch, getState)
  // error
    .catch(err => {
      if (Array.isArray(err)) {
        err.forEach(error => {
          dispatch(
            loggerNotification({
              error,
              type: 'warning',
              triggerToast: true,
              message: `[${error.errorName}] ${error.errorMessage}`
            })
          );
        });
      } else {
        dispatch(
          loggerNotification({
            error: err,
            type: 'warning',
            triggerToast: true,
            message: err.message || err.errorMessage || err
          })
        );
      }
    })
}

function getDefaultSceneForFile(p, f) {
  try {
    if (p && Array.isArray(p.scenes)) {
      return p.scenes.find((s) => s.customProperties.sourceID === f).id;
    }
  } catch (err) {
    // swallow the exception at this time.
    log.warn('getDefaultSceneForFile failed', err);
  }
  return 'start';
}

function showErrorMessagesForImport(errors) {
  return (dispatch) => {
    if (Array.isArray(errors)) {
      errors.forEach(async error => {
        await dispatch(
          loggerNotification({
            error,
            type: 'warning',
            triggerToast: true,
            message: `[${error.errorName}] ${error.errorMessage}`
          })
        );
      });
    }
  }
}

function generateRecentProjectsList(location, skillName, recentProjectList) {
  let projects = [{path: location, name: skillName}];
  if (Array.isArray(recentProjectList)) {
    projects = projects.concat(
      recentProjectList
        .filter(item => item.path !== location)
        .slice(0, 4)
    );
  }
  return projects;
}

async function openProjectFileAsync(fileName, selectedSceneId, dispatch, getState) {
  const {project} = getState();
  const {projectFileMap, json} = project;

  // Changes are lost upon switching files

  dispatch(updateProjectFileName(fileName));

  const projectFileSource = projectFileMap ? projectFileMap[fileName] || '' : '';

  dispatch(updateProjectSource(projectFileSource));

  const sceneId = selectedSceneId || getDefaultSceneForFile(json, fileName);
  dispatch(setSelectedSceneId(sceneId));


  const targetPath = '/workspace';
  if (history.location.pathname !== targetPath) {
    history.push(targetPath);
  }
}

function determineInitialProjectFile(files) {
  try {
    const cachedFileName =
      localStorage.getItem('project.currentFile') || 'story.abc';
    return files.includes(cachedFileName)
      ? cachedFileName
      : files[0];
  } catch (error) {
    log.error(error);
    return files[0];
  }
}

async function openProjectLocationAsync(location, isManualOpen, dispatch, getState) {
  const {workspace} = getState();
  const {recentProjectList} = workspace;
  const currentLocale = workspace.currentLocale || DEFAULT_LOCALE;

  const contentPath = getContentPath(location);
  const resourcesPath = getResourcesPath(location, currentLocale);

  const projectFiles = await findFiles(contentPath, '.abc');
  if (projectFiles.length === 0) {
    throw Error('Folder does not contain .abc files.');
  }

  const currentFile = determineInitialProjectFile(projectFiles);
  const abcConfig = await readJson(path.resolve(location, 'abcConfig.json'));

  const awsProfileName = getAWSProfileName(abcConfig);
  dispatch(updateAWSProfileName(awsProfileName));

  const voicePreviewAwsRegionName = getVoicePreviewAWSRegionName(abcConfig);
  dispatch(updateVoicePreviewAWSRegionName(voicePreviewAwsRegionName));

  const skillName = await getSkillName(location);
  const projects = generateRecentProjectsList(location, skillName, recentProjectList);
  await dispatch(setRecentProjectList(projects));

  dispatch(setProjectOpening());
  dispatch(closeBuildOutput());
  dispatch(clearBuildOutput());
  dispatch(updateProjectFileName(currentFile));
  dispatch(updateProjectJson(null));
  dispatch(updateProjectLocation(location));
  dispatch(updateProjectName(location.split(path.sep).pop()));
  dispatch(updateProjectFileNames(projectFiles));
  dispatch(setSelectedSceneId(null));

  const manifest = await readJson(path.resolve(contentPath, 'MANIFEST.json'));
  const {projectJson, fileMap, errors} = await importProjectJson(
    manifest,
    contentPath,
    resourcesPath,
    currentLocale,
    getState,
    null,
    false
  );


  await dispatch(updateProjectFileMap(fileMap));
  dispatch(updateProjectJson(projectJson));

  await openProjectFileAsync(currentFile, null, dispatch, getState);
  dispatch(loggerClearErrorsAndMessages());
  await dispatch(fetchSlotTypes());
  await dispatch(fetchSnippets());
  await dispatch(fetchLanguageStrings());
  await dispatch(fetchImages());
  await dispatch(fetchAudio());
  await dispatch(setNewProjectSessionId());
  await dispatch(setProjectOpened());

  if (errors && errors.length > 0) {
    dispatch(showErrorMessagesForImport(errors));
    dispatch(updateProjectImportSuccessful(false));
  } else {
    dispatch(updateProjectImportSuccessful(true));
  }
  dispatch(loggerNotification({message: 'Project was successfully opened.'}));
}

export function openProjectLocation(location, isManualOpen) {
  return (dispatch, getState) => {
    try {
      return openProjectLocationAsync(location, isManualOpen, dispatch, getState)
    } catch (err) {
      handleProjectErrors(dispatch, err);
    }
  };
}

function handleProjectErrors(dispatch, err) {
  if (Array.isArray(err)) {
    err.forEach(error => {
      dispatch(
        loggerNotification({
          error,
          type: 'warning',
          triggerToast: true,
          message: `[${error.errorName}] ${error.errorMessage}`
        })
      );
    });
  } else {
    dispatch(
      loggerNotification({
        error: err,
        type: 'error',
        triggerToast: true,
        message: err.message || err.errorMessage || err
      })
    );
  }
}

export function updateProjectFileNames(fileNames) {
  return {
    type: UPDATE_PROJECT_FILE_NAMES,
    payload: fileNames
  };
}

export function openProjectLocationOnBootUp(location, currentFile) {
  return dispatch => {
    const contentPath = getContentPath(location);

    // Check if content path no longer exists, which means that the user deleted it.
    // If so, don't try and auto open this existing project.
    if (!fs.existsSync(contentPath)) {
      dispatch(closeProject()); // actually close the project because it is invalid
      return;
    }

    if (!currentFile) {
      dispatch(openProjectLocation(location, false));
      return; // exit
    }

    return Promise.all([
      readFile(TMP_PROJECT_FILE_PATH),
      readFile(path.resolve(contentPath, currentFile))
    ]).then(([backupSource, source]) => {
      if (backupSource !== source) {
        return dispatch(openRestoreBackUpModal());
      }
      return dispatch(openProjectLocation(location, false));
    });
  };
}

export function newProjectAtLocation(location, template) {
  return dispatch => {
    const sfbCliBuildOutputLogger = new SfbCliBuildOutputLogger(dispatch);
    const sfbCliBuiltOutputStdOut = new SfbCliBuiltOutputStdOut(dispatch);
    const newProjectCommand = new sfbCli.CommandFactory(
      sfbCliBuildOutputLogger,
      sfbCliBuiltOutputStdOut
    ).buildNewProjectCommand(
      location,
      {template}
    );

    newProjectCommand
      .run()
      .then(() => {
        dispatch(
          loggerNotification({
            triggerToast: true,
            title: 'Project created',
            message: `Project was successfully created at '${location}'.`
          })
        );
        // open map in secondary view
        dispatch(setSecondaryMode(WorkspaceSecondaryMode.Map));
        dispatch(openProjectLocation(location, false));
      })
      .catch(error => {
        console.error(error.message);
        dispatch(
          loggerNotification({
            error,
            type: 'error',
            triggerToast: true,
            message: error.message
          })
        );
      });
  };
}

export function newProject() {
  return dispatch => dispatch(openNewProjectModal());
}

export function openProject() {
  return dispatch => {
    const {dialog, getCurrentWindow} = remote;
    const win = getCurrentWindow();
    const folderPaths = dialog.showOpenDialog(win, {
      title: 'Open Project',
      properties: ['openDirectory'],
      filters: [
        {
          name: 'Projects',
          extensions: ['abc']
        }
      ]
    });

    if (!folderPaths) {
      log.info('User did not select a folder.');
      return;
    }
    const location = folderPaths[0];

    // open map in secondary view
    dispatch(setSecondaryMode(WorkspaceSecondaryMode.Map));

    return dispatch(openProjectLocation(location, true));
  };
}

export function updateProjectLocation(payload) {
  return {
    type: UPDATE_PROJECT_LOCATION,
    payload
  };
}

async function reimportProjectAsync(dispatch, getState) {
  const {project, workspace} = getState();
  const {source} = project;
  const {location, currentFile} = project;
  // when a project is closed, this method is sometimes triggered because it is based on a timeout from a child component.
  // exit the method if the files are no longer the project state
  if (!location || !currentFile) {
    dispatch(
      loggerNotification({
        type: 'info',
        dedup: true,
        triggerToast: false,
        message: 'Skipping auto save due to project close.'
      })
    );
    return;
  }
  const currentLocale = workspace.currentLocale || DEFAULT_LOCALE;

  const contentPath = getContentPath(location);
  const resourcesPath = getResourcesPath(location, currentLocale);

  // fetch manifest
  const manifest = await readJson(path.resolve(contentPath, 'MANIFEST.json'));

  const loadedSourceFiles = {};
  loadedSourceFiles[project.currentFile] = source;
  const {projectJson, errors} = await importProjectJson(
    manifest,
    contentPath,
    resourcesPath,
    currentLocale,
    getState,
    loadedSourceFiles,
    false
  );
  dispatch(updateProjectJson(projectJson));
  if (errors && errors.length > 0) {
    dispatch(updateProjectImportSuccessful(false));
    dispatch(setSyntaxErrors(errors));

    if (Array.isArray(errors)) {
      errors.forEach(error => {
        dispatch(
          loggerNotification({
            error,
            type: 'warning',
            dedup: true,
            triggerToast: false,
            message: `[${error.errorName}] ${error.errorMessage}`
          })
        );
      });
    }
  } else {
    dispatch(setSyntaxErrors([]));
    dispatch(updateProjectImportSuccessful(true));
  }
}

// Called whenever the text in the SFB Source View windows updates (2 seconds after user stops typing)
export function reimportProject() {
  return (dispatch, getState) => {
    try {
      return reimportProjectAsync(dispatch, getState);
    } catch (err) {
      dispatch(setSyntaxErrors(err));

      handleProjectErrors(dispatch, err);
    }
  };
}

export const saveProjectBackup = debounce(
  () => (dispatch, getState) => {
    const {project} = getState();
    const {source} = project;

    if (!project.location) {
      throw Error('No current project open.');
    }

    const filePath = TMP_PROJECT_FILE_PATH;

    // save slot types backup
    dispatch(saveSlotTypes(true));
    // save language strings backup
    dispatch(saveLanguageStrings(true));

    // write files
    return makeDir(TMP_FOLDER_PATH).then(() =>
      writeFile(filePath, source, {recursive: true})
    );
  },
  3000,
  {leading: true, trailing: true}
);

async function reimportProjectForSimulatorAsync(dispatch, getState) {
  const {project, simulator, workspace, languageStrings} = getState();
  // Need to ensure that our language strings are up to date since writer mode has been removed. Users could be editing from outside SFB.
  await dispatch(fetchLanguageStrings());
  const {langObj} = languageStrings;
  const {source} = project;
  const {location, currentFile} = project;
  // when a project is closed, this method is sometimes triggered because it is based on a timeout from a child component.
  // exit the method if the files are no longer the project state
  if (!location || !currentFile) {
    dispatch(
      loggerNotification({
        type: 'info',
        dedup: true,
        triggerToast: false,
        message: 'Skipping auto save due to project close.'
      })
    );
    return;
  }
  const currentLocale = workspace.currentLocale || DEFAULT_LOCALE;

  const contentPath = getContentPath(location);
  const resourcesPath = getResourcesPath(location, currentLocale);

  const manifest = await readJson(path.resolve(contentPath, 'MANIFEST.json'));
  const loadedSourceFiles = {};
  loadedSourceFiles[project.currentFile] = source;
  const {projectJson, errors} = await importProjectJson(
    manifest,
    contentPath,
    resourcesPath,
    currentLocale,
    getState,
    null,
    true
  );
  await startSimulator(
    projectJson,
    project.location,
    langObj,
    currentLocale,
    true,
    {
      pollyPreview: simulator.isPollyPreview,
      pollyProxyAccessToken: simulator.pollyPreviewAccessTokenInfo.accessToken,
      awsRegionName: project.voicePreviewAwsRegionName,
      awsProfileName: project.awsProfileName
    },
    dispatch
  );
  dispatch(updateProjectJsonWithExtensions(projectJson));
  if (errors && errors.length > 0) {
    dispatch(updateProjectImportSuccessful(false));
    dispatch(setSyntaxErrors(errors));

    if (Array.isArray(errors)) {
      errors.forEach(error => {
        dispatch(
          loggerNotification({
            error,
            type: 'warning',
            dedup: true,
            triggerToast: false,
            message: `[${error.errorName}] ${error.errorMessage}`
          })
        );
      });
    }
  } else {
    dispatch(setSyntaxErrors([]));
    dispatch(updateProjectImportSuccessful(true));
  }
}

export function reimportProjectForSimulator() {
  return (dispatch, getState) => {
    try {
      return reimportProjectForSimulatorAsync(dispatch, getState);
    } catch (err) {
      dispatch(setSyntaxErrors(err));
      handleProjectErrors(dispatch, err);
    }
  };
}

async function saveProjectFileAsync(dispatch, getState) {
  const {project, workspace} = getState();
  const {location, currentFile} = project;
  const {source} = project;
  const currentLocale = workspace.currentLocale || DEFAULT_LOCALE;

  if (!location) {
    throw Error('No current project open.');
  }
  // save slot types backup
  dispatch(saveSlotTypes());
  // save language strings
  dispatch(saveLanguageStrings());
  // update backup
  dispatch(saveProjectBackup());

  const contentPath = getContentPath(location);
  const resourcesPath = getResourcesPath(location, currentLocale);
  const filePath = path.resolve(contentPath, currentFile);

  await writeFile(filePath, source);
  dispatch(loggerNotification({message: 'Project was successfully saved.'}));
  // reload file list on save
  await findFiles(contentPath, '.abc');
  // fetch manifest
  const manifest = await readJson(path.resolve(contentPath, 'MANIFEST.json'));
  const {projectJson, fileMap, errors} = await importProjectJson(
    manifest,
    contentPath,
    resourcesPath,
    currentLocale,
    getState,
    null,
    false
  );
  dispatch(updateProjectFileMap(fileMap));
  dispatch(updateProjectJson(projectJson));
  if (errors && errors.length > 0) {
    dispatch(showErrorMessagesForImport(errors));
    dispatch(updateProjectImportSuccessful(false));
  } else {
    dispatch(setSyntaxErrors([]));
    dispatch(updateProjectImportSuccessful(true));
  }
}

export function saveProjectFile() {
  return (dispatch, getState) => {
    try {
      return saveProjectFileAsync(dispatch, getState);
    } catch (err) {
      handleProjectErrors(dispatch, err);
    }
  };
}

export function isProjectUnSaved() {
  return (dispatch, getState) => {
    const {project} = getState();
    const {projectFileMap, currentFile, source} = project;
    const projectFileSource = projectFileMap ? projectFileMap[currentFile] || '' : '';
    return projectFileSource !== source;
  }
}

export function saveProjectFileAs() {
  return (dispatch, getState) => {
    const {project} = getState();
    const {location} = project;

    if (!location) {
      throw Error('No current project open.');
    }

    const contentPath = getContentPath(location);

    const {dialog, getCurrentWindow} = remote;
    const win = getCurrentWindow();
    const filePath = dialog.showSaveDialog(win, {
      title: 'Save New File',
      properties: ['openFile', 'createDirectory'],
      defaultPath: path.resolve(contentPath, 'backup.abc'),
      filters: [
        {
          name: 'SFB Content Files',
          extensions: ['abc']
        }
      ]
    });

    if (!filePath) {
      return Promise.resolve(false); // exit
    }

    const {dir, base} = path.parse(filePath);

    if (contentPath !== dir) {
      return dispatch(
        loggerNotification({
          type: 'error',
          triggerToast: true,
          message:
            "You must save the file in your current project's content folder."
        })
      );
    }

    dispatch(updateProjectFileName(base));
    return dispatch(saveProjectFile()).catch(err => {
      handleProjectErrors(dispatch, err);
    });
  };
}

// Read the manifest file and load all files from disk, except if existing sourceFiles exist in the loadedSourceFile map then use that instead of the disk version
export async function getCombinedStoryContentFromManifest(
  manifest,
  srcDirectoryPath,
  overrideLoadedSourceFiles
) {
  return new Promise((resolve, reject) => {
    try {

      const stories =
        manifest && manifest.include ? manifest.include : ['*.abc'];
      const pathToRegex = {};

      stories.forEach((storyRegex) => {
        const extractFileRegex = /([\S]+\/)?([^\/]+?)$/g;
        const matchedPath = extractFileRegex.exec(storyRegex);

        if (matchedPath != null) {
          const postDir = matchedPath[1] ? `/${matchedPath[1]}` : '';
          if (!pathToRegex[`${srcDirectoryPath}${postDir}`]) {
            pathToRegex[`${srcDirectoryPath}${postDir}`] = '';
          } else {
            pathToRegex[`${srcDirectoryPath}${postDir}`] += '|';
          }

          pathToRegex[
            `${srcDirectoryPath}${postDir}`
            ] += `(?:^${matchedPath[2]
            .replace(/\./g, '\\.')
            .replace(/\*/g, '.*')}$)`;
        }
      });

      const combinedStoryContent = [];

      for (const searchDirectory of Object.keys(pathToRegex)) {
        const files = fs.readdirSync(searchDirectory);
        if (!files) {
          throw new Error(`[Import ERROR] Cannot find story content files: ${JSON.stringify(
            stories,
            null,
            4
          )}`);
        }

        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          if (file.match(pathToRegex[searchDirectory])) {
            if (overrideLoadedSourceFiles && overrideLoadedSourceFiles[file]) {
              combinedStoryContent.push({
                id: path.join(path.relative(srcDirectoryPath, searchDirectory), file),
                text: `\n${overrideLoadedSourceFiles[file]}`
              });
            } else {
              combinedStoryContent.push({
                id: path.join(path.relative(srcDirectoryPath, searchDirectory), file),
                text: readUtf8FileExcludingBomSync(path.join(searchDirectory, file))
              });
            }
          }
        }
      }

      resolve(combinedStoryContent);
    } catch (err) {
      reject(err);
    }
  });
}

function getStoryConfigPath(location) {
  let storyConfigPath = path.resolve(location, 'abcConfig.json');
  if (!fs.existsSync(storyConfigPath)) {
    storyConfigPath = path.resolve(
      location,
      '..',
      '..',
      '..',
      'lib',
      'dist',
      'abcConfig',
      'abcConfig.json'
    );
  }
  return storyConfigPath;
}

function getExtensionConfigPath(location) {
  let customExtensionPath = path.resolve(
    location,
    'code',
    'dist',
    'extensions',
    'ExtensionLoader.js'
  );
  if (!fs.existsSync(customExtensionPath)) {
    customExtensionPath = path.resolve(
      location,
      '..',
      '..',
      '..',
      'lib',
      'dist',
      'extensions',
      'ExtensionLoader.js'
    );
  }
  return customExtensionPath;
}

function getStoryExtensions(customExtensionLoader, extensionLoader) {
  return customExtensionLoader
    ? customExtensionLoader
      .getExtensions()
      .concat(extensionLoader.getImportExtensions())
    : extensionLoader.getImportExtensions();
}

function getSnippetsPath(resourcesPath) {
  return path.resolve(resourcesPath, 'Snippets.json');
}

export async function importProjectJson(
  manifest,
  contentPath,
  resourcesPath,
  currentLocale,
  getState,
  overrideLoadedSourceFiles,
  includeExtensions = false
) {
  const {languageStrings, slotTypes, project} = getState();
  const {langObj} = languageStrings;
  const {location, currentFile} = project;

  const filePath = path.resolve(contentPath, currentFile);
  const snippets = await readJson(getSnippetsPath(resourcesPath));
  const storyConfigPath = getStoryConfigPath(location);
  const customExtensionPath = getExtensionConfigPath(location);


  const combinedSource = await getCombinedStoryContentFromManifest(manifest, contentPath, overrideLoadedSourceFiles);
  const customExtensionLoader = getCustomExtensionLoader(customExtensionPath, currentLocale, storyConfigPath, contentPath);
  const extensionLoader = getCoreExtensionLoader(currentLocale, storyConfigPath, contentPath, snippets, langObj);

  const fileMap = {};
  combinedSource.forEach((file) => {
    fileMap[file.id] = file.text;
  });

  // This to be cleaned more when I understand it a bit more
  const storyExtensions = getStoryExtensions(customExtensionLoader, extensionLoader);
  const extensions = includeExtensions ? storyExtensions : [];
  const importer = new SFBImporter(
    customImportPlugins,
    undefined,
    extensions
  );

  const returnErrors = (projectJson) => ({
    projectJson: projectJson.importedData,
    fileMap,
    errors: projectJson.errorItems || []
  });


  try {
    const projectJson = await importer.importABCStory(
      'default',
      filePath,
      'Test',
      'Test',
      true,
      {
        customSlots: getSlotMap(slotTypes),
        contents: combinedSource
      }
    );


    if (projectJson.errorItems) {
      return returnErrors(projectJson);
    }
    return {
      projectJson,
      fileMap,
      errors: []
    }
  } catch (err) {
    if (err.errorItems) {
      return returnErrors(err);
    }
    throw new Error(err);
  }
}

export function discardBackupFiles(reOpenProject = true) {
  return (dispatch, getState) => {
    const {project, workspace} = getState();
    const currentLocale = workspace.currentLocale || DEFAULT_LOCALE;

    const contentPath = getContentPath(project.location);
    const resourcesPath = getResourcesPath(project.location, currentLocale);

    return makeDir(TMP_FOLDER_PATH)
      .then(() =>
        Promise.all([
          readFile(path.resolve(resourcesPath, 'SlotTypes.json')).then(
            content =>
              content ? writeFile(TMP_SLOTS_FILE_PATH, content) : null
          ),
          readFile(path.resolve(contentPath, 'NOTES.md')).then(content =>
            content ? writeFile(TMP_NOTES_FILE_PATH, content) : null
          ),
          readFile(path.resolve(contentPath, 'languageStrings.json')).then(
            content =>
              content
                ? writeFile(TMP_LANGUAGE_STRINGS_FILE_PATH, content)
                : null
          ),
          readFile(path.resolve(contentPath, project.currentFile)).then(
            content =>
              content ? writeFile(TMP_PROJECT_FILE_PATH, content) : null
          )
        ])
      )
      .then(() => {
        if (reOpenProject) {
          dispatch(openProjectLocation(project.location, true));
        }
        return dispatch(closeRestoreBackUpModal());
      });
  };
}

export function restoreBackupFiles() {
  return (dispatch, getState) => {
    const {project, workspace} = getState();
    const currentLocale = workspace.currentLocale || DEFAULT_LOCALE;

    const contentPath = getContentPath(project.location);
    const resourcesPath = getResourcesPath(project.location, currentLocale);

    return makeDir(TMP_FOLDER_PATH)
      .then(() =>
        Promise.all([
          readFile(TMP_SLOTS_FILE_PATH).then(content =>
            content
              ? writeFile(
              path.resolve(resourcesPath, 'SlotTypes.json'),
              content
              )
              : null
          ),
          readFile(TMP_NOTES_FILE_PATH).then(content =>
            content
              ? writeFile(path.resolve(contentPath, 'NOTES.md'), content)
              : null
          ),
          readFile(TMP_LANGUAGE_STRINGS_FILE_PATH).then(content =>
            content
              ? writeFile(
              path.resolve(contentPath, 'languageStrings.json'),
              content
              )
              : null
          ),
          readFile(TMP_PROJECT_FILE_PATH).then(content =>
            content
              ? writeFile(
              path.resolve(contentPath, project.currentFile),
              content
              )
              : null
          )
        ])
      )
      .then(() => {
        dispatch(openProjectLocation(project.location, true));
        return dispatch(closeRestoreBackUpModal());
      });
  };
}

export function openRestoreBackUpModal() {
  return {
    type: OPEN_RESTORE_BACKUP_MODAL
  };
}

export function closeRestoreBackUpModal() {
  return {
    type: CLOSE_RESTORE_BACKUP_MODAL
  };
}

export function openNewProjectModal() {
  return {
    type: OPEN_NEW_PROJECT_MODAL
  };
}

export function closeNewProjectModal() {
  return {
    type: CLOSE_NEW_PROJECT_MODAL
  };
}

function setProjectOpening() {
  return {
    type: SET_PROJECT_OPENING
  };
}

function setProjectOpened() {
  return {
    type: SET_PROJECT_OPENED
  };
}

function setProjectClosed() {
  return {
    type: SET_PROJECT_CLOSED
  }
}

export function closeProject() {
  ipcRenderer.send('update-title', `SFB Editor`);
  return dispatch => {
    dispatch(setProjectClosed());
    dispatch({type: RESET_WORKSPACE});
    dispatch({type: SLOT_TYPES_RESET});
    dispatch(clearProjectSessionId());
  };
}

export function changeSceneId(newSceneId) {
  return (dispatch, getState) => {
    const {workspace} = getState();
    const {selectedSceneId} = workspace;

    if (selectedSceneId) {
      dispatch(renameScene(selectedSceneId, newSceneId))
        .then(() => dispatch(setSelectedSceneId(newSceneId)))
        .catch((err) => {
          log.warn(err);
        });
    }
  };
}

function sceneIsNew(scene, project) {
  const targetOptions = project.json.scenes
    .filter(s => scene === s.id);
  return targetOptions.length <= 0;
}

export function updateSceneAction(
  sceneId,
  originalHear,
  originalGoto,
  hear,
  goto,
  action,
  type
) {
  return (dispatch, getState) => {
    const {project} = getState();
    if (sceneId) {
      try {
        // Create the new scene before creating a link to it.
        if (goto && sceneIsNew(goto, project)) {
          dispatch(addNewScene(goto));
        }

        // Add links to scene
        if (type === 'choice') {
          dispatch(updateHearCommand(sceneId, originalHear, goto, hear, action));
        } else {
          dispatch(updateActionCommand(sceneId, originalGoto, goto, action));
        }
      } catch (error) {
        console.error(error.message);
        dispatch(
          loggerNotification({
            error,
            type: 'error',
            triggerToast: true,
            message: error.message
          })
        );
      }
    }
  };
}

export function updateProjectName(name) {
  ipcRenderer.send('update-title', `SFB Editor [${name}]`);
  return {
    type: UPDATE_PROJECT_NAME,
    payload: name
  };
}

function setNewProjectSessionId() {
  return {
    type: SET_NEW_PROJECT_SESSION_ID,
    projectSessionId: uuid()
  };
}

function clearProjectSessionId() {
  return {
    type: CLEAR_PROJECT_SESSION_ID
  };
}
