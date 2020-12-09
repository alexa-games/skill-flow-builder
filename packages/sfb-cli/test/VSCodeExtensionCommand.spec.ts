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

import { VscodeExtensionCommand } from '../lib/vscodeExtensionCommand';
import { ConsoleLogger } from '../lib/consoleLogger';
import { ConsoleStdOutput } from '../lib/consoleStdOutput';

import {
  createMockSpawn,
  assertCalledManyTimesWithArgs,
  stubSfbCliRoot,
  readTextFile,
  DUMMY_SFB_ROOT,
  SFB_VSCODE_EXTENSION_NAME,
  isWin32
} from './testUtilities';

describe('alexa-sfb vscode', () => {
  let dummyFileSystem: any;
  let mockSpawn: any;
  let vscodeExtension: VscodeExtensionCommand; // Subject under test

  let homeDir = isWin32() ? '\\home' : '/home';

  beforeEach(() => {
    sinon.stub(process, 'env').value({ HOME: homeDir, USERPROFILE: homeDir });

    mockFileSystem({
      [DUMMY_SFB_ROOT]: {
        node_modules: {
          ['@alexa-games']: {
            [SFB_VSCODE_EXTENSION_NAME]: { // Directory to copy the extension from
              'dummy-file': 'dummy-contents',
              'package.json': JSON.stringify({
                "dependencies": {
                  "dummy-dependency": "// dummy dependency",
                  "@alexa-games/sfb-util": "file:../dummy/local/reference",
                  "@alexa-games/sfb-f": "^1.2.3" // Simulated remote location
                }
              }, null, 4)
            }
          }
        }
      }
    });

    stubSfbCliRoot();

    mockSpawn = createMockSpawn();

    vscodeExtension = new VscodeExtensionCommand(
      new ConsoleLogger(true),
      new ConsoleStdOutput(),
    );
  });

  afterEach(() => {
    mockFileSystem.restore();
    mockSpawn.restore();
    sinon.restore();
  });

  const vscodeExtDestPath = path.resolve(path.join(homeDir, '.vscode', 'extensions', SFB_VSCODE_EXTENSION_NAME));

  it('moves the extension in the user\'s .vscode directory', async () => {
    await vscodeExtension.run();

    assert.ok(
      fs.existsSync(vscodeExtDestPath)
    );

    assert.equal(readTextFile(vscodeExtDestPath + '/dummy-file'), 'dummy-contents');
  });

  it('fixes the local module references', async () => {
    await vscodeExtension.run();

    const expectedDependencies = {
      "dummy-dependency": "// dummy dependency",
      "@alexa-games/sfb-util": `file:${path.join(DUMMY_SFB_ROOT, '..', 'sfb-util')}`, // Expected local reference
      "@alexa-games/sfb-f": "^1.2.3" // Simulated remote location
    };

    assert.deepEqual(JSON.parse(readTextFile(vscodeExtDestPath + '/package.json')).dependencies, expectedDependencies);
  });

  it('ensures the extension is fully resolved', async () => {
    await vscodeExtension.run();

    assertCalledManyTimesWithArgs(mockSpawn, [
      ['npx', ['npm', 'install', '--production'], { cwd: `${vscodeExtDestPath}`, shell: true }]
    ]);
  });
});
