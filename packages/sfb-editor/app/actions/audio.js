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
import log from 'electron-log';
import { loggerNotification } from './logger';
import { copyFile, findAudioFiles, getResourcesPath } from '../utils-main';

export const AUDIO_APPEND = 'AUDIO_APPEND';
export const AUDIO_UPDATE = 'AUDIO_UPDATE';
export const AUDIO_REMOVE = 'AUDIO_REMOVE';
export const AUDIO_REPLACE = 'AUDIO_REPLACE';

const VALID_AUDIO_EXT = ['.mp3', '.wav'];

export function appendAudio(payload) {
  return {
    type: AUDIO_APPEND,
    payload
  };
}

export function updateAudio(payload) {
  return {
    type: AUDIO_APPEND,
    payload
  };
}

export function removeAudio(payload) {
  return {
    type: AUDIO_APPEND,
    payload
  };
}

export function replaceAudio(payload) {
  return {
    type: AUDIO_REPLACE,
    payload
  };
}

export function fetchAudio() {
  return (dispatch, getState) => {
    const state = getState();
    const { location } = state.project;

    const resourcesPath = getResourcesPath(
      location,
      state.workspace.currentLocale
    );

    const folderPath = path.resolve(resourcesPath, 'public', 'audio');

    return findAudioFiles(folderPath)
      .then(files => {
        const data = files.map(filename => ({
          filename,
          src: path.resolve(folderPath, filename)
        }));
        return dispatch(replaceAudio(data));
      })
      .catch(err => {
        log.error(err);
        dispatch(replaceAudio([]));
        dispatch(
          loggerNotification({
            triggerToast: true,
            title: 'Audio could not be loaded.',
            message:
              'Check that a `resources/public/audio` folder exists inside your project.'
          })
        );
      });
  };
}

export function addFileToProject(payload) {
  const { ext } = path.parse(payload);

  if (!VALID_AUDIO_EXT.includes(ext)) {
    return; // exit
  }

  return (dispatch, getState) => {
    const state = getState();
    const { location } = state.project;

    const resourcesPath = getResourcesPath(
      location,
      state.workspace.currentLocale
    );

    const filename = path.basename(payload);
    const folderPath = path.resolve(resourcesPath, 'public', 'audio');
    const destination = path.resolve(folderPath, filename);

    return copyFile(payload, destination).then(() =>
      dispatch(
        appendAudio({
          filename,
          src: destination
        })
      )
    );
  };
}
