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

import * as path from 'path';
import { strict as assert } from 'assert';

import { ConfigAccessor } from '../../configAccessor';
import { AlexaAPLExtension } from '../../sfbExtension/alexaAPLExtension';

const CONFIG_FILE = "./src/test/data/abcConfig.json";

describe('Alexa APL Extension Test', () => {

    it('Initialization', async () => {

        const config = await ConfigAccessor.loadConfigFile(path.resolve(CONFIG_FILE), "./src/test/data");

        const alexaAPLExtension = new AlexaAPLExtension('en-us', config);

        assert.ok(alexaAPLExtension);
    });

});
