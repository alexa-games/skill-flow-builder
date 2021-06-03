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

import { StoryMetadataHelper } from "./../importPlugins/storyMetadataHelper";
import { Instruction, InstructionType, SceneVariation } from "./../story/storyMetadata";
import { Segmenter, SegmentType } from "./../transformers/segmenter";
import { VoiceModel } from "./languageModel";
import { LanguageModelBuilder, LanguageModelSlot, LanguageModelValue } from "./languageModel";

export interface IntentCategory {
    id: string,
    type: CategoryType,
    utterances: string[]
}

export enum CategoryType {
    INTENT,
    CUSTOM_SLOT,
    AUTO_SLOT,
    BUILT_IN_INTENT,
    BASE_INTENT
}

const SLOT_VERSION_BASE = 26;

const A_CHAR_CODE = 'a'.charCodeAt(0);

const CATCH_ALL_SLOT_INTENT_NAME = 'CatchAllSlotIntent';

const INTENT_NUMBER_LIMIT: number = 220;

const OVERFLOW_INTENT_SLOT_NAME: string = "OverflowIntentSlot";

export class ModelBuildHelper {
    public static autoSlotCount: number = 0;
    public static autoIntentCount: number = 0;

    public static buildBuiltInSampleToIntentMap(intentToSamples: {[key: string]: string[];}): {[key: string]: string} {
        const sampleToBuiltIn: {[key: string]: string} = {};
        for (const intentName in intentToSamples) {
            intentToSamples[intentName].forEach((sample) => {
                sampleToBuiltIn[sample.toLowerCase()] = intentName;
            });
        }

        return sampleToBuiltIn;
    }

    public static isBuiltInIntent(intent: string) {
        return intent.startsWith("AMAZON.");
    }

    public static isWildCardUtterance(utterance: string) {
        return utterance === "*";
    }

    /**
     * Given a SFB story metadata divide utterances based on the intent of the utterance.
     */
    public static categorizeByIntent(story: StoryMetadataHelper, builtInIntents: {[key: string]: string}, baseVoiceModel?: VoiceModel): IntentCategory[] {
        let result: IntentCategory[] = [];

        let utteranceToCategory: {[key: string]: IntentCategory} = {};

        if (baseVoiceModel) {
            utteranceToCategory = this.getUtteranceCategoryFromModel(baseVoiceModel);
        }

        story.getAllScenes().forEach((scene) => {

            scene.contents.forEach((content) => {
                const categories = ModelBuildHelper.getCategoriesFromScene(utteranceToCategory, builtInIntents, content);

                result = result.concat(categories);
            });
        });

        ModelBuildHelper.registerCategoryToStory(story, utteranceToCategory);

        return result;
    }

    /**
     * Given the voice model, generate a mapping of "utterance"/"sample" to [[Category]] mapping
     *
     * @param voiceModel
     */
    public static getUtteranceCategoryFromModel(voiceModel: VoiceModel): {[key: string]: IntentCategory} {
        const existingCategories: IntentCategory[] = [];

        voiceModel.languageModel.intents.forEach((intent) => {
            if (intent.samples && intent.samples.length > 0) {

                const slotNameToType: {[key: string]: string; } = {};
                if (intent.slots) {
                    intent.slots.forEach((slot) => {
                        const slotName = slot.name;
                        const slotType = slot.type;

                        slotNameToType[slotName] = slotType;
                    });
                }

                const intentSamples: string[] = [];

                intent.samples.forEach((sample) => {
                    if (sample.match(/{.+?}/)) {
                        const slotRegex = /{(.+?)}/g;

                        let match = slotRegex.exec(sample);
                        let result = sample.toLowerCase();
                        while (match != null) {
                            const slotName = match[1].trim();
                            const slotType = slotNameToType[slotName];

                            result = result.replace(new RegExp(`{${slotName.toLowerCase()}}`, "g"), `{${slotName} as ${slotType}}`);
                            match = slotRegex.exec(sample);
                        }

                        intentSamples.push(result);
                    } else {
                        intentSamples.push(sample.toLowerCase());
                    }
                });

                if (intentSamples.length > 0) {
                    existingCategories.push({
                        id: intent.name,
                        type: CategoryType.BASE_INTENT,
                        utterances: intentSamples,
                    });
                }
            }
        });

        const utteranceToCategory: {[key: string]: IntentCategory} = {};

        existingCategories.forEach((category) => {
            category.utterances.forEach((utterance) => {
                utteranceToCategory[utterance] = category;
            });
        });

        return utteranceToCategory;
    }

