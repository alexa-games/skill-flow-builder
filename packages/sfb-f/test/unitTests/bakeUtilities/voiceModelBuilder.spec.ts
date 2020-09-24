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

import { ModelBuilderHelper, CategoryType, IntentCategory } from './../../../bakeUtilities/VoiceModelBuilder';
import { strict as assert } from 'assert';

const numberToAlphabetCounting = ModelBuilderHelper.numberToAlphabetCounting;

describe("auto voice model generating utility test", function () {
    before(async function() {
        ModelBuilderHelper.autoSlotCount = 0;
        ModelBuilderHelper.autoIntentCount = 0;
    });
    
    it("Slot Number to Alphabet Conversion", async function () {
        assert.equal(numberToAlphabetCounting(0), 'a');
        assert.equal(numberToAlphabetCounting(1), 'b');
        assert.equal(numberToAlphabetCounting(2), 'c');
        assert.equal(numberToAlphabetCounting(3), 'd');
        assert.equal(numberToAlphabetCounting(4), 'e');
        assert.equal(numberToAlphabetCounting(5), 'f');
        assert.equal(numberToAlphabetCounting(6), 'g');
        assert.equal(numberToAlphabetCounting(7), 'h');
        assert.equal(numberToAlphabetCounting(8), 'i');
        assert.equal(numberToAlphabetCounting(9), 'j');
        assert.equal(numberToAlphabetCounting(10), 'k');
        assert.equal(numberToAlphabetCounting(11), 'l');
        assert.equal(numberToAlphabetCounting(12), 'm');
        assert.equal(numberToAlphabetCounting(13), 'n');
        assert.equal(numberToAlphabetCounting(14), 'o');
        assert.equal(numberToAlphabetCounting(15), 'p');
        assert.equal(numberToAlphabetCounting(16), 'q');
        assert.equal(numberToAlphabetCounting(17), 'r');
        assert.equal(numberToAlphabetCounting(18), 's');
        assert.equal(numberToAlphabetCounting(19), 't');
        assert.equal(numberToAlphabetCounting(20), 'u');
        assert.equal(numberToAlphabetCounting(21), 'v');
        assert.equal(numberToAlphabetCounting(22), 'w');
        assert.equal(numberToAlphabetCounting(23), 'x');
        assert.equal(numberToAlphabetCounting(24), 'y');
        assert.equal(numberToAlphabetCounting(25), 'z');
        assert.equal(numberToAlphabetCounting(26), 'ba');
        assert.equal(numberToAlphabetCounting(27), 'bb');
        assert.equal(numberToAlphabetCounting(100), 'dw');
    });

    it("buildCategoriesFromUtteranceTyping() - empty utterance lists", async function () {
        const result = ModelBuilderHelper.buildCategoriesFromUtteranceTyping([], [], [], [], {}, {});
        assert.equal(result.length, 0);
    });

    it("buildCategoriesFromUtteranceTyping() - generate new intent category", async function () {
        const result = ModelBuilderHelper.buildCategoriesFromUtteranceTyping([], ["test one", "test two", "test three"], [], [], {}, {});
        assert.equal(result.length, 1);
        assert.equal(result[0].id, "flexaIntent");
    });

    it("buildCategoriesFromUtteranceTyping() - intent utterances already used in existing categories", async function () {
        const testingCategoryName = "already used intent";
        const testingCategoryName2 = "already used intent2";

        const existingCategoryMap = {
            "test one": {
                id: testingCategoryName,
                type: CategoryType.INTENT,
                utterances: ["test one"]
            },
            "test four": {
                id: testingCategoryName2,
                type: CategoryType.INTENT,
                utterances: ["test four"]
            }
        }

        const oneOverlapResult = ModelBuilderHelper.buildCategoriesFromUtteranceTyping([], ["test one", "test two", "test three"], [], [], {}, existingCategoryMap);

        assert.equal(oneOverlapResult.length, 1);
        assert.equal(oneOverlapResult[0].utterances.length, 3);
        assert.ok(oneOverlapResult[0].utterances.includes("test one"));
        assert.ok(oneOverlapResult[0].utterances.includes("test two"));
        assert.ok(oneOverlapResult[0].utterances.includes("test three"));

        const twoOverlapResult = ModelBuilderHelper.buildCategoriesFromUtteranceTyping([], ["test one", "test two", "test three", "test four", "test five"], [], [], {}, existingCategoryMap);

        assert.equal(twoOverlapResult.length, 2);
        assert.equal(twoOverlapResult[0].utterances.length, 3);
        assert.ok(twoOverlapResult[0].utterances.includes("test one"));
        assert.ok(twoOverlapResult[0].utterances.includes("test two"));
        assert.ok(twoOverlapResult[0].utterances.includes("test three"));
        assert.equal(twoOverlapResult[1].utterances.length, 2);
        assert.ok(twoOverlapResult[1].utterances.includes("test four"));
        assert.ok(twoOverlapResult[1].utterances.includes("test five"));
    });

    it("buildVoiceModelFromCategory() - intents with empty utterances", async function() {
        const testCategories: IntentCategory[] = [
            {
                id: "intentOne",
                type: CategoryType.INTENT,
                utterances: [
                    "sample one",
                    "sample two",
                    "sample three"
                ]
            },
            {
                id: "intentTwo",
                type: CategoryType.INTENT,
                utterances: [
                ]
            },
        ];

        const result = ModelBuilderHelper.buildVoiceModelFromCategory(testCategories, "testInvocation", {}, {});

        assert.equal(result.languageModel.intents.length, 1, "Unexpected number of resulting intents.");
        for (let i = 0; i < result.languageModel.intents.length; i ++) {
            const intent = result.languageModel.intents[i];
            if (intent.samples) {
                assert.notEqual(intent.samples.length, 0, "Detected intents with 0 samples");
            } else {
                assert.fail(`Unexpected intent without samples: ${intent.name}`);
            }
        }
    });

    it("buildVoiceModelFromCategory() - build model from [[CategoryType.AUTO_SLOT]] category items", async function() {
        const testCategories: IntentCategory[] = [
            {
                id: "intentOne",
                type: CategoryType.AUTO_SLOT,
                utterances: [
                    "sample one",
                    "sample two",
                    "sample three"
                ]
            },
            {
                id: "intenTwo",
                type: CategoryType.AUTO_SLOT,
                utterances: [
                    "sample four",
                    "sample five"
                ]
            },
        ];

        const result = ModelBuilderHelper.buildVoiceModelFromCategory(testCategories, "testInvocation", {}, {});

        assert.equal(result.languageModel.intents.length, 1, "Unexpected number of resulting intents.");
        if (result.languageModel.intents[0].samples) {
            assert.equal(result.languageModel.intents[0].samples.length, 2);
        } else {
            assert.fail(`Samples for ${result.languageModel.intents[0].name} is unexptectedly empty.`);
        }

        if (result.languageModel.types) {
            assert.equal(result.languageModel.types.length, 2);
            assert.equal(result.languageModel.types[0].name, testCategories[0].id + "Type");
            assert.equal(result.languageModel.types[1].name, testCategories[1].id + "Type");
        } else {
            assert.fail(`SlotType is expected, but was not present.`);
        }
    });

    it("buildBuiltInSampleToIntentMap() - generate utterance to intent name map for built-in intent", async function() {
        const resultMap = ModelBuilderHelper.buildBuiltInSampleToIntentMap({
            "TestBuiltInIntent1": [
                "utterance 1 for TestBuiltInIntent1",
                "utterance 2 for TestBuiltInIntent1",
                "utterance 3 for TestBuiltInIntent1"
            ],
            "TestBuiltInIntent2": [
                "utterance 1 for TestBuiltInIntent2",
                "utterance 2 for TestBuiltInIntent2",
                "utterance 3 for TestBuiltInIntent2"
            ]
        });

        assert.equal(resultMap["utterance 1 for TestBuiltInIntent1"], undefined, "The utterance for intent was not LowerCased");
        assert.equal(resultMap["utterance 1 for testbuiltinintent1"], "TestBuiltInIntent1", "utterance does not map correctly to the test intent: TestBuiltInIntent1");
        assert.equal(resultMap["utterance 2 for testbuiltinintent1"], "TestBuiltInIntent1", "utterance does not map correctly to the test intent: TestBuiltInIntent1");
        assert.equal(resultMap["utterance 3 for testbuiltinintent1"], "TestBuiltInIntent1", "utterance does not map correctly to the test intent: TestBuiltInIntent1");
        assert.equal(resultMap["utterance 1 for testbuiltinintent2"], "TestBuiltInIntent2", "utterance does not map correctly to the test intent: TestBuiltInIntent2");
        assert.equal(resultMap["utterance 2 for testbuiltinintent2"], "TestBuiltInIntent2", "utterance does not map correctly to the test intent: TestBuiltInIntent2");
        assert.equal(resultMap["utterance 3 for testbuiltinintent2"], "TestBuiltInIntent2", "utterance does not map correctly to the test intent: TestBuiltInIntent2");
    });

    it("buildBuiltInSampleToIntentMap() - non EN lower casing test", async function() {
        const resultMap = ModelBuilderHelper.buildBuiltInSampleToIntentMap({
            "TestBuiltInIntent1": [
                "TestBuiltInIntent1の発話1",
                "TestBuiltInIntent1の発話2",
                "TestBuiltInIntent1の発話3"
            ],
            "TestBuiltInIntent2": [
                "TestBuiltInIntent2の発話1",
                "TestBuiltInIntent2の発話2",
                "TestBuiltInIntent2の発話3"
            ]
        });

        assert.equal(resultMap["TestBuiltInIntent1の発話1"], undefined, "The utterance for intent was not LowerCased");
        assert.equal(resultMap["testbuiltinintent1の発話1"], "TestBuiltInIntent1", "utterance 'testbuiltinintent1の発話1' does not map correctly to the test intent: TestBuiltInIntent1");
        assert.equal(resultMap["testbuiltinintent1の発話2"], "TestBuiltInIntent1", "utterance 'testbuiltinintent1の発話2' does not map correctly to the test intent: TestBuiltInIntent1");
        assert.equal(resultMap["testbuiltinintent1の発話3"], "TestBuiltInIntent1", "utterance 'testbuiltinintent1の発話3' does not map correctly to the test intent: TestBuiltInIntent1");
        assert.equal(resultMap["testbuiltinintent2の発話1"], "TestBuiltInIntent2", "utterance 'testbuiltinintent2の発話1' does not map correctly to the test intent: TestBuiltInIntent2");
        assert.equal(resultMap["testbuiltinintent2の発話2"], "TestBuiltInIntent2", "utterance 'testbuiltinintent2の発話2' does not map correctly to the test intent: TestBuiltInIntent2");
        assert.equal(resultMap["testbuiltinintent2の発話3"], "TestBuiltInIntent2", "utterance 'testbuiltinintent3の発話3' does not map correctly to the test intent: TestBuiltInIntent2");
    });

    it ("splitUtteranceType() - splits to types appropriately", async function() {
        const autoIntentTarget = "utterance one";
        const autoSlotNumericTarget = "utterance 2";
        const customSlotTarget = "{slotName} woo hoo";
        const builtInTarget = "built in utterance";

        const result = ModelBuilderHelper.splitUtteranceType([autoIntentTarget, autoSlotNumericTarget, customSlotTarget, builtInTarget],
            {
                [builtInTarget]: 'BuiltInIntent' 
            },
            {
                "slotName": 'CustomSlotType'
            });

        assert.equal(result.autoIntents[0], autoIntentTarget);
        assert.equal(result.autoSlots[0], autoSlotNumericTarget);
        assert.equal(result.builtInIntents[0], builtInTarget);
        assert.equal(result.customSlots[0], customSlotTarget.replace("{slotName}", "{slotName as CustomSlotType}"));
    });

    it ("buildCategoriesForChoice() - test for proper categorization and de-duping of category.", async function() {
        const autoIntentTarget = "utterance one";
        const autoSlotNumericTarget = "utterance 2";
        const customSlotTarget = "{slotName} woo hoo";
        const builtInTarget = "built in utterance";
        const usedUtterance = "Already Used Within Scene Utterance";
        const lowerCaseUsedUtterance = usedUtterance.toLowerCase();

        const testUtterances = [
            autoIntentTarget,
            autoSlotNumericTarget,
            customSlotTarget,
            builtInTarget,
            usedUtterance
        ];

        const existingCategory: IntentCategory = {
            id: "AlreadyUsedIntent",
            type: CategoryType.INTENT,
            utterances: [
                lowerCaseUsedUtterance
            ]
        }

        const result = ModelBuilderHelper.buildCategoriesForChoice(testUtterances, {
            [existingCategory.id]: true
        },
        {
            "slotName": 'CustomSlotType'
        },
        {
            [builtInTarget]: 'BuiltInIntent' 
        },
        {
            [lowerCaseUsedUtterance]: existingCategory
        });

        assert.equal(existingCategory.utterances.length, 0, "duplicating utterance is not removed from the existing category.");

        let hasBuiltIn = false;
        let hasAutoSlot = false;
        let hasCustomSlot = false;
        let hasIntent = false;
        for (let category of result) {
            if (category.type === CategoryType.BUILT_IN_INTENT) {
                hasBuiltIn = true;
                assert.equal(category.utterances.length, 0, "BuiltInIntent utterances should always be empty.");
            } else if (category.type === CategoryType.AUTO_SLOT) {
                hasAutoSlot = true;
                assert.equal(category.utterances.length, 1);
                assert.ok(category.utterances.includes(autoSlotNumericTarget), `Expected utterance for auto slot '${autoSlotNumericTarget}' is not found.`);
            } else if (category.type === CategoryType.CUSTOM_SLOT) {
                hasCustomSlot = true;
                assert.equal(category.utterances.length, 1);
                assert.equal(category.utterances[0], customSlotTarget.replace("{slotName}", "{slotName as CustomSlotType}"));
            } else if (category.type === CategoryType.INTENT) {
                hasIntent = true;
                assert.equal(category.utterances.length, 2);
                assert.ok(category.utterances.includes(lowerCaseUsedUtterance));
                assert.ok(category.utterances.includes(autoIntentTarget));
            }
        }

        assert.ok(hasBuiltIn, "Expected intent 'BuiltInIntent' does not exist in the reuslt");
        assert.ok(hasAutoSlot, "Expected category type 'Auto Slot' does not exist in the reuslt");
        assert.ok(hasCustomSlot, "Expected category type 'Custom Slot' does not exist in the reuslt");
        assert.ok(hasIntent, "Expected category type 'Intent' does not exist in the reuslt");
    });
});