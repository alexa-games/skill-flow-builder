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

import { DeployCommand } from '../lib/deployCommand';
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
  REMOVE_DIR_COMMAND, 
  REMOVE_FLAGS
} from './testUtilities';

describe('alexa-sfb deploy', () => {
  const dummyAskVersion = [''];

  let dummyFileSystem: any;
  let mockSpawn: any;
  let deployCommand: DeployCommand; // Subject under test

  beforeEach(() => {
    dummyFileSystem = JSON.parse(JSON.stringify(DUMMY_ASK_FILE_SYSTEM)); // Deep copy
    mockFileSystem(dummyFileSystem);

    dummyAskVersion[0] = '2.3.1';
    mockSpawn = createMockSpawn(dummyAskVersion);

    deployCommand = new DeployCommand(
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

  /**
   * Shared example
   */
  const itHandlesMetadata = () => {
    it('copies metadata into build artifact', async () => {
      await deployCommand.run();

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
        ['deploy', sinon.match.any, sinon.match.any, sinon.match.any],
      ).callsFake(() => {
        fs.writeFileSync(STAGED_SKILL_JSON_PATH, 'modified skill.json');
        fs.writeFileSync(STAGED_ASK_STATES_PATH, 'modified ask-states.json');
        fs.writeFileSync(STAGED_ASK_RESOURCES_PATH, 'modified ask-resources.json');

        return createMockChildProcess();
      });

      await deployCommand.run();

      assert.equal(readTextFile(STORED_SKILL_JSON_PATH), 'modified skill.json');
      assert.equal(readTextFile(STORED_ASK_STATES_PATH), 'modified ask-states.json');
      assert.equal(readTextFile(STORED_ASK_RESOURCES_PATH), 'modified ask-resources.json');
    });
  };

  describe('when build artifact was generated with ASK CLI v2', () => {
    itHandlesMetadata();

    it('copies CloudFormation template metadata into build artifact', async () => {
      await deployCommand.run();

      assert.equal(readTextFile(STAGED_CLOUDFORMATION_PATH), 'skill-stack.yaml contents');
    });

    it('checks ASK CLI version and deploys ASK project', async () => {
      await deployCommand.run();

      assertCalledManyTimesWithArgs(mockSpawn, [
        [
          'ask',
          ['--version'],
          { shell: true, cwd: path.resolve(ASK_SKILL_DIRECTORY_PATH) },
        ],
        [
           'ask',
           ['deploy', '--ignore-hash', '--profile', ASK_PROFILE_NAME],
           { shell: true, cwd: path.resolve(ASK_SKILL_DIRECTORY_PATH) },
        ],
      ]);
    });

    /**
     * Shared example
     */
    const itAutoInstallsAskCli = () => {
      it('auto-installs ASK CLI and deploys ASK project', async () => {
        await deployCommand.run();

        assertCalledManyTimesWithArgs(mockSpawn, [
          [
            'ask',
            ['--version'],
            { shell: true, cwd: path.resolve(ASK_SKILL_DIRECTORY_PATH) },
          ],
          [
             'npx',
             ['ask-cli@^2.x.x', 'deploy', '--ignore-hash', '--profile', ASK_PROFILE_NAME],
             { shell: true, cwd: path.resolve(ASK_SKILL_DIRECTORY_PATH) },
          ],
        ]);
      });
    };

    describe('when ASK CLI is not installed', () => {
      beforeEach(() => {
        dummyAskVersion[0] = '';
        mockSpawn.withArgs('ask').throws();
      });

      itAutoInstallsAskCli();
    });

    describe('when ASK CLI version is not supported', () => {
      beforeEach(() => {
        dummyAskVersion[0] = '1.7.3';
      });

      itAutoInstallsAskCli();
    });
  });

  describe('when build artifact was generated with ASK CLI v1', () => {
    let mockReadline: any;

    beforeEach(() => {
      // Mock project directory to look like it's from ASK CLI v1
      delete dummyFileSystem[STORY_DIR]['.deploy'][ASK_SKILL_DIRECTORY_NAME]['skill-package']
      dummyFileSystem[STORY_DIR].metadata = {
        'ask_config': '{}',
        'skill.json': '{}',
      };
      mockFileSystem.restore();
      mockFileSystem(dummyFileSystem);


      // Mock user prompt so that the user always answers "Yes"
      mockReadline = sinon.stub(readline, 'createInterface');
      mockReadline.returns(['Yes']);


      // Mock spawn so that the project upgrade command actually modifies the
      // project directory structure
      mockSpawn.withArgs(
        'ask',
        ['util', 'upgrade-project', sinon.match.any, sinon.match.any],
      ).callsFake(() => {
        const askSkillDirectory = dummyFileSystem[STORY_DIR]['.deploy'][ASK_SKILL_DIRECTORY_NAME];

        askSkillDirectory.lambda = {
          lambdacustom: JSON.parse(JSON.stringify(askSkillDirectory.lambda)),
        };

        askSkillDirectory['ask-resources.json'] = JSON.stringify({
          profiles: {
            [ASK_PROFILE_NAME]: {
              code: {
                default: {
                  src: 'lambda/lambdacustom',
                },
              },
            },
          },
        });

        askSkillDirectory['.ask'] = {
          ['ask-states.json']: JSON.stringify({
            profiles: {
              [ASK_PROFILE_NAME]: {
                skillId: SKILL_ID,
              },
            },
          }),
        };

        askSkillDirectory['skill-package'] = {
          'skill.json': 'skill.json contents',
        };

        mockFileSystem.restore();
        mockFileSystem(dummyFileSystem);

        return createMockChildProcess();
      });
    });

    itHandlesMetadata();

    it('upgrades build artifact and deploys', async () => {
      await deployCommand.run();

      assertCalledManyTimesWithArgs(mockSpawn, [
        // 1. Upgrades build artifacts
        ['ask', ['--version'], { shell: true, cwd: path.resolve(ASK_SKILL_DIRECTORY_PATH) }],
        ['ask', ['util', 'upgrade-project', '--profile', ASK_PROFILE_NAME], { shell: true, cwd: path.resolve(ASK_SKILL_DIRECTORY_PATH) }],
        [REMOVE_DIR_COMMAND, [...REMOVE_FLAGS, `"${path.resolve(path.join(ASK_SKILL_DIRECTORY_PATH, 'lambda'))}"`], { shell: true }],

        // 2. Deploys with upgraded artifacts
        ['ask', ['--version'], { shell: true, cwd: path.resolve(ASK_SKILL_DIRECTORY_PATH) }],
        ['ask', ['deploy', '--ignore-hash', '--profile', ASK_PROFILE_NAME], { shell: true, cwd: path.resolve(ASK_SKILL_DIRECTORY_PATH) }],
      ]);

      assert.equal(
        readTextFile(`${path.resolve(path.join(ASK_SKILL_DIRECTORY_PATH, 'lambda', 'index.js'))}`),
        // Original file content
        DUMMY_ASK_FILE_SYSTEM[STORY_DIR]['.deploy'][ASK_SKILL_DIRECTORY_NAME].lambda['index.js'],
      );

      assert.deepEqual(
        JSON.parse(readTextFile(path.resolve(STAGED_ASK_RESOURCES_PATH))),
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
        }
      );
    });
  });

  describe('when locale and stage are set', () => {
    it('deploys ASK project with correct config');

    it('copies correct metadata into build artifact');

    it('copies modified metadata back into project directory');
  });
});
