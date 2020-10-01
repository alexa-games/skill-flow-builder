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

import childProcess from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

import * as sinon from 'sinon';
import { strict as assert } from 'assert';
import mockFileSystem from 'mock-fs';

import { CleanCommand } from '../lib/cleanCommand';
import { ConsoleLogger } from '../lib/consoleLogger';
import { ConsoleStdOutput } from '../lib/consoleStdOutput';

import {
  STORY_DIR,
  DUMMY_ASK_FILE_SYSTEM,
  createMockSpawn,
  assertCalledManyTimesWithArgs,
  REMOVE_DIR_COMMAND,
  REMOVE_FLAGS
} from './testUtilities';

describe('alexa-sfb clean', () => {
  let dummyFileSystem: any;
  let mockSpawn: any;
  let cleanCommand: CleanCommand; // Subject under test

  beforeEach(() => {
    dummyFileSystem = JSON.parse(JSON.stringify(DUMMY_ASK_FILE_SYSTEM)); // Deep copy
    dummyFileSystem[STORY_DIR].node_modules = {}; // Directory to be clobbered
    mockFileSystem(dummyFileSystem);

    mockSpawn = createMockSpawn();

    cleanCommand = new CleanCommand(
      STORY_DIR,
      new ConsoleLogger(true),
      new ConsoleStdOutput(),
    );
  });

  afterEach(() => {
    mockFileSystem.restore();
    mockSpawn.restore();
    sinon.restore();
  });

  it('clobbers build artifact directory and node_modules, and runs npm clean', async () => {
    await cleanCommand.run();

    // File deletion is done by shell commands, bypassing `fs`.
    // Hence, instead of using `fs.existsSync` to verify clobbering,
    // We need to check that `spawn` gets called with the right arguments.
    assertCalledManyTimesWithArgs(mockSpawn, [
      [REMOVE_DIR_COMMAND, [...REMOVE_FLAGS, `"${path.resolve(path.join('/', STORY_DIR, '.deploy'))}"`], { shell: true }],
      [REMOVE_DIR_COMMAND, [...REMOVE_FLAGS, `"${path.resolve(path.join('/', STORY_DIR, 'node_modules'))}"`], { shell: true }],
      ['npm', ['run', 'clean'], { shell: true, cwd: path.resolve(path.join('/', STORY_DIR, 'code')) }],
    ]);
  });

  describe('when configured for local testing', () => {
    beforeEach(() => {
      dummyFileSystem[STORY_DIR]['abcConfig.json'] = JSON.stringify({
        default: {
          sfbLocalTesting: true,
        },
      });
      mockFileSystem.restore();
      mockFileSystem(dummyFileSystem);
    });

    it('auto-installs yarn, and then runs yarn clean', async () => {
      await cleanCommand.run();

      assertCalledManyTimesWithArgs(mockSpawn, [
        [REMOVE_DIR_COMMAND, [...REMOVE_FLAGS, `"${path.resolve(path.join('/', STORY_DIR, '.deploy'))}"`], { shell: true }],
        [REMOVE_DIR_COMMAND, [...REMOVE_FLAGS, `"${path.resolve(path.join('/', STORY_DIR, 'node_modules'))}"`], { shell: true }],

        // Assert that NPX is run to install yarn
        ['npx', ['yarn', 'clean'], { shell: true, cwd: path.resolve(path.join('/', STORY_DIR, 'code')) }],
      ]);
    });
  });
});
