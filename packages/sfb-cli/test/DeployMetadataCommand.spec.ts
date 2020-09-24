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

import { DeployMetadataCommand } from '../lib/deployMetadataCommand';
import { ConsoleLogger } from '../lib/consoleLogger';
import { ConsoleStdOutput } from '../lib/consoleStdOutput';

import {
  STORY_DIR,
  ASK_PROFILE_NAME,
  ASK_SKILL_DIRECTORY_NAME,
  SKILL_ID,

  ASK_SKILL_DIRECTORY_PATH,
  STAGED_CLOUDFORMATION_PATH,
  STAGED_SKILL_JSON_PATH,
  STAGED_ASK_RESOURCES_PATH,
  STAGED_ASK_STATES_PATH,

  STORED_METADATA_PATH,
  STORED_SKILL_JSON_PATH,
  STORED_ASK_RESOURCES_PATH,
  STORED_ASK_STATES_PATH,

  DUMMY_ASK_FILE_SYSTEM,

  createMockSpawn,
  createMockChildProcess,
  readTextFile,
  assertCalledManyTimesWithArgs,
} from './testUtilities';

describe('alexa-sfb deploy-metadata', () => {
  let dummyFileSystem: any;
  let mockSpawn: any;
  let deployMetadataCommand: DeployMetadataCommand; // Subject under test

  beforeEach(() => {
    dummyFileSystem = JSON.parse(JSON.stringify(DUMMY_ASK_FILE_SYSTEM)); // Deep copy
    mockFileSystem(dummyFileSystem);

    mockSpawn = createMockSpawn();
    mockSpawn.withArgs('ask', ['--version']).returns(createMockChildProcess(['2.7.1']));

    deployMetadataCommand = new DeployMetadataCommand(
      STORY_DIR,
      'live',
      new ConsoleLogger(true),
      new ConsoleStdOutput(),
    );
  });

  afterEach(() => {
    mockFileSystem.restore();
    mockSpawn.restore();
    sinon.restore();
  });

  it('copies metadata into build artifact', async () => {
    await deployMetadataCommand.run();

    assert.equal(readTextFile(STAGED_SKILL_JSON_PATH), 'skill.json contents');
    assert.deepEqual(
      JSON.parse(readTextFile(STAGED_ASK_STATES_PATH)),
      {
        profiles: {
          [ASK_PROFILE_NAME]: {
            skillId: SKILL_ID,
          },
        },
      },
    );
    assert.deepEqual(
      JSON.parse(readTextFile(STAGED_ASK_RESOURCES_PATH)),
      {
        profiles: {
          [ASK_PROFILE_NAME]: {
            code: {
              default: {
                src: 'lambda',
              },
            },
          },
        },
      },
    );
  });

  it('copies modified metadata back into project directory', async () => {
    mockSpawn.withArgs(
      'ask',
      ['smapi', ...Array(9).fill(sinon.match.any)],
    ).callsFake(() => {
      fs.writeFileSync(STAGED_SKILL_JSON_PATH, 'modified skill.json');

      return createMockChildProcess();
    });

    await deployMetadataCommand.run();

    assert.equal(readTextFile(STORED_SKILL_JSON_PATH), 'modified skill.json');
  });

  it('copies CloudFormation template metadata into build artifact', async () => {
    await deployMetadataCommand.run();

    assert.equal(readTextFile(STAGED_CLOUDFORMATION_PATH), 'skill-stack.yaml contents');
  });

  it('checks ASK CLI version and deploys ASK project', async () => {
    await deployMetadataCommand.run();

    assertCalledManyTimesWithArgs(mockSpawn, [
      [
        'ask',
        ['--version'],
        { shell: true, cwd: ASK_SKILL_DIRECTORY_PATH },
      ],
      [
         'ask',
         [
           'smapi',
           'update-skill-manifest',
           '--stage',
           'live',
           '--skill-id',
           SKILL_ID,
           '--manifest',
           `file:${STAGED_SKILL_JSON_PATH}`,
           '--profile',
           ASK_PROFILE_NAME,
         ],
         { shell: true, cwd: ASK_SKILL_DIRECTORY_PATH },
      ],
    ]);
  });

  describe('when unsupported stage is specified', () => {
    beforeEach(() => {
      deployMetadataCommand = new DeployMetadataCommand(
        STORY_DIR,
        'unsupported-stage',
        new ConsoleLogger(true),
        new ConsoleStdOutput(),
      );
    });

    it('throws', async () => {
      await assert.rejects(
        async () => await deployMetadataCommand.run(),
        /Invalid skill stage selected/,
      );
    });
  });

  describe('when ask-states.json is not stored', () => {
    beforeEach(() => {
      fs.unlinkSync(STORED_ASK_STATES_PATH);
    });

    it('throws', async () => {
      await assert.rejects(
        async () => await deployMetadataCommand.run(),
        /there was a problem finding a valid skillId/,
      );
    });
  });
});
