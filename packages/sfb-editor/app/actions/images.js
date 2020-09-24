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

import { copyFile, findImageFiles, getResourcesPath } from '../utils-main';

export const IMAGES_APPEND = 'IMAGES_APPEND';
export const IMAGES_UPDATE = 'IMAGES_UPDATE';
export const IMAGES_REMOVE = 'IMAGES_REMOVE';
export const IMAGES_REPLACE = 'IMAGES_REPLACE';

const VALID_IMAGE_EXT = ['.png', '.jpg', '.jpeg'];

export function appendImages(payload) {
  return {
    type: IMAGES_APPEND,
    payload
  };
}

export function updateImages(payload) {
  return {
    type: IMAGES_UPDATE,
    payload
  };
}

export function removeImages(payload) {
  return {
    type: IMAGES_REMOVE,
    payload
  };
}

export function replaceImages(payload) {
  return {
    type: IMAGES_REPLACE,
    payload
  };
}

export function fetchImages() {
  return (dispatch, getState) => {
    const state = getState();
    const { location } = state.project;

    const resourcesPath = getResourcesPath(
      location,
      state.workspace.currentLocale
    );

    const folderPath = path.resolve(resourcesPath, 'public', 'images');

    return findImageFiles(folderPath)
      .then(files => {
        const data = files.map(filename => ({
          filename,
          src: path.resolve(folderPath, filename)
        }));
        return dispatch(replaceImages(data));
      })
      .catch(() => {
        dispatch(replaceImages([]));
        dispatch(
          loggerNotification({
            triggerToast: true,
            title: 'Images could not be loaded.',
            message:
              'Check that a `resources/public/images` folder exists inside your project.'
          })
        );
      });
  };
}

export function addFileToProject(payload) {
  const { ext } = path.parse(payload);

  if (!VALID_IMAGE_EXT.includes(ext)) {
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
    const folderPath = path.resolve(resourcesPath, 'public', 'images');
    const destination = path.resolve(folderPath, filename);

    return copyFile(payload, destination).then(() =>
      dispatch(
        appendImages({
          filename,
          src: destination
        })
      )
    );
  };
}
