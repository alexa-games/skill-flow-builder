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

import { UploadResourcesCommand } from '../lib/uploadResourcesCommand';
import { ConsoleLogger } from '../lib/consoleLogger';
import { ConsoleStdOutput } from '../lib/consoleStdOutput';

import {
  STORY_DIR,
  DUMMY_ASK_FILE_SYSTEM,

  ASK_PROFILE_NAME,
  AWS_PROFILE_NAME,
  S3_BUCKET_NAME,
  ASK_SKILL_DIRECTORY_NAME,

  createMockSpawn,
  assertCalledManyTimesWithArgs,
} from './testUtilities';

describe('alexa-sfb upload', () => {
  let dummyFileSystem: any;
  let mockSpawn: any;
  let uploadResourcesCommand: UploadResourcesCommand; // Subject under test

  beforeEach(() => {
    dummyFileSystem = JSON.parse(JSON.stringify(DUMMY_ASK_FILE_SYSTEM)); // Deep copy
    mockFileSystem(dummyFileSystem);

    mockSpawn = createMockSpawn();

    uploadResourcesCommand = new UploadResourcesCommand(
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

  it('upload public resources to S3', async () => {
    await uploadResourcesCommand.run();

    assertCalledManyTimesWithArgs(mockSpawn, [
      [
        'aws',
        [
          's3',
          'cp',
          `"${path.resolve(path.join(STORY_DIR, 'content', 'en-US', 'resources', 'public', 'audio-files'))}"`,
          `"s3://${S3_BUCKET_NAME}/${ASK_SKILL_DIRECTORY_NAME}/en-US/audio-files/"`,
          '--recursive',
          '--acl',
          'public-read',
          '--profile',
          AWS_PROFILE_NAME,
        ],
        { shell: true },
      ],
      [
        'aws',
        [
          's3',
          'cp',
          `"${path.resolve(path.join(STORY_DIR, 'content', 'en-US', 'resources', 'public', 'image-files'))}"`,
          `"s3://${S3_BUCKET_NAME}/${ASK_SKILL_DIRECTORY_NAME}/en-US/image-files/"`,
          '--recursive',
          '--acl',
          'public-read',
          '--profile',
          AWS_PROFILE_NAME,
        ],
        { shell: true },
      ],
      [
        'aws',
        [
          's3',
          'cp',
          `"${path.resolve(path.join(STORY_DIR, 'content', 'en-GB', 'resources', 'public', 'audio-files'))}"`,
          `"s3://${S3_BUCKET_NAME}/${ASK_SKILL_DIRECTORY_NAME}/en-GB/audio-files/"`,
          '--recursive',
          '--acl',
          'public-read',
          '--profile',
          AWS_PROFILE_NAME,
        ],
        { shell: true },
      ],
      [
        'aws',
        [
          's3',
          'cp',
          `"${path.resolve(path.join(STORY_DIR, 'content', 'en-GB', 'resources', 'public', 'image-files'))}"`,
          `"s3://${S3_BUCKET_NAME}/${ASK_SKILL_DIRECTORY_NAME}/en-GB/image-files/"`,
          '--recursive',
          '--acl',
          'public-read',
          '--profile',
          AWS_PROFILE_NAME,
        ],
        { shell: true }
      ],
    ]);
  });
});
