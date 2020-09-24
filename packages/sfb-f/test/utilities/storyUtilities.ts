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
import { readUtf8FileExcludingBomSync } from '@alexa-games/sfb-util';

export const POSITIVE_TEST_STORY_DIRECTORY = './test/positive_test_cases';
export const NEGATIVE_TEST_STORY_DIRECTORY_MISSING_START = './test/negative_test_cases/missing_start_scene';
export const GLOBAL_TEST_STORY_DIRECTORY = './test/global_test_cases';

export interface Content {
  id: string,
  text: string
}

export function loadTestStory(storyFileDirectory: string, fileName: string): string {
    const fullPath = path.resolve(path.join(storyFileDirectory, fileName));

    // console.log(`fullPath=${fullPath}`);

    return readUtf8FileExcludingBomSync(fullPath);
}

export function loadTestResource(storyFileDirectory: string, fileName: string): string {
    const fullPath = path.resolve(path.join(storyFileDirectory, 'resources', fileName));

    // console.log(`fullPath=${fullPath}`);

    return readUtf8FileExcludingBomSync(fullPath);
}

export function loadTestResourceAsObject(storyFileDirectory: string, fileName: string): any {
    const fullPath = path.resolve(path.join(storyFileDirectory, 'resources', fileName));

    // console.log(`fullPath=${fullPath}`);

    return JSON.parse(readUtf8FileExcludingBomSync(fullPath));
}

export function loadAllContent(storyFileDirectory: string, storyFileList: string[]): Content[] {
    const contentList: Content[] = [];

    for (let storyFile of storyFileList) {
      contentList.push({
        id: storyFile,
        text: loadTestStory(storyFileDirectory, storyFile)
      });
    }

    return contentList;
}


export function getISPMapping(storyFileDirectory: string, ispFile: string): { [key: string]: string } {
    let ispJSON = JSON.parse(loadTestResource(storyFileDirectory, ispFile));

    let ispMapping: { [key: string]: string } = {};
    for (let i: number = 0; i < ispJSON.length; i++) {
      ispMapping[ispJSON[i].productName] = ispJSON[i].ISPID;
    }
    return ispMapping;
}
