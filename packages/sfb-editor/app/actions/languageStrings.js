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
import { loggerNotification } from './logger';
import {
  TMP_FOLDER_PATH,
  TMP_LANGUAGE_STRINGS_FILE_PATH
} from '../data/constants';

import { makeDir, readFile, writeFile, getContentPath } from '../utils-main';

export const LANGUAGE_STRINGS_UPDATE = 'LANGUAGE_STRINGS_UPDATE';

const FILE_NAME = 'languageStrings.json';

export function updateLanguageStrings(payload) {
  return dispatch => {
    dispatch({
      type: LANGUAGE_STRINGS_UPDATE,
      payload
    });
    dispatch(saveLanguageStrings(true));
  };
}

export function fetchLanguageStrings() {
  return (dispatch, getState) => {
    const state = getState();
    const { location } = state.project;

    if (!location) {
      return; // exit
    }

    const contentPath = getContentPath(location);

    const filePath = path.resolve(contentPath, FILE_NAME);

    return readFile(filePath)
      .then(source => dispatch(updateLanguageStrings(source)))
      .catch(err => {
        dispatch(
          loggerNotification({
            error: err,
            type: 'error',
            triggerToast: true,
            message: err.message
          })
        );
      });
  };
}

export function saveLanguageStrings(isBackUp = false) {
  return (dispatch, getState) => {
    const state = getState();

    if (!state.project.location) {
      throw Error('No current project open.');
    }

    const { langObj } = state.languageStrings;
    const { location } = state.project;

    const contentPath = getContentPath(location);

    const filePath = !isBackUp
      ? path.resolve(contentPath, FILE_NAME)
      : TMP_LANGUAGE_STRINGS_FILE_PATH;

    const langObjString = JSON.stringify(langObj, null, 4);

    return isBackUp
      ? makeDir(TMP_FOLDER_PATH)
      : Promise.resolve()
          .then(() => writeFile(filePath, langObjString))
          .then(() =>
            dispatch(
              loggerNotification({
                type: 'message',
                message: 'Project language strings saved.'
              })
            )
          )
          .catch(err => {
            dispatch(
              loggerNotification({
                error: err,
                type: 'error',
                triggerToast: true,
                message: err.message
              })
            );
          });
  };
}
