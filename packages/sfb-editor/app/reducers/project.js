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
} from '../actions/project';
import { getGraphElements } from '../utils/graph';
import { ProjectState } from '../data/enums';

const initialState = {
  source: '',
  json: null,
  graphElements: null,
  jsonWithExtensions: null,
  importSuccessful: false,
  allProjectFileNames: [],
  isRestoreBackUpModalOpen: false,
  location: localStorage.getItem('project.location'),
  currentFile: localStorage.getItem('project.currentFile'),
  isNewProjectModalOpen: false,
  name: '',
  awsProfileName: '',
  projectState: ProjectState.Closed,
  projectSessionId: null,
  projectFileMap: {}
};

export default function project(state = initialState, action) {
  switch (action.type) {
    case UPDATE_PROJECT_SOURCE:
      return {
        ...state,
        source: action.payload
      };
    case UPDATE_PROJECT_JSON:
      return {
        ...state,
        json: action.payload,
        graphElements: getGraphElements(action.payload)
      };
    case UPDATE_PROJECT_JSON_WITH_EXTENSIONS:
      return {
        ...state,
        jsonWithExtensions: action.payload
      };
    case UPDATE_PROJECT_IMPORT_SUCCESSFUL:
      return {
        ...state,
        importSuccessful: action.payload
      };
    case UPDATE_PROJECT_LOCATION:
      localStorage.setItem('project.location', action.payload);
      return {
        ...state,
        location: action.payload
      };
    case UPDATE_PROJECT_FILE_NAMES:
      return {
        ...state,
        allProjectFileNames: action.payload
      };
    case UPDATE_PROJECT_FILE_SOURCE:
      return {
        ...state,
        fileSource: action.payload
      };
    case UPDATE_PROJECT_CURRENT_FILE:
      localStorage.setItem('project.currentFile', action.payload);
      return {
        ...state,
        currentFile: action.payload
      };
    case OPEN_RESTORE_BACKUP_MODAL:
      return {
        ...state,
        isRestoreBackUpModalOpen: true
      };
    case CLOSE_RESTORE_BACKUP_MODAL:
      return {
        ...state,
        isRestoreBackUpModalOpen: false
      };
    case OPEN_NEW_PROJECT_MODAL:
      return {
        ...state,
        isNewProjectModalOpen: true
      };
    case CLOSE_NEW_PROJECT_MODAL:
      return {
        ...state,
        isNewProjectModalOpen: false
      };
    case UPDATE_PROJECT_NAME:
      return {
        ...state,
        name: action.payload
      };
    case SET_PROJECT_OPENING:
      return {
        ...state,
        projectState: ProjectState.Opening
      };
    case SET_PROJECT_OPENED:
      return {
        ...state,
        projectState: ProjectState.Opened
      };
    case SET_PROJECT_CLOSED:
      localStorage.removeItem('project.location');
      localStorage.removeItem('project.currentFile');
      return {
        ...initialState,
        location: undefined,
        currentFile: undefined,
        projectState: ProjectState.Closed
      };
    case UPDATE_AWS_PROFILE_NAME:
      return {
        ...state,
        awsProfileName: action.payload
      };
    case UPDATE_VOICE_PREVIEW_AWS_REGION_NAME:
      return {
        ...state,
        voicePreviewAwsRegionName: action.payload
      };
    case SET_NEW_PROJECT_SESSION_ID:
      return {
        ...state,
        projectSessionId: action.projectSessionId
      };
    case CLEAR_PROJECT_SESSION_ID:
      return {
        ...state,
        projectSessionId: null
      };
     case UPDATE_PROJECT_FILE_MAP:
      return {
        ...state,
        projectFileMap: action.payload
      };
    default:
      return state;
  }
}
