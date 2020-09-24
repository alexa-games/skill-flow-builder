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

import { 
    StoryBlockFinder, 
    EndType, 
    BlockStartExpressions
} from './storyBlockFinder';
import { StoryBlockRange } from './storyBlockRange';
import { SceneStoryBlock, ScenePropertyStoryBlock } from './storyBlock';

export class SceneEnumerator {
  
    private finder: StoryBlockFinder; 

    constructor(lines: string[], sceneId?: string) {
        this.finder = new StoryBlockFinder({
            blockEndType: EndType.NextBlock,
            lines: lines,
            blockStartMatch: BlockStartExpressions.SceneMatch,
            blockName: sceneId
        }); 
    }
    
    /**
     * Returns the next scene. Returns undefined when no more scenes are available.
     */
    public getNext(): SceneStoryBlock | undefined {
        const result = this.finder.getNextBlock();
        if (result) {
            return new SceneStoryBlock(result.lines, result.blockName, result.range);
        }

        return undefined;
    }
}

export class ScenePropertyEnumerator {
  
    private finder: StoryBlockFinder; 

    constructor(lines: string[], range: StoryBlockRange, type?: string) {
        this.finder = new StoryBlockFinder({
            blockEndType: EndType.NextBlock,
            lines: lines,
            range,
            blockName: type,
            blockStartMatch: BlockStartExpressions.ScenePropMatch
        }); 
    }
    
    /**
     * Returns the next scene property. Returns undefined when no more are available.
     */
    public getNext(): ScenePropertyStoryBlock | undefined {

        const result =  this.finder.getNextBlock();

        if (result) {
            return new ScenePropertyStoryBlock(result.lines, result.blockName, result.range);
        }

        return undefined;
    }
}
