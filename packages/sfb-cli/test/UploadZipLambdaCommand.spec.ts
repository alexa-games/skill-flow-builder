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

import { UploadZipLambdaCommand } from '../lib/uploadZipLambdaCommand';
import { ConsoleLogger } from '../lib/consoleLogger';
import { ConsoleStdOutput } from '../lib/consoleStdOutput';

import {
  STORY_DIR,
  ASK_PROFILE_NAME,
  ASK_SKILL_DIRECTORY_NAME,
  ASK_SKILL_DIRECTORY_PATH,
  DUMMY_ASK_FILE_SYSTEM,

  createMockSpawn,
  createMockChildProcess,
  assertCalledManyTimesWithArgs,
} from './testUtilities';

describe('alexa-sfb deploy-via-zip', () => {
  let dummyFileSystem: any;
  let mockSpawn: any;
  let uploadZipLambdaCommand: UploadZipLambdaCommand; // Subject under test

  const DUMMY_LAMBDA_ARN = 'arn:aws:lambda:us-west-2:123456789012:function:DummyFunction';
  const DUMMY_AWS_REGION = 'dummy-region-2';
  const DUMMY_EN_GB_S3_BUCKET_NAME = 'dummy-en-gb-s3-bucket';
  const DUMMY_ASK_STATES = {
    profiles: {
      [ASK_PROFILE_NAME]: {
        skillInfrastructure: {
          '@ask-cli/lambda-deployer': {
            deployState: {
              default: {
                lambda: { arn: DUMMY_LAMBDA_ARN },
              },
            },
          },
        },
      },
    },
  };

  beforeEach(() => {
    dummyFileSystem = JSON.parse(JSON.stringify(DUMMY_ASK_FILE_SYSTEM)); // Deep copy

    const abcConfig = JSON.parse(dummyFileSystem[STORY_DIR]['abcConfig.json']);
    abcConfig.default['aws-region'] = DUMMY_AWS_REGION;
    abcConfig['en-gb'] = { 's3-bucket-name': DUMMY_EN_GB_S3_BUCKET_NAME };
    dummyFileSystem[STORY_DIR]['abcConfig.json'] = JSON.stringify(abcConfig);

    dummyFileSystem[STORY_DIR]['.deploy'][ASK_SKILL_DIRECTORY_NAME]['.ask'] = {
     'ask-states.json': JSON.stringify(DUMMY_ASK_STATES),
    };

    mockFileSystem(dummyFileSystem);

    mockSpawn = createMockSpawn();
    mockSpawn.withArgs('ask', ['--version']).returns(createMockChildProcess(['2.7.1']));

    uploadZipLambdaCommand = new UploadZipLambdaCommand(
      STORY_DIR,
      new ConsoleLogger(true),
      'en-GB',
      new ConsoleStdOutput(),
    );
  });

  afterEach(() => {
    mockFileSystem.restore();
    mockSpawn.restore();
    sinon.restore();
  });

  it('checks ASK CLI version and deploys ASK project', async () => {
    await uploadZipLambdaCommand.run();

    assertCalledManyTimesWithArgs(mockSpawn, [
      [
        "npx",
        [
          "rimraf",
          "index.zip",
        ],
        {
          "cwd": STORY_DIR,
          "shell": true,
        },
      ],
      [
        "zip",
        [
          "-rg",
          "index.zip",
          `${ASK_SKILL_DIRECTORY_PATH}/lambda`,
        ],
        {
          "cwd": STORY_DIR,
          "shell": true,
        },
      ],
      [
        "npx",
        [
          "aws",
          "s3",
          "cp",
          "./index.zip",
          `s3://${DUMMY_EN_GB_S3_BUCKET_NAME}/lambda-zips/${ASK_SKILL_DIRECTORY_NAME}/`,
          "--profile",
          ASK_PROFILE_NAME,
        ],
        {
          "cwd": STORY_DIR,
          "shell": true,
        },
      ],
      [
        "npx",
        [
          "aws",
          "lambda",
          "update-function-code",
          "--function-name",
          DUMMY_LAMBDA_ARN,
          "--region",
          DUMMY_AWS_REGION,
          "--s3-bucket",
          DUMMY_EN_GB_S3_BUCKET_NAME,
          "--s3-key",
          `lambda-zips/${ASK_SKILL_DIRECTORY_NAME}/index.zip`,
          "--profile",
          ASK_PROFILE_NAME,
        ],
        {
          "cwd": STORY_DIR,
          "shell": true,
        },
      ],
    ]);
  });

  describe('when profile is not found in ask-states.json', () => {
    beforeEach(() => {
      const abcConfig = JSON.parse(dummyFileSystem[STORY_DIR]['abcConfig.json']);
      abcConfig.default['ask-profile-name'] = 'mystery_caller';
      dummyFileSystem[STORY_DIR]['abcConfig.json'] = JSON.stringify(abcConfig);

      mockFileSystem.restore();
      mockFileSystem(dummyFileSystem);
    });

    it('throws', async () => {
      await assert.rejects(
        async () => await uploadZipLambdaCommand.run(),
        /ASK profile \S+ missing/,
      );
    });
  });

  describe('when skill infrastructure is not supported', () => {
    beforeEach(() => {
      dummyFileSystem[STORY_DIR]['.deploy'][ASK_SKILL_DIRECTORY_NAME]['.ask']['ask-states.json'] = JSON.stringify({
        profiles: {
          [ASK_PROFILE_NAME]: {
            skillInfrastructure: {
              '@ask-cli/cfn-deployer': {},
            },
          },
        },
      });

      mockFileSystem.restore();
      mockFileSystem(dummyFileSystem);
    });

    it('throws', async () => {
      await assert.rejects(
        async () => await uploadZipLambdaCommand.run(),
        /deploy-via-zip is only supported for skills deployed with lambda-deployer/,
      );
    });
  });

  describe('when Lambda ARN is not found in ask-states.json', () => {
    beforeEach(() => {
      dummyFileSystem[STORY_DIR]['.deploy'][ASK_SKILL_DIRECTORY_NAME]['.ask']['ask-states.json'] = JSON.stringify({
        profiles: {
          [ASK_PROFILE_NAME]: {
            skillInfrastructure: {
              '@ask-cli/lambda-deployer': {
                deployState: {
                  default: {
                    lambda: {},
                  },
                },
              },
            },
          },
        },
      });

      mockFileSystem.restore();
      mockFileSystem(dummyFileSystem);
    });

    it('throws', async () => {
      await assert.rejects(
        async () => await uploadZipLambdaCommand.run(),
        /skillInfrastructure is missing lambda ARN information/,
      );
    });
  });
});
