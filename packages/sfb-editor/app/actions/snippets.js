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
import { getResourcesPath, readJson, writeJson } from '../utils-main';

export const SNIPPETS_APPEND = 'SNIPPETS_APPEND';
export const SNIPPETS_UPDATE = 'SNIPPETS_UPDATE';
export const SNIPPETS_REMOVE = 'SNIPPETS_REMOVE';
export const SNIPPETS_REPLACE = 'SNIPPETS_REPLACE';
export const SNIPPETS_SET_ERROR = 'SNIPPETS_SET_ERROR';

export function appendSnippets(payload) {
  return {
    type: SNIPPETS_APPEND,
    payload
  };
}

export function updateSnippets(payload) {
  return {
    type: SNIPPETS_UPDATE,
    payload
  };
}

export function removeSnippets(payload) {
  return {
    type: SNIPPETS_REMOVE,
    payload
  };
}

export function replaceSnippets(payload) {
  return {
    type: SNIPPETS_REPLACE,
    payload
  };
}

export function setSnippetsError(payload) {
  return {
    type: SNIPPETS_SET_ERROR,
    payload
  };
}

export function deleteSnippet(payload) {
  return (dispatch, getState) => {
    const state = getState();
    const { location } = state.project;
    const resourcesPath = getResourcesPath(
      location,
      state.workspace.currentLocale
    );
    return readSnippetsFile(resourcesPath)
      .then(snippets => {
        const updatedSnippets = {};
        snippets
          .filter(s => s.short !== payload.short)
          .forEach(snippet => {
            updatedSnippets[snippet.short] = snippet.long;
          });
        return {
          ...updatedSnippets
        };
      })
      .then(snippets =>
        writeJson(path.resolve(resourcesPath, 'Snippets.json'), snippets, {
          indent: true
        })
      )
      .then(() => dispatch(removeSnippets(payload)))
      .catch(error => {
        log.error(error);
        dispatch(
          loggerNotification({
            message: error ? error.message : 'Unhandled error.',
            type: 'warning',
            triggerToast: true,
            title: 'Error deleting snippet.'
          })
        );
      });
  };
}

export function createSnippet(payload) {
  return (dispatch, getState) => {
    const state = getState();
    const { location } = state.project;
    const resourcesPath = getResourcesPath(
      location,
      state.workspace.currentLocale
    );
    return readJson(path.resolve(resourcesPath, 'Snippets.json'))
      .then(snippets => {
        if (snippets[payload.short]) {
          throw new Error('Snippet already exists.');
        }
        return {
          ...snippets,
          [`${payload.short}`]: `${payload.long}`
        };
      })
      .then(snippets =>
        writeJson(path.resolve(resourcesPath, 'Snippets.json'), snippets, {
          indent: true
        })
      )
      .then(() => dispatch(appendSnippets(payload)))
      .catch(error => {
        dispatch(
          loggerNotification({
            message: error.message,
            type: 'warning',
            triggerToast: true,
            title: 'Error creating snippet.'
          })
        );
      });
  };
}

export function fetchSnippets() {
  return (dispatch, getState) => {
    const state = getState();
    const { location } = state.project;
    const resourcesPath = getResourcesPath(
      location,
      state.workspace.currentLocale
    );

    dispatch(setSnippetsError(null));
    return readSnippetsFile(resourcesPath)
      .then(snippets => dispatch(replaceSnippets(snippets)))
      .catch(() => {
        const message =
          'There was an error reading `content/<locale>/resources/Snippets.json`. Please ensure the file exists, and that it is valid JSON.';

        dispatch(replaceSnippets([]));
        dispatch(
          loggerNotification({
            message,
            type: 'warning',
            triggerToast: true,
            title: 'Snippets could not be loaded.'
          })
        );
        dispatch(setSnippetsError(message));
      });
  };
}

function readSnippetsFile(resourcesPath) {
  return readJson(path.resolve(resourcesPath, 'Snippets.json')).then(json => {
    if (json === null) {
      throw Error();
    }

    return Object.entries(json).map(([short, long]) => ({ short, long }));
  });
}
