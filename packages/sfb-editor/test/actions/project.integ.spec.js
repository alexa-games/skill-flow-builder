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

import path from 'path';
import { ConfigAccessor, CoreExtensionLoader } from '@alexa-games/sfb-skill';
import fs from "fs";
import * as project from '../../app/actions/project';
import * as extensionLoaders from '../../app/utils-renderer/extensionLoaders';
import * as projectIntegData from './project.integ.data';
import * as projectFs from '../../app/utils-main/fs';
import { configureStore } from '../../app/store/configureStore';
import * as _ from 'lodash';

const mockfs = require('mock-fs');

// eslint-disable-next-line no-unused-vars
const {getContentPath, getResourcesPath} = jest.requireActual('../../app/utils-main');

async function generateMockFsForSkill(skillPath) {
  const fileMap = new Map();
  const files = await projectFs.readdirRecursivePromisified(skillPath);
  // eslint-disable-next-line no-restricted-syntax
  for (const file of files) {
    const p = path.join(skillPath, file);
    const content = fs.readFileSync(p, {encoding: 'utf8'});
    fileMap.set(file, content);
  }

  mockfs({
    [skillPath]: {
      'code': {
        'extensions': {}
      },
      'content': {
        'en-US': {
          'resources': {
            'public': {
              'audio': {},
              'images': {},
              'vo': {}
            }
          }
        },
        'en-GB': {
          'resources': {
            'public': {
              'audio': {},
              'images': {},
              'vo': {}
            }
          }
        }
      }
    }
  });

  // eslint-disable-next-line no-restricted-syntax
  for (const file of files) {
    const p = path.join(skillPath, file);
    fs.writeFileSync(p, fileMap.get(file));
  }
}

function printAllLogMessagesToConsole(actionValues) {
  actionValues.forEach((actionValue) => {
    if (actionValue.type === 'LOGGER_NOTIFY') {
      console.log(actionValue);
    }
  });
}

