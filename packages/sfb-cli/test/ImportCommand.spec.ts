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

import { FileUtils } from '../lib/fileUtils';
import { ManifestUtils } from '../lib/manifestUtils';
import { ImportCommand } from '../lib/importCommand';
import { ConsoleLogger } from '../lib/consoleLogger';
import { ConsoleStdOutput } from '../lib/consoleStdOutput';

import {
  createMockSpawn,
  createMockChildProcess,
  readTextFile,
  assertCalledManyTimesWithArgs,
} from './testUtilities';

describe('alexa-sfb import', () => {
  // `importCommand` depends on `require`, which doesn't work well with
  // `mock-fs`. Hence, instead of mocking the file system, we use real files.
  const STORY_DIR = `${__dirname}/importCommandData`;

  let mockSpawn: any;
  let mockedManifestUtils: any;
  let importCommand: ImportCommand; // Subject under test

  beforeEach(async () => {
    // Copy dummy story directory into compiled test directory, for single use
    await FileUtils.recursiveCopy(
      path.resolve(`${__dirname}/../../test/importCommandData`),
      __dirname,
    );

    mockedManifestUtils = {
      readRawPackageNameVersion: sinon
        .stub(ManifestUtils, 'readRawPackageNameVersion')
        .returns({
          name: 'dummy-sfb-package',
          version: '1.2.3',
        }),
      checkDeploymentPackageVersionWithTooling: sinon.stub(
        ManifestUtils,
        'checkDeploymentPackageVersionWithTooling',
      ),
      getLatestsMajorVersionFromNpm: sinon
        .stub(ManifestUtils, 'getLatestsMajorVersionFromNpm')
        .resolves('1.2.3'),
    };


    mockSpawn = createMockSpawn();
    // Stub `npm run compile` to fake-compile TypeScript code into JavaScript
    mockSpawn.withArgs('npm', ['run', 'compile']).callsFake(() => {
      fs.mkdirSync(`${STORY_DIR}/code/dist`);
      fs.mkdirSync(`${STORY_DIR}/code/dist/extensions`);
      fs.copyFileSync(
        `${STORY_DIR}/code/extensions/ExtensionLoader.ts`,
        `${STORY_DIR}/code/dist/extensions/ExtensionLoader.js`,
      );
      return createMockChildProcess();
    });


    importCommand = new ImportCommand(
      STORY_DIR,
      true,
      new ConsoleLogger(true),
      new ConsoleStdOutput(),
    );
  });

  afterEach(async () => {
    mockSpawn.restore();
    sinon.restore();

    await FileUtils.deleteDir(STORY_DIR, new ConsoleStdOutput());
  });

  it('creates languageString.json in build artifact', async () => {
    await importCommand.run();

    const translation = {
      "translation": {
          "start.narration": "Dummy start scene! Go to next scene?",
          "utterance-yes": "yes",
          "utterance-go to next scene": "go to next scene",
          "utterance-no": "no",
          "second scene.narration": "You brave soul!\n    <break time='1s'>\n    You get nothing. The cake is a lie.",
          "answered no.narration": "Just go to next scene! What say you?",
          "utterance-start over": "start over"
      }
    };

    assert.deepEqual(
      JSON.parse(readTextFile(`${STORY_DIR}/.deploy/dist/res/languageStrings.json`)),
      { 'en-US': translation, 'en-GB': translation },
    );
  });

  it('creates languageString.json in content directory', async () => {
    await importCommand.run();

    assert.deepEqual(
      JSON.parse(readTextFile(`${STORY_DIR}/content/languageStrings.json`)),
      JSON.parse(readTextFile(`${STORY_DIR}/.deploy/dist/res/languageStrings.json`)),
    );
  });

  it('creates baked story file', async () => {
    await importCommand.run();

    const storyUS = JSON.parse(readTextFile(`${STORY_DIR}/.deploy/dist/res/en-US/en-us-baked-story.json`));
    const storyGB = JSON.parse(readTextFile(`${STORY_DIR}/.deploy/dist/res/en-GB/en-gb-baked-story.json`));

    // Sanity check the imported JSON file. More detailed testing is done in
    // `SampleStoryTest.int-spec.ts`

    assert.equal(storyUS.storyID, 'awesome-123');
    assert.equal(storyGB.storyID, 'absolute-unit-123');
    assert.equal(storyUS.scenes.length, 4);
    assert.equal(storyGB.scenes.length, 4);
  });

  it('creates voice model file', async () => {
    await importCommand.run();

    const voiceUS = JSON.parse(readTextFile(`${STORY_DIR}/.deploy/dist/res/en-US/en-US.json`));
    const voiceGB = JSON.parse(readTextFile(`${STORY_DIR}/.deploy/dist/res/en-GB/en-GB.json`));

    assert.equal(voiceUS.interactionModel.languageModel.invocationName, 'awesome skill');
    assert.equal(voiceGB.interactionModel.languageModel.invocationName, 'absolute unit');

    // SFB-generated intents
    assert.deepEqual(voiceUS.interactionModel.languageModel.intents[0].samples, ['go to next scene']);
    assert.deepEqual(voiceGB.interactionModel.languageModel.intents[0].samples, ['go to next scene']);

    // Default intents
    assert.ok(voiceUS.interactionModel.languageModel.intents[1].name.startsWith('AMAZON.'));
    assert.ok(voiceGB.interactionModel.languageModel.intents[1].name.startsWith('AMAZON.'));
  });

  it('compiles typescript code', async () => {
    await importCommand.run();

    assertCalledManyTimesWithArgs(mockSpawn, [
      [
        "npm",
        [
          "install",
        ],
        {
          "cwd": `${STORY_DIR}/code`,
          "shell": true,
        },
      ],
      [
        "npm",
        [
          "run",
          "compile",
        ],
        {
          "cwd": `${STORY_DIR}/code`,
          "shell": true,
        },
      ],
    ]);
  });

  it('copies abcConfig', async () => {
    await importCommand.run();

    assert.deepEqual(
      JSON.parse(readTextFile(`${STORY_DIR}/abcConfig.json`)),
      JSON.parse(readTextFile(`${STORY_DIR}/.deploy/dist/abcConfig/abcConfig.json`)),
    );
  });

  it('copies resources into build artifact', async () => {
    await importCommand.run();

    assert.deepEqual(
      JSON.parse(readTextFile(`${STORY_DIR}/.deploy/dist/res/en-US/en-us-slots.json`)),
      { FooSlot: ['foo', 'bar', 'baz'] },
    );
    assert.deepEqual(
      JSON.parse(readTextFile(`${STORY_DIR}/.deploy/dist/res/en-US/snippets.json`)),
      { pause: "<break time='1s'>" },
    );
    assert.equal(
      readTextFile(`${STORY_DIR}/.deploy/dist/res/en-US/baz.csv`),
      'baz,csv,content\n',
    );
    assert.ok(fs.existsSync(`${STORY_DIR}/.deploy/dist/res/en-US/isp.json`));
    assert.ok(fs.existsSync(`${STORY_DIR}/.deploy/dist/res/en-US/apl-templates.json`));

    // Specifically configured file names
    assert.deepEqual(
      JSON.parse(readTextFile(`${STORY_DIR}/.deploy/dist/res/en-GB/en-gb-slots.json`)),
      { FooSlot: ['baz', 'quux'] },
    );
    assert.deepEqual(
      JSON.parse(readTextFile(`${STORY_DIR}/.deploy/dist/res/en-GB/snippets-en-gb.json`)),
      { pause: "<break time='2s'>" },
    );
    assert.ok(fs.existsSync(`${STORY_DIR}/.deploy/dist/res/en-GB/isp.json`));
    assert.ok(fs.existsSync(`${STORY_DIR}/.deploy/dist/res/en-GB/apl-templates-en-gb.json`));
  });

  describe('when more resources are configured', () => {
    beforeEach(() => {
      const abcConfig = JSON.parse(readTextFile(`${STORY_DIR}/abcConfig.json`));
      abcConfig.default['valid-resource-file-extensions'] = ['json', 'txt'];
      abcConfig.default['additional-resource-directories'] =
        ['additional-resources-1', 'additional-resources-2'];

      fs.writeFileSync(`${STORY_DIR}/abcConfig.json`, JSON.stringify(abcConfig));
    });

    it('copies additionally configured resources into build artifact', async () => {
      await importCommand.run();

      assert.equal(
        readTextFile(`${STORY_DIR}/.deploy/dist/res/en-GB/foo-bar.txt`),
        'Sample text file\n',
      );

      assert.equal(
        readTextFile(`${STORY_DIR}/.deploy/dist/res/en-GB/additional-resources-1/foo.img`),
        'Fake image\n',
      );
      assert.equal(
        readTextFile(`${STORY_DIR}/.deploy/dist/res/en-GB/additional-resources-2/bar.img`),
        'Another fake image\n',
      );
    });
  });

  describe('with import errors', () => {
    beforeEach(() => {
      // Delete a content file to break the story
      fs.unlinkSync(`${STORY_DIR}/content/more-content/bar.abc`);
    });

    it('throws', async () => {
      await assert.rejects(
        async () => await importCommand.run(),
        /Found \d+ import errors/,
      );
    });
  });

  describe('when newer SFB version is available', () => {
    beforeEach(() => {
      mockedManifestUtils.getLatestsMajorVersionFromNpm.resolves('1.2.4');
    });

    it('throws', async () => {
      await assert.rejects(
        async () => await importCommand.run(),
        /Current version Skill Flow Builder \S+ is behind latest available/,
      );
    });

    describe('when version check is overridden', () => {
      beforeEach(() => {
        importCommand = new ImportCommand(
          STORY_DIR,
          false,
          new ConsoleLogger(true),
          new ConsoleStdOutput(),
        );
      });

      it('still imports', async () => {
        await importCommand.run();

        assert.ok(fs.existsSync(`${STORY_DIR}/.deploy/dist/res/en-US/en-us-baked-story.json`));
        assert.ok(fs.existsSync(`${STORY_DIR}/.deploy/dist/res/en-GB/en-gb-baked-story.json`));
      });
    });
  });
});
