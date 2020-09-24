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
import { remote } from 'electron';
import { reimportProject, reimportProjectForSimulator } from './project';
import { cleanDir } from '../utils-main';
import { loggerNotification } from './logger';

export const SET_MAP_TYPE = 'SET_MAP_TYPE';
export const SET_IS_STACKED = 'SET_IS_STACKED';
export const SET_CURRENT_LOCALE = 'SET_CURRENT_LOCALE';
export const SET_PRIMARY_MODE = 'SET_PRIMARY_MODE';
export const SET_SECONDARY_MODE = 'SET_SECONDARY_MODE';
export const SET_EDITOR_LOCALE = 'SET_EDITOR_LOCALE';
export const SET_SELECTED_SCENE_ID = 'SET_SELECTED_SCENE_ID';
export const SET_SYNTAX_ERRORS = 'SET_SYNTAX_ERRORS';
export const TOGGLE_EXPERIMENTAL_MODE = 'TOGGLE_EXPERIMENTAL_MODE';
export const RESET_WORKSPACE = 'RESET_WORKSPACE';
export const SET_RECENT_PROJECT_LIST = 'SET_RECENT_PROJECT_LIST';
export const SET_SELECTED_SCENE_HISTORY = 'SET_SELECTED_SCENE_HISTORY';
export const SET_EDITOR_REFERENCE = 'SET_EDITOR_REFERENCE';

export function setMapType(payload) {
  return {
    type: SET_MAP_TYPE,
    payload
  };
}

export function setIsStacked(payload) {
  // fire a resize event for components that need to adjust their size
  setTimeout(() => window.dispatchEvent(new Event('resize')), 10);
  return {
    type: SET_IS_STACKED,
    payload
  };
}

export function clearVoicePreviewCache() {
  return (dispatch) => {
    const pollyPreviewFolder = path.resolve(remote.app.getPath("userData"), "pollyPreview");

    // Ensure that path really resolved properly before doing clear operation
    if(pollyPreviewFolder && pollyPreviewFolder.endsWith("pollyPreview")) {
      cleanDir(pollyPreviewFolder);

      dispatch(
        loggerNotification({
          triggerToast: true,
          title: 'Voice Preview Cache Cleared',
          message: `Cleaned Voice Preview Cache: '${pollyPreviewFolder}'.`
        })
      );
    }
  }
}

export function setCurrentLocale(payload) {
  return dispatch => {
    dispatch({
      type: SET_CURRENT_LOCALE,
      payload
    });

    dispatch(reimportProjectForSimulator());
  };
}

export function setPrimaryMode(payload) {
  return {
    type: SET_PRIMARY_MODE,
    payload
  };
}

export function setSecondaryMode(payload) {
  return {
    type: SET_SECONDARY_MODE,
    payload
  };
}

export function setEditorLocale(payload) {
  return {
    type: SET_EDITOR_LOCALE,
    payload
  };
}

export function pushToNavigationStack(payload) {
  return (dispatch, getState) => {

    const {workspace} = getState();
    const {selectedSceneHistory} = workspace;
    const newHistory = selectedSceneHistory.concat(payload);

    dispatch({
      type: SET_SELECTED_SCENE_HISTORY,
      payload: newHistory
    });
  }
}

export function popNavigationStack() {
  return (dispatch, getState) => {

    const {workspace} = getState();
    const {selectedSceneHistory} = workspace;
    const newHistory = selectedSceneHistory.slice(0, -1);

    dispatch({
      type: SET_SELECTED_SCENE_HISTORY,
      payload: newHistory
    });
  }
}

export function clearNavigationStack() {
  return {
    type: SET_SELECTED_SCENE_HISTORY,
    payload: []
  }
}

export function setSelectedSceneId(payload) {
  return {
    type: SET_SELECTED_SCENE_ID,
    payload
  };
}

export function setSyntaxErrors(payload) {
  return {
    type: SET_SYNTAX_ERRORS,
    payload
  };
}

export function toggleExperimentalModeEnabledd() {
  return {
    type: TOGGLE_EXPERIMENTAL_MODE
  };
}

export function setRecentProjectList(payload) {
  return {
    type: SET_RECENT_PROJECT_LIST,
    payload
  };
}

export function setEditorReference(payload) {
  return {
    type: SET_EDITOR_REFERENCE,
    payload
  };
}
