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
import path from 'path';
import * as fs from 'fs';
import * as sinon from 'sinon';
import { strict as assert } from 'assert';

export const STORY_DIR = '/dummy/project';
export const DUMMY_SFB_ROOT = '/home/sfb-cli';
export const ASK_PROFILE_NAME = 'dummy-ask-profile';
export const ASK_SKILL_DIRECTORY_NAME = 'dummy-ask-directory';

export const S3_BUCKET_NAME = 'dummy-s3-bucket';
export const AWS_PROFILE_NAME = 'dummy-aws-profile';
export const SKILL_ID = 'dummy-skill-id';
export const SFB_VSCODE_EXTENSION_NAME = 'sfb-vscode-extension';

export const BUILD_ARTIFACT_PATH = `${STORY_DIR}/.deploy`;
export const STAGED_LAMBDA_PATH = `${BUILD_ARTIFACT_PATH}/${ASK_SKILL_DIRECTORY_NAME}/lambda`;
export const ASK_SKILL_DIRECTORY_PATH = `${BUILD_ARTIFACT_PATH}/${ASK_SKILL_DIRECTORY_NAME}`;
export const STAGED_CLOUDFORMATION_PATH = `${ASK_SKILL_DIRECTORY_PATH}/infrastructure/cfn-deployer/skill-stack.yaml`;
export const STAGED_SKILL_JSON_PATH = `${ASK_SKILL_DIRECTORY_PATH}/skill-package/skill.json`;
export const STAGED_ASK_RESOURCES_PATH = `${ASK_SKILL_DIRECTORY_PATH}/ask-resources.json`;
export const STAGED_ASK_STATES_PATH = `${ASK_SKILL_DIRECTORY_PATH}/.ask/ask-states.json`;

export const STORED_METADATA_PATH = `${STORY_DIR}/metadata`;
export const STORED_LAMBDA_LAYER_PATH = `${STORED_METADATA_PATH}/lambda-layer`;
export const STORED_SKILL_JSON_PATH = `${STORED_METADATA_PATH}/skill.json`;
export const STORED_ASK_RESOURCES_PATH = `${STORED_METADATA_PATH}/ask-resources.json`;
export const STORED_ASK_STATES_PATH = `${STORED_METADATA_PATH}/ask-states.json`;
export const STORED_LAMBDA_LAYER_CONFIG_PATH = `${STORED_METADATA_PATH}/lambda-layer.json`;

/**
 * Dummy file system for use with `mock-fs`.
 *
 * Directory tree is modeled as an object tree, with leaf nodes as file content.
 */
export const DUMMY_ASK_FILE_SYSTEM = {
  /**
   * Main SFB project directory
   */
  [STORY_DIR]: {
    /**
     * SFB build artifact directory
     */
    '.deploy': {
      /**
       * ASK-CLI-style project directory, used by ASK CLI to deploy the skill
       */
      [ASK_SKILL_DIRECTORY_NAME]: {
        lambda: {
          'index.js': '// Dummy index file',
          'node_modules': {},
          'package.json': '// Dummy package.json'
        },
        'skill-package': {
          'skill.json': '{}',
          interactionModels: {
            custom: {
              'en-US.json': 'dummy en-US interaction model',
              'en-GB.json': 'dummy en-GB interaction model',
            },
          },
        },
      },
      dist: { abcConfig: {}, res: {} },
    },
    /**
     * Metadata used by ASK CLI for deployment. Since every ASK-deployment may
     * auto-modify these metadata files, we store them for future deployments.
     */
    metadata: {
      'skill.json': 'skill.json contents',
      'skill-stack.yaml': 'skill-stack.yaml contents',
      'ask-states.json': JSON.stringify({
        profiles: {
          [ASK_PROFILE_NAME]: {
            skillId: SKILL_ID,
          },
        },
      }),
      'ask-resources.json': JSON.stringify({
        profiles: {
          [ASK_PROFILE_NAME]: {
            code: {
              default: {
                src: 'lambda',
              },
            },
          },
        },
      }),
    },
    /**
     * Main workhorse of SFB.
     *
     * Contains `.abc` files that form the story, and public resources.
     */
    content: {
      'en-US': {
        resources: {
          public: {
            'audio-files': {},
            'image-files': {},
          },
        },
      },
      'en-GB': {
        resources: {
          public: {
            'audio-files': {},
            'image-files': {},
            'ignored-files': {},
          },
        },
      },
    },
    /**
     * JavaScript code for SFB extensions.
     */
    code: {},
    /**
     * Main configuration for SFB.
     */
    'abcConfig.json': JSON.stringify({
      default: {
        sfbLocalTesting: false,
        'ask-profile-name': ASK_PROFILE_NAME,
        'ask-skill-directory-name': ASK_SKILL_DIRECTORY_NAME,
        'publish-locales': ['en-US', 'en-GB'],
        'public-resource-folders': ['audio-files', 'image-files'],
        's3-bucket-name': S3_BUCKET_NAME,
        'aws-profile-name': AWS_PROFILE_NAME,
        'use-lambda-layer': false
      }
    }),
  },
};

/**
 * Note that, because of how `mock-fs` works, you need to call this **after**
 * you mock the file system. Otherwise, file system mocking won't work
 * correctly.
 */
export const stubSfbCliRoot = () => {
  const sfbRoot = path.resolve(__dirname, '../..');

  const stubbedResolve = sinon.stub(path, 'resolve');
  stubbedResolve.withArgs(sfbRoot).returns(DUMMY_SFB_ROOT);
  stubbedResolve.callThrough();
  return stubbedResolve;
};

export const readTextFile = (filePath: string) => {
  return fs.readFileSync(filePath, 'utf8');
}

export const createMockChildProcess = (stdOutputList: string[] = [], exitCode = 0) => {
  return {
    on: (eventName: string, callback: (exitCode: number) => void) => {
      if (eventName === 'close') {
        callback(exitCode);
      }
    },
    stdin: {
      write: sinon.stub(),
    },
    stdout: {
      on: (eventName: string, callback: (output: string) => void) => {
        if (eventName === 'data') {
          for (const output of stdOutputList) {
            callback(output);
          }
        }
      }
    },
    stderr: {
      on: () => null,
    },
  };
};

export const createMockSpawn = (stdOutputList: string[] = [], exitCode = 0) => {
  const mockSpawn = sinon.stub(childProcess, 'spawn');
  // @ts-ignore: Duck-type our mocks for ease of mocking
  mockSpawn.returns(createMockChildProcess(stdOutputList, exitCode));

  return mockSpawn;
};

export const assertCalledManyTimesWithArgs = (sinonStub: any, calls: any[][]) => {
  assert.deepEqual(getArgsForEachCall(sinonStub), calls);
};

export const getArgsForEachCall = (sinonStub: any) => {
  return sinonStub.getCalls().map((c: any) => c.args);
}
