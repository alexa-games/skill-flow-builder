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

export interface StoryBlockPoint {
    /**
     * Index into an array of strings where 0 is the first row
     */
    row: number;

    /**
     * Index into a string. The first column is 0 and the last column is the length of the string.
     * Think of the last column as pointing to an invisible CR character.
     */
    column: number;
}

export class StoryBlockRange {
    /**
     * Starting point of the range, including the character at the specified column
     */
    public readonly start: StoryBlockPoint;

    /**
     * Ending point of the range, not including the character at the specified column.
     */
    public readonly end: StoryBlockPoint;

    constructor(startRow: number, startColumn: number, endRow: number, endColumn: number) {
        if (startRow !== 0 && endRow < startRow) {
            throw new Error(`endRow(${endRow}) less than startRow(${startRow})`);
        }

        if (startColumn < 0) {
            throw new Error(`startColumn cannot be less than 0.`);
        }

        if (endColumn < 0) {
            throw new Error(`endColumn cannot be less than 0.`);
        }

        if (startRow === endRow && endColumn < startColumn) {
            throw new Error('endColumn less than startColumn on a single row.')
        }

        this.start = { 
            row: startRow, 
            column: startColumn 
        };
        this.end = { 
            row: endRow, 
            column: endColumn 
        };
    }

    public cropToRange(line: string, row: number): string {
        if (row < this.start.row || row > this.end.row) {
            return '';
        }
    
        if (row === this.start.row && row === this.end.row) {
            return line.substring(this.start.column, this.end.column);
        } else if (row === this.start.row) {
            return line.substring(this.start.column);
        } else if (row === this.end.row) {
            return line.substring(0, this.end.column);
        }
    
        return line;
    }

    public intersectsWith(b: StoryBlockRange): boolean {
        return StoryBlockRange.rangesIntersect(this, b);
    }

    private static rangesIntersect(a: StoryBlockRange, b: StoryBlockRange): boolean {
        if (a.end.row < b.start.row || a.start.row > b.end.row) {
            return false;
        }
    
        if (a.end.row === b.start.row &&
            a.end.column <= b.start.column) {
            return false;
        }
    
        if (b.end.row === a.start.row &&
            b.end.column <= a.start.column) {
            return false;
        }
    
        return true;
    }
}
