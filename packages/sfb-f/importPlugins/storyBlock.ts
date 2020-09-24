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

import { StoryBlockRange } from './storyBlockRange';
import { ScenePropertyEnumerator } from './storyFeatureEnumerator';

export class StoryBlock {
    constructor(
        public readonly lines: string[],
        public readonly blockName: string,
        public readonly range: StoryBlockRange) {
    }

    /**
     * Assembles the whole block into a single multi-line string.
     */
    public getText(): string {
        let result: string | undefined = undefined;;
        for (let i = this.range.start.row; i <= this.range.end.row; i++) {
            if (result) {
                result += '\n';
            } else {
                result = '';
            }
            result += this.range.cropToRange(this.lines[i], i);
        }

        return result || '';
    }
}

export class SceneStoryBlock extends StoryBlock {
    constructor(
        lines: string[],
        blockName: string,
        range: StoryBlockRange) {
            super(lines, blockName, range);
    }

    public getPropertyEnumerator(type?: string): ScenePropertyEnumerator {
        return new ScenePropertyEnumerator(this.lines, this.range, type);
    }
}

export class ScenePropertyStoryBlock extends StoryBlock {
    constructor(
        lines: string[],
        blockName: string,
        range: StoryBlockRange) {
            super(lines, blockName, range);
    }
}
