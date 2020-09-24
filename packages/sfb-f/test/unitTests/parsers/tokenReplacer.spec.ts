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

import { TokenReplacer } from '../../../transformers/tokenReplacer';
import { strict as assert } from 'assert';
import { SegmenterBuilder } from '../../../transformers/segmenter';
import { substituteSlotValues } from '../../../transformers/legacy';

// Segmenter is stateless and so can be used globally.

const data = {
    one: 1,
    two: 2,
    threestr: 'its 3rd',
    complex: {
        four: 4,
        five: 5,
        level2: {
            six: 6
        },
        loop: '{complex.loop}'
    },
    level1: {
        level2: {
            level3: {
                data: 'Test value goes here',
                data1: 'More test data.'
            }
        }
    },
    loop: '{loop}',
    location1: 'Ballard',
    location2: 'Seattle',
    index: 2,
    pick1: 2,
    pick2: 1
};

describe("TokenReplacer", function () {

    // *say this will cause a infinite {loop}
    // *say you are at {location{index}}

    const tokenReplacer = new TokenReplacer(SegmenterBuilder.getVariableSegmenter(), data);

    it("simple example", function () {
        
        const input = "Should get {one} here.";
        const output = tokenReplacer.replaceTokens(input, true);
        const orig = substituteSlotValues(input, data, true);

        assert.equal(output, 'Should get 1 here.');
        assert.equal(output, orig.value, 'New method outputs same as original');
    });

    it("multiple variable example, is condition false", function () {
        
        const input = "This {threestr} sentence has {one} and {two} values to replace.";
        const output = tokenReplacer.replaceTokens(input, false);
        const orig = substituteSlotValues(input, data, false);
        
        assert.equal(output, 'This its 3rd sentence has 1 and 2 values to replace.');
        assert.equal(output, orig.value, 'New method outputs same as original');
    });

    it("multiple variable complex type", function () {
        
        const input = "Delving {complex.four} gives {complex.level2.six}";
        const output = tokenReplacer.replaceTokens(input, false);
        const orig = substituteSlotValues(input, data, false);
        
        assert.equal(output, 'Delving 4 gives 6');
        assert.equal(output, orig.value, 'New method outputs same as original');
    });

    it("variable path part one is quoted, second is wrongly quoted", function () {
        
        const input = "Delving {'complex'.four} gives {complex.'level2'.six}";
        const output = tokenReplacer.replaceTokens(input, false);
        const orig = substituteSlotValues(input, data, false);
        
        assert.equal(output, 'Delving 4 gives 6');
        assert.equal(output, orig.value, 'New method outputs same as original');
    });

    it("missing second part of a complex property.", function () {
        
        const input = "{complex.notHere}";
        const output = tokenReplacer.replaceTokens(input, false);
        const orig = substituteSlotValues(input, data, false);
        
        assert.equal(output, 'undefined');
        assert.equal(output, orig.value, 'New method outputs same as original');
    });

    it("missing first part of a complex property.", function () {
        
        const input = "{notHere.complex}";
        const output = tokenReplacer.replaceTokens(input, false);
        const orig = substituteSlotValues(input, data, false);
        
        assert.equal(output, 'false');
        assert.equal(output, orig.value, 'New method outputs same as original');
    });

    it("missing simple property.", function () {
        
        const input = "{notHere}";
        const output = tokenReplacer.replaceTokens(input, false);
        const orig = substituteSlotValues(input, data, false);
        
        assert.equal(output, 'false');
        assert.equal(output, orig.value, 'New method outputs same as original');
    });

    it("incomplete path for complex property.", function () {
        
        const input = "Incomplete: {complex.level2} Complete: {complex.level2.six}";
        const output = tokenReplacer.replaceTokens(input, false);
        const orig = substituteSlotValues(input, data, false);
        
        assert.equal(output, 'Incomplete: [object Object] Complete: 6');
        assert.equal(output, orig.value, 'New method outputs same as original');
    });

    it("two pass value {location{index}}.", function () {
        
        const input = "You are at {location{index}}.";
        const output = tokenReplacer.replaceTokens(input, false);
        const orig = substituteSlotValues(input, data, false);

        assert.equal(output, 'You are at Seattle.');
        assert.equal(output, orig.value, 'New method outputs same as original');
    });

    it("three pass value {location{pick{index}}.", function () {
        
        const input = "You are at {location{pick{index}}}.";
        const output = tokenReplacer.replaceTokens(input, false);
        const orig = substituteSlotValues(input, data, false);

        assert.equal(output, 'You are at Ballard.');
        assert.equal(output, orig.value, 'New method outputs same as original');
    });

    it("Infinite loop test.", function () {
        // console.log('Starting loop test');
        
        const input = "Will this ever stop {loop}ing.";
        const output = tokenReplacer.replaceTokens(input, false);

        // The answer is 'no' for the substituteSlotValues function
        //const orig = substituteSlotValues(input, data, false);

        //console.log(`output=${output} orig=${orig.value}`);
        
        assert.equal(output, 'Will this ever stop {loop}ing.');
        //assert.equal(output, orig.value, 'New method outputs same as original');
    });

});