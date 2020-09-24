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
import { StoryBlock, SceneStoryBlock } from './storyBlock';

export class StoryFeatureFinder {
    // Looks for -> scene or <-> scene style references on a line
    private static readonly ReferenceNotationMatch = /^\s*<?->\s+(.*)\s*$/;

    // Looks for { } or spaces on a line. Other characters result in no-match
    private static readonly BracesOrSpaces = /^[\s\{\}]*$/;


    constructor(private lines: string[]) {
    }

    /**
     * Finds the range of the given scene. Returns undefined if the scene is not present.
     * @param sceneId ID of the scene to find.
     */
    public findScene(sceneId: string): SceneStoryBlock | undefined {
        sceneId = sceneId.trim();

        const sceneFinder = new StoryBlockFinder({
            blockEndType: EndType.NextBlock,
            blockName: sceneId,
            lines: this.lines,
            blockStartMatch: BlockStartExpressions.SceneMatch
        });
        
        const result = sceneFinder.getNextBlock();
        if (result) {
            return new SceneStoryBlock(result.lines, result.blockName, result.range);
        }

        return undefined;
    }

    /**
     * Returns Ranges containing references to the specified scene. 
     * @param sceneId Scene ID to find references to.
     */
    public getReferences(sceneId: string): StoryBlockRange[] {
        sceneId = sceneId.trim();

        const result: StoryBlockRange[] = [];

        const sceneFinder = new StoryBlockFinder({
            blockEndType: EndType.NextBlock,
            lines: this.lines,
            blockStartMatch: BlockStartExpressions.SceneMatch
        });

        let sceneBlock = sceneFinder.getNextBlock();
        while (sceneBlock) {
            const thenFinder = new StoryBlockFinder({
                blockEndType: EndType.NextBlock,
                blockName: 'then',
                lines: this.lines,
                range: sceneBlock.range,
                blockStartMatch: BlockStartExpressions.ScenePropMatch            
            });
    
            let thenBlock = thenFinder.getNextBlock();
            while (thenBlock) {
                const refFinder = new StoryBlockFinder({
                    blockEndType: EndType.OneLine,
                    range: thenBlock.range,
                    lines: this.lines,
                    blockStartMatch: StoryFeatureFinder.ReferenceNotationMatch,
                    blockName: sceneId            
                });

                let reference = refFinder.getNextBlock();
                while (reference) {
                    result.push(reference.range);
                    reference = refFinder.getNextBlock();
                }

                if (result.length > 0) {
                    this.expandToSimpleHearBlocks(result, thenBlock.range);
                }
    
                thenBlock = thenFinder.getNextBlock();
            }

            sceneBlock = sceneFinder.getNextBlock();
        }

        return result;
    }

    /**
     * Return range of the given property type or undefined if it is not found.
     * @param sceneBlock Range to include in the quest for the scene property.
     * @param propertyType Values like 'say', 'then', etc.
     */
    public getScenePropertyByType(sceneBlock: StoryBlockRange, propertyType: string): StoryBlock | undefined {
        const blockFinder = new StoryBlockFinder({
            blockEndType: EndType.NextBlock,
            blockName: propertyType,
            lines: this.lines,
            range: sceneBlock,
            blockStartMatch: BlockStartExpressions.ScenePropMatch            
        });

        return blockFinder.getNextBlock();
    }

    /**
     * Find simple hear blocks (blocks with nothing else but a single reference) and replaces the reference to the
     * entire hear block.
     * @param result List of references to expand
     * @param thenBlock Range to scan
     */
    private expandToSimpleHearBlocks(result: StoryBlockRange[], thenBlock: StoryBlockRange): void {
        
        const hearFinder = new StoryBlockFinder({
            blockEndType: EndType.BraceMatch,
            range: thenBlock,
            lines: this.lines,
            blockStartMatch: BlockStartExpressions.HearMatch            
        });

        let index = 0;

        let hearBlock = hearFinder.getNextBlock();
        while (index < result.length && hearBlock) {
            while (index < result.length &&
                result[index].end.row < hearBlock.range.start.row) {
                // Skip past results that precede the current hear block.
                index++;
            }

            if (index < result.length && 
                result[index].intersectsWith(hearBlock.range)) {
                // Is hear block simple? use it!
                if (this.isBlockSimple(hearBlock.range, result[index])) {
                    result[index] = hearBlock.range;
                }
                index++;
            }

            hearBlock = hearFinder.getNextBlock();
        }
    }

    // A simple block has only spaces or braces on lines that are outside of the ignore range.
    // The first line may have any characters.  For example:
    //     hear foo 
    //     {
    //         -> test (ignored)
    //
    //     }
    private isBlockSimple(block: StoryBlockRange, ignore: StoryBlockRange): boolean {
        for (let i = block.start.row + 1; i <= block.end.row; i++) {
            let line = block.cropToRange(this.lines[i], i);

            if (i === ignore.start.row && i < ignore.end.row) {
                continue;
            }

            if (!StoryFeatureFinder.BracesOrSpaces.test(line)) {
                return false;
            }
        }

        return true;
    }
}