    /**
     * Given the category list, construct a voice model object.
     */
    public static buildVoiceModelFromCategory(categories: IntentCategory[], invocationName: string, customSlots: {[key: string]: (string|LanguageModelValue)[]}, builtInIntents: {[key: string]: string[]}): VoiceModel {
        const modelBuilder = new LanguageModelBuilder(invocationName);

        for (const item of categories) {
            if (item.utterances.length === 0) {
                continue;
            }

            if (item.type === CategoryType.INTENT || item.type === CategoryType.BASE_INTENT) {
                const slots = ModelBuildHelper.getSlotsFromUtterances(item.utterances);
                const utterances = ModelBuildHelper.convertSlotUtteranceForModel(item.utterances);

                if (slots && slots.length > 0) {
                    slots.forEach((slot) => {
                        const customSlotTypeName = slot.type;
                        const customSlotValues = customSlots[customSlotTypeName] || [];

                        if (!ModelBuildHelper.isBuiltInIntent(customSlotTypeName)) {
                            modelBuilder.addSlotValues(customSlotTypeName, customSlotValues);
                        }
                    });

                    modelBuilder.addSlotSamplesToIntent(item.id, utterances, slots);
                } else {
                    modelBuilder.addIntent({
                        name: item.id,
                        samples: item.utterances
                    });
                }
            } else if (item.type === CategoryType.AUTO_SLOT) {
                const generatedSlotName = item.id;
                const generatedSlotTypeName = `${generatedSlotName}Type`;
                const utterances = ModelBuildHelper.convertSlotUtteranceForModel(item.utterances);

                modelBuilder.addSlotValues(generatedSlotTypeName, utterances);
                modelBuilder.addSlotSamplesToIntent(CATCH_ALL_SLOT_INTENT_NAME, [`{${generatedSlotName}}`], [{
                    name: generatedSlotName,
                    type: generatedSlotTypeName
                }]);
            }
        }

        for (const intentName of Object.keys(builtInIntents)) {
            modelBuilder.addIntent({
                name: intentName
            });
        }

        return modelBuilder.build();
    }

    public static getCategoriesFromScene(utteranceToCategory: {[key: string]: IntentCategory}, builtInIntents: {[key: string]: string}, sceneContent: SceneVariation): IntentCategory[] {
        const instructions = sceneContent.sceneDirections;

        if (!instructions) {
            return [];
        }

        const registeredSlots = ModelBuildHelper.buildSlotMap(instructions);
        const sceneCategory: IntentCategory[] = [];

        let instructionsQueue = JSON.parse(JSON.stringify(instructions));

        const usedIntent: {[key: string]: boolean} = {};

        while (instructionsQueue.length > 0) {
            const checking = instructionsQueue.splice(0, 1)[0];

            if (checking.directionType === InstructionType.CHOICE) {
                const utterances = checking.parameters.utterances as string[];

                const choiceCategories = ModelBuildHelper.buildCategoriesForChoice(utterances, usedIntent, registeredSlots, builtInIntents, utteranceToCategory);

                choiceCategories.forEach((item) => sceneCategory.push(item));
            } else if (checking.directionType === InstructionType.CONDITION) {
                if (checking.parameters.directions && checking.parameters.directions.length > 0) {
                    instructionsQueue = instructionsQueue.concat(checking.parameters.directions);
                }
            }
        }

        return sceneCategory;
    }

