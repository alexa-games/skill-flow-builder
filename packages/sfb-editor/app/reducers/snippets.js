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
  SNIPPETS_APPEND,
  SNIPPETS_UPDATE,
  SNIPPETS_REMOVE,
  SNIPPETS_REPLACE,
  SNIPPETS_SET_ERROR
} from '../actions/snippets';

const initialState = {
  snippets: [],
  hasError: false,
  errorMessage: ''
};

export default function simulator(state = initialState, action) {
  switch (action.type) {
    case SNIPPETS_APPEND:
      return {
        ...state,
        snippets: state.snippets.concat(action.payload)
      };
    case SNIPPETS_UPDATE:
      return {
        ...state,
        snippets: state.snippets.map(s =>
          s.short === action.payload.short ? action.payload : s
        )
      };
    case SNIPPETS_REMOVE:
      return {
        ...state,
        snippets: state.snippets.filter(s => s.short !== action.payload.short)
      };
    case SNIPPETS_REPLACE:
      return {
        ...state,
        snippets: [].concat(action.payload)
      };
    case SNIPPETS_SET_ERROR:
      return typeof action.payload === 'string'
        ? {
            ...state,
            hasError: true,
            errorMessage: action.payload
          }
        : {
            ...state,
            hasError: false,
            errorMessage: ''
          };
    default:
      return state;
  }
}
