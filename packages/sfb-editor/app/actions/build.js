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

import log from 'electron-log';
import * as sfbCli from '@alexa-games/sfb-cli';
import { Timer } from '../utils';
import { loggerNotification } from './logger';

const { StringDecoder } = require('string_decoder');

export const START_BUILD_ACTION = 'START_BUILD_ACTION';
export const END_BUILD_ACTION = 'END_BUILD_ACTION';
export const LOG_TO_BUILD_OUTPUT = 'LOG_TO_BUILD_OUTPUT';
export const STD_OUT_TO_BUILD_OUTPUT = 'STD_OUT_TO_BUILD_OUTPUT';
export const STD_ERR_TO_BUILD_OUTPUT = 'STD_ERR_TO_BUILD_OUTPUT';
export const CLEAR_BUILD_OUTPUT = 'CLEAR_BUILD_OUTPUT';
export const OPEN_BUILD_OUTPUT = 'OPEN_BUILD_OUTPUT';
export const CLOSE_BUILD_OUTPUT = 'CLOSE_BUILD_OUTPUT';

export class SfbCliBuildOutputLogger {
  constructor(dispatch) {
    this.dispatch = dispatch;
  }

  success(message) {
    log.info(message);
    this.dispatch(logToBuildOutput(message));
  }

  status(message) {
    log.info(message);
    this.dispatch(logToBuildOutput(message));
  }

  warning(message) {
    log.warn(message);
    this.dispatch(logToBuildOutput(message));
  }

  failure(message) {
    log.error(message);
    this.dispatch(logToBuildOutput(message));
  }

  error(message) {
    log.error(message);
    this.dispatch(logToBuildOutput(message));
  }
}

export class SfbCliBuiltOutputStdOut {
  constructor(dispatch) {
    this.dispatch = dispatch;
  }

  stdOut(chunk) {
    logChunk(chunk, false);
    this.dispatch(stdOutToBuildOutput(chunk));
  }

  stdErr(chunk) {
    logChunk(chunk, true);
    this.dispatch(stdErrToBuildOutput(chunk));
  }
}

async function wrapBuildAction(dispatch, buildAction) {
  const timer = new Timer();
  let hasErrors = false;

  try {
    const sfbCliBuildOutputLogger = new SfbCliBuildOutputLogger(dispatch);
    const sfbCliBuiltOutputStdOut = new SfbCliBuiltOutputStdOut(dispatch);
    const commandFactory = new sfbCli.CommandFactory(
      sfbCliBuildOutputLogger,
      sfbCliBuiltOutputStdOut
    );

    dispatch(startBuildAction());
    dispatch(clearBuildOutput());
    dispatch(openBuildOutput());

    await buildAction(commandFactory);
  } catch (error) {
    log.error(error);
    dispatch(logToBuildOutput(error.toString()));
    dispatch(
      loggerNotification({
        error,
        type: 'error',
        triggerToast: true,
        message: error.message
      })
    );
    hasErrors = true;
  } finally {
    dispatch(endBuildAction());

    return {
      durationMs: timer.getDurationMs(),
      hasErrors
    };
  }
}

export function buildProject() {
  return async (dispatch, getState) => {
    const state = getState();

    const buildResult = await wrapBuildAction(dispatch, async commandFactory => {
      await commandFactory.buildImportCommand(state.project.location, { enforceLatest: false }).run();
      await commandFactory.buildBakeCommand(state.project.location).run();

      log.info('\nProject was successfully built.');
      dispatch(logToBuildOutput('\nProject was successfully built.'));
      dispatch(
        loggerNotification({
          triggerToast: true,
          title: 'Project built',
          message: 'Project was successfully built.'
        })
      );
    });
  };
}

export function deployProject() {
  return async (dispatch, getState) => {
    const state = getState();

    await wrapBuildAction(dispatch, async commandFactory => {
      await commandFactory.buildImportCommand(state.project.location, { enforceLatest: false }).run();
      await commandFactory.buildBakeCommand(state.project.location).run();
      await commandFactory.buildStageCommand(state.project.location).run();
      await commandFactory.buildDeployCommand(state.project.location).run();

      log.info('\nProject was successfully deployed.');
      dispatch(logToBuildOutput('\nProject was successfully deployed.'));
      dispatch(
        loggerNotification({
          triggerToast: true,
          title: 'Project deployed',
          message: 'Project was successfully deployed.'
        })
      );
    });
  };
}

export function uploadResources() {
  return async (dispatch, getState) => {
    const state = getState();

    await wrapBuildAction(dispatch, async commandFactory => {
      await commandFactory
        .buildUploadResourcesCommand(state.project.location)
        .run();

      log.info('\nResources were successfully uploaded.');
      dispatch(logToBuildOutput('\nResources were successfully uploaded.'));
      dispatch(
        loggerNotification({
          triggerToast: true,
          title: 'Resources uploaded',
          message: 'Resources were successfully uploaded.'
        })
      );
    });
  };
}

export function startBuildAction() {
  return {
    type: START_BUILD_ACTION
  };
}

export function endBuildAction() {
  return {
    type: END_BUILD_ACTION
  };
}

export function logToBuildOutput(message) {
  return {
    type: LOG_TO_BUILD_OUTPUT,
    message: `${message}\n`
  };
}

export function stdOutToBuildOutput(chunk) {
  return {
    type: STD_OUT_TO_BUILD_OUTPUT,
    chunk
  };
}

export function stdErrToBuildOutput(chunk) {
  return {
    type: STD_ERR_TO_BUILD_OUTPUT,
    chunk
  };
}

export function clearBuildOutput() {
  return {
    type: CLEAR_BUILD_OUTPUT
  };
}

export function openBuildOutput() {
  return {
    type: OPEN_BUILD_OUTPUT
  };
}

export function closeBuildOutput() {
  return {
    type: CLOSE_BUILD_OUTPUT
  };
}

const AnsiCodesProcessingState = {
  OUTPUTTING_STRING: 0,
  ESCAPING: 1,
  GENERATING_CSI_SEQUENCE: 2
};

// Function that logs a chunk to the electron logger.
// All escape sequences are ignored.
function logChunk(chunk, isError) {
  if (!chunk) {
    return;
  }

  if (typeof chunk === 'string') {
    if (!isError) {
      log.info(chunk);
    } else {
      log.error(chunk);
    }
  }
  
  // Handle raw byte buffer
  const decoder = new StringDecoder('utf8');
  let processingState = AnsiCodesProcessingState.OUTPUTTING_STRING;
  let output = '';

  for (const characterCode of chunk) {
    switch (processingState) {
      case AnsiCodesProcessingState.OUTPUTTING_STRING:
        {
          if (characterCode === 27) {
            // Escape
            processingState = AnsiCodesProcessingState.ESCAPING;
          } else {
            output += decoder.write(Buffer.from([characterCode]));
          }
        }
        break;

      case AnsiCodesProcessingState.ESCAPING:
        {
          if (characterCode === 91) {
            // [
            processingState = AnsiCodesProcessingState.GENERATING_CSI_SEQUENCE;
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
            processingState = AnsiCodesProcessingState.OUTPUTTING_STRING;
          }
        }
        break;
    }
  }

  if (!isError) {
    log.info(output);
  } else {
    log.error(output);
  }
}
  