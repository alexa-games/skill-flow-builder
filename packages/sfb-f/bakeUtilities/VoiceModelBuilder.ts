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
import { LanguageModelValue, VoiceModel } from "./languageModel";
import { ModelBuildHelper } from "./modelBuildHelper";

export interface ModelBuildParameter {
    story: StoryMetadataHelper;
    locale: string;
    invocationName: string;
    customSlots: {[key: string]: string[]|LanguageModelValue[]};
    builtInIntents: {[key: string]: string[]};
    baseVoiceModel?: VoiceModel;
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
        
        ModelBuildHelper.autoIntentCount = 0;
        ModelBuildHelper.autoSlotCount = 0;

        const baseModel = param.baseVoiceModel;

        const builtInIntents = ModelBuildHelper.buildBuiltInSampleToIntentMap(param.builtInIntents);
        const categories = ModelBuildHelper.categorizeByIntent(storyAccessor, builtInIntents, baseModel);
        const voiceModel = ModelBuildHelper.buildVoiceModelFromCategory(categories, param.invocationName, param.customSlots, param.builtInIntents);

        if (baseModel) {
            ModelBuildHelper.applyBuiltInIntentSamples(voiceModel, baseModel);
            ModelBuildHelper.copyAdditionalAttributes(voiceModel, baseModel);
        }

        return voiceModel;
    }
}