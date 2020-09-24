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

import { SegmentType, SegmenterBuilder } from '../../../transformers/segmenter';
import { strict as assert } from 'assert';

// Segmenter is stateless and so can be used globally.
const segmenterAll = SegmenterBuilder.getAllSegmenter();
const segmenterVar = SegmenterBuilder.getVariableSegmenter();

describe("Segmenter", function () {
    it("simple plain text string", function () {
        
        const outputString = "Simple single segment plain text string.";

        const segments = segmenterAll.parse(outputString);

        
        assert.equal(segments.length, 1, 'Should produce a single segment.');
        assert.equal(segments[0].type, SegmentType.PlainText, 'This is a plain text example.');
        assert.equal(segments[0].value, outputString, 'Single segment value should equal original value.');
        assert.equal(segments[0].original, segments[0].value, 'Plain text segment value and original are the same.');
    });

    it("simple {variable} string", function () {
        
        const outputString = "{var}";

        const segments = segmenterAll.parse(outputString);
        
        assert.equal(segments.length, 1, 'Should produce a single segment.');
        assert.equal(segments[0].type, SegmentType.Variable, 'This is a variable example.');
        assert.equal(segments[0].value, 'var', 'Single segment value should not equal original value.');
        assert.equal(segments[0].original, outputString, 'Original should match the whole string.');
    });

    it("simple {error string", function () {
        
        const outputString = "{error";

        const segments = segmenterAll.parse(outputString);
        
        assert.equal(segments.length, 1, 'Should produce a single segment.');
        assert.equal(segments[0].type, SegmentType.Error, 'This is a error example.');
        assert.equal(segments[0].value, outputString, 'Single segment value should equal original value.');
        assert.equal(segments[0].original, outputString, 'Original should match the whole string.');
    });

    it("simple plain text and variable string", function () {
        
        const outputString = "Hi {name}, you should see the look on {otherPerson}'s face.";

        const segments = segmenterAll.parse(outputString);
        
        assert.equal(segments.length, 5, 'Should produce 5 segments.');
        assert.equal(segments[0].type, SegmentType.PlainText, 'This is a plain text example.');
        assert.equal(segments[1].type, SegmentType.Variable, 'This is a variable example.');
        assert.equal(segments[2].type, SegmentType.PlainText, 'This is a plain text example.');
        assert.equal(segments[3].type, SegmentType.Variable, 'This is a variable example.');
        assert.equal(segments[4].type, SegmentType.PlainText, 'This is a plain text example.');

        assert.equal(segments[3].value, 'otherPerson');
        assert.equal(segments[4].value, '\'s face.');

        const reassembled = segments.map((s) => s.original).join('');

        assert.equal(outputString, reassembled, 'String reassembled from original segments should match original string.');
    });
   

    it("Nested bracket types.", function () {
        
        const outputString = "One {<not an element>} but rather [{is a snippet]";

        const segments = segmenterAll.parse(outputString);
        
        assert.equal(segments.length, 4, 'Should produce 4 segments.');
        assert.equal(segments[0].type, SegmentType.PlainText, 'This is a plain text example.');
        assert.equal(segments[1].type, SegmentType.Variable, 'This is a variable example.');
        assert.equal(segments[2].type, SegmentType.PlainText, 'This is a plain text example.');
        assert.equal(segments[3].type, SegmentType.Snippet, 'This is a snippet example.');

        assert.equal(segments[1].value, '<not an element>');
        assert.equal(segments[2].value, ' but rather ');

        const reassembled = segments.map((s) => s.original).join('');

        assert.equal(outputString, reassembled, 'String reassembled from original segments should match original string.');
    });

    it("Mixed with an error.", function () {
        
        const outputString = "I have a compl{ex<type} with an [error because I forgot to close the snippet.";

        const segments = segmenterAll.parse(outputString);
        
        assert.equal(segments.length, 4, 'Should produce 4 segments.');
        assert.equal(segments[0].type, SegmentType.PlainText, 'This is a plain text example.');
        assert.equal(segments[1].type, SegmentType.Variable, 'This is a variable example.');
        assert.equal(segments[2].type, SegmentType.PlainText, 'This is a plain text example.');
        assert.equal(segments[3].type, SegmentType.Error, 'This is a error example.');

        assert.equal(segments[0].value, 'I have a compl');
        assert.equal(segments[1].value, 'ex<type');
        assert.equal(segments[2].value, ' with an ');
        assert.equal(segments[3].value, '[error because I forgot to close the snippet.');

        const reassembled = segments.map((s) => s.original).join('');

        assert.equal(outputString, reassembled, 'String reassembled from original segments should match original string.');
    });

    it("Mixed without plain text.", function () {
        
        const outputString = "{var1}{var2}{var1}[snippet1]<element1>{var4}[snippet2]";

        const segments = segmenterAll.parse(outputString);
        
        assert.equal(segments.length, 7, 'Should produce 7 segments.');
        assert.equal(segments[0].type, SegmentType.Variable, 'This is a variable text example.');
        assert.equal(segments[1].type, SegmentType.Variable, 'This is a variable example.');
        assert.equal(segments[2].type, SegmentType.Variable, 'This is a variable text example.');
        assert.equal(segments[3].type, SegmentType.Snippet, 'This is a snippet example.');
        assert.equal(segments[4].type, SegmentType.Element, 'This is a element example.');
        assert.equal(segments[5].type, SegmentType.Variable, 'This is a variable example.');
        assert.equal(segments[6].type, SegmentType.Snippet, 'This is a snippet example.');

        assert.equal(segments[0].value, 'var1');
        assert.equal(segments[1].value, 'var2');
        assert.equal(segments[2].value, 'var1');
        assert.equal(segments[3].value, 'snippet1');
        assert.equal(segments[4].value, '<element1>');
        assert.equal(segments[5].value, 'var4');
        assert.equal(segments[6].value, 'snippet2');

        const reassembled = segments.map((s) => s.original).join('');

        assert.equal(outputString, reassembled, 'String reassembled from original segments should match original string.');
    });


    it("Mixed but Variable segmenter only.", function () {
        
        const outputString = "{var1}{var2}{var1}[snippet1]<element1>{var4}[snippet2]";

        const segments = segmenterVar.parse(outputString);
        
        assert.equal(segments.length, 6, 'Should produce 6 segments.');
        assert.equal(segments[0].type, SegmentType.Variable, 'This is a variable text example.');
        assert.equal(segments[1].type, SegmentType.Variable, 'This is a variable example.');
        assert.equal(segments[2].type, SegmentType.Variable, 'This is a variable text example.');
        assert.equal(segments[3].type, SegmentType.PlainText, 'This is a snippet example.');
        assert.equal(segments[4].type, SegmentType.Variable, 'This is a variable example.');
        assert.equal(segments[5].type, SegmentType.PlainText, 'This is a snippet example.');

        assert.equal(segments[0].value, 'var1');
        assert.equal(segments[1].value, 'var2');
        assert.equal(segments[2].value, 'var1');
        assert.equal(segments[3].value, '[snippet1]<element1>');
        assert.equal(segments[4].value, 'var4');
        assert.equal(segments[5].value, '[snippet2]');

        const reassembled = segments.map((s) => s.original).join('');

        assert.equal(outputString, reassembled, 'String reassembled from original segments should match original string.');
    });
});