    public static buildCategoriesForChoice(utterances: string[], usedIntent: {[key: string]: boolean}, slotNameToType: {[key: string]: string}, builtInIntentMap: {[key: string]: string}, utteranceToCategory: {[key: string]: IntentCategory}): IntentCategory[] {
        const utteranceTypingResult = ModelBuildHelper.splitUtteranceType(utterances, builtInIntentMap, slotNameToType);

        utteranceTypingResult.autoIntents.forEach((utterance) => {
            const categoryForUtterance = utteranceToCategory[utterance];
            if (categoryForUtterance) {
                const intentID = categoryForUtterance.id;
                if (usedIntent[intentID] && utteranceToCategory[utterance].type !== CategoryType.BASE_INTENT) {
                    // remove utterance from the existing category for re-assignment
                    const i = utteranceToCategory[utterance].utterances.indexOf(utterance);
                    utteranceToCategory[utterance].utterances.splice(i, 1);
                    delete utteranceToCategory[utterance];
                }
            }
        });

        const choiceCategories = ModelBuildHelper.buildCategoriesFromUtteranceTyping (
            utteranceTypingResult.builtInIntents,
            utteranceTypingResult.autoIntents,
            utteranceTypingResult.autoSlots,
            utteranceTypingResult.customSlots,
            builtInIntentMap,
            utteranceToCategory
        );

        choiceCategories.filter((category) => {
            return category.type === CategoryType.INTENT;
        }).forEach((category) => {
            usedIntent[category.id] = true;
        });

        return choiceCategories;
    }

    public static buildCategoriesFromUtteranceTyping(builtIns: string[], autoIntents: string[], autoSlots: string[], customSlots: string[], builtInIntentMap: {[key: string]: string}, utteranceToCategory: {[key: string]: IntentCategory}): IntentCategory[] {
        const categories: IntentCategory[] = [];

        if (builtIns.length > 0) {
            builtIns.forEach((utterance) => {
                const intentName = builtInIntentMap[utterance];
                const category = {
                    id: intentName,
                    type: CategoryType.BUILT_IN_INTENT,
                    utterances: []
                };

                utteranceToCategory[utterance] = category;
                categories.push(category);
            });
        }

        if (autoSlots.length > 0) {
            categories.push({
                id: OVERFLOW_INTENT_SLOT_NAME,
                type: CategoryType.AUTO_SLOT,
                utterances: autoSlots
            });

            ModelBuildHelper.autoSlotCount ++;
        }

        // same handling for custom slots & auto intents
        const autoIntentGroup = autoIntents.concat(customSlots);
        if (autoIntentGroup.length > 0) {
            const categoryInUse: IntentCategory[] = [];
            autoIntentGroup.forEach((utterance) => {
                const recentCategory = categoryInUse.length > 0 ? categoryInUse[categoryInUse.length - 1] : undefined;

                if (utteranceToCategory[utterance] && (!recentCategory || utteranceToCategory[utterance].id !== recentCategory.id)) {
                    categoryInUse.push(utteranceToCategory[utterance]);
                } else if (!recentCategory) {
                    const intentName = `flex${ModelBuildHelper.numberToAlphabetCounting(ModelBuildHelper.autoIntentCount)}Intent`;

                    const generatedCategory: IntentCategory = {
                        id: intentName,
                        type: CategoryType.INTENT,
                        utterances: [utterance]
                    };

                    if (ModelBuildHelper.autoIntentCount > INTENT_NUMBER_LIMIT) {
                        generatedCategory.id = OVERFLOW_INTENT_SLOT_NAME;
                        generatedCategory.type = CategoryType.AUTO_SLOT;
                    }

                    categoryInUse.push(generatedCategory);
                    utteranceToCategory[utterance] = generatedCategory;
                    ModelBuildHelper.autoIntentCount ++;
                } else if (!utteranceToCategory[utterance]) {
                    utteranceToCategory[utterance] = recentCategory;
                    recentCategory.utterances.push(utterance);
                }
            });
            categoryInUse.forEach((cat) => categories.push(cat));
        }

        return categories;
    }

