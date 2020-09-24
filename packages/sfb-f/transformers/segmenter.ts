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



export enum SegmentType {
    /**
     * Stuff in between other types of segments
     */
    PlainText,

    /**
     * Replaced with the value of a variable
     */
    Variable,

    /**
     * Replaced with the value of a snippet
     */
    Snippet,

    /**
     * An SSML/XML style element 
     */
    Element,

    /**
     * Segment has a open bracket, but no closing bracket.
     */
    Error
}

export interface Segment {
    /**
     * Value of the segment. 
     */
    value: string;

    /**
     * Segment type
     */
    type: SegmentType;

    /**
     * Original segment value. This will be the same as value for plain text and Element, but will include brackets
     * for Variable and Snippet.
     */
    original: string;
}

export interface SegmenterConfig {
    /**
     * Bracket pair that define a segment. For example: {}, or [], or <>
     */
    brackets: string;

    /**
     * Type of segment defined by the specified bracket pair
     */
    type: SegmentType;

    /**
     * Whether to keep the brackets on the resulting value. True will preserve the
     * brackets, false will remove them.
     */
    preserve: boolean;
}

export class Segmenter {

    private readonly openBrackets: string;
    private readonly closeBrackets: string;

    constructor(private readonly config: SegmenterConfig[]) {
        this.openBrackets = config.map((c) => c.brackets[0]).join('');
        this.closeBrackets = config.map((c) => c.brackets[1]).join('');
    }

    /**
     * Returns an array of segments categorized by type.
     * @param value String to segment
     */
    public parse(value: string): Segment[] {
        const result: Segment[] = [];
    
        if (!value) {
            return result; 
        }
    
        let currType = SegmentType.PlainText;
        let currBracket = '';
        let start = 0;
    
        let bracketCount = 0;

        for (let i = 0; i < value.length; i++) {
            let ch = value[i];
            if (bracketCount > 0) {
                // Check for close bracket and check that it pairs up with the open bracket found earlier
                const closeBracketIndex = this.closeBrackets.indexOf(ch);
                if (closeBracketIndex >= 0 && currBracket === this.openBrackets[closeBracketIndex]) {
                    bracketCount--;
                    if (bracketCount === 0) {
                        result.push(this.makeSegment(value, start, i + 1, currType));
                        start = i + 1;
                        currBracket = '';

                        // Switch back to plain text.
                        currType = SegmentType.PlainText;
                    }
                } else if (currBracket === ch) {
                    bracketCount++;
                }
            } else {
                const newType = this.getSegmentTypeFromCharacter(ch);
                if (newType !== SegmentType.PlainText) {
                    // Found open bracket, note it down.
                    currBracket = ch;
                    bracketCount++;

                    if (start < i) {
                        result.push(this.makeSegment(value, start, i, currType));
                        start = i;
                    }

                    currType = newType;
                }
            } 
        }
    
        if (start < value.length) {
            // Anything left at the end of the string is recorded as and error since a close
            // bracket must be missing.
            if (currType !== SegmentType.PlainText) {
                currType = SegmentType.Error;
            }

            result.push(this.makeSegment(value, start, value.length, currType));
        }

        return result;
    }

    private getSegmentTypeFromCharacter(ch: string): SegmentType {
        const index = this.openBrackets.indexOf(ch);
        if (index < 0) {
            return SegmentType.PlainText;
        }
        return this.config[index].type;
    }

    private makeSegment(wholeString: string, start: number, end: number, type: SegmentType): Segment {
        const original = wholeString.substring(start, end);
        let value = original;

        const seg = this.config.find((c) => { return c.type === type });

        if (seg && !seg.preserve) {
            // Trim the brackets
            if (original.length >= 2) {
                value = original.substring(1, original.length - 1);
            }
        }

        return {
            type,
            value,
            original
        }
    }
}

export class SegmenterBuilder {
    public static getVariableSegmenter() {
        return new Segmenter([
            {
                brackets: '{}',
                preserve: false,
                type: SegmentType.Variable
            }
        ]);
    }

    public static getAllSegmenter() {
        return new Segmenter([
            {
                brackets: '{}',
                preserve: false,
                type: SegmentType.Variable
            },
            {
                brackets: '[]',
                preserve: false,
                type: SegmentType.Snippet
            },
            {
                brackets: '<>',
                preserve: true,
                type: SegmentType.Element
            }
        ]);
    }
}