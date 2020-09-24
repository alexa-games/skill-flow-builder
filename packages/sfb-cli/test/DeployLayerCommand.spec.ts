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

import { DeployLayerCommand } from '../lib/deployLayerCommand';
import { ConsoleLogger } from '../lib/consoleLogger';
import { ConsoleStdOutput } from '../lib/consoleStdOutput';

import {
  DUMMY_ASK_FILE_SYSTEM,
  createMockSpawn,
  assertCalledManyTimesWithArgs,
  STORY_DIR,
  STORED_LAMBDA_LAYER_CONFIG_PATH,
  ASK_SKILL_DIRECTORY_NAME,
  STORED_LAMBDA_LAYER_PATH,
  createMockChildProcess,
  STORED_SKILL_JSON_PATH,
  readTextFile,
  STAGED_LAMBDA_PATH
} from './testUtilities';

describe('alexa-sfb deploy-layer', () => {
  let dummyFileSystem: any;
  let mockSpawn: any;
  let deployLayerCommand: DeployLayerCommand; // Subject under test

  /**
  * Helper to re-mock file system after initial mocking
  */
  const reMockFileSystem = (fileSystem: any) => {
    mockFileSystem.restore();
    mockFileSystem(fileSystem);
  };

  /**
  * Helper to re-mock process after initial spawn
  */
  const reMockSpawn = () => {
    mockSpawn.restore();
    mockSpawn = createMockSpawn();
  };


  const mockDeployShellCommands = (deployOptions: any) => {
    const {
      layerNames,
      functionName
    } = deployOptions;

    return [
      ['aws',
        ['lambda', 'publish-layer-version',
          '--layer-name', `${ASK_SKILL_DIRECTORY_NAME}-lambda-layer`,
          '--zip-file', `fileb://${ASK_SKILL_DIRECTORY_NAME}-lambda-layer.zip`,
          '--compatible-runtimes', 'nodejs10.x',
          '--cli-connect-timeout 30000'
        ],
        {
          shell: true,
          cwd: STORED_LAMBDA_LAYER_PATH
        }
      ],
      ['aws',
        ['lambda', 'get-function-configuration',
          '--function-name', functionName,
        ],
        {
          shell: true,
        }
      ],
      ['aws',
        ['lambda', 'update-function-configuration',
          '--function-name', functionName,
          '--layers', layerNames.join(' ')
        ],
        {
          shell: true,
        }
      ],
    ]
  }


  beforeEach(() => {
    dummyFileSystem = JSON.parse(JSON.stringify(DUMMY_ASK_FILE_SYSTEM)); // Deep copy

    const abcConfig = JSON.parse(dummyFileSystem[STORY_DIR]['abcConfig.json']);
    abcConfig.default['use-lambda-layer'] = true;
    dummyFileSystem[STORY_DIR]['abcConfig.json'] = JSON.stringify(abcConfig);

    dummyFileSystem[STORY_DIR].metadata['skill.json'] = JSON.stringify({
      'manifest': {
        'apis': {
          'custom': {
            'endpoint': {
              'uri': 'dummy-lambda-uri'
            }
          }
        }
      }
    });

    mockSpawn = createMockSpawn();

    mockFileSystem(dummyFileSystem);

    mockSpawn.withArgs(
      'aws',
      ['lambda', 'publish-layer-version', ...Array(7).fill(sinon.match.any)]
    ).callsFake(() => {
      return createMockChildProcess([
        `{"LayerArn": "dummy-layer-arn", "LayerVersionArn": "dummy-layer-version-arn", "Version": "dummy-layer-version"}`
      ]);
    });

    mockSpawn.withArgs(
      'aws',
      ['lambda', 'get-function-configuration', ...Array(2).fill(sinon.match.any)]
    ).callsFake(() => {
      return createMockChildProcess([
        `{"Layers": []}`
      ]);
    });

    mockSpawn.withArgs(
      'aws',
      ['lambda', 'update-function-configuration', ...Array(4).fill(sinon.match.any)]
    ).callsFake(() => {
      return createMockChildProcess([
        `{"Layers": [{"Arn": "dummy-layer-version-arn"}]}`
      ]);
    });

    deployLayerCommand = new DeployLayerCommand(
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

  describe('when no previous layer has been deployed', async () => {
    beforeEach(() => {
      dummyFileSystem[STORY_DIR].metadata['lambda-layer'] = {};
      dummyFileSystem[STORY_DIR].metadata['lambda-layer'][`${ASK_SKILL_DIRECTORY_NAME}-lambda-layer.zip`] = 'dummy zip file';

      reMockFileSystem(dummyFileSystem);
    });

    it('successfully deploys a new layer', async () => {
      await deployLayerCommand.run();

      assertCalledManyTimesWithArgs(
        mockSpawn,
        mockDeployShellCommands({
          functionName: 'dummy-lambda-uri',
          layerNames: ['dummy-layer-version-arn']
        })
      );

      assert.ok(
        fs.existsSync(STORED_LAMBDA_LAYER_CONFIG_PATH)
      );
    });

    it('deploys a new layer alongside other existing layers', async () => {
      mockSpawn.withArgs(
        'aws',
        ['lambda', 'get-function-configuration', ...Array(2).fill(sinon.match.any)]
      ).callsFake(() => {
        return createMockChildProcess([
          `{"Layers": [{"Arn": "dummy-existing-random-layer-verison-arn"}]}`
        ]);
      });

      await deployLayerCommand.run();

      assertCalledManyTimesWithArgs(
        mockSpawn,
        mockDeployShellCommands({
          functionName: 'dummy-lambda-uri',
          layerNames: ['dummy-existing-random-layer-verison-arn dummy-layer-version-arn']
        })
      );

      assert.ok(
        fs.existsSync(STORED_LAMBDA_LAYER_CONFIG_PATH)
      );
    });

    it('rolls back the code directory', async () => {
      await deployLayerCommand.run();

      assert.ok(
        fs.existsSync(path.resolve(STAGED_LAMBDA_PATH + '/node_modules'))
      );
      assert.ok(
        fs.existsSync(path.resolve(STAGED_LAMBDA_PATH + '/package.json'))
      );
    }); 
  });

  describe('when a layer is not deployed/attached properly', async () => {
    beforeEach(() => {
      mockSpawn.withArgs(
        'aws',
        ['lambda', 'update-function-configuration', ...Array(4).fill(sinon.match.any)]
      ).callsFake(() => {
        return createMockChildProcess([
          `{"Layers": []}`
        ]);
      });
    });

    it('does not save', async () => {
      await assert.rejects(
        async () => await deployLayerCommand.run(),
        /not found/,
      );

      assert.ok(!fs.existsSync(STORED_LAMBDA_LAYER_CONFIG_PATH));
    });

    it('rolls back the code directory', async () => {
      await assert.rejects(
        async () => await deployLayerCommand.run(),
        /not found/,
      );
      assert.ok(
        fs.existsSync(path.resolve(STAGED_LAMBDA_PATH + '/node_modules'))
      );
      assert.ok(
        fs.existsSync(path.resolve(STAGED_LAMBDA_PATH + '/package.json'))
      );
    });
  });

  describe('when a layer has already been deployed', () => {
    beforeEach(async () => {
      dummyFileSystem[STORY_DIR].metadata['lambda-layer'] = {};
      dummyFileSystem[STORY_DIR].metadata['lambda-layer'][`${ASK_SKILL_DIRECTORY_NAME}-lambda-layer.zip`] = 'dummy zip file';

      reMockFileSystem(dummyFileSystem);
      mockSpawn.withArgs(
        'aws',
        ['lambda', 'publish-layer-version', ...Array(7).fill(sinon.match.any)]
      ).callsFake(() => {
        return createMockChildProcess([
          `{"LayerArn": "dummy-layer-arn", "LayerVersionArn": "dummy-layer-version-arn", "Version": "dummy-layer-version"}`
        ]);
      });

      mockSpawn.withArgs(
        'aws',
        ['lambda', 'get-function-configuration', ...Array(2).fill(sinon.match.any)]
      ).callsFake(() => {
        return createMockChildProcess([
          `{"Layers": []}`
        ]);
      });

      mockSpawn.withArgs(
        'aws',
        ['lambda', 'update-function-configuration', ...Array(4).fill(sinon.match.any)]
      ).callsFake(() => {
        return createMockChildProcess([
          `{"Layers": [{"Arn": "dummy-layer-version-arn"}]}`
        ]);
      });

      await deployLayerCommand.run();

      reMockSpawn();

      mockSpawn.withArgs(
        'aws',
        ['lambda', 'publish-layer-version', ...Array(7).fill(sinon.match.any)]
      ).callsFake(() => {
        return createMockChildProcess([
          `{"LayerArn": "dummy-layer-arn", "LayerVersionArn": "dummy-layer-version-arn", "Version": "dummy-layer-version"}`
        ]);
      });

      mockSpawn.withArgs(
        'aws',
        ['lambda', 'get-function-configuration', ...Array(2).fill(sinon.match.any)]
      ).callsFake(() => {
        return createMockChildProcess([
          `{"Layers": []}`
        ]);
      });

      mockSpawn.withArgs(
        'aws',
        ['lambda', 'update-function-configuration', ...Array(4).fill(sinon.match.any)]
      ).callsFake(() => {
        return createMockChildProcess([
          `{"Layers": [{"Arn": "dummy-layer-version-arn"}]}`
        ]);
      });
    });

    it('does not redeploy an unchanged layer', async () => {
      const lambdaInfo = JSON.parse(readTextFile(STORED_LAMBDA_LAYER_CONFIG_PATH));

      await deployLayerCommand.run();

      assertCalledManyTimesWithArgs(
        mockSpawn,
        []
      );

      assert.deepEqual(
        JSON.parse(readTextFile(STORED_LAMBDA_LAYER_CONFIG_PATH)),
        lambdaInfo
      );
    });

    it('redeploys when a layer is changed', async () => {
      const lambdaInfo = JSON.parse(readTextFile(STORED_LAMBDA_LAYER_CONFIG_PATH));
      lambdaInfo.lambdaLayerHash = 'dummy-hash';

      fs.writeFileSync(STORED_LAMBDA_LAYER_CONFIG_PATH, JSON.stringify(lambdaInfo));

      await deployLayerCommand.run();

      assertCalledManyTimesWithArgs(
        mockSpawn,
        mockDeployShellCommands({
          functionName: 'dummy-lambda-uri',
          layerNames: ['dummy-layer-version-arn']
        })
      );

      assert.notDeepEqual(
        JSON.parse(readTextFile(STORED_LAMBDA_LAYER_CONFIG_PATH)),
        lambdaInfo
      );
    });
  });

  describe('when the config flag is turned off but a layer has already been deployed', async () => {
    beforeEach(async () => {
      dummyFileSystem[STORY_DIR].metadata['lambda-layer'] = {};
      dummyFileSystem[STORY_DIR].metadata['lambda-layer'][`${ASK_SKILL_DIRECTORY_NAME}-lambda-layer.zip`] = 'dummy zip file';

      reMockFileSystem(dummyFileSystem);
      mockSpawn.withArgs(
        'aws',
        ['lambda', 'publish-layer-version', ...Array(7).fill(sinon.match.any)]
      ).callsFake(() => {
        return createMockChildProcess([
          `{"LayerArn": "dummy-layer-arn", "LayerVersionArn": "dummy-layer-version-arn", "Version": "dummy-layer-version"}`
        ]);
      });

      mockSpawn.withArgs(
        'aws',
        ['lambda', 'get-function-configuration', ...Array(2).fill(sinon.match.any)]
      ).callsFake(() => {
        return createMockChildProcess([
          `{"Layers": []}`
        ]);
      });

      mockSpawn.withArgs(
        'aws',
        ['lambda', 'update-function-configuration', ...Array(4).fill(sinon.match.any)]
      ).callsFake(() => {
        return createMockChildProcess([
          `{"Layers": [{"Arn": "dummy-layer-version-arn"}]}`
        ]);
      });

      await deployLayerCommand.run(); // Ends the 'Layer has already been deployed' condition

      const abcConfig = JSON.parse(dummyFileSystem[STORY_DIR]['abcConfig.json']);
      abcConfig.default['use-lambda-layer'] = false;
      dummyFileSystem[STORY_DIR]['abcConfig.json'] = JSON.stringify(abcConfig);

      dummyFileSystem[STORY_DIR].metadata['lambda-layer'] = {};
      dummyFileSystem[STORY_DIR].metadata['lambda-layer.json'] = JSON.stringify({
        lambdaArn: 'dummy-lambda-arn',
        lambdaLayerArn: 'dummy-lambda-layer-arn',
        lambdaLayerVersionArn: 'dummy-lambda-layer-arn:version'
      });

      reMockFileSystem(dummyFileSystem);

      reMockSpawn();

      mockSpawn.withArgs(
        'aws',
        ['lambda', 'get-function-configuration', ...Array(2).fill(sinon.match.any)]
      ).callsFake(() => {
        return createMockChildProcess([
          `{"Layers": [
            {
              "Arn": "dummy-lambda-layer-arn:version"
            },
            {
              "Arn": "dummy-other-layer-arn:version"
            }
          ]}`
        ]);
      });

      mockSpawn.withArgs(
        'aws',
        ['lambda', 'update-function-configuration', ...Array(4).fill(sinon.match.any)]
      ).callsFake(() => {
        return createMockChildProcess([
          `{"Layers": [{"Arn": "dummy-other-layer-arn:version"}]}`
        ]);
      });

      // Force `rm -rf` to actually remove files in our mock file system
      mockSpawn.withArgs('rm', ['-rf', `"${STORED_LAMBDA_LAYER_PATH}"`])
        .callsFake(() => {
          delete dummyFileSystem[STORY_DIR].metadata['lambda-layer'];
          reMockFileSystem(dummyFileSystem);
          return createMockChildProcess();
        });
    });

    it('unlinks all lambda-layer metadata', async () => {
      await deployLayerCommand.run();

      assertCalledManyTimesWithArgs(
        mockSpawn,
        [
          ['aws',
            ['lambda', 'get-function-configuration',
              '--function-name', `dummy-lambda-arn`,
            ],
            {
              shell: true,
            }
          ],
          ['aws',
            ['lambda', 'update-function-configuration',
              '--function-name', `dummy-lambda-arn`,
              '--layers', 'dummy-other-layer-arn:version'
            ],
            {
              shell: true,
            }
          ],
          ['rm',
            ['-rf', `"${STORED_LAMBDA_LAYER_PATH}"`],
            {
              shell: true
            }
          ]
        ],
      );

      assert.ok(!fs.existsSync(STORED_LAMBDA_LAYER_PATH));
    });
  });

  describe('when skill.json is not stored', () => {
    beforeEach(() => {
      fs.unlinkSync(STORED_SKILL_JSON_PATH);
    });

    it('no layer is deployed', async () => {
      await assert.rejects(
        async () => await deployLayerCommand.run(),
        /there was a problem finding a valid lambda URI for this project/,
      );

      assert.ok(!fs.existsSync(STORED_LAMBDA_LAYER_CONFIG_PATH));
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
      await deployLayerCommand.run();

      assert.ok(!fs.existsSync(STORED_LAMBDA_LAYER_CONFIG_PATH));
    });
  });
}); 
