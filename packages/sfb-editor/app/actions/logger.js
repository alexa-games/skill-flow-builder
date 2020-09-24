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

export const LOGGER_NOTIFY = 'LOGGER_NOTIFY';
export const LOGGER_CLOSE = 'LOGGER_CLOSE';
export const LOGGER_OPEN_ERRORS = 'LOGGER_OPEN_ERRORS';
export const LOGGER_OPEN_MESSAGES = 'LOGGER_OPEN_MESSAGES';
export const LOGGER_DISMISS_TOAST = 'LOGGER_DISMISS_TOAST';
export const LOGGER_CLEAR_ERRORS_AND_MESSAGES =
  'LOGGER_CLEAR_ERRORS_AND_MESSAGES';

export function loggerNotification(payload) {
  // trigger a toast
  // payload.triggerToast === true
  return {
    type: LOGGER_NOTIFY,
    payload
  };
}

export function loggerClose() {
  return {
    type: LOGGER_CLOSE
  };
}

export function loggerOpenErrors() {
  return {
    type: LOGGER_OPEN_ERRORS
  };
}

export function loggerOpenMessages() {
  return {
    type: LOGGER_OPEN_MESSAGES
  };
}

export function loggerDismissToast(payload) {
  return {
    type: LOGGER_DISMISS_TOAST,
    payload
  };
}

export function loggerClearErrorsAndMessages() {
  return {
    type: LOGGER_CLEAR_ERRORS_AND_MESSAGES
  };
}
