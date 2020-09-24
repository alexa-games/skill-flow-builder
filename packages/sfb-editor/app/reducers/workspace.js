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
} from '../actions/workspace';

import { LOCALE_LIST } from '../data/constants';
import { WorkspacePrimaryMode, WorkspaceSecondaryMode } from '../data/enums';
import { convertLegacyWorkspacePrimaryMode, convertLegacyWorkspaceSecondaryMode } from '../utils/legacy';

const initialState = {
  selectedSceneId: 'start',
  selectedSceneHistory: [],
  currentLocale: LOCALE_LIST[0],
  syntaxErrors: [], // do not cache syntax errors
  mapType: localStorage.getItem('workspace.mapType') || 'tree',
  isStacked: localStorage.getItem('workspace.isStacked') === 'true',
  primaryMode: convertLegacyWorkspacePrimaryMode(localStorage.getItem('workspace.primaryMode')) || WorkspacePrimaryMode.Source,
  secondaryMode: convertLegacyWorkspaceSecondaryMode(localStorage.getItem('workspace.secondaryMode')) || WorkspaceSecondaryMode.Map,
  editorLocale: localStorage.getItem('workspace.editorLocale') || 'en-US',
  experimentalModeEnabled:
    localStorage.getItem('workspace.experimentalModeEnabled') === 'true',
  recentProjectList:
    JSON.parse(localStorage.getItem('workspace.recentProjectList')) || [],
};

export default function workspace(state = initialState, action) {
  switch (action.type) {
    case SET_MAP_TYPE:
      localStorage.setItem('workspace.mapType', action.payload);
      return {
        ...state,
        mapType: action.payload
      };
    case SET_SELECTED_SCENE_ID:
      return {
        ...state,
        selectedSceneId: action.payload
      };
    case SET_SELECTED_SCENE_HISTORY:
      return {
        ...state,
        selectedSceneHistory: action.payload
      };
    case SET_CURRENT_LOCALE:
      return {
        ...state,
        currentLocale: action.payload
      };
    case SET_IS_STACKED:
      localStorage.setItem('workspace.isStacked', action.payload);
      return {
        ...state,
        isStacked: action.payload
      };
    case SET_PRIMARY_MODE:
      localStorage.setItem('workspace.primaryMode', action.payload);
      return {
        ...state,
        primaryMode: action.payload
      };
    case SET_SECONDARY_MODE:
      localStorage.setItem('workspace.secondaryMode', action.payload);
      return {
        ...state,
        secondaryMode: action.payload
      };
    case SET_EDITOR_LOCALE:
      localStorage.setItem('workspace.editorLocale', action.payload);
      return {
        ...state,
        editorLocale: action.payload
      };
    case SET_SYNTAX_ERRORS:
      // do not cache syntax errors
      // as they should be raised on import
      return {
        ...state,
        syntaxErrors: action.payload || state.syntaxErrors
      };
    case TOGGLE_EXPERIMENTAL_MODE:
      localStorage.setItem(
        'workspace.experimentalModeEnabled',
        !state.experimentalModeEnabled
      );
      return {
        ...state,
        experimentalModeEnabled: !state.experimentalModeEnabled
      };
    case RESET_WORKSPACE:
      localStorage.removeItem('workspace.mapType');
      localStorage.removeItem('workspace.primaryMode');
      localStorage.removeItem('workspace.secondaryMode');
      return {
        ...initialState,
        recentProjectList: state.recentProjectList,
        secondaryMode: WorkspaceSecondaryMode.News
      };
    case SET_RECENT_PROJECT_LIST:
      localStorage.setItem(
        'workspace.recentProjectList',
        JSON.stringify(action.payload)
      );
      return {
        ...state,
        recentProjectList: action.payload
      };
    case SET_EDITOR_REFERENCE:
      return {
        ...state,
        editorReference: action.payload
      }
    default:
      return state;
  }
}
