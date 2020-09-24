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
import { findFiles, readdirRecursivePromisified } from '../../app/utils-main/fs';


describe('fs utils', () => {

  it('reads a folder recursively', async () => {
    const skillPath = path.resolve('./', 'test', 'sample-skill', 'sample');
    const files = await readdirRecursivePromisified(skillPath);
    const expectedFileList = [
      ["abcConfig.json"],
      ["code", "extensions", "ExtensionLoader.ts"],
      ["code", "extensions", "SampleCustomExtension.ts"],
      ["code", "index.ts"],
      ["code", "package.json"],
      ["code", "tsconfig.json"],
      ["content", "MANIFEST.json"],
      ["content", "NOTES.md"],
      ["content", "en-GB", "resources", "ProductISPs.json"],
      ["content", "en-GB", "resources", "SlotTypes.json"],
      ["content", "en-GB", "resources", "Snippets.json"],
      ["content" , "en-GB", "resources", "apl-templates.json"],
      ["content", "en-GB", "resources", "public", "audio", "trumpet_1.mp3"],
      ["content", "en-GB", "resources", "public", "vo", "a-fairy-tale.mp3"],
      ["content", "en-US", "resources", "ProductISPs.json"],
      ["content", "en-GB", "resources", "public", "images", "sample_image.png"],
      ["content", "en-US", "resources", "SlotTypes.json"],
      ["content", "en-US", "resources", "Snippets.json"],
      ["content", "en-US", "resources", "apl-templates.json"],
      ["content", "en-US", "resources", "public", "audio", "trumpet_1.mp3"],
      ["content", "en-US", "resources", "public", "images", "sample_image.png"],
      ["content", "en-US", "resources", "public", "vo", "a-fairy-tale.mp3"],
      ["content", "languageStrings.json"],
      ["content", "story.abc"]
    ];
    const normalizedExpectedFileList = expectedFileList.map(e => path.join(...e));
    expect(files.sort()).toEqual(normalizedExpectedFileList.sort());
  });

  it('finds files', async () => {
    const skillPath = path.resolve('./', 'test', 'sample-skill', 'sample');
    const files = await findFiles(skillPath);
    const expectedFileList = [
      ["content", "story.abc"]
    ];
    const normalizedExpectedFileList = expectedFileList.map(e => path.join(...e));
    expect(files.sort()).toEqual(normalizedExpectedFileList.sort());
  });
});
