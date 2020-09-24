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

import {SFBImporter} from '../../importer/importer';
import {VoiceModel} from './../../bakeUtilities/languageModel';

import { strict as assert } from 'assert';

import * as fs from 'fs';
import * as path from 'path';

const DEFAULT_IMPORT_PLUGIN_NAME: string = "default";
const TEST_STORY_TITLE: string = "Test Story";
const TEST_STORY_ID: string = "test-id";

const TEST_BUILT_IN_COUNT: number = 23;

describe("Scene Transition Baseline", function () {
    let thinImporter: SFBImporter;

    before(async function () {
        console.log("Reset SFBImporter...");
        thinImporter = new SFBImporter([], undefined, []);
    });

    it("Import - split utterances into two groups", async function() {
        const testFileName: string = "utterance-splitting.abc";
        const importResult = await thinImporter.importABCStory(DEFAULT_IMPORT_PLUGIN_NAME, "", TEST_STORY_TITLE, TEST_STORY_ID, true, {
            contents: [
                {
                    id: testFileName,
                    text: fs.readFileSync(getTestResourcePath(testFileName), "utf8")
                }
            ]
        });

        const model = <VoiceModel>importResult.alexaVoiceModel;

        assert.equal(model.languageModel.intents.length - TEST_BUILT_IN_COUNT, 2, "Unexpected number of intents for given test.");
    });

    it("Import - build up intent for addional utterance", async function() {
        const testFileName: string = "intent-build-up.abc";
        const importResult = await thinImporter.importABCStory(DEFAULT_IMPORT_PLUGIN_NAME, "", TEST_STORY_TITLE, TEST_STORY_ID, true, {
            contents: [
                {
                    id: testFileName,
                    text: fs.readFileSync(getTestResourcePath(testFileName), "utf8")
                }
            ]
        });

        const model = <VoiceModel>importResult.alexaVoiceModel;

        assert.equal(model.languageModel.intents.length - TEST_BUILT_IN_COUNT, 1, "Unexpected number of intents for given test.");
    });

    it("Import - normal intent splitting per choice", async function() {
        const testFileName: string = "normal-intent-split-per-choice.abc";
        const importResult = await thinImporter.importABCStory(DEFAULT_IMPORT_PLUGIN_NAME, "", TEST_STORY_TITLE, TEST_STORY_ID, true, {
            contents: [
                {
                    id: testFileName,
                    text: fs.readFileSync(getTestResourcePath(testFileName), "utf8")
                }
            ]
        });

        const model = <VoiceModel>importResult.alexaVoiceModel;

        assert.equal(model.languageModel.intents.length - TEST_BUILT_IN_COUNT, 3, "Unexpected number of intents for given test.");
    });
});

function getTestResourcePath(testResourceName: string) {
    return path.resolve(__dirname, 
        "..", // ./dist/test
        "..", // ./dist,
        "..", // ./
        "test", // ./test
        "integrationTests", // ./test/integrationTests
        "testResources", // ./test/integrationTests/testResources
        testResourceName);
}