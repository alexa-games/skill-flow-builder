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

import project from '../../app/reducers/project';

import {
  UPDATE_PROJECT_JSON,
  UPDATE_PROJECT_JSON_WITH_EXTENSIONS,
  UPDATE_PROJECT_IMPORT_SUCCESSFUL,
  UPDATE_PROJECT_SOURCE,
  UPDATE_PROJECT_LOCATION,
  UPDATE_PROJECT_FILE_NAMES,
  UPDATE_PROJECT_FILE_SOURCE,
  UPDATE_PROJECT_CURRENT_FILE,
  OPEN_RESTORE_BACKUP_MODAL,
  CLOSE_RESTORE_BACKUP_MODAL,
  OPEN_NEW_PROJECT_MODAL,
  CLOSE_NEW_PROJECT_MODAL,
  SET_PROJECT_OPENING,
  SET_PROJECT_OPENED,
  SET_PROJECT_CLOSED,
  UPDATE_PROJECT_NAME,
  UPDATE_AWS_PROFILE_NAME,
  UPDATE_VOICE_PREVIEW_AWS_REGION_NAME,
  SET_NEW_PROJECT_SESSION_ID,
  CLEAR_PROJECT_SESSION_ID,
  UPDATE_PROJECT_FILE_MAP
} from '../../app/actions/project';

import { getGraphElements } from '../../app/utils/graph';

import { ProjectState } from '../../app/data/enums';

import { MockStorage } from '../mocks/mockStorage';

