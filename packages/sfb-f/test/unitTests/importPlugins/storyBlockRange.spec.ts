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

import { StoryBlockRange } from '../../../importPlugins/storyBlockRange';
import { strict as assert } from 'assert';

describe("StoryBlockRange", function () {
    it("constructor - good", () => {
        const range = new StoryBlockRange(1, 2, 3, 4);

        assert.equal(range.start.row, 1, 'start row set');
        assert.equal(range.start.column, 2, 'start column set');
        assert.equal(range.end.row, 3, 'end row set');
        assert.equal(range.end.column, 4, 'end column set');
    });

    it("constructor - endRow less than startRow", () => {
        try {
            new StoryBlockRange(10, 2, 3, 4);
            assert.ok(false, 'Should not reach here.')
        } catch (e) {
            assert.ok(e.message.indexOf('less than startRow') >= 0, 'endRow smaller than start row.');
        }
    });

    it("constructor - endColumn less than startColumn on same row", () => {
        try {
            new StoryBlockRange(10, 20, 10, 4);
            assert.ok(false, 'Should not reach here.')
        } catch (e) {
            assert.ok(e.message.indexOf('less than startColumn') >= 0, 'endRow smaller than start row.');
        }
    });

    it("intersectsWith - no intersection - before", () => {
        const range1 = new StoryBlockRange(10, 0, 15, 0);
        const range2 = new StoryBlockRange(1, 0, 5, 0);

        const result = range1.intersectsWith(range2);

        assert.equal(result, false, 'Should not intersect');
    });

    it("intersectsWith - no intersection - after", () => {
        const range1 = new StoryBlockRange(10, 0, 15, 0);
        const range2 = new StoryBlockRange(20, 0, 65, 45);

        const result = range1.intersectsWith(range2);

        assert.equal(result, false, 'Should not intersect');
    });

    it("intersectsWith - intersects self", () => {
        const range1 = new StoryBlockRange(10, 0, 15, 0);

        const result = range1.intersectsWith(range1);

        assert.equal(result, true, 'Should intersect');
    });

    it("intersectsWith - whole intersection", () => {
        const range1 = new StoryBlockRange(10, 0, 55, 0);
        const range2 = new StoryBlockRange(20, 0, 40, 45);

        const result1 = range1.intersectsWith(range2);

        assert.equal(result1, true, 'Should intersect');

        const result2 = range2.intersectsWith(range1);

        assert.equal(result2, true, 'Should intersect');
    });

    it("intersectsWith - start share row but don't intersect", () => {
        const range1 = new StoryBlockRange(10, 15, 55, 16);
        const range2 = new StoryBlockRange(5, 0, 10, 5);

        const result1 = range1.intersectsWith(range2);

        assert.equal(result1, false, 'Should not intersect');

        const result2 = range2.intersectsWith(range1);

        assert.equal(result2, false, 'Should not intersect');
    });

    it("intersectsWith - start share row and touch but don't intersect", () => {
        const range1 = new StoryBlockRange(10, 15, 55, 16);
        const range2 = new StoryBlockRange(5, 0, 10, 15);

        const result1 = range1.intersectsWith(range2);

        assert.equal(result1, false, 'Should not intersect');

        const result2 = range2.intersectsWith(range1);

        assert.equal(result2, false, 'Should not intersect');
    });

    it("intersectsWith - start share row and columns intersect", () => {
        const range1 = new StoryBlockRange(10, 15, 55, 16);
        const range2 = new StoryBlockRange(5, 0, 10, 16);

        const result1 = range1.intersectsWith(range2);

        assert.equal(result1, true, 'Should intersect');

        const result2 = range2.intersectsWith(range1);

        assert.equal(result2, true, 'Should intersect');
    });

    it("cropToRange large range", () => {
        const line = '01234567890123456789012345678901234567890123456789'

        const range = new StoryBlockRange(10, 15, 55, 16);

        const beforeLine = range.cropToRange(line, 0);
        assert.equal(beforeLine, '', 'Should be empty.')

        const afterLine = range.cropToRange(line, 100);
        assert.equal(afterLine, '', 'Should be empty.')
        
        const middleLine = range.cropToRange(line, 20);
        assert.equal(middleLine, line, 'Should be whole line.');

        const firstLine = range.cropToRange(line, 10);
        assert.equal(firstLine, '56789012345678901234567890123456789', 'Match rest of the line.')

        const lastLine = range.cropToRange(line, 55);
        assert.equal(lastLine, '0123456789012345', 'Match start of the line.')
        
    });

    it("cropToRange 0 range", () => {
        const line = '01234567890123456789012345678901234567890123456789'

        const range = new StoryBlockRange(55, 45, 55, 45);
       
        const firstLine = range.cropToRange(line, 55);
        assert.equal(firstLine, '', 'Start / end column are same, should be empty.')
    });

    it("cropToRange one line range", () => {
        const line = 'abcdefghijklmnopqrstuvwxyz';

        const range = new StoryBlockRange(55, 20, 55, 22);
      
        const firstLine = range.cropToRange(line, 55);
        assert.equal(firstLine, 'uv', 'Small slice on line 55')
    });
});
