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
import { TMP_FOLDER_PATH, TMP_NOTES_FILE_PATH } from '../data/constants';

import { makeDir, readFile, writeFile, getContentPath } from '../utils-main';

export const NOTES_UPDATE = 'NOTES_UPDATE';

const FILE_NAME = 'NOTES.md';

export function updateNotes(payload) {
  return dispatch => {
    dispatch({
      type: NOTES_UPDATE,
      payload
    });
    dispatch(saveNotes(true)); // Save backup file
    dispatch(saveNotes(false)); // Save file
  };
}

export function fetchNotes() {
  return (dispatch, getState) => {
    const state = getState();
    const { location } = state.project;

    if (!location) {
      return; // exit
    }

    const contentPath = getContentPath(location);

    const filePath = path.resolve(contentPath, FILE_NAME);

    return readFile(filePath)
      .then(source => dispatch(updateNotes(source)))
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

export function saveNotes(isBackUp = false) {
  return (dispatch, getState) => {
    const state = getState();

    if (!state.project.location) {
      throw Error('No current project open.');
    }

    const { source } = state.notes;
    const { location } = state.project;

    const contentPath = getContentPath(location);

    const filePath = !isBackUp
      ? path.resolve(contentPath, FILE_NAME)
      : TMP_NOTES_FILE_PATH;

    return (isBackUp
      ? makeDir(TMP_FOLDER_PATH)
      : Promise.resolve())
          .then(() => writeFile(filePath, source))
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
