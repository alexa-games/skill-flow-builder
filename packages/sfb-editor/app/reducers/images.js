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

import {
  IMAGES_APPEND,
  IMAGES_UPDATE,
  IMAGES_REMOVE,
  IMAGES_REPLACE
} from '../actions/images';

const initialState = {
  files: []
};

export default function simulator(state = initialState, action) {
  switch (action.type) {
    case IMAGES_APPEND:
      return {
        ...state,
        files: state.files.concat(action.payload)
      };
    case IMAGES_UPDATE:
      return {
        ...state,
        files: state.files.map(s =>
          s.id === action.payload.id ? action.payload : s
        )
      };
    case IMAGES_REMOVE:
      return {
        ...state,
        files: state.files.filter(s => s.id !== action.payload.id)
      };
    case IMAGES_REPLACE:
      return {
        ...state,
        files: [].concat(action.payload)
      };
    default:
      return state;
  }
}
