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
  SLOT_TYPES_APPEND,
  SLOT_TYPES_UPDATE,
  SLOT_TYPES_REMOVE,
  SLOT_TYPES_REPLACE,
  SLOT_TYPES_RESET
} from '../actions/slot-types';

const initialState = {
  types: []
};

export default function simulator(state = initialState, action) {
  switch (action.type) {
    case SLOT_TYPES_APPEND:
      return {
        ...state,
        types: state.types.concat(action.payload)
      };
    case SLOT_TYPES_UPDATE:
      return {
        ...state,
        types: state.types.map(s =>
          s.name === action.payload.name ? action.payload : s
        )
      };
    case SLOT_TYPES_REMOVE:
      return {
        ...state,
        types: state.types.filter(s => s.name !== action.payload.name)
      };
    case SLOT_TYPES_REPLACE:
      return {
        ...state,
        types: [].concat(action.payload)
      };
    case SLOT_TYPES_RESET:
      return {
        ...initialState,
        types: []
      };
    default:
      return state;
  }
}
