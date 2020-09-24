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

import { getSecondsSinceTimestamp } from '@alexa-games/sfb-util'
import {
  SIMULATOR_START,
  SIMULATOR_EXIT,
  SIMULATOR_RESUME,
  SIMULATOR_UPDATE_RESPONSE,
  SIMULATOR_UPDATE_STORY_STATE,
  SIMULATOR_SEND,
  SET_IS_POLLY_PREVIEW,
  SET_POLLY_PREVIEW_ACCESS_TOKEN_INFO
} from '../actions/simulator';

const initialState = {
  response: null,
  isRunning: false,
  showSpinner: false,
  isPollyPreview: localStorage.getItem('simulator.isPollyPreview') ? localStorage.getItem('simulator.isPollyPreview') === 'true' : true, // local stage is storing as a string not a boolean
  pollyPreviewAccessTokenInfo: JSON.parse(localStorage.getItem('simulator.pollyPreviewAccessTokenInfo')) || { accessToken: "", timestamp: 0 }
};

// Clear any stale login with amazon data if not enabled
localStorage.setItem('simulator.pollyPreviewAccessTokenInfo', JSON.stringify({ accessToken: "", timestamp: 0 }))

export default function simulator(state = initialState, action) {

  let { response } = state;

  if(!response) {
    response = {};
  }

  switch (action.type) {
    case SIMULATOR_START:
      return {
        ...state,
        isRunning: true,
        showSpinner: true,
        response: null
      };
    case SIMULATOR_RESUME:
      return {
        ...state,
        isRunning: true,
        showSpinner: true,
        response: null
      };
    case SIMULATOR_SEND:
      return {
        ...state,
        // If passed in dontSpin parameter, don't set spinner on send command
        // otherwise set it to true
        showSpinner: !action.dontSpin
      };
      case SIMULATOR_EXIT:
      return {
        ...state,
        isRunning: false,
        showSpinner: false
      };
    case SIMULATOR_UPDATE_RESPONSE:
      return {
        ...state,
        response: action.payload,
        showSpinner: false
      };
    case SIMULATOR_UPDATE_STORY_STATE:
        response.storyState = action.storyState

      return {
        ...state,
        response,
        showSpinner: false
      };
    case SET_IS_POLLY_PREVIEW:
      localStorage.setItem('simulator.isPollyPreview', action.payload);
      return {
        ...state,
        isPollyPreview: action.payload
      };
    case SET_POLLY_PREVIEW_ACCESS_TOKEN_INFO:
      localStorage.setItem('simulator.pollyPreviewAccessTokenInfo', JSON.stringify(action.payload));
      return {
        ...state,
        pollyPreviewAccessTokenInfo: action.payload
      };
    default:
      return state;
  }
}
