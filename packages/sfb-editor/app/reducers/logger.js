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

import uuid from 'uuid/v4';

import {
  LOGGER_NOTIFY,
  LOGGER_CLOSE,
  LOGGER_OPEN_ERRORS,
  LOGGER_OPEN_MESSAGES,
  LOGGER_DISMISS_TOAST,
  LOGGER_CLEAR_ERRORS_AND_MESSAGES
} from '../actions/logger';

const initialState = {
  log: [],
  toasts: [],
  showItems: [],
  totalErrors: 0,
  totalMessages: 0,
  unreadErrors: 0,
  unreadMessages: 0
};

export default function logger(state = initialState, action) {
  let showItems;
  switch (action.type) {
    case LOGGER_CLOSE:
      return {
        ...state,
        showItems: []
      };
    case LOGGER_OPEN_ERRORS:
      showItems = state.log.filter(({ type }) => type === 'error');
      showItems =
        showItems.length === 0
          ? [{ type: 'error', message: 'No errors.', timestamp: Date.now() }]
          : showItems;
      return {
        ...state,
        showItems,
        unreadErrors: 0
      };
    case LOGGER_OPEN_MESSAGES:
      showItems = state.log.filter(({ type }) => type !== 'error');
      showItems =
        showItems.length === 0
          ? [
              {
                type: 'message',
                message: 'No messages.',
                timestamp: Date.now()
              }
            ]
          : showItems;
      return {
        ...state,
        showItems,
        unreadMessages: 0
      };
    case LOGGER_DISMISS_TOAST:
      return {
        ...state,
        toasts: state.toasts.filter(({ id }) => id !== action.payload.id)
      };
    case LOGGER_NOTIFY:
      // Check if preivous log contains this same log message, and if so then don't retrigger the toast if the deduplication
      // flag was passed.
      let foundPreviousDedup = false;
      if (action.payload.dedup) {
        if (state.previousLog) {
          // Undefined check, because we don't want to set in initial state because it will mess with reset logic
          for (const logLine of state.previousLog) {
            if (
              JSON.stringify(logLine.error) ===
              JSON.stringify(action.payload.error)
            ) {
              foundPreviousDedup = true;
            }
          }
        }
      }

      return {
        ...state,
        log: state.log.concat({
          ...action.payload,
          timestamp: Date.now()
        }),
        toasts:
          action.payload.triggerToast && !foundPreviousDedup
            ? state.toasts.concat({
                ...action.payload,
                id: uuid()
              })
            : state.toasts,
        totalErrors:
          action.payload.type === 'error'
            ? state.totalErrors + 1
            : state.totalErrors,
        totalMessages:
          action.payload.type !== 'error'
            ? state.totalMessages + 1
            : state.totalMessages,
        unreadErrors:
          action.payload.type === 'error' && !action.payload.triggerToast
            ? state.unreadErrors + 1
            : state.unreadErrors,
        unreadMessages:
          action.payload.type !== 'error' && !action.payload.triggerToast
            ? state.unreadMessages + 1
            : state.unreadMessages
      };
    case LOGGER_CLEAR_ERRORS_AND_MESSAGES:
      // Now cache the previous list of errors/warnings so they can be used for deduplication
      state.previousLog = state.log;

      return {
        ...state,
        ...initialState
      };
    default:
      return state;
  }
}