describe('Project integration tests', async () => {
  beforeAll(() => {
    jest.spyOn(extensionLoaders, 'getCustomExtensionLoader')
      .mockImplementation((customExtensionPath, locale, storyConfigPath, contentSource) => {
        if (!fs.existsSync(customExtensionPath)) {
          return undefined;
        }
        // eslint-disable-next-line global-require,import/no-dynamic-require
        const {ExtensionLoader} = require(customExtensionPath);
        return new ExtensionLoader({
          locale,
          // eslint-disable-next-line global-require,import/no-dynamic-require
          configAccessor: new ConfigAccessor(require(storyConfigPath), contentSource)
        })
      });
    jest.spyOn(extensionLoaders, 'getCoreExtensionLoader')
      .mockImplementation((locale, storyConfigPath, contentSource, snippets, langObj) => new CoreExtensionLoader(
          locale,
          // eslint-disable-next-line global-require,import/no-dynamic-require
          new ConfigAccessor(require(storyConfigPath), contentSource),
          {
            snippets,
            languageStrings: langObj,
            contentSource
          }
        ));
  });

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    mockfs.restore();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('openProjectFile: open project file does not perform additional actions', async () => {
    const skillPath = path.resolve('./', 'test', 'sample-skill', 'sample');

    const store = configureStore();
    const initialState = store.getState();
    await store.dispatch(project.updateProjectLocation(skillPath));

    await store.dispatch(project.openProjectFile('story.abc', ''));
    const state = store.getState();

    const importedProject = state.project;
    const expectedProject = projectIntegData['opens a project file'];

    expect(initialState).not.toEqual(state);

    expect(importedProject.location).toEqual(skillPath);
    expect(importedProject).toMatchObject(expectedProject);
  });

  it('openProjectLocation: opens a project from location', async () => {
    const skillPath = path.resolve('./', 'test', 'sample-skill', 'sample');
    const sampleImagePath = path.resolve(skillPath, 'content/en-US/resources/public/images/sample_image.png');
    const sampleAudioPath = path.resolve(skillPath, 'content/en-US/resources/public/audio/trumpet_1.mp3');

    const store = configureStore();
    const initialState = store.getState();

    await store.dispatch(project.openProjectLocation(skillPath, true));
    const state = store.getState();

    const importedState = state;
    const expectedState = projectIntegData['opens a project location'];

    expect(initialState).not.toEqual(state);

    expect(importedState.images.files[0].src).toEqual(sampleImagePath);
    expect(importedState.audio.files[0].src).toEqual(sampleAudioPath);
    expect(importedState.project.location).toEqual(skillPath);
    expect(importedState.workspace.recentProjectList[0].path).toEqual(skillPath);
    expect(importedState).toMatchObject(expectedState);
  });

  it('opens and saves a project file with mock file store', async () => {
    const skillPath = path.resolve('./', 'test', 'sample-skill', 'sample');

    const actions = [];
    const actionValues = [];
    let postImportActions = [];

    // This little middleware allows us to verify that actions are called correctly.
    const customMiddleware = store => next => action => {
      actions.push(action.type);
      postImportActions.push(action.type);
      actionValues.push(action);
      next(action);
    };

    // read all file contents from fs
    await generateMockFsForSkill(skillPath);

    // read project
    const store = configureStore({}, customMiddleware);
    await store.dispatch(project.openProjectLocation(skillPath, true));

    const expectedOpenActions = [
      'UPDATE_AWS_PROFILE_NAME',
      'UPDATE_VOICE_PREVIEW_AWS_REGION_NAME',
      'SET_RECENT_PROJECT_LIST',
      'SET_PROJECT_OPENING',
      'CLOSE_BUILD_OUTPUT',
      'CLEAR_BUILD_OUTPUT',
      'UPDATE_PROJECT_CURRENT_FILE',
      'UPDATE_PROJECT_JSON',
      'UPDATE_FOLDER_LOCATION',
      'UPDATE_PROJECT_NAME',
      'UPDATE_PROJECT_FILE_NAMES',
      'SET_SELECTED_SCENE_ID',
      'UPDATE_PROJECT_FILE_MAP',
      'UPDATE_PROJECT_JSON',
      'UPDATE_PROJECT_CURRENT_FILE',
      'UPDATE_PROJECT_SOURCE',
      'SET_SELECTED_SCENE_ID',
      'LOGGER_CLEAR_ERRORS_AND_MESSAGES',
      'SLOT_TYPES_REPLACE',
      'SNIPPETS_SET_ERROR',
      'LOGGER_NOTIFY',
      'SNIPPETS_REPLACE',
      'LANGUAGE_STRINGS_UPDATE',
      'IMAGES_REPLACE',
      'AUDIO_REPLACE',
      'SET_NEW_PROJECT_SESSION_ID',
      'SET_PROJECT_OPENED',
      'UPDATE_PROJECT_IMPORT_SUCCESSFUL',
      'LOGGER_NOTIFY'];

    expect(actions).toEqual(expectedOpenActions);
    const currentState = store.getState();
    // make a small change to the file
    const newSource = _.replace(currentState.project.source, 'It can be anywhere in your file', 'It can be anywhere on your file');

    store.dispatch({
      type: 'UPDATE_PROJECT_SOURCE',
      payload: newSource
    });


    postImportActions = [];
    await store.dispatch(project.saveProjectFile());

    const expectedAllActions = [
      'UPDATE_AWS_PROFILE_NAME',
      'UPDATE_VOICE_PREVIEW_AWS_REGION_NAME',
      'SET_RECENT_PROJECT_LIST',
      'SET_PROJECT_OPENING',
      'CLOSE_BUILD_OUTPUT',
      'CLEAR_BUILD_OUTPUT',
      'UPDATE_PROJECT_CURRENT_FILE',
      'UPDATE_PROJECT_JSON',
      'UPDATE_FOLDER_LOCATION',
      'UPDATE_PROJECT_NAME',
      'UPDATE_PROJECT_FILE_NAMES',
      'SET_SELECTED_SCENE_ID',
      'UPDATE_PROJECT_FILE_MAP',
      'UPDATE_PROJECT_JSON',
      'UPDATE_PROJECT_CURRENT_FILE',
      'UPDATE_PROJECT_SOURCE',
      'SET_SELECTED_SCENE_ID',
      'LOGGER_CLEAR_ERRORS_AND_MESSAGES',
      'SLOT_TYPES_REPLACE',
      'SNIPPETS_SET_ERROR',
      'LOGGER_NOTIFY',
      'SNIPPETS_REPLACE',
      'LANGUAGE_STRINGS_UPDATE',
      'IMAGES_REPLACE',
      'AUDIO_REPLACE',
      'SET_NEW_PROJECT_SESSION_ID',
      'SET_PROJECT_OPENED',
      'UPDATE_PROJECT_IMPORT_SUCCESSFUL',
      'LOGGER_NOTIFY',
      // Manually changing project source for test
      'UPDATE_PROJECT_SOURCE',
      // Save events
      'LOGGER_NOTIFY',
      'LOGGER_NOTIFY',
      'LOGGER_NOTIFY',
      'LOGGER_NOTIFY',
      'UPDATE_PROJECT_FILE_MAP',
      'UPDATE_PROJECT_JSON',
      'SET_SYNTAX_ERRORS',
      'UPDATE_PROJECT_IMPORT_SUCCESSFUL'];

    const expectedSaveActions = [
      'LOGGER_NOTIFY',
      'LOGGER_NOTIFY',
      'LOGGER_NOTIFY',
      'LOGGER_NOTIFY',
      'UPDATE_PROJECT_FILE_MAP',
      'UPDATE_PROJECT_JSON',
      'SET_SYNTAX_ERRORS',
      'UPDATE_PROJECT_IMPORT_SUCCESSFUL'
    ];

    expect(actions).toEqual(expectedAllActions);
    expect(postImportActions).toEqual(expectedSaveActions);

    const expectedState = projectIntegData['saves a project'];
    const state = store.getState();
    expect(state).toMatchObject(expectedState);

    mockfs.restore();
  });

  it('reimports a project for simulator', async () => {
    const skillPath = path.resolve('./', 'test', 'sample-skill', 'sample');

    const actions = [];
    const actionValues = [];
    let postImportActions = [];

    // This little middleware allows us to verify that actions are called correctly.
    const customMiddleware = store => next => action => {
      actions.push(action.type);
      postImportActions.push(action.type);
      actionValues.push(action);
      next(action);
    };

    // read all file contents from fs
    await generateMockFsForSkill(skillPath);

    // read project
    const store = configureStore({}, customMiddleware);
    await store.dispatch(project.openProjectLocation(skillPath, true));

    const expectedOpenActions = [
      'UPDATE_AWS_PROFILE_NAME',
      'UPDATE_VOICE_PREVIEW_AWS_REGION_NAME',
      'SET_RECENT_PROJECT_LIST',
      'SET_PROJECT_OPENING',
      'CLOSE_BUILD_OUTPUT',
      'CLEAR_BUILD_OUTPUT',
      'UPDATE_PROJECT_CURRENT_FILE',
      'UPDATE_PROJECT_JSON',
      'UPDATE_FOLDER_LOCATION',
      'UPDATE_PROJECT_NAME',
      'UPDATE_PROJECT_FILE_NAMES',
      'SET_SELECTED_SCENE_ID',
      'UPDATE_PROJECT_FILE_MAP',
      'UPDATE_PROJECT_JSON',
      'UPDATE_PROJECT_CURRENT_FILE',
      'UPDATE_PROJECT_SOURCE',
      'SET_SELECTED_SCENE_ID',
      'LOGGER_CLEAR_ERRORS_AND_MESSAGES',
      'SLOT_TYPES_REPLACE',
      'SNIPPETS_SET_ERROR',
      'LOGGER_NOTIFY',
      'SNIPPETS_REPLACE',
      'LANGUAGE_STRINGS_UPDATE',
      'IMAGES_REPLACE',
      'AUDIO_REPLACE',
      'SET_NEW_PROJECT_SESSION_ID',
      'SET_PROJECT_OPENED',
      'UPDATE_PROJECT_IMPORT_SUCCESSFUL',
      'LOGGER_NOTIFY'];

    expect(actions).toEqual(expectedOpenActions);
    const currentState = store.getState();
    // make a small change to the file
    const newSource = _.replace(currentState.project.source, 'It can be anywhere in your file', 'It can be anywhere on your file');

    store.dispatch({
      type: 'UPDATE_PROJECT_SOURCE',
      payload: newSource
    });

    postImportActions = [];
    await store.dispatch(project.reimportProjectForSimulator());

    const expectedAllActions = [
      'UPDATE_AWS_PROFILE_NAME',
      'UPDATE_VOICE_PREVIEW_AWS_REGION_NAME',
      'SET_RECENT_PROJECT_LIST',
      'SET_PROJECT_OPENING',
      'CLOSE_BUILD_OUTPUT',
      'CLEAR_BUILD_OUTPUT',
      'UPDATE_PROJECT_CURRENT_FILE',
      'UPDATE_PROJECT_JSON',
      'UPDATE_FOLDER_LOCATION',
      'UPDATE_PROJECT_NAME',
      'UPDATE_PROJECT_FILE_NAMES',
      'SET_SELECTED_SCENE_ID',
      'UPDATE_PROJECT_FILE_MAP',
      'UPDATE_PROJECT_JSON',
      'UPDATE_PROJECT_CURRENT_FILE',
      'UPDATE_PROJECT_SOURCE',
      'SET_SELECTED_SCENE_ID',
      'LOGGER_CLEAR_ERRORS_AND_MESSAGES',
      'SLOT_TYPES_REPLACE',
      'SNIPPETS_SET_ERROR',
      'LOGGER_NOTIFY',
      'SNIPPETS_REPLACE',
      'LANGUAGE_STRINGS_UPDATE',
      'IMAGES_REPLACE',
      'AUDIO_REPLACE',
      'SET_NEW_PROJECT_SESSION_ID',
      'SET_PROJECT_OPENED',
      'UPDATE_PROJECT_IMPORT_SUCCESSFUL',
      'LOGGER_NOTIFY',
      // Manually changing project source for test
      'UPDATE_PROJECT_SOURCE',
      // Save events
      'LANGUAGE_STRINGS_UPDATE',
      'UPDATE_PROJECT_JSON_WITH_EXTENSIONS',
      'SET_SYNTAX_ERRORS',
      'UPDATE_PROJECT_IMPORT_SUCCESSFUL'];

    const expectedReImportActions = [
      'LANGUAGE_STRINGS_UPDATE',
      'UPDATE_PROJECT_JSON_WITH_EXTENSIONS',
      'SET_SYNTAX_ERRORS',
      'UPDATE_PROJECT_IMPORT_SUCCESSFUL'
    ];

    expect(actions).toEqual(expectedAllActions);
    expect(postImportActions).toEqual(expectedReImportActions);

    const state = store.getState();
    expect(state.project.jsonWithExtensions).not.toBe(null);
    // Verify no syntax errors
    expect(actionValues[actionValues.length - 2].type).toEqual('SET_SYNTAX_ERRORS');
    expect(actionValues[actionValues.length - 2].payload).toEqual([]);

    mockfs.restore();
  });

  it('reimports a project without extensions', async () => {
    const skillPath = path.resolve('./', 'test', 'sample-skill', 'sample');

    const actions = [];
    const actionValues = [];
    let postImportActions = [];

    // This little middleware allows us to verify that actions are called correctly.
    const customMiddleware = store => next => action => {
      actions.push(action.type);
      postImportActions.push(action.type);
      actionValues.push(action);
      next(action);
    };

    // read all file contents from fs
    await generateMockFsForSkill(skillPath);

    // read project
    const store = configureStore({}, customMiddleware);
    await store.dispatch(project.openProjectLocation(skillPath, true));

    const expectedOpenActions = [
      'UPDATE_AWS_PROFILE_NAME',
      'UPDATE_VOICE_PREVIEW_AWS_REGION_NAME',
      'SET_RECENT_PROJECT_LIST',
      'SET_PROJECT_OPENING',
      'CLOSE_BUILD_OUTPUT',
      'CLEAR_BUILD_OUTPUT',
      'UPDATE_PROJECT_CURRENT_FILE',
      'UPDATE_PROJECT_JSON',
      'UPDATE_FOLDER_LOCATION',
      'UPDATE_PROJECT_NAME',
      'UPDATE_PROJECT_FILE_NAMES',
      'SET_SELECTED_SCENE_ID',
      'UPDATE_PROJECT_FILE_MAP',
      'UPDATE_PROJECT_JSON',
      'UPDATE_PROJECT_CURRENT_FILE',
      'UPDATE_PROJECT_SOURCE',
      'SET_SELECTED_SCENE_ID',
      'LOGGER_CLEAR_ERRORS_AND_MESSAGES',
      'SLOT_TYPES_REPLACE',
      'SNIPPETS_SET_ERROR',
      'LOGGER_NOTIFY',
      'SNIPPETS_REPLACE',
      'LANGUAGE_STRINGS_UPDATE',
      'IMAGES_REPLACE',
      'AUDIO_REPLACE',
      'SET_NEW_PROJECT_SESSION_ID',
      'SET_PROJECT_OPENED',
      'UPDATE_PROJECT_IMPORT_SUCCESSFUL',
      'LOGGER_NOTIFY'
    ];

    expect(actions).toEqual(expectedOpenActions);
    const currentState = store.getState();
    // make a small change to the file
    const newSource = _.replace(currentState.project.source, 'It can be anywhere in your file', 'It can be anywhere on your file');

    store.dispatch({
      type: 'UPDATE_PROJECT_SOURCE',
      payload: newSource
    });

    postImportActions = [];
    await store.dispatch(project.reimportProject());

    const expectedAllActions = [
      'UPDATE_AWS_PROFILE_NAME',
      'UPDATE_VOICE_PREVIEW_AWS_REGION_NAME',
      'SET_RECENT_PROJECT_LIST',
      'SET_PROJECT_OPENING',
      'CLOSE_BUILD_OUTPUT',
      'CLEAR_BUILD_OUTPUT',
      'UPDATE_PROJECT_CURRENT_FILE',
      'UPDATE_PROJECT_JSON',
      'UPDATE_FOLDER_LOCATION',
      'UPDATE_PROJECT_NAME',
      'UPDATE_PROJECT_FILE_NAMES',
      'SET_SELECTED_SCENE_ID',
      'UPDATE_PROJECT_FILE_MAP',
      'UPDATE_PROJECT_JSON',
      'UPDATE_PROJECT_CURRENT_FILE',
      'UPDATE_PROJECT_SOURCE',
      'SET_SELECTED_SCENE_ID',
      'LOGGER_CLEAR_ERRORS_AND_MESSAGES',
      'SLOT_TYPES_REPLACE',
      'SNIPPETS_SET_ERROR',
      'LOGGER_NOTIFY',
      'SNIPPETS_REPLACE',
      'LANGUAGE_STRINGS_UPDATE',
      'IMAGES_REPLACE',
      'AUDIO_REPLACE',
      'SET_NEW_PROJECT_SESSION_ID',
      'SET_PROJECT_OPENED',
      'UPDATE_PROJECT_IMPORT_SUCCESSFUL',
      'LOGGER_NOTIFY',
      // Manually changing project source for test
      'UPDATE_PROJECT_SOURCE',
      // Save events
      'UPDATE_PROJECT_JSON',
      'SET_SYNTAX_ERRORS',
      'UPDATE_PROJECT_IMPORT_SUCCESSFUL'];

    const expectedReImportActions = [
      'UPDATE_PROJECT_JSON',
      'SET_SYNTAX_ERRORS',
      'UPDATE_PROJECT_IMPORT_SUCCESSFUL'
    ];

    expect(actions).toEqual(expectedAllActions);
    expect(postImportActions).toEqual(expectedReImportActions);

    const state = store.getState();
    expect(state.project.jsonWithExtensions).toBe(null);
    // Verify no syntax errors
    expect(actionValues[actionValues.length - 2].type).toEqual('SET_SYNTAX_ERRORS');
    expect(actionValues[actionValues.length - 2].payload).toEqual([]);

    mockfs.restore();
  });


});
