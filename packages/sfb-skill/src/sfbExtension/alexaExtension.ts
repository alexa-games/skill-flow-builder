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

import { DriverExtension, DriverExtensionParameter, UserInput, Slot as SFBSlot, StoryStateHelper } from '@alexa-games/sfb-f';
import { HandlerInput } from 'ask-sdk';

export class AlexaExtension implements DriverExtension {
    async post(param: DriverExtensionParameter) {
        const driver = param.driver;
        const handlerInput = param.userInputHelper.getHandlerInput();

        if (handlerInput) {
            const ssmlPromises: Promise<string>[] = [
                driver.getSpeechSSMLText(),
                driver.getRepromptSSMLText()
            ];
            
            const resultSSML = await Promise.all(ssmlPromises);

            const speechOutput: string = resultSSML[0]; 

            // reprompt speech (speech for when player doesn't respond in 8 seconds)
            let repromptOutput: string = resultSSML[1];

            if(!repromptOutput || repromptOutput.trim().length === 0) {
                // reprompt with speech if not defined by the content.
                repromptOutput = speechOutput;
            }

            if (StoryStateHelper.isStoryPaused(driver.getCurrentStoryState()) || StoryStateHelper.isEndingReached(driver.getCurrentStoryState())) {
                handlerInput.responseBuilder.withShouldEndSession(true);
            } else {
                handlerInput.responseBuilder.reprompt(repromptOutput);
            }
            
            handlerInput.responseBuilder
            .speak(speechOutput)
            .getResponse();
        }
    }

    async pre(param: DriverExtensionParameter) {
        const inputHelper = param.userInputHelper;
        const handlerInput = inputHelper.getHandlerInput();

        if (handlerInput) {
            const parsedInput = this.parseASKHandlerInput(handlerInput);
            if (parsedInput.intent) inputHelper.setInputIntent(parsedInput.intent);
            if (parsedInput.value) inputHelper.setInputValue(parsedInput.value);
            if (parsedInput.slots) inputHelper.setInputSlots(parsedInput.slots);
        }

        const isPausingIntent = this.isPausingIntent(inputHelper.getInputIntent() || "");
        const isForceQuitIntent = this.isForceQuitIntent(inputHelper.getInputIntent() || "");
        const isIntentExpected = StoryStateHelper.isInputExpected(param.storyState, inputHelper.getUserInput(), param.locale);

        if (isForceQuitIntent || (isPausingIntent && !isIntentExpected)) {
            param.driver.pauseStory();
        }
    }

    private parseASKHandlerInput(handlerInput: HandlerInput): UserInput {
        // Parse the incoming request
        let userInput: UserInput = {
        }

        if (handlerInput.requestEnvelope.request.type === 'LaunchRequest' || handlerInput.requestEnvelope.request.type === 'SessionEndedRequest') {
            userInput.intent = handlerInput.requestEnvelope.request.type;
        } else if (handlerInput.requestEnvelope.request.type === 'IntentRequest') {
            userInput.intent = handlerInput.requestEnvelope.request.intent.name;

            let slots: {[key: string]: any} | undefined = handlerInput.requestEnvelope.request.intent.slots;
            let foundSlots: SFBSlot[] = [];
            let valueStringCollections: string = "";

            if (slots) {
                for (let slotName of Object.keys(slots)) {
                    if (slots[slotName] && slots[slotName].value) {
                        let resolutionEntities: any = slots[slotName].resolutions;

                        let slotIndexToUse = 0;
                        if (resolutionEntities && resolutionEntities.resolutionsPerAuthority) {
                            for(let i = 0; i < resolutionEntities.resolutionsPerAuthority.length; i++) {
                                
                                console.log("CHECKING " + i + " " + JSON.stringify(resolutionEntities.resolutionsPerAuthority[i]));

                                if(resolutionEntities.resolutionsPerAuthority[i].status.code === 'ER_SUCCESS_MATCH') {
                                    slotIndexToUse = i;
                                    console.log("BREAKING at : " + slotIndexToUse);
                                    break;
                                }
                            }
                        }

                        if (resolutionEntities && resolutionEntities.resolutionsPerAuthority && resolutionEntities.resolutionsPerAuthority[slotIndexToUse]
                            && resolutionEntities.resolutionsPerAuthority[slotIndexToUse].status.code === 'ER_SUCCESS_MATCH') {
                                let resolution: string = resolutionEntities.resolutionsPerAuthority[slotIndexToUse].values[0].value.name;
                                foundSlots.push({
                                    name: slots[slotName].name,
                                    value: resolution
                                });
                                
                                valueStringCollections += " " + resolution;
                        } 
                        else if (!resolutionEntities || !resolutionEntities.resolutionsPerAuthority){
                            foundSlots.push({
                                name: slots[slotName].name,
                                value: slots[slotName].value || ""
                            });	
                            valueStringCollections += " " + slots[slotName].value;
                        }
                    }
                }
            }

            if (valueStringCollections.trim().length > 0) {
                userInput.value = valueStringCollections.trim();
            }

            userInput.slots = foundSlots;
        }

        return userInput;
    }

    private isPausingIntent(intent: string): boolean {
        return intent == "AMAZON.PauseIntent" || intent == "AMAZON.CancelIntent";
    }

    private isForceQuitIntent(intent: string): boolean {
        return intent == "SessionEndedRequest" || intent == "AMAZON.StopIntent";
	}
}