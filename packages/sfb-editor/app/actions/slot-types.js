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
import { TMP_FOLDER_PATH, TMP_SLOTS_FILE_PATH } from '../data/constants';

import { makeDir, readJson, writeJson, getResourcesPath } from '../utils-main';

export const SLOT_TYPES_APPEND = 'SLOT_TYPES_APPEND';
export const SLOT_TYPES_UPDATE = 'SLOT_TYPES_UPDATE';
export const SLOT_TYPES_REMOVE = 'SLOT_TYPES_REMOVE';
export const SLOT_TYPES_REPLACE = 'SLOT_TYPES_REPLACE';
export const SLOT_TYPES_RESET = 'SLOT_TYPES_RESET';

const FILE_NAME = 'SlotTypes.json';

function getSlotTypeMapping(slotTypes) {
  if (slotTypes.length) {
    return slotTypes.reduce((acc, slot) => {
      acc[slot.name] = slot.values;
      return acc;
    }, {});
  }
  return {};
}

export function appendSlotTypes(payload) {
  return {
    type: SLOT_TYPES_APPEND,
    payload
  };
}

export function updateSlotTypes(payload) {
  return dispatch => {
    dispatch({
      type: SLOT_TYPES_UPDATE,
      payload
    });
    return dispatch(saveSlotTypes(true)); // save backup
  };
}

export function removeSlotTypes(payload) {
  return dispatch => {
    dispatch({
      type: SLOT_TYPES_REMOVE,
      payload
    });
    return dispatch(saveSlotTypes(true)); // save backup
  }
}

export function replaceSlotTypes(payload) {
  return {
    type: SLOT_TYPES_REPLACE,
    payload
  };
}

export function fetchSlotTypes() {
  return (dispatch, getState) => {
    const state = getState();
    const { location } = state.project;

    const resourcesPath = getResourcesPath(
      location,
      state.workspace.currentLocale
    );

    return readJson(path.resolve(resourcesPath, 'SlotTypes.json'))
      .then(json => {
        const slotTypes = Object.entries(json).map(([name, values]) => ({
          name,
          values
        }));

        return dispatch(replaceSlotTypes(slotTypes));
      })
      .catch(() => {
        // should get the error here and log it somewhere useful
        dispatch(replaceSlotTypes([]));
        dispatch(
          loggerNotification({
            triggerToast: true,
            title: 'Slot types could not be loaded.',
            message: `Check that a \`${resourcesPath}/SlotTypes.json\` file exists inside your project.`
          })
        );
      });
  };
}

export function saveSlotTypes(isBackUp = false) {
  return (dispatch, getState) => {
    const state = getState();

    if (!state.project.location) {
      throw Error('No current project open.');
    }

    const { location } = state.project;

    const resourcesPath = getResourcesPath(
      location,
      state.workspace.currentLocale
    );

    const filePath = !isBackUp
      ? path.resolve(resourcesPath, FILE_NAME)
      : TMP_SLOTS_FILE_PATH;

    return (isBackUp
      ? makeDir(TMP_FOLDER_PATH)
      : Promise.resolve())
          .then(() =>
            writeJson(filePath, getSlotTypeMapping(state.slotTypes.types), {
              indent: true
            })
          )
          .then(() =>
            dispatch(
              loggerNotification({
                type: 'message',
                message: 'Project slot types saved.'
              })
            )
          )
          .catch(err => {
            dispatch(
              loggerNotification({
                error: err,
                type: 'error',
                triggerToast: true,
                message: `Please make a resources directory in you project for locale ${state.workspace.currentLocale}. Received error: ${err}`
              })
            );
          });
  };
}