describe('Project Reducers', () => {
  let storage = {};

  beforeEach(() => {
    storage = new MockStorage();
    storage.setupSpies();
  });

  const initialState = {
    source: '',
    json: null,
    graphElements: null,
    jsonWithExtensions: null,
    importSuccessful: false,
    allProjectFileNames: [],
    isRestoreBackUpModalOpen: false,
    location: null,
    currentFile: null,
    isNewProjectModalOpen: false,
    name: '',
    awsProfileName: '',
    projectState: ProjectState.Closed,
    projectSessionId: null,
    projectFileMap: {}
  };

  it('should return the initial state', () => {
    expect(project(undefined, {})).toEqual(
      initialState
    );
  });

  it('update project source', () => {
    const payload = 'dummy project source';

    const expectedState = {
      ...initialState,
      source: payload
    };

    const state = project(undefined, {
      type: UPDATE_PROJECT_SOURCE,
      payload
    });

    expect(state).toEqual(expectedState);
  });

  it('update project JSON', () => {
    const payload = {
      pluginName: 'default',
      scenes: [
        { contents: [], id: 'dummy scene 1', customProperties: {} },
        { contents: [], id: 'dummy scene 2', customProperties: {} },
        { contents: [], id: 'dummy scene 3', customProperties: {} }
      ]
    };

    const expectedState = {
      ...initialState,
      json: payload,
      graphElements: getGraphElements(payload)
    };

    const state = project(undefined, {
      type: UPDATE_PROJECT_JSON,
      payload
    });

    expect(state).toEqual(expectedState);
  });

  it('update project JSON with extensions', () => {
    const payload = {
      pluginName: 'default',
      scenes: []
    };

    const expectedState = {
      ...initialState,
      jsonWithExtensions: payload
    };

    const state = project(undefined, {
      type: UPDATE_PROJECT_JSON_WITH_EXTENSIONS,
      payload
    });

    expect(state).toEqual(expectedState);
  });

  it('update project import successful', () => {
    const payload = {
      pluginName: 'default',
      scenes: []
    };

    const expectedState = {
      ...initialState,
      importSuccessful: payload
    };

    const state = project(undefined, {
      type: UPDATE_PROJECT_IMPORT_SUCCESSFUL,
      payload
    });

    expect(state).toEqual(expectedState);
  });

  it('update project location', () => {
    const payload = 'dummy project location';

    const expectedState = {
      ...initialState,
      location: payload
    };

    const state = project(undefined, {
      type: UPDATE_PROJECT_LOCATION,
      payload
    });

    expect(Storage.prototype.setItem).toHaveBeenCalledWith('project.location', payload);
    expect(storage.getItem('project.location')).toEqual(payload);
    expect(state).toEqual(expectedState);
  });

  it('update project file names', () => {
    const payload = 'dummy project file names';

    const expectedState = {
      ...initialState,
      allProjectFileNames: payload
    };

    const state = project(undefined, {
      type: UPDATE_PROJECT_FILE_NAMES,
      payload
    });

    expect(state).toEqual(expectedState);
  });

  it('update project file source', () => {
    const payload = 'dummy project file source';

    const expectedState = {
      ...initialState,
      fileSource: payload
    };

    const state = project(undefined, {
      type: UPDATE_PROJECT_FILE_SOURCE,
      payload
    });

    expect(state).toEqual(expectedState);
  });

  it('update project current file', () => {
    const payload = 'dummy project current file';

    const expectedState = {
      ...initialState,
      currentFile: payload
    };

    const state = project(undefined, {
      type: UPDATE_PROJECT_CURRENT_FILE,
      payload
    });

    expect(Storage.prototype.setItem).toHaveBeenCalledWith('project.currentFile', payload);
    expect(storage.getItem('project.currentFile')).toEqual(payload);
    expect(state).toEqual(expectedState);
  });

  it('open restore backup modal', () => {
    const expectedState = {
      ...initialState,
      isRestoreBackUpModalOpen: true
    };

    const state = project(undefined, {
      type: OPEN_RESTORE_BACKUP_MODAL
    });

    expect(state).toEqual(expectedState);
  });

  it('close restore backup modal', () => {
    const expectedState = {
      ...initialState,
      isRestoreBackUpModalOpen: false
    };

    const state = project(undefined, {
      type: CLOSE_RESTORE_BACKUP_MODAL
    });

    expect(state).toEqual(expectedState);
  });

  it('open new project modal', () => {
    const expectedState = {
      ...initialState,
      isNewProjectModalOpen: true
    };

    const state = project(undefined, {
      type: OPEN_NEW_PROJECT_MODAL
    });

    expect(state).toEqual(expectedState);
  });

  it('close new project modal', () => {
    const expectedState = {
      ...initialState,
      isNewProjectModalOpen: false
    };

    const state = project(undefined, {
      type: CLOSE_NEW_PROJECT_MODAL
    });

    expect(state).toEqual(expectedState);
  });

  it('update project name', () => {
    const payload = 'dummy project name';

    const expectedState = {
      ...initialState,
      name: payload
    };

    const state = project(undefined, {
      type: UPDATE_PROJECT_NAME,
      payload
    });

    expect(state).toEqual(expectedState);
  });

  it('set project opening', () => {
    const expectedState = {
      ...initialState,
      projectState: ProjectState.Opening
    };

    const state = project(undefined, {
      type: SET_PROJECT_OPENING
    });

    expect(state).toEqual(expectedState);
  });

  it('set project opened', () => {
    const expectedState = {
      ...initialState,
      projectState: ProjectState.Opened
    };

    const state = project(undefined, {
      type: SET_PROJECT_OPENED
    });

    expect(state).toEqual(expectedState);
  });

  it('set project closed', () => {
    const locationValue = 'dummy location value';
    const currentFile = 'dummy current file';

    storage.setItem('project.location', locationValue);
    storage.setItem('project.currentFile', currentFile);

    const expectedState = {
      ...initialState,
      location: undefined,
      currentFile: undefined,
      projectState: ProjectState.Closed
    };

    const state = project(undefined, {
      type: SET_PROJECT_CLOSED
    });

    expect(Storage.prototype.removeItem).toHaveBeenCalledWith('project.location');
    expect(Storage.prototype.removeItem).toHaveBeenCalledWith('project.currentFile');
    expect(storage.getItem('project.location')).not.toEqual(locationValue);
    expect(storage.getItem('project.currentFile')).not.toEqual(currentFile);
    expect(state).toEqual(expectedState);
  });

  it('update AWS profile name', () => {
    const payload = 'dummy aws profile name';

    const expectedState = {
      ...initialState,
      awsProfileName: payload
    };

    const state = project(undefined, {
      type: UPDATE_AWS_PROFILE_NAME,
      payload
    });

    expect(state).toEqual(expectedState);
  });

  it('update voice preview AWS region name', () => {
    const payload = 'dummy voice preview AWS region name';

    const expectedState = {
      ...initialState,
      voicePreviewAwsRegionName: payload
    };

    const state = project(undefined, {
      type: UPDATE_VOICE_PREVIEW_AWS_REGION_NAME,
      payload
    });

    expect(state).toEqual(expectedState);
  });

  it('set new project session id', () => {
    const projectSessionId = 'dummy project session id';

    const expectedState = {
      ...initialState,
      projectSessionId
    };

    const state = project(undefined, {
      type: SET_NEW_PROJECT_SESSION_ID,
      projectSessionId
    });

    expect(state).toEqual(expectedState);
  });

  it('clear project session id', () => {
    const expectedState = {
      ...initialState,
      projectSessionId: null
    };

    const state = project(undefined, {
      type: CLEAR_PROJECT_SESSION_ID
    });

    expect(state).toEqual(expectedState);
  });

  it('update project file map', () => {
    const payload = 'dummy project file map';

    const expectedState = {
      ...initialState,
      projectFileMap: payload
    };

    const state = project(undefined, {
      type: UPDATE_PROJECT_FILE_MAP,
      payload
    });

    expect(state).toEqual(expectedState);
  });
});
