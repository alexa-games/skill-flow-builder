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

import {LanguageModelBuilder, LanguageModelIntent, LanguageModelValue, LanguageModelSlot} from './../../../bakeUtilities/languageModel';

import { strict as assert } from 'assert';

const TEST_INVOCATION = "test";

describe("Voice Model Builder Test", function () {
    it("Add Intent.", async function () {
        const builder = new LanguageModelBuilder(TEST_INVOCATION);
        const addingIntent: LanguageModelIntent = {
            name: "TestIntent",
            samples: ["utterance1", "utterance2"]
        }
        builder.addIntent(addingIntent);
        const result = builder.build();

        assert.equal(result.languageModel.intents.length, 1, "Number of intents in the model does not match the expected number.");
        assert.equal(result.languageModel.intents[0].name, addingIntent.name, "Content of the intent added does not match the expected value.");
        assert.ok(addingIntent.samples);
        if (addingIntent.samples && result.languageModel.intents[0].samples) {
            assert.equal(result.languageModel.intents[0].samples.length, addingIntent.samples.length, "Content of the intent added does not match the expected value.");
        }
    });

    it("Add Overlapping Intent.", async function () {
        const builder = new LanguageModelBuilder(TEST_INVOCATION);
        const testIntent: LanguageModelIntent = {
            name: "TestIntent",
            samples: ["utterance1", "utterance2"]
        }

        const overlappingIntent: LanguageModelIntent = {
            name: "TestIntent",
            samples: ["utterance2", "utterance3"]
        }

        const otherIntent: LanguageModelIntent = {
            name: "TestIntent2",
            samples: ["utterance1", "utterance2"]
        }
        builder.addIntent(testIntent);
        builder.addIntent(otherIntent);
        builder.addIntent(overlappingIntent);

        const result = builder.build();

        assert.equal(result.languageModel.intents.length, 2, "Number of intents in the model does not match the expected number.");

        let target: LanguageModelIntent | undefined = undefined;
        for (let intent of result.languageModel.intents) {
            if (intent.name === overlappingIntent.name) {
                target = intent;
                break;
            }
        }

        if (target && target.samples) {
            assert.equal(target.samples.length, 2);
        } else {
            assert.fail("Expected Intent was not found in the result.");
        }
    });

    it("Add Slot Type.", async function () {
        const testSlotType = "TestSlot";
        const testSlotValues = ["value1", "value2"];

        const builder = new LanguageModelBuilder(TEST_INVOCATION);

        builder.addSlotValues(testSlotType, testSlotValues);
        
        const result = builder.build();

        assert.ok(result.languageModel.types);
        if (result.languageModel.types) {
            assert.equal(result.languageModel.types[0].name, testSlotType);
            assert.equal(result.languageModel.types[0].values.length, testSlotValues.length);
        } else {
            assert.fail("Expected slot types does not exist in the model.");
        }
    });

    it("Add Slot Values To Existing Slot Type.", async function () {
        const testSlotType = "TestSlot";
        const testSlotValues = ["value1", "value2"];
        
        const builder = new LanguageModelBuilder(TEST_INVOCATION);
        builder.addSlotType({
            name: testSlotType,
            values: []
        });

        builder.addSlotValues(testSlotType, testSlotValues);
        
        const result = builder.build();

        assert.ok(result.languageModel.types);
        if (result.languageModel.types) {
            assert.equal(result.languageModel.types[0].name, testSlotType);
            assert.equal(result.languageModel.types[0].values.length, testSlotValues.length);
        } else {
            assert.fail("Expected slot types does not exist in the model.");
        }
    });

    it("Replace Existing Slot Type.", async function () {
        const testSlotType = "TestSlot";
        const testSlotValues: LanguageModelValue[] = [
            {
                name: {
                    value: "value1"
                }
            },
            {
                name: {
                    value: "value2"
                }
            }
        ];
        
        const builder = new LanguageModelBuilder(TEST_INVOCATION);
        builder.addSlotType({
            name: testSlotType,
            values: []
        });

        builder.addSlotType({
            name: testSlotType,
            values: testSlotValues
        });
        
        const result = builder.build();

        assert.ok(result.languageModel.types);
        if (result.languageModel.types) {
            assert.equal(result.languageModel.types[0].name, testSlotType);
            assert.equal(result.languageModel.types[0].values.length, testSlotValues.length);
        } else {
            assert.fail("Expected slot types does not exist in the model.");
        }
    });

    it("Add Slot Sample to Intent As First Entry.", async function () {
        const testIntentName = "TestIntent";
        const utterances = ["value {one}", "value {two}"];
        const slots: LanguageModelSlot[] = [
            {
                name: "one",
                type: "SlotType1"
            },
            {
                name: "two",
                type: "SlotType2"
            }
        ];
        
        const builder = new LanguageModelBuilder(TEST_INVOCATION);
        builder.addSlotSamplesToIntent(testIntentName, utterances, slots);
        const result = builder.build();


        assert.equal(result.languageModel.intents.length, 1);
        assert.equal(result.languageModel.intents[0].name, testIntentName);
        if (result.languageModel.intents[0].slots) {
            assert.equal(result.languageModel.intents[0].slots.length, slots.length);
        } else {
            assert.fail();
        }

        if (result.languageModel.intents[0].samples) {
            assert.equal(result.languageModel.intents[0].samples.length, utterances.length);
        } else {
            assert.fail();
        }
    });

    it("Add Slot Sample to Emmpty Intent.", async function () {
        const testIntentName = "TestIntent";
        const utterances = ["value {one}", "value {two}"];
        const slots: LanguageModelSlot[] = [
            {
                name: "one",
                type: "SlotType1"
            },
            {
                name: "two",
                type: "SlotType2"
            }
        ];
        
        const builder = new LanguageModelBuilder(TEST_INVOCATION);
        builder.addIntent({
            name: testIntentName
        });
        
        builder.addSlotSamplesToIntent(testIntentName, utterances, slots);
        const result = builder.build();


        assert.equal(result.languageModel.intents.length, 1);
        assert.equal(result.languageModel.intents[0].name, testIntentName);
        if (result.languageModel.intents[0].slots) {
            assert.equal(result.languageModel.intents[0].slots.length, slots.length);
        } else {
            assert.fail();
        }

        if (result.languageModel.intents[0].samples) {
            assert.equal(result.languageModel.intents[0].samples.length, utterances.length);
        } else {
            assert.fail();
        }
    });

    it("isSlotValue() Test.", async function () {
        assert.ok(!LanguageModelBuilder.isSlotValue("some string"), "identified 'string' as LanguageModelValue.");
        assert.ok(!LanguageModelBuilder.isSlotValue({}), "identified empty 'object' as LanguageModelValue.");
        assert.ok(!LanguageModelBuilder.isSlotValue([]), "identified empty array as LanguageModelValue.");
        assert.ok(!LanguageModelBuilder.isSlotValue({
            id: {},
            name: {
                value: "value"
            }
        }), "property 'id' can't be an object.");

        assert.ok(!LanguageModelBuilder.isSlotValue({
            id: "string name",
            name: {
            }
        }), "property 'name' cannot have empty object.");

        assert.ok(!LanguageModelBuilder.isSlotValue({
            id: "string name",
            name: "test"
        }), "property 'name' cannot be string.");

        assert.ok(LanguageModelBuilder.isSlotValue({
            name: {
                value: "value",
                synonyms: ["something"]
            }
        }), "property 'id' is optional");

        assert.ok(LanguageModelBuilder.isSlotValue({
            id: "string name",
            name: {
                value: "value"
            }
        }), "property 'synonyms' of 'name' is optional");

        assert.ok(LanguageModelBuilder.isSlotValue({
            id: "string name",
            name: {
                value: "value",
                synonyms: []
            }
        }), "property 'synonyms' can be an empty array.");

        assert.ok(!LanguageModelBuilder.isSlotValue({
            id: "string name",
            name: {
                value: "value",
                synonyms: "something"
            }
        }), "property 'synonyms' cannot be string.");

        assert.ok(!LanguageModelBuilder.isSlotValue({
            id: "string name",
            name: {
                value: "value",
                synonyms: [{}]
            }
        }), "property 'synonyms' cannot have type 'object' as an item.");

        assert.ok(LanguageModelBuilder.isSlotValue({
            id: "string name",
            name: {
                value: "value",
                synonyms: ["item", "item2"]
            }
        }), "property 'synonyms' should have type 'string' as an item.");

    });
});