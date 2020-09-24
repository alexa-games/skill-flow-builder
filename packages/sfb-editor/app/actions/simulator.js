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

import { setSelectedSceneId } from './workspace';
import { sendSimulatorCommand as sendCommand } from '../utils-renderer';
import { loggerNotification } from './logger';

export const SIMULATOR_START = 'SIMULATOR_START';
export const SIMULATOR_RESUME = 'SIMULATOR_RESUME';
export const SIMULATOR_SEND = 'SIMULATOR_SEND';
export const SIMULATOR_EXIT = 'SIMULATOR_EXIT';
export const SIMULATOR_UPDATE_RESPONSE = 'SIMULATOR_UPDATE_RESPONSE';
export const SIMULATOR_UPDATE_STORY_STATE = 'SIMULATOR_UPDATE_STORY_STATE';
export const SET_IS_POLLY_PREVIEW = 'SET_IS_POLLY_PREVIEW';
export const SET_POLLY_PREVIEW_ACCESS_TOKEN_INFO = 'SET_POLLY_PREVIEW_ACCESS_TOKEN_INFO';

export function startSimulator() {
  return dispatch => {
    const handler = r => dispatch(updateSimulatorResponse(r));
    sendCommand(handler, '!restart');
    dispatch(setSelectedSceneId('start'));
    dispatch({ type: SIMULATOR_START });
  };
}

export function startSimulatorWithCommand(command) {
  return dispatch => {
    const handler = r => dispatch(updateSimulatorResponse(r));
    sendCommand(handler, command);
    dispatch({ type: SIMULATOR_START });
  };
}

export function resumeSimulator() {
  return dispatch => {
    dispatch({ type: SIMULATOR_RESUME });
  };
}

export function resumeSimulatorFromStart() {
  return dispatch => {
    const handler = r => dispatch(updateSimulatorResponse(r));
    sendCommand(handler, '!restart');

    dispatch({ type: SIMULATOR_RESUME });
  };
}

export function sendSimulatorCommand(payload, dontSpin) {
  return dispatch => {
    const handler = r => dispatch(updateSimulatorResponse(r));
    dispatch({ type: SIMULATOR_SEND, payload, dontSpin });
    sendCommand(handler, payload);
  };
}

export function updateSimulatorResponse(payload, storyState) {
  return dispatch => {

    if(!payload && storyState) {
      dispatch({
        type: SIMULATOR_UPDATE_STORY_STATE,
        storyState
      });
    } else if(payload) {
      const sceneId = payload.id ? payload.id.toLowerCase() : 'start';

      if (payload.error) {
        dispatch(
          loggerNotification({
            error: payload,
            type: 'error',
            dedup: false,
            triggerToast: true,
            message: payload.message
          })
        );
      } else {
        if(sceneId && sceneId.toLowerCase() !== "start") {
          dispatch(setSelectedSceneId(sceneId.toLowerCase()));
        }
        dispatch({
          type: SIMULATOR_UPDATE_RESPONSE,
          payload
        });
      }
    }
  };
}

export function exitSimulator() {
  return { type: SIMULATOR_EXIT };
}

export function setIsPollyPreview(payload) {
  return {
    type: SET_IS_POLLY_PREVIEW,
    payload
  };
}

export function setPollyPreviewAccessTokenInfo(payload) {
  return {
    type: SET_POLLY_PREVIEW_ACCESS_TOKEN_INFO,
    payload
  };
}
