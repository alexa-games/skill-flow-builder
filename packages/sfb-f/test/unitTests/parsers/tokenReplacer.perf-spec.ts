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

describe("TokenReplacer Performance", function () {

    // *say this will cause a infinite {loop}
    // *say you are at {location{index}}

    const tokenReplacer = new TokenReplacer(SegmenterBuilder.getVariableSegmenter(), data);


    it("performance test new parser.", function () {
        
        let input = '';
        
        for (let i = 0; i < 1; i++) {
            input += 'More {two} text to {complex.level2.six} data to {two} expand. {\'level1.\'level2.level3.data}, with {missing}. Move to {location{pick{index}}}. '
        }

        const count = 500000;
        const newStartTime = Date.now();

        for (let i = 0; i < count; i++) {
            tokenReplacer.replaceTokens(input, false);
        }
        const newEndTime = Date.now();

        console.log(`New Method Time: ${newEndTime - newStartTime}`)

        const oldStartTime = Date.now();

        for (let i = 0; i < count; i++) {
            substituteSlotValues(input, data, false);
        }
        const oldEndTime = Date.now();
        console.log(`Original Method Time: ${oldEndTime - oldStartTime}`)
    });

    it("common performance test new parser.", function () {
        
        let input = '';
        
        for (let i = 0; i < 1; i++) {
            input += 'This {one} and that {threestr}. '
        }

        const count = 500000;
        const newStartTime = Date.now();

        for (let i = 0; i < count; i++) {
            tokenReplacer.replaceTokens(input, false);
        }
        const newEndTime = Date.now();

        console.log(`New Method Time: ${newEndTime - newStartTime}`)

        const oldStartTime = Date.now();

        for (let i = 0; i < count; i++) {
            substituteSlotValues(input, data, false);
        }
        const oldEndTime = Date.now();
        console.log(`Original Method Time: ${oldEndTime - oldStartTime}`)
    });

    it("long string performance test new parser.", function () {
        
        let input = '';
        
        for (let i = 0; i < 200; i++) {
            input += 'More {two} text to {complex.level2.six} data to {two} expand. {\'level1.\'level2.level3.data}, with {missing}. Move to {location{pick{index}}}. '
        }

        const count = 5000;
        const newStartTime = Date.now();

        for (let i = 0; i < count; i++) {
            tokenReplacer.replaceTokens(input, false);
        }
        const newEndTime = Date.now();

        console.log(`New Method Time: ${newEndTime - newStartTime}`)

        const oldStartTime = Date.now();

        for (let i = 0; i < count; i++) {
            substituteSlotValues(input, data, false);
        }
        const oldEndTime = Date.now();
        console.log(`Original Method Time: ${oldEndTime - oldStartTime}`)
    });
});