    /**
     * Split a list of utterances in by their utterance type.
     * Three utterances types are:
     * 1. Auto Intent
     * 2. Built In Intents
     * 3. Auto Slot
     * 4. Custom Slot
     */
    public static splitUtteranceType(utterances: string[], builtInIntents: {[key: string]: string}, registeredSlots: {[key: string]: string}): {
        autoIntents: string[],
        builtInIntents: string[],
        autoSlots: string[],
        customSlots: string[]
    } {
        const autoSlotUtterances: string[] = [];
        const customSlotUtterances: string[] = [];
        const intentUtterances: string[] = [];
        const builtInUtterances: string[] = [];

        for (const utterance of utterances) {
            const segmenter = new Segmenter([{
                brackets: "{}",
                preserve: false,
                type: SegmentType.Element
            }]);

            const segments = segmenter.parse(utterance);

            const normalizedUtterance = segments.map((seg) => {
                return seg.type === SegmentType.Element ? seg.original : seg.value.toLowerCase();
            }).reduce((prev, curr): string => {
                if (prev) {
                    return prev + curr;
                } else {
                    return curr;
                }
            });

            if (ModelBuildHelper.isWildCardUtterance(normalizedUtterance)) {
                continue;
            } else if (ModelBuildHelper.isBuiltInIntent(normalizedUtterance)) {
                continue;
            } else if (builtInIntents[normalizedUtterance]) {
                builtInUtterances.push(normalizedUtterance);
            } else if (ModelBuildHelper.hasUserDefinedSlots(normalizedUtterance)) {
                const slotStandardUtterance = ModelBuildHelper.standarizeSlottedUtterance(normalizedUtterance, registeredSlots);

                customSlotUtterances.push(slotStandardUtterance);
            } else if (ModelBuildHelper.hasNumerics(normalizedUtterance)) {
                autoSlotUtterances.push(normalizedUtterance);
            } else {
                intentUtterances.push(normalizedUtterance);
            }
        }

        return {
            autoIntents: intentUtterances,
            builtInIntents: builtInUtterances,
            autoSlots: autoSlotUtterances,
            customSlots: customSlotUtterances
        };
    }

    /**
     * Build a map of { slot name : slot type } registered within the given list of scene instructions.
     */
    public static buildSlotMap(instructions: Instruction[]): {[key: string]: string} {
        const registeredSlots: {[key: string]: string} = {};

        let instructionsQueue = JSON.parse(JSON.stringify(instructions));

        while (instructionsQueue.length > 0) {
            const checking = instructionsQueue.splice(0, 1)[0];

            if (checking.directionType === InstructionType.SLOT) {
                const name: string = checking.parameters.variableName;
                const type: string = checking.parameters.variableType;

                registeredSlots[name] = type;
            } else if (checking.directionType === InstructionType.CONDITION) {
                if (checking.parameters.directions && checking.parameters.directions.length > 0) {
                    instructionsQueue = instructionsQueue.concat(checking.parameters.directions);
                }
            }
        }

        return registeredSlots;
    }

    public static standarizeSlottedUtterance(utterance: string, slotMap: {[key: string]: string;}): string {
        return utterance.replace(/{([\s\S]+?)(?:[ \t]+?as[ \t]+?([\s\S]+?))?}/g,
            (match: any, slotName: string, slotType: string) => {
                if (slotName && !slotType && slotMap[slotName]) {
                    return `{${slotName} as ${slotMap[slotName]}}`;
                } else if (slotName && !slotType && !slotMap[slotName]) {
                    return `{${slotName} as ${slotName}}`;
                } else {
                    return match;
                }
            });
    }

    public static hasUserDefinedSlots(utterance: string) {
        return !!utterance.match(/{[\s\S]+?([ \t]+?as[ \t]+?[\s\S]+?)?}/g);
    }

    public static hasNumerics(utterance: string) {
        return !!utterance.match(/[\d]+?/g);
    }

    public static numberToAlphabetCounting(i: number) {
        const base26Count = i.toString(SLOT_VERSION_BASE);

        const alphaBaseCount = base26Count.replace(/./g, (match): string => {
            if (isNaN(parseInt(match, 10))) {
                return String.fromCharCode(match.charCodeAt(0) + 10);
            } else {
                return String.fromCharCode(A_CHAR_CODE + parseInt(match, 10));
            }
        });

        return alphaBaseCount;
    }

    public static getSlotsFromUtterances(utterances: string[]): LanguageModelSlot[] {
        const slots: {[key: string]: LanguageModelSlot} = {};
        utterances.forEach((item) => {
            const segmenter = new Segmenter([{
                brackets: "{}",
                preserve: false,
                type: SegmentType.Element
            }]);

            const segments = segmenter.parse(item);

            for (const segment of segments) {
                const value = segment.value;

                if (segment.type === SegmentType.Element) {
                    const slotRegex = /^([\s\S]+?)[ \t]+?as[ \t]+?([\s\S]+?)$/;
                    const match = slotRegex.exec(value);

                    if (match === null) {
                        throw new Error(`Unexpected slot format '${value}' in Utterance '${item}'`);
                    }

                    const type = match[2];
                    const name = match[1];

                    slots[name] = {
                        name: name,
                        type: type
                    };
                }
            }
        });

        return Object.values(slots);
    }

