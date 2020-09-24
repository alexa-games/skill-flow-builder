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

import { VoiceModel } from "./languageModel";
import { StoryMetadataHelper } from './../importPlugins/storyMetadataHelper';
import { Instruction, InstructionType, SceneVariation } from './../story/storyMetadata';
import { LanguageModelBuilder, LanguageModelSlot, LanguageModelValue } from './languageModel';
import { Segmenter, SegmentType } from './../transformers/segmenter';

export interface IntentCategory {
    id: string,
    type: CategoryType,
    utterances: string[],
}

export enum CategoryType {
    INTENT,
    CUSTOM_SLOT,
    AUTO_SLOT,
    BUILT_IN_INTENT
}

const SLOT_VERSION_BASE = 26;

const A_CHAR_CODE = 'a'.charCodeAt(0);

const SLOT_INTENT_NAME = 'CatchAllSlotIntent';

const INTENT_NUMBER_LIMIT: number = 220;

const OVERFLOW_INTENT_SLOT_NAME: string = "OverflowIntentSlot"

export interface ModelBuildParameter {
    story: StoryMetadataHelper;
    locale: string;
    invocationName: string;
    customSlots: {[key: string]: string[]|LanguageModelValue[]};
    builtInIntents: {[key: string]: string[]};
}

export interface ModelBuilder {
    build(param: ModelBuildParameter): VoiceModel;
}

export class AlexaVoiceModelBuilder implements ModelBuilder {
    /**
     * Given a imported story structure for SFB, automatically generate an Alexa Interaction Model.
     */
    public build(param: ModelBuildParameter): VoiceModel {
        const storyAccessor = param.story;
        
        ModelBuilderHelper.autoIntentCount = 0;
        ModelBuilderHelper.autoSlotCount = 0;

        const builtInIntents = ModelBuilderHelper.buildBuiltInSampleToIntentMap(param.builtInIntents);
        const categories = ModelBuilderHelper.categorizeByIntent(storyAccessor, builtInIntents);
        const voiceModel = ModelBuilderHelper.buildVoiceModelFromCategory(categories, param.invocationName, param.customSlots, param.builtInIntents);

        return voiceModel;
    }
}

export class ModelBuilderHelper {
    static autoSlotCount: number = 0;
    static autoIntentCount: number = 0;

    static buildBuiltInSampleToIntentMap(intentToSamples: {[key: string]: string[];}): {[key: string]: string} {
        const sampleToBuiltIn: {[key: string]: string} = {};
        for (let intentName in intentToSamples) {
            intentToSamples[intentName].forEach((sample) => {
                sampleToBuiltIn[sample.toLowerCase()] = intentName;
            });
        }

        return sampleToBuiltIn;
    }

    static isBuiltInIntent(intent: string) {
        return intent.startsWith("AMAZON.");
    }

    static isWildCardUtterance(utterance: string) {
        return utterance === "*";
    }

    /**
     * Given a SFB story metadata divide utterances based on the intent of the utterance.
     */
    static categorizeByIntent(story: StoryMetadataHelper, builtInIntents: {[key: string]: string}): IntentCategory[] {
        let result: IntentCategory[] = [];

        const utteranceToCategory: {[key: string]: IntentCategory} = {};

        story.getAllScenes().forEach((scene) => {

            scene.contents.forEach((content) => {
                const categories = ModelBuilderHelper.getCategoriesFromScene(utteranceToCategory, builtInIntents, content);

                result = result.concat(categories);
            });
        });

        ModelBuilderHelper.registerCategoryToStory(story, utteranceToCategory);

        return result;
    }

    /**
     * Given the category list, construct a voice model object.
     */
    static buildVoiceModelFromCategory(categories: IntentCategory[], invocationName: string, customSlots: {[key: string]: (string|LanguageModelValue)[]}, builtInIntents: {[key:string]: string[]}): VoiceModel {
        const modelBuilder = new LanguageModelBuilder(invocationName);

        for (let item of categories) {
            if (item.utterances.length === 0) {
                continue;
            }

            if (item.type === CategoryType.INTENT) {
                modelBuilder.addIntent({
                    name: item.id,
                    samples: item.utterances
                });
            } else if (item.type === CategoryType.AUTO_SLOT) {
                const generatedSlotName = item.id;
                const generatedSlotTypeName = `${generatedSlotName}Type`;
                const utterances = ModelBuilderHelper.convertSlotUtteranceForModel(item.utterances);

                modelBuilder.addSlotValues(generatedSlotTypeName, utterances);
                modelBuilder.addSlotSamplesToIntent(SLOT_INTENT_NAME, [`{${generatedSlotName}}`], [{
                    name: generatedSlotName,
                    type: generatedSlotTypeName
                }]);
            } else if (item.type === CategoryType.CUSTOM_SLOT) {
                const slots = ModelBuilderHelper.getSlotsFromUtterances(item.utterances);
                const utterances = ModelBuilderHelper.convertSlotUtteranceForModel(item.utterances);

                slots.forEach((slot) => {
                    const customSlotTypeName = slot.type;
                    const customSlotValues = customSlots[customSlotTypeName] || [];


                    if (!ModelBuilderHelper.isBuiltInIntent(customSlotTypeName)) {
                        modelBuilder.addSlotValues(customSlotTypeName, customSlotValues);
                    }
                });
                modelBuilder.addSlotSamplesToIntent(SLOT_INTENT_NAME, utterances, slots);
            }
        }

        for (let intentName of Object.keys(builtInIntents)) {
            modelBuilder.addIntent({
                name: intentName
            });
        }

        return modelBuilder.build();
    }

