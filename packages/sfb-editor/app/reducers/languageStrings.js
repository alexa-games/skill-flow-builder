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

import { isString } from 'lodash';
import { isObject } from 'util';
import log from 'electron-log';
import { LANGUAGE_STRINGS_UPDATE } from '../actions/languageStrings';

const initialState = {
  langObj: {}
};

export default function simulator(state = initialState, action) {
  switch (action.type) {
    case LANGUAGE_STRINGS_UPDATE:
      let langObj = {};

      if (action.payload) {
        try {
          if (isString(action.payload)) {
            langObj = JSON.parse(action.payload);
          } else if (isObject(action.payload)) {
            langObj = action.payload;
          }
        } catch (err) {
          log.error('Error updating state of language strings');
          log.error(err);
        }
      }

      return {
        ...state,
        langObj
      };
    default:
      return state;
  }
}
