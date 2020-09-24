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

import * as fs from 'fs';
import * as path from 'path';

import * as sinon from 'sinon';
import { strict as assert } from 'assert';
import mockFileSystem from 'mock-fs';

import { BakeCommand } from '../lib/bakeCommand';
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
} from './testUtilities';

describe('alexa-sfb bake', () => {
  describe('with mocked file system', () => {
    let dummyFileSystem: any;
    let bakeCommand: BakeCommand; // Subject under test

    beforeEach(() => {
      dummyFileSystem = JSON.parse(JSON.stringify(DUMMY_ASK_FILE_SYSTEM)); // Deep copy

      dummyFileSystem[STORY_DIR]['.deploy'].dist.res = {
        'en-US': {
          'en-us-recording-script.txt': 'en-us script content',
          'en-us-baked-file.json': 'en-us baked content',
        },
        'en-GB': {
          'en-gb-recording-script.txt': 'en-gb script content',
          'en-gb-baked-file.json': 'en-gb baked content',
        },
      };

      const abcConfig = JSON.parse(dummyFileSystem[STORY_DIR]['abcConfig.json']);
      abcConfig['en-us'] = {
        'abc-recording-script-filename': 'en-us-recording-script.txt',
        'abc-baked-filename': 'en-us-baked-file.json',
        'apl-templates-filename': 'en-us-apl-templates.json',
      };
      abcConfig['en-gb'] = {
        'abc-recording-script-filename': 'en-gb-recording-script.txt',
        'abc-baked-filename': 'en-gb-baked-file.json',
        'apl-templates-filename': 'en-gb-apl-templates.json',
      };
      dummyFileSystem[STORY_DIR]['abcConfig.json'] = JSON.stringify(abcConfig);

      mockFileSystem(dummyFileSystem);

      bakeCommand = new BakeCommand(STORY_DIR, new ConsoleLogger(true));
    });

    afterEach(() => {
      mockFileSystem.restore();
      sinon.restore();
    });

    it('copies resources', async () => {
      await bakeCommand.run();

      assert.equal(
        readTextFile(`${STORY_DIR}/baked/en-US/en-us-baked-file.json`),
        'en-us baked content',
      );
      assert.equal(
        readTextFile(`${STORY_DIR}/baked/en-GB/en-gb-baked-file.json`),
        'en-gb baked content',
      );

      assert.equal(
        readTextFile(`${STORY_DIR}/baked/en-US/en-us-recording-script.txt`),
        'en-us script content',
      );
      assert.equal(
        readTextFile(`${STORY_DIR}/baked/en-GB/en-gb-recording-script.txt`),
        'en-gb script content',
      );
    });

    it('bakes APL', async () => {
      const bakeAplFiles = sinon.spy(bakeCommand, 'bakeAPLFiles');

      await bakeCommand.run();

      // Assert that `BakeCommand.bakeAPLFiles` was called.
      // Detailed behavior is tested below with real files.
      assertCalledManyTimesWithArgs(bakeAplFiles, [
        [
          '/dummy/project/.deploy/dist/res/en-US/en-us-apl-templates.json',
          '/dummy/project/.deploy/dist/res/en-US/en-us-apl-templates.json',
        ],
        [
          '/dummy/project/.deploy/dist/res/en-GB/en-gb-apl-templates.json',
          '/dummy/project/.deploy/dist/res/en-GB/en-gb-apl-templates.json',
        ]
      ]);
    });
  });

  describe('with real file system', () => {
    it('Test APL Bake', async () => {

        const bakeCommand = new BakeCommand("", new ConsoleLogger);

        const aplPath = path.resolve("test/data/en-us/apl-templates.json");

        const outputFile = aplPath + ".out";

        fs.unlinkSync(outputFile);

        // Verify file is deleted
        assert.ok(!fs.existsSync(outputFile));

        await bakeCommand.bakeAPLFiles(aplPath, outputFile);

        // Verify file now exists
        assert.ok(fs.existsSync(outputFile));

        const generatedAPLHash = JSON.parse(readTextFile(outputFile));

        assert.ok(generatedAPLHash);

        assert.ok(!generatedAPLHash['does not contain me']);

        assert.ok(generatedAPLHash['default']);
        assert.ok(generatedAPLHash['title-screen-apl-test']);
        assert.ok(generatedAPLHash['ending-screen-apl-test']);
        assert.ok(generatedAPLHash['subdir.subdir-apl']);
    });
  });
});

