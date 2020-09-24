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
import { APLHelper } from '../../handler/APLHelper';
import { VisualOptions } from '@alexa-games/sfb-f';

const CONFIG_FILE = "./src/test/data/abcConfig.json";

describe('APL Helper Test', () => {

    it('Initialization', async () => {

        const config = await ConfigAccessor.loadConfigFile(path.resolve(CONFIG_FILE), "./src/test/data");

        const aplHelper = new APLHelper('en-us', config);

        assert.ok(aplHelper);
    });

    it('Generate Directive from APL Directive', async () => {

        const config = await ConfigAccessor.loadConfigFile(path.resolve(CONFIG_FILE), "./src/test/data");

        const aplHelper = new APLHelper('en-us', config);

        const visualProps : VisualOptions[] = [];

        visualProps.push( { sceneID: "start", 
                            template: "default", 
                            title : "Story Title"});

        const aplTemplate = aplHelper.generateAPLDirectiveWithVisualOptions(visualProps);

        assert.ok(aplTemplate);

        assert.ok(aplTemplate.length > 0);

        assert.equal(aplTemplate[0].type, "Alexa.Presentation.APL.RenderDocument");
    });

});
