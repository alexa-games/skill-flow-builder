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

import readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';

import * as sinon from 'sinon';
import { strict as assert } from 'assert';
import mockFileSystem from 'mock-fs';

import { StageLayerCommand } from '../lib/stageLayerCommand';
import { ConsoleLogger } from '../lib/consoleLogger';
import { ConsoleStdOutput } from '../lib/consoleStdOutput';

import {
  STORY_DIR,
  ASK_SKILL_DIRECTORY_NAME,
  ASK_SKILL_DIRECTORY_PATH,
  STORED_METADATA_PATH,
  STORED_LAMBDA_LAYER_PATH,
  DUMMY_ASK_FILE_SYSTEM,

  createMockSpawn,
  createMockChildProcess,
  readTextFile,
  assertCalledManyTimesWithArgs,
  MOVE_COMMAND,
  REMOVE_DIR_COMMAND, 
  REMOVE_FLAGS, 
  ZIP_COMMAND, 
  ZIP_FLAGS
} from './testUtilities';

describe('alexa-sfb stage-layer', () => {
  let dummyFileSystem: any;
  let mockSpawn: any;
  let stageLayerCommand: StageLayerCommand; // Subject under test

  /**
   * Helper to re-mock file system after initial mocking
   */
  const reMockFileSystem = (fileSystem: any) => {
    mockFileSystem.restore();
    mockFileSystem(fileSystem);
  };

  beforeEach(() => {
    dummyFileSystem = JSON.parse(JSON.stringify(DUMMY_ASK_FILE_SYSTEM)); // Deep copy

    const askSkillDirectory = dummyFileSystem[STORY_DIR]['.deploy'][ASK_SKILL_DIRECTORY_NAME];
    askSkillDirectory.lambda.node_modules = {
      '@dummy-dependency': {
        'dummy-file': 'dummy-content',
      },
    };
    askSkillDirectory.lambda['package.json'] = JSON.stringify({
      dummy: 'field',
      dependencies: {
        '@dummy-dependency': '^foo-bar',
      },
      devDependencies: {
        '@dummy-dev-dependency': '^baz-quux',
      },
    });

    delete dummyFileSystem[STORY_DIR].metadata;

    const abcConfig = JSON.parse(dummyFileSystem[STORY_DIR]['abcConfig.json']);
    abcConfig.default['use-lambda-layer'] = true;
    dummyFileSystem[STORY_DIR]['abcConfig.json'] = JSON.stringify(abcConfig);

    mockFileSystem(dummyFileSystem);

    mockSpawn = createMockSpawn();

    // Force `rm -rf` to actually remove files in our mock file system
    mockSpawn.withArgs('rm', ['-rf', `"${STORED_LAMBDA_LAYER_PATH}"`]).callsFake(() => {
      if (dummyFileSystem[STORY_DIR].metadata) {
        delete dummyFileSystem[STORY_DIR].metadata['lambda-layer'];
      }
      reMockFileSystem(dummyFileSystem);
      return createMockChildProcess();
    });

    stageLayerCommand = new StageLayerCommand(
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

  it('empties out package.json', async () => {
    await stageLayerCommand.run();

    assert.deepEqual(
      JSON.parse(readTextFile(`${ASK_SKILL_DIRECTORY_PATH}/lambda/package.json`)),
      {
        dummy: 'field',
        dependencies: {},
        devDependencies: {
          '@dummy-dev-dependency': '^baz-quux',
        },
      }
    );
  });

  it('backs up package.json into layer config directory', async () => {
    await stageLayerCommand.run();

    assert.deepEqual(
      JSON.parse(readTextFile(`${STORED_LAMBDA_LAYER_PATH}/package.json`)),
      {
        dummy: 'field',
        dependencies: {
          '@dummy-dependency': '^foo-bar',
        },
        devDependencies: {
          '@dummy-dev-dependency': '^baz-quux',
        },
      }
    );
  });

  it('compresses node dependencies', async () => {
    await stageLayerCommand.run();

    assertCalledManyTimesWithArgs(mockSpawn, [
      [
        REMOVE_DIR_COMMAND,
        [
          ...REMOVE_FLAGS,
          `"${path.resolve(STORED_LAMBDA_LAYER_PATH)}"`,
        ],
        {
          "shell": true,
        },
      ],
      [
        MOVE_COMMAND,
        [
          `${path.resolve(path.join(ASK_SKILL_DIRECTORY_PATH, 'lambda', 'node_modules'))}`,
          `${path.resolve(path.join(STORED_LAMBDA_LAYER_PATH, 'nodejs'))}`,
        ],
        {
          "shell": true,
        },
      ],
      [
        ZIP_COMMAND,
        [
          ...ZIP_FLAGS,
          `${ASK_SKILL_DIRECTORY_NAME}-lambda-layer.zip`,
          "nodejs",
        ],
        {
          "cwd": path.resolve(STORED_LAMBDA_LAYER_PATH),
          "shell": true,
        },
      ],
    ]);
  });

  describe('with pre-existing layer config directory', () => {
    beforeEach(() => {
      dummyFileSystem[STORY_DIR].metadata = {
        'lambda-layer': {
          'package.json': 'old package.json',
          nodejs: {
            '@old-dependency': {},
          },
        },
      };

      reMockFileSystem(dummyFileSystem);
    });

    it('replaces existing data', async () => {
      await stageLayerCommand.run();

      assert.deepEqual(
        JSON.parse(readTextFile(`${STORED_LAMBDA_LAYER_PATH}/package.json`)),
        {
          dummy: 'field',
          dependencies: {
            '@dummy-dependency': '^foo-bar',
          },
          devDependencies: {
            '@dummy-dev-dependency': '^baz-quux',
          },
        }
      );
    });
  });

  describe('when Lambda layer is disabled', () => {
    beforeEach(() => {
      const abcConfig = JSON.parse(dummyFileSystem[STORY_DIR]['abcConfig.json']);
      abcConfig.default['use-lambda-layer'] = false;
      dummyFileSystem[STORY_DIR]['abcConfig.json'] = JSON.stringify(abcConfig);

      reMockFileSystem(dummyFileSystem);
    });

    it('is a no-op', async () => {
      await stageLayerCommand.run();

      assert.ok(!fs.existsSync(STORED_METADATA_PATH));
    });
  });
});
