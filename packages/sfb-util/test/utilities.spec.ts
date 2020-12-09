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
    readUtf8FileExcludingBom,
    readUtf8FileExcludingBomSync,
    sanitizeCommandLineParameter
} from '../utilities';
import { strict as assert } from 'assert';

describe('utilities', () => {

    const ExpectedOutput = 'this is a test';
    const TestReadUtf8FileWithoutBomPath = 'test/testFiles/testReadUtf8FileWithoutBom.txt';
    const TestReadUtf8FileWithBomPath = 'test/testFiles/testReadUtf8FileWithBom.txt';

    it('readUtf8FileExcludingBomSync without bom', () => {
        const output = readUtf8FileExcludingBomSync(TestReadUtf8FileWithoutBomPath);

        assert.equal(output, ExpectedOutput);
    });

    it('readUtf8FileExcludingBomSync with bom', () => {
        const output = readUtf8FileExcludingBomSync(TestReadUtf8FileWithBomPath);

        assert.equal(output, ExpectedOutput);
    });

    it('readUtf8FileExcludingBom without bom', async () => {
        const output = await readUtf8FileExcludingBom(TestReadUtf8FileWithoutBomPath);

        assert.equal(output, ExpectedOutput);
    });

    it('readUtf8FileExcludingBom with bom', async () => {
        const output = await readUtf8FileExcludingBom(TestReadUtf8FileWithBomPath);

        assert.equal(output, ExpectedOutput);
    });

    describe('sanitizeCommandLineParameter', () => {
        it('removes double quotes', () => {
            const actual = sanitizeCommandLineParameter('fake" && rm -rf / && echo "');

            assert.equal(actual, 'fake && rm -rf / && echo ');
        });

        it('removes single quotes', () => {
            const actual = sanitizeCommandLineParameter("fake' && rm -rf / && echo '");

            assert.equal(actual, 'fake && rm -rf / && echo ');
        });

        it('removes line breaks', () => {
            const actual = sanitizeCommandLineParameter('fake\\\r\n" && rm -rf / && echo "');

            assert.equal(actual, 'fake && rm -rf / && echo ');
        });

        it('removes environment variable syntax', () => {
            const actual = sanitizeCommandLineParameter('fake" && echo ${MY_SECRET_CREDENTIALS} "');

            assert.equal(actual, 'fake && echo MY_SECRET_CREDENTIALS ');
        });
    });
});