    static getCategoriesFromScene(utteranceToCategory: {[key:string]: IntentCategory}, builtInIntents: {[key: string]: string}, sceneContent: SceneVariation): IntentCategory[] {
        const instructions = sceneContent.sceneDirections;

        if (!instructions) {
            return [];
        }

        const registeredSlots = ModelBuilderHelper.buildSlotMap(instructions);
        const sceneCategory: IntentCategory[] = [];

        let instructionsQueue = JSON.parse(JSON.stringify(instructions));

        const usedIntent: {[key: string]: boolean} = {};

        while (instructionsQueue.length > 0) {
            const checking = instructionsQueue.splice(0, 1)[0];
            
            if (checking.directionType === InstructionType.CHOICE) {
                const utterances = (<string[]>checking.parameters.utterances);

                const choiceCategories = ModelBuilderHelper.buildCategoriesForChoice(utterances, usedIntent, registeredSlots, builtInIntents, utteranceToCategory);
                
                choiceCategories.forEach((item) => sceneCategory.push(item));
            } else if (checking.directionType === InstructionType.CONDITION) {
                if (checking.parameters.directions && checking.parameters.directions.length > 0) {
                    instructionsQueue = instructionsQueue.concat(checking.parameters.directions);
                }
            }
        }

        return sceneCategory;
    }

    static buildCategoriesForChoice(utterances: string[], usedIntent: {[key: string]: boolean}, slotNameToType: {[key:string]: string}, builtInIntentMap: {[key: string]: string}, utteranceToCategory: {[key:string]: IntentCategory}): IntentCategory[] {
        const utteranceTypingResult = ModelBuilderHelper.splitUtteranceType(utterances, builtInIntentMap, slotNameToType);

        utteranceTypingResult.autoIntents.forEach((utterance) => {
            const categoryForUtterance = utteranceToCategory[utterance];
            if (categoryForUtterance) {
                const intentID = categoryForUtterance.id;
                if (usedIntent[intentID]) {
                    // remove utterance from the existing category for re-assignment
                    const i = utteranceToCategory[utterance].utterances.indexOf(utterance);
                    utteranceToCategory[utterance].utterances.splice(i, 1);
                    delete utteranceToCategory[utterance];
                }
            }            
        });

        const choiceCategories = ModelBuilderHelper.buildCategoriesFromUtteranceTyping (
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
            usedIntent[category.id] = true
        })

