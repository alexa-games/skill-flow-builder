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

import path from "path";
import { areFilesTheSameSize, copyAudioResources, getNewOrDifferentFiles } from '../../app/utils-renderer';

describe('Simulator utils', () => {
  it('file does not exist', async () => {
    const skillPath = path.resolve('./', 'test', 'sample-skill', 'sample');
    const audioFilePath = path.resolve(skillPath, 'content', 'en-US', 'resources', 'public', 'audio');
    const fileList = await getNewOrDifferentFiles(audioFilePath, skillPath);

    expect(fileList).toEqual(['trumpet_1.mp3']);
  });

  it('file does exist but is different', async () => {
    const skillPath = path.resolve('./', 'test', 'sample-skill', 'sample');
    const folder1 = path.resolve(skillPath, 'content', 'en-US', 'resources', 'public', 'audio');
    const folder2 = path.resolve('./', 'test', 'sample-skill', 'file-test-data');

    const fileList = await getNewOrDifferentFiles(folder1, folder2);

    expect(fileList).toEqual(['trumpet_1.mp3']);
  });

  it('file exists but is the same', async () => {
    const skillPath = path.resolve('./', 'test', 'sample-skill', 'sample');
    const folder1 = path.resolve(skillPath, 'content', 'en-US', 'resources', 'public', 'audio');
    const skill2Path = path.resolve('./', 'test', 'sample-skill', 'sample-errors');
    const folder2 = path.resolve(skill2Path, 'content', 'en-US', 'resources', 'public', 'audio');
    const fileList = await getNewOrDifferentFiles(folder1, folder2);

    expect(fileList).toEqual([]);
  });

  it('path does not exist', async () => {
    const skillPath = path.resolve('./', 'test', 'sample-skill', 'sample');
    const folder1 = path.resolve(skillPath, 'content', 'en-US', 'resources', 'public', 'audio-not');
    const skill2Path = path.resolve('./', 'test', 'sample-skill', 'sample-errors');
    const folder2 = path.resolve(skill2Path, 'content', 'en-US', 'resources', 'public', 'audio');
    const result = await copyAudioResources(folder1, folder2);

    expect(result).toEqual(null);
  });

  it('compares two files', async () => {
    const skillPath = path.resolve('./', 'test', 'sample-skill', 'sample');
    const correctFile = path.resolve(skillPath, 'content', 'en-US', 'resources', 'public', 'audio', 'trumpet_1.mp3');
    const brokenFile = path.resolve('./', 'test', 'sample-skill', 'file-test-data', 'trumpet_1.mp3');

    const areSame = await areFilesTheSameSize(correctFile, brokenFile);

    expect(areSame).toEqual(false);

  });

});
