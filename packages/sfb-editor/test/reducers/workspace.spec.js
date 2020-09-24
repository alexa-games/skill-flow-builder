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

import workspace from '../../app/reducers/workspace';

import {
  SET_MAP_TYPE,
  SET_IS_STACKED,
  SET_PRIMARY_MODE,
  SET_SECONDARY_MODE,
  SET_EDITOR_LOCALE,
  SET_SYNTAX_ERRORS,
  SET_SELECTED_SCENE_ID,
  TOGGLE_EXPERIMENTAL_MODE,
  SET_CURRENT_LOCALE,
  RESET_WORKSPACE,
  SET_RECENT_PROJECT_LIST,
  SET_SELECTED_SCENE_HISTORY,
  SET_EDITOR_REFERENCE
} from '../../app/actions/workspace';

import { LOCALE_LIST } from '../../app/data/constants';
import { WorkspacePrimaryMode, WorkspaceSecondaryMode } from '../../app/data/enums';

import { MockStorage } from '../mocks/mockStorage';

describe('Workspace Reducers', () => {
  let storage = {};

  beforeEach(() => {
    storage = new MockStorage();
    storage.setupSpies();
  });

  const initialState = {
    selectedSceneId: 'start',
    selectedSceneHistory: [],
    currentLocale: LOCALE_LIST[0],
    syntaxErrors: [],
    mapType: 'tree',
    isStacked: false,
    primaryMode: WorkspacePrimaryMode.Source,
    secondaryMode: WorkspaceSecondaryMode.Map,
    editorLocale: 'en-US',
    experimentalModeEnabled: false,
    recentProjectList: [],
  };

  it('returns the initial state', () => {
    expect(workspace(undefined, {})).toEqual(
      initialState
    );
  });

  it('sets mapType', () => {
    const payload = 'new map type';

    const expectedState = {
      ...initialState,
      mapType: payload
    };

    const state = workspace(undefined, {
      type: SET_MAP_TYPE,
      payload
    });

    expect(Storage.prototype.setItem).toHaveBeenCalledWith('workspace.mapType', payload);
    expect(state).toEqual(expectedState);
  });

  it('sets selectedSceneId', () => {
    const payload = 'scene';

    const expectedState = {
      ...initialState,
      selectedSceneId: payload
    };

    const state = workspace(undefined, {
      type: SET_SELECTED_SCENE_ID,
      payload
    });

    expect(state).toEqual(expectedState);
  });

  it('sets selectedSceneHistory', () => {
    const payload = 'history';

    const expectedState = {
      ...initialState,
      selectedSceneHistory: payload
    };

    const state = workspace(undefined, {
      type: SET_SELECTED_SCENE_HISTORY,
      payload
    });

    expect(state).toEqual(expectedState);
  });

  it('sets currentLocale', () => {
    const payload = 'locale';

    const expectedState = {
      ...initialState,
      currentLocale: payload
    };

    const state = workspace(undefined, {
      type: SET_CURRENT_LOCALE,
      payload
    });

    expect(state).toEqual(expectedState);
  });

  it('sets isStacked', () => {
    const payload = 'true';

    const expectedState = {
      ...initialState,
      isStacked: payload
    };

    const state = workspace(undefined, {
      type: SET_IS_STACKED,
      payload
    });

    expect(Storage.prototype.setItem).toHaveBeenCalledWith('workspace.isStacked', payload);
    expect(state).toEqual(expectedState);
  });

  it('sets primaryMode', () => {
    const payload = WorkspacePrimaryMode.Simulator;

    const expectedState = {
      ...initialState,
      primaryMode: payload
    };

    const state = workspace(undefined, {
      type: SET_PRIMARY_MODE,
      payload
    });

    expect(Storage.prototype.setItem).toHaveBeenCalledWith('workspace.primaryMode', payload);
    expect(state).toEqual(expectedState);
  });

  it('sets secondaryMode', () => {
    const payload = WorkspaceSecondaryMode.Documentation;

    const expectedState = {
      ...initialState,
      secondaryMode: payload
    };

    const state = workspace(undefined, {
      type: SET_SECONDARY_MODE,
      payload
    });

    expect(Storage.prototype.setItem).toHaveBeenCalledWith('workspace.secondaryMode', payload);
    expect(state).toEqual(expectedState);
  });

  it('sets editorLocale', () => {
    const payload = 'editor locale';

    const expectedState = {
      ...initialState,
      editorLocale: payload
    };

    const state = workspace(undefined, {
      type: SET_EDITOR_LOCALE,
      payload
    });

    expect(Storage.prototype.setItem).toHaveBeenCalledWith('workspace.editorLocale', payload);
    expect(state).toEqual(expectedState);
  });

  it('sets syntaxErrors', () => {
    const payload = 'syntax errors';

    const expectedState = {
      ...initialState,
      syntaxErrors: payload
    };

    const state = workspace(undefined, {
      type: SET_SYNTAX_ERRORS,
      payload
    });

    expect(state).toEqual(expectedState);
  });

  it('does not unset syntaxErrors if payload is missing', () => {
    const payload = 'set syntax errors';

    const expectedState = {
      ...initialState,
      syntaxErrors: payload
    };

    const setState = workspace(undefined, {
      type: SET_SYNTAX_ERRORS,
      payload
    });
    const stateAfterNull = workspace(setState, {
      type: SET_SYNTAX_ERRORS,
      payload: null
    });
    const stateAfterUndefined = workspace(setState, {
      type: SET_SYNTAX_ERRORS,
      payload: undefined
    });
    const stateAfterEmpty = workspace(setState, {
      type: SET_SYNTAX_ERRORS,
      payload: ''
    });
    
    expect(stateAfterNull).toEqual(expectedState);
    expect(stateAfterUndefined).toEqual(expectedState);
    expect(stateAfterEmpty).toEqual(expectedState);
  });

  it('toggles experimentalModeEnabled', () => {
    const firstExpectedState = {
      ...initialState,
      experimentalModeEnabled: true
    };

    const firstState = workspace(undefined, {
      type: TOGGLE_EXPERIMENTAL_MODE
    });


    expect(Storage.prototype.setItem).toHaveBeenCalledWith('workspace.experimentalModeEnabled', true);
    expect(firstState).toEqual(firstExpectedState);

    const secondExpectedState = {
      ...initialState,
      experimentalModeEnabled: false
    };

    const secondState = workspace(firstState, {
      type: TOGGLE_EXPERIMENTAL_MODE
    });

    expect(Storage.prototype.setItem).toHaveBeenCalledWith('workspace.experimentalModeEnabled', false);
    expect(secondState).toEqual(secondExpectedState);
  });

  it('resets workspace', () => {
    const modifiedState = {
      selectedSceneId: 'later',
      selectedSceneHistory: [ 'history' ],
      currentLocale: 'different locale',
      syntaxErrors: [ 'error' ],
      mapType: 'different type',
      isStacked: true,
      primaryMode: WorkspacePrimaryMode.Guided,
      secondaryMode: WorkspaceSecondaryMode.Audio,
      editorLocale: 'different editor locale',
      experimentalModeEnabled: true,
      recentProjectList: [ 'project' ],
    };

    const expectedState = {
      ...initialState,
      recentProjectList: modifiedState.recentProjectList,
      secondaryMode: WorkspaceSecondaryMode.News
    };

    const state = workspace(modifiedState, {
      type: RESET_WORKSPACE
    });

    expect(Storage.prototype.removeItem).toHaveBeenCalledWith('workspace.mapType');
    expect(Storage.prototype.removeItem).toHaveBeenCalledWith('workspace.primaryMode');
    expect(Storage.prototype.removeItem).toHaveBeenCalledWith('workspace.secondaryMode');
    expect(state).toEqual(expectedState);
  });

  it('sets recentProjectList', () => {
    const payload = [ 'project1', 'project2' ];

    const expectedState = {
      ...initialState,
      recentProjectList: payload
    };

    const state = workspace(undefined, {
      type: SET_RECENT_PROJECT_LIST,
      payload
    });


    expect(Storage.prototype.setItem).toHaveBeenCalledWith('workspace.recentProjectList', JSON.stringify(payload));
    expect(state).toEqual(expectedState);
  });

  it('sets editorReference', () => {
    const payload = 'reference';

    const expectedState = {
      ...initialState,
      editorReference: payload
    };

    const state = workspace(undefined, {
      type: SET_EDITOR_REFERENCE,
      payload
    });

    expect(state).toEqual(expectedState);
  });
});
