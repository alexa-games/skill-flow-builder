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

import * as sinon from 'sinon';
import { strict as assert } from 'assert';
import mockFileSystem from 'mock-fs';

import { NewProjectCommand } from '../lib/newProjectCommand';
import { ConsoleLogger } from '../lib/consoleLogger';
import { ConsoleStdOutput } from '../lib/consoleStdOutput';
import { ManifestUtils } from '../lib/manifestUtils';

import {
  STORY_DIR,
  DUMMY_ASK_FILE_SYSTEM,
  DUMMY_SFB_ROOT,
  stubSfbCliRoot,
  readTextFile,
} from './testUtilities';

describe('alexa-sfb new', () => {
  const DUMMY_STORY_PATH = '/dummy/story/path/my-Story_123';
  const DUMMY_TEMPLATE_NAME = 'dummy-skill-template';
  const DUMMY_CONTENT = 'dummy content';
  const DUMMY_PACKAGE_JSON = JSON.stringify({ dummy: 'package.json' });

  let newProjectCommand: NewProjectCommand; // Subject under test

  beforeEach(() => {
    mockFileSystem({
      [DUMMY_SFB_ROOT]: {
        samples: {
          [DUMMY_TEMPLATE_NAME]: {
            content: {
              'content.abc': DUMMY_CONTENT,
            },
            code: {
              '_package.json': DUMMY_PACKAGE_JSON,
            },
            'abcConfig.json': JSON.stringify({
              'foo-bar-key': 'some-stuff-with-my-branch-story',
              'another-key': 'some stuff with My Branch Story',
            }),
          },
        },
      },
    });

    stubSfbCliRoot();

    // This functionality is tested on its own suite, so we mock it out
    sinon
      .stub(ManifestUtils, 'repairPackageManifest')
      .withArgs(JSON.parse(DUMMY_PACKAGE_JSON))
      .callsFake(async (o) => {
        o.repaired = true;
      });

    newProjectCommand = new NewProjectCommand(
      DUMMY_STORY_PATH,
      DUMMY_TEMPLATE_NAME,
      new ConsoleLogger(true),
      new ConsoleStdOutput(),
    );
  });

  afterEach(() => {
    mockFileSystem.restore();
    sinon.restore();
  });

  it('copies template project to user-specified project directory', async () => {
    await newProjectCommand.run();

    assert.equal(readTextFile(`${DUMMY_STORY_PATH}/content/content.abc`), DUMMY_CONTENT);
  });

  it('replaces abcConfig.json to contain user-specified project name', async () => {
    await newProjectCommand.run();

    assert.deepEqual(
      JSON.parse(readTextFile(`${DUMMY_STORY_PATH}/abcConfig.json`)),
      {
        'foo-bar-key': 'some-stuff-with-my-story-123',
        'another-key': 'some stuff with my Story 123',
      },
    );
  });

  it('repairs package.json', async () => {
    await newProjectCommand.run();

    assert.ok(!fs.existsSync(`${DUMMY_STORY_PATH}/code/_package.json`));
    assert.deepEqual(
      JSON.parse(readTextFile(`${DUMMY_STORY_PATH}/code/package.json`)),
      {
        dummy: 'package.json',
        repaired: true,
      },
    );
  });
});