        return choiceCategories
    }

    static buildCategoriesFromUtteranceTyping(builtIns: string[], autoIntents: string[], autoSlots: string[], customSlots: string[], builtInIntentMap: {[key: string]: string}, utteranceToCategory: {[key:string]: IntentCategory}): IntentCategory[] {
        const categories: IntentCategory[] = [];

        if (builtIns.length > 0) {
            builtIns.forEach((utterance) => {
                const intentName = builtInIntentMap[utterance];
                const category = {
                    id: intentName,
                    type: CategoryType.BUILT_IN_INTENT,
                    utterances: []
                }

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

            ModelBuilderHelper.autoSlotCount ++;
        }

        if (customSlots.length > 0) {
            categories.push({
                id: 'custom',
                type: CategoryType.CUSTOM_SLOT,
                utterances: customSlots
            });
        }

        if (autoIntents.length > 0) {
            let categoryInUse: IntentCategory[] = [];
            autoIntents.forEach((utterance) => {
                const recentCategory = categoryInUse.length > 0? categoryInUse[categoryInUse.length - 1]: undefined;

                if (utteranceToCategory[utterance] && (!recentCategory || utteranceToCategory[utterance].id !== recentCategory.id)) {
                    categoryInUse.push(utteranceToCategory[utterance]);
                } else if (!recentCategory) {
                    const intentName = `flex${ModelBuilderHelper.numberToAlphabetCounting(ModelBuilderHelper.autoIntentCount)}Intent`;

                    const generatedCategory: IntentCategory = {
                        id: intentName,
                        type: CategoryType.INTENT,
                        utterances: [utterance]
                    };

                    if (ModelBuilderHelper.autoIntentCount > INTENT_NUMBER_LIMIT) {
                        generatedCategory.id = OVERFLOW_INTENT_SLOT_NAME;
                        generatedCategory.type = CategoryType.AUTO_SLOT;
                    }

                    categoryInUse.push(generatedCategory);
                    utteranceToCategory[utterance] = generatedCategory;
                    ModelBuilderHelper.autoIntentCount ++;
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
    static splitUtteranceType(utterances: string[], builtInIntents: {[key: string]: string}, registeredSlots:  {[key: string]: string}): {
        autoIntents: string[],
        builtInIntents: string[],
        autoSlots: string[],
        customSlots: string[]
    } {
        const autoSlotUtterances: string[] = [];
        const customSlotUtterances: string[] = [];
        const intentUtterances: string[] = [];
        const builtInUtterances: string[] = [];

        for (let utterance of utterances) {
            const segmenter = new Segmenter([{
                brackets: "{}",
                preserve: false,
                type: SegmentType.Element
            }]);
            
            const segments = segmenter.parse(utterance);

            const normalizedUtterance = segments.map((seg) => {
                return seg.type === SegmentType.Element? seg.original: seg.value.toLowerCase();
            }).reduce((prev, curr): string => {
                if (prev) {
                    return prev + curr;
                } else {
                    return curr;
                }
            });

            if (ModelBuilderHelper.isWildCardUtterance(normalizedUtterance)) {
                continue;
            } else if (ModelBuilderHelper.isBuiltInIntent(normalizedUtterance)) {
                continue;
            } else if (builtInIntents[normalizedUtterance]) {
                builtInUtterances.push(normalizedUtterance);
            } else if (ModelBuilderHelper.hasUserDefinedSlots(normalizedUtterance)) {
                const slotStandardUtterance = ModelBuilderHelper.standarizeSlottedUtterance(normalizedUtterance, registeredSlots);

                customSlotUtterances.push(slotStandardUtterance);
            } else if (ModelBuilderHelper.hasNumerics(normalizedUtterance)) {
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
        }
    }

    /**
     * Build a map of { slot name : slot type } registered within the given list of scene instructions.
     */
    static buildSlotMap(instructions: Instruction[]): {[key: string]: string} {
        const registeredSlots: {[key:string]: string} = {};

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

    static standarizeSlottedUtterance(utterance: string, slotMap: {[key: string]: string;}): string {
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

    static hasUserDefinedSlots(utterance: string) {
        return !!utterance.match(/{[\s\S]+?([ \t]+?as[ \t]+?[\s\S]+?)?}/g);
    }

    static hasNumerics(utterance: string) {
        return !!utterance.match(/[\d]+?/g);
    }

    static numberToAlphabetCounting(i: number) {
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

    static getSlotsFromUtterances(utterances: string[]): LanguageModelSlot[] {
        const slots: {[key:string]: LanguageModelSlot}= {};
        utterances.forEach((item) => {
            const segmenter = new Segmenter([{
                brackets: "{}",
                preserve: false,
                type: SegmentType.Element
            }]);
            
            const segments = segmenter.parse(item);

            for (let segment of segments) {
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
                    }
                }
            }
        });

        return Object.values(slots);
    }

    static convertSlotUtteranceForModel(utterances: string[]): string[] {
        const flattenedUtterance = JSON.stringify(utterances);

        const slotRegex = /{([\s\S]+?)[ \t]+?as[ \t]+?([\s\S]+?)}/g; 

        const correctedUtterances = flattenedUtterance.replace(slotRegex, (match, slotName, slotType): string => {
            return `{${slotName}}`;
        });

        return <string[]>JSON.parse(correctedUtterances);
    }

    static registerCategoryToStory(story: StoryMetadataHelper, utteranceToCategory: {[key:string]: IntentCategory;}) {
        const scenes = story.getAllScenes();
        for (let scene of scenes) {
            for (let content of scene.contents) {
                if (!content.sceneDirections) {
                    continue;
                }
    
                ModelBuilderHelper.registerCategoryToInstructions(content.sceneDirections, utteranceToCategory);
            }
        }
        story.setAllScenes(scenes);
    }

    static registerCategoryToInstruction(instruction: Instruction, utteranceToCategory: {[key:string]: IntentCategory;}) {
        if (instruction.parameters.utterances) {
            const uniqueIntentsUsed: any = {};

            for (let utterance of <string[]>instruction.parameters.utterances) {
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

    static registerCategoryToInstructions(instructions: Instruction[], utteranceToCategory: {[key:string]: IntentCategory;}) {
        for (let instruction of instructions) {
            if (instruction.directionType === InstructionType.CHOICE) {
                ModelBuilderHelper.registerCategoryToInstruction(instruction, utteranceToCategory);
            } else if (instruction.directionType === InstructionType.CONDITION) {
                if (instruction.parameters.directions && instruction.parameters.directions.length > 0) {
                    ModelBuilderHelper.registerCategoryToInstructions(instruction.parameters.directions, utteranceToCategory);
                }
            }
        }
    }
}