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

/**
 * Last Updated Aug-13-2019
 * As found in https://developer.amazon.com/docs/smapi/interaction-model-schema.html
 */

export interface VoiceModel {
    languageModel: LanguageModel;
}

export interface LanguageModel {
    invocationName: string;
    intents: LanguageModelIntent[];
    types?: LanguageModelSlotType[];
}

export interface LanguageModelIntent {
    name: string;
    slots?: LanguageModelSlot[];
    samples?: string[];
}

export interface LanguageModelSlot {
    name: string;
    type: string;
    samples?: string[];
}

export interface LanguageModelSlotType {
    name: string;
    values: LanguageModelValue[];
}

export interface LanguageModelValue {
    id?: string;
    name: {
        value: string;
        synonyms?: string[];
    };
}

export class LanguageModelBuilder {
    private model: VoiceModel;
    constructor(invocationName: string) {
        this.model = {
            languageModel: {
                intents: [],
                invocationName: invocationName,
            }
        }
    }

    public build(): VoiceModel {
        return this.model;
    }

    public addSlotSamplesToIntent(intentName: string, samples: string[], slots: LanguageModelSlot[]) {
        if (this.intentExists(intentName)) {
            for (let intentItem of this.model.languageModel.intents) {
                if (intentItem.name === intentName) {
                    const combinedSamples =  this.concatDedupe(samples, intentItem.samples || [], (a) => {
                        return a;
                    });

                    const combinedSlots = this.concatDedupe(slots, intentItem.slots || [], (a) => {
                        return a.name;
                    });

                    intentItem.samples = combinedSamples;
                    intentItem.slots = combinedSlots;
                    break;
                }
            }
        } else {
            this.addIntent({
                name: intentName,
                samples: samples,
                slots: slots
            });
        }

        return this;
    }

    public addIntent(intent: LanguageModelIntent): LanguageModelBuilder {
        if (this.intentExists(intent.name)) {
            for (let intentItem of this.model.languageModel.intents) {
                if (intentItem.name === intent.name) {
                    intentItem.samples = intent.samples;
                    intentItem.slots = intent.slots;
                    break;
                }
            }
        } else {
            this.model.languageModel.intents.push(intent);
        }

        return this;
    }

    public addSlotType(slotType: LanguageModelSlotType): LanguageModelBuilder {
        if (!this.model.languageModel.types) {
            this.model.languageModel.types = [];
        }

        if (this.slotTypeExists(slotType.name)) {
            for (let typeItem of this.model.languageModel.types) {
                if (typeItem.name === slotType.name) {
                    typeItem.values = slotType.values;
                    break;
                }
            }
        } else {
            this.model.languageModel.types.push(slotType);
        }

        return this;
    }

    public addSlotValues(slotTypeName: string, values: (string|LanguageModelValue)[]) {
        if (!this.model.languageModel.types) {
            this.model.languageModel.types = [];
        }

        const slotValues = [];

        for (let valueItem of values) {
            if (LanguageModelBuilder.isSlotValue(valueItem)){
                slotValues.push(valueItem);
            } else if (typeof(valueItem) === "string") {
                slotValues.push(this.buildSlotValue(valueItem));
            }
        }

        if (this.slotTypeExists(slotTypeName)) {
            for (let typeItem of this.model.languageModel.types) {
                if (typeItem.name === slotTypeName) {
                    const combined =  this.concatDedupe(typeItem.values, slotValues, (a) => {
                        return JSON.stringify(a);
                    });

                    typeItem.values = combined;
                    break;
                }
            }
        } else {
            this.model.languageModel.types.push({
                name: slotTypeName,
                values: slotValues
            });
        }
    }

    public slotTypeExists(slotTypeName: string) {        
        if (this.model.languageModel.types) {
            for (let type of this.model.languageModel.types) {
                if (type.name === slotTypeName) {
                    return true;
                }
            }
        } 

        return false;
    }

    public intentExists(intentName: string) {
        for (let intent of this.model.languageModel.intents) {
            if (intent.name === intentName) {
                return true;
            }
        }

        return false;
    }

    public buildSlotValue(value: string): LanguageModelValue {
        return {
            name: {
                value: value
            }
        }
    }

    private concatDedupe<T>(arr1: T[], arry2: T[], hash:(a:T) => string): T[] {
        const result: {[key: string]: T} = {};

        arr1.forEach((item) => {
            const itemHash = hash(item);
            result[itemHash] = item;
        });

        arry2.forEach((item) => {
            const itemHash = hash(item);
            result[itemHash] = item;
        })

        return Object.values(result);
    }

    /**
     * Verifies if the object is an instance of interface [[LanguageModelValue]]
     */
    static isSlotValue(object: any): object is LanguageModelValue {
        let isSlotValue = true;

        const isObject = typeof(object) === "object";

        isSlotValue = isSlotValue && isObject;

        if (isObject) {
            const hasID = "id" in object;
            const hasName = "name" in object;

            isSlotValue = isSlotValue && hasName;
            if (hasID) {
                isSlotValue = isSlotValue && typeof(object.id) === "string";
            }

            if (hasName) {
                const isNameCorrect = typeof(object.name) === "object";
                const isNameValueCorrect = isNameCorrect && "value" in object.name && typeof(object.name.value) === "string";
                const hasSynonyms = isNameCorrect && "synonyms" in object.name;

                isSlotValue = isSlotValue && isNameCorrect && isNameValueCorrect;

                if (hasSynonyms) {
                    const isNameSynonymsCorrect =  typeof(object.name.synonyms) === "object";
                    
                    isSlotValue = isSlotValue && isNameSynonymsCorrect;

                    const hasNameSynonymsItem = isNameSynonymsCorrect && object.name.synonyms[0];
                    if (hasNameSynonymsItem) {
                        const isNameSynonymsItemCorrect = typeof(object.name.synonyms[0]) === "string";
                        isSlotValue = isSlotValue && isNameSynonymsItemCorrect;
                    }
                }
            }
        }

        return isSlotValue;
    }
}