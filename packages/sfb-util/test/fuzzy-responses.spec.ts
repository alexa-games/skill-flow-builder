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

import { pickBestResponse } from '../fuzzy-responses';
import { strict as assert } from 'assert';

describe('fuzzy-responses', () => {

    it('pickBestResponse test', () => {

        const resp = pickBestResponse("who", ["who", "what", "why", "when", "how"]);

        assert.ok(resp);

        if(resp) {
            assert.equal(resp.index, 0);
            assert.equal(resp.response, "who");
        }
    });

});
