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

import { Segmenter, SegmentType } from './segmenter';

export class TokenReplacer {

    constructor(
        private readonly segmenter: Segmenter,
        private readonly data: any) {
    }

    /**
     * Replaces tokens in the supplied line with values from class instance data structure.
     * @param line Line to substitute special segments.
     * @param isCondition True will cause non-numbers for single part tokens to be returned quoted.
     */
    public replaceTokens(line: string, isCondition : boolean = true, depth: number = 0): string {

        let result = '';

        const resolveCache: { [key: string]: string } = {};

        const segments = this.segmenter.parse(line);

        for (let segment of segments) {
            switch (segment.type) {
                case SegmentType.PlainText:
                case SegmentType.Error:
                case SegmentType.Snippet:
                    result += segment.original;
                    break
                case SegmentType.Variable:

                    result += this.resolveVariable(resolveCache, segment.value, isCondition, depth);
                    break;
            }
        }

        return result.toString();
    }

    private resolveVariable(resolveCache: { [key: string]: string }, key: string, isCondition: boolean, depth: number) {
        let value = resolveCache[key];
        if (value) {
            return value;
        }

        value = this.resolveVariableBase(key, isCondition, depth);
        resolveCache[key] = value;

        return value;
    }

    private resolveVariableBase(key: string, isCondition: boolean, depth: number): string {
        // Remove single quotes from throughout the key.
        key = key.replace(/'/g, '');

        if (depth < 10 && key.indexOf('{') >= 0) {
            key = this.replaceTokens(key, false, depth + 1);
        }

        const splitKey = key.split('.');

        let value = this.data;
        for (let i = 0; i < splitKey.length; i++) {
            value = value[splitKey[i]];

            if (value === undefined) {
                if (i === 0) {
                    // Current convention maps undefined single-token and first token
                    // variables values to 'false'.
                    value = false;
                }
                break;
            }
        }

        if (splitKey.length === 1 && isCondition && value && isNaN(value)) {
            // If our single-token variable value is not a number, and is a condition, then
            // return it in single quotes. Inline code (in the story file) cannot create
            // complex data types, so not treating dotted notation specially when used in 
            // a condition since that is by definition inline
            value = `'${value.replace(/'/g, "\\'")}'`;
        }

        if (value === undefined || value === null) {
            return 'undefined';
        }
   
        return value.toString();
    }  
}