    public static convertSlotUtteranceForModel(utterances: string[]): string[] {
        const flattenedUtterance = JSON.stringify(utterances);

        const slotRegex = /{([\s\S]+?)[ \t]+?as[ \t]+?([\s\S]+?)}/g;

        const correctedUtterances = flattenedUtterance.replace(slotRegex, (match, slotName, slotType): string => {
            return `{${slotName}}`;
        });

        return JSON.parse(correctedUtterances) as string[];
    }

    public static registerCategoryToStory(story: StoryMetadataHelper, utteranceToCategory: {[key: string]: IntentCategory;}) {
        const normalizedUtteranceToCat: {[key: string]: IntentCategory; } = {};

        Object.keys(utteranceToCategory).forEach((beforeUtterance) => {
            const normalizedUtterance = beforeUtterance.replace(/{(.+?) as (.+?)}/g, (match, p1, p2) => {
                return `{${p1}}`;
            });
            normalizedUtteranceToCat[normalizedUtterance] = utteranceToCategory[beforeUtterance];
        });

        const scenes = story.getAllScenes();
        for (const scene of scenes) {
            for (const content of scene.contents) {
                if (!content.sceneDirections) {
                    continue;
                }

                ModelBuildHelper.registerCategoryToInstructions(content.sceneDirections, normalizedUtteranceToCat);
            }
        }
        story.setAllScenes(scenes);
    }

    public static registerCategoryToInstruction(instruction: Instruction, utteranceToCategory: {[key: string]: IntentCategory;}) {
        if (instruction.parameters.utterances) {
            const uniqueIntentsUsed: any = {};

            for (const utterance of instruction.parameters.utterances as string[]) {
                const category = utteranceToCategory[utterance];
                if (category) {
                    uniqueIntentsUsed[category.id] = true;
                }
            }

            if (!instruction.parameters.utteranceIDs) {
                instruction.parameters.utteranceIDs = [];
            }

            instruction.parameters.utteranceIDs = instruction.parameters.utteranceIDs.concat(Object.keys(uniqueIntentsUsed));
        }
    }

    public static registerCategoryToInstructions(instructions: Instruction[], utteranceToCategory: {[key: string]: IntentCategory;}) {
        for (const instruction of instructions) {
            if (instruction.directionType === InstructionType.CHOICE) {
                ModelBuildHelper.registerCategoryToInstruction(instruction, utteranceToCategory);
            } else if (instruction.directionType === InstructionType.CONDITION) {
                if (instruction.parameters.directions && instruction.parameters.directions.length > 0) {
                    ModelBuildHelper.registerCategoryToInstructions(instruction.parameters.directions, utteranceToCategory);
                }
            }
        }
    }

    public static applyBuiltInIntentSamples(voiceModel: VoiceModel, baseModel: VoiceModel) {
        const baseIntentSamplesMap: { [key: string]: string[] } = {};

        baseModel.languageModel.intents.forEach((intent) => {

            // Check for special case catch all slot intent name, that shouldn't be in the voice model.
            if (intent.name === CATCH_ALL_SLOT_INTENT_NAME) {
                throw new Error(`Reserved intent name ${CATCH_ALL_SLOT_INTENT_NAME} found in base voice model. This is not allowed, please remove.'`);
            }

            if (ModelBuildHelper.isBuiltInIntent(intent.name) && intent.samples) {
                baseIntentSamplesMap[intent.name] = intent.samples;
            }
        });

        voiceModel.languageModel.intents.forEach((intent) => {
            if (ModelBuildHelper.isBuiltInIntent(intent.name) && baseIntentSamplesMap[intent.name]) {
                intent.samples = baseIntentSamplesMap[intent.name];
            }
        });
    }

    public static copyAdditionalAttributes(voiceModel: VoiceModel, baseModel: VoiceModel) {
        for (const key in baseModel.languageModel) {
            if (key === "invocationName" || key === "intents" || key === "types") {
                continue;
            }
            voiceModel.languageModel[key] = baseModel.languageModel[key];
        }
    }
}