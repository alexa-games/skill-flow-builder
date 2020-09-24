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
  START_BUILD_ACTION,
  END_BUILD_ACTION,
  LOG_TO_BUILD_OUTPUT,
  STD_OUT_TO_BUILD_OUTPUT,
  STD_ERR_TO_BUILD_OUTPUT,
  CLEAR_BUILD_OUTPUT,
  OPEN_BUILD_OUTPUT,
  CLOSE_BUILD_OUTPUT
} from '../actions/build';

const { StringDecoder } = require('string_decoder');

const initialState = {
  isPerformingBuildAction: false,
  buildOutput: '',
  isBuildOutputOpen: false
};

export default function build(state = initialState, action) {
  switch (action.type) {
    case START_BUILD_ACTION:
      return {
        ...state,
        isPerformingBuildAction: true
      };
    case END_BUILD_ACTION:
      return {
        ...state,
        isPerformingBuildAction: false
      };
    case LOG_TO_BUILD_OUTPUT:
      return {
        ...state,
        buildOutput: updateBuildOutputWithLoggerMessage(state, action)
      };
    case STD_OUT_TO_BUILD_OUTPUT:
      return {
        ...state,
        buildOutput: updateBuildOutputWithStdOut(state, action)
      };
    case STD_ERR_TO_BUILD_OUTPUT:
      return {
        ...state,
        buildOutput: updateBuildOutputWithStdOut(state, action)
      };
    case CLEAR_BUILD_OUTPUT:
      return {
        ...state,
        buildOutput: ''
      };
    case OPEN_BUILD_OUTPUT:
      return {
        ...state,
        isBuildOutputOpen: true
      };
    case CLOSE_BUILD_OUTPUT:
      return {
        ...state,
        isBuildOutputOpen: false
      };
    default:
      return state;
  }
}

function updateBuildOutputWithLoggerMessage(state, action) {
  return state.buildOutput + action.message;
}

const AnsiCodesProcessingState = {
  OUTPUTTING_STRING: 0,
  ESCAPING: 1,
  GENERATING_CSI_SEQUENCE: 2
};

// Function that outputs standard out to the build window.
// The only ANSI escape sequence that it handles is setting the column cursor to zero.
// All other escape sequences are ignored.
function updateBuildOutputWithStdOut(state, action) {
  if (!action.chunk) {
    return state.buildOutput;
  }

  if (typeof action.chunk === 'string') {
    return state.buildOutput + action.chunk;
  }
  
  // Handle raw byte buffer
  const decoder = new StringDecoder('utf8');
  let processingState = AnsiCodesProcessingState.OUTPUTTING_STRING;
  let csiSequence = '';
  let newBuildOutput = state.buildOutput;

  for (const characterCode of action.chunk) {
    switch (processingState) {
      case AnsiCodesProcessingState.OUTPUTTING_STRING:
        {
          if (characterCode === 27) {
            // Escape
            processingState = AnsiCodesProcessingState.ESCAPING;
          } else {
            newBuildOutput += decoder.write(Buffer.from([characterCode]));
          }
        }
        break;

      case AnsiCodesProcessingState.ESCAPING:
        {
          if (characterCode === 91) {
            // [
            processingState = AnsiCodesProcessingState.GENERATING_CSI_SEQUENCE;
            csiSequence = '';
          } else {
            processingState = AnsiCodesProcessingState.OUTPUTTING_STRING;
          }
        }
        break;

      case AnsiCodesProcessingState.GENERATING_CSI_SEQUENCE:
        {
          if (
            (characterCode >= 65 && characterCode <= 90) ||
            (characterCode >= 97 && characterCode <= 122)
          ) {
            // CSI End Codes A-Z a-z

            if (characterCode === 71) {
              // G = Set Column
              if (csiSequence === '0') {
                // Move to first column
                // Seek last New Line character
                const newLineIndex = newBuildOutput.lastIndexOf('\n');

                if (newLineIndex !== -1) {
                  newBuildOutput = newBuildOutput.substring(
                    0,
                    newLineIndex + 1
                  );
                } else {
                  newBuildOutput = '';
                }
              }
            }

            processingState = AnsiCodesProcessingState.OUTPUTTING_STRING;
          } else {
            csiSequence += decoder.write(Buffer.from([characterCode]));
          }
        }
        break;
    }
  }

  return newBuildOutput;
}
