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
import { StoryBlock } from './storyBlock';

export class BlockStartExpressions {
     // Matches lines whose first non-whitespace character is a @
     public static readonly SceneMatch = /^\s*@\s*(.*)$/;

     // Match lines whose first non-whitespace character is a *
     public static readonly ScenePropMatch = /^\s*\*\s*(.*)$/;
 
     // Match lines that start with a 'hear' statement.
     public static readonly HearMatch = /^\s*hear\s+(.*)\s*$/i;
}


export enum EndType {
    /**
     * Current block ends when next block is found, or end of the range is found.
     */
    NextBlock,

    /**
     * Current block ends when a final closing brace is found.
     */
    BraceMatch,

    /**
     * Block is always one line long
     */
    OneLine
}

export interface StoryBlockFinderParameters {
    /**
     * Array of strings that represent the story to be searched
     */
    lines: string[];

    /**
     * Range within the provided lines to be searched.
     */
    range?: StoryBlockRange;

    /**
     * Regular expression that will match when a line is the start of a block
     */
    blockStartMatch: RegExp;

    /**
     * Indicates what marks the end of a block. 
     */
    blockEndType: EndType;
    
    /**
     * If this property is specified, then block is considered a 
     * match if group 1 of the blockStartMatch expression matches this string.
     */
    blockName?: string;
}

/**
 * Class that finds a block of code that starts with the supplied regex and ends with a specified method.
 */
export class StoryBlockFinder {

    private currentRow = -1;

    private readonly lines: string[];
    private readonly range: StoryBlockRange;
    private readonly blockStartMatch: RegExp;
    private readonly blockEndType: EndType;
    private readonly blockName?: string;

    constructor(props: StoryBlockFinderParameters) {
        this.lines = props.lines;
        this.blockEndType = props.blockEndType;
        this.blockStartMatch = props.blockStartMatch;
        this.blockName = props.blockName;

        if (!props.range) {
            const endColumn = this.lines.length === 0 ? 0 : this.lines[this.lines.length - 1].length;
            this.range = new StoryBlockRange(0, 0, this.lines.length - 1, endColumn);
        } else {
            this.range = props.range;
        }

        if (this.range.start.row < 0 || this.range.end.row >= this.lines.length) {
            throw new Error('range property outside of provided line array.')
        }
    }

    public getNextBlock(): StoryBlock | undefined {
        if (this.currentRow >= this.lines.length) {
            return undefined;
        }

        if (this.currentRow < 0) {
            this.currentRow = this.range!.start.row;
        }

        let result: StoryBlockRange | undefined = undefined;

        let braces = { balance: 0, count: 0 };
        let startRow = -1;
        let blockName = '';
        
        while (!result && this.currentRow <= this.range!.end.row) {
            const line = this.range.cropToRange(this.lines[this.currentRow], this.currentRow);

            if (startRow < 0) {
                const match = line.match(this.blockStartMatch);
                if (this.positiveMatch(match)) {
                    startRow = this.currentRow;

                    if (match!.length > 1) {
                        blockName = match![1].trim();
                    }

                    if (this.blockEndType === EndType.BraceMatch) {
                        braces = { balance: 0, count: 0 };
                        this.countBraces(line, braces);
                    } else if (this.blockEndType === EndType.OneLine) {
                        result = this.makeWholeLineRange(startRow, startRow);
                    }
                }
            } else {
                switch (this.blockEndType) {
                    case EndType.BraceMatch: 
                        this.countBraces(line, braces);
                        if (braces.count > 0 && braces.balance === 0) {
                            result = this.makeWholeLineRange(startRow, this.currentRow);
                        }
                        break;
                    case EndType.NextBlock:
                        const match = line.match(this.blockStartMatch);
                        if (match) {
                            this.currentRow--;
                            result = this.makeWholeLineRange(startRow, this.currentRow);
                        }
                        break;
                }
            }

            this.currentRow++;
        }

        if (!result && startRow >= 0 && this.blockEndType === EndType.NextBlock) {
            // End of range marks the end of current block when using NextBlock end type.
            result = this.makeWholeLineRange(startRow, this.currentRow - 1);
        }

        if (result) {
            return new StoryBlock(this.lines, blockName, result);
        }
        
        return undefined;
    }

    private positiveMatch(match: RegExpMatchArray | null): boolean {
        if (!match) { 
            return false;
        }

        if (match.length > 1 && !!this.blockName) {
            return this.blockName === match[1].trim();
        }

        return true;
    }

    private countBraces(line: string, value: { balance: number, count: number }): void  {
        
        let prev = ' ';
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '/' && prev === '/') {
                // break on comment
                break;
            }
            else if (ch === '{') {
                value.balance++;
                value.count++;
            } else if (ch === '}') {
                value.balance--;
                value.count++;
            }

            prev = line[i];
        }
    }

    /**
     * Returns a range that includes the whole block ending on column 0 of the next line.
     * If the last row is the same as the last line, then the range ends on the last column
     * of the last line.
     * @param startRow First row of the block
     * @param endRow Last row of the block
     */
    private makeWholeLineRange(startRow: number, endRow: number): StoryBlockRange {
        let endColumn = 0;
        if (endRow >= 0) {
            if (endRow + 1 <= this.range.end.row) {
                endRow++;
            } else {
                endRow = this.range.end.row;
                endColumn = this.range.end.column;
            }
        }

        return new StoryBlockRange(startRow, 0, endRow, endColumn);
    }
}