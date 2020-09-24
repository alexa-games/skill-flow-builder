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

import { DriverExtension, InstructionExtension, DriverExtensionParameter, InstructionExtensionParameter, StoryStateHelper, Choice, SceneDirectionBuilder } from '@alexa-games/sfb-f';
import { ConfigAccessor } from './../configAccessor';

import * as path from 'path';
import * as fs from 'fs';
import { readUtf8FileExcludingBomSync } from '@alexa-games/sfb-util';

export interface ISPItem { 
    ISPID: string;
    productName: string;
}

export class AlexaMonetizationExtension implements DriverExtension, InstructionExtension {
    private enterMonetization: boolean = false;
    private workflowType: string = "";
    private activeProductISP: string = "";
    private productToISP: {[key: string]: string};

    public constructor(locale: string, configAccessor: ConfigAccessor) {
        const resourcePath = configAccessor.getResourcePath(locale);
        const ispConfigPath: string = path.resolve(resourcePath, configAccessor.getValue("isp-config-filename", undefined, locale));
        this.productToISP = {};
        if (!fs.existsSync(ispConfigPath)) {
            console.warn(`[WARN] ISP config '${ispConfigPath}' cannot be found.`);
        } else {
            try {
                let productISPConfig: ISPItem[] = JSON.parse(readUtf8FileExcludingBomSync(ispConfigPath));
                for (let ispItem of productISPConfig) {
                    this.productToISP[ispItem.productName] = ispItem.ISPID;
                }
            } catch (err) {
                console.warn(`[WARN] Badly formed JSON : ISP config '${ispConfigPath}' could not be opened.`);
            }
        }
    }

    async post(param: DriverExtensionParameter) {
        const handlerInput = param.userInputHelper.getHandlerInput();

        if (this.enterMonetization && handlerInput) {
            let directive: any = undefined;
			if (this.enterMonetization) {
                switch(this.workflowType) {
                case "buy": {
                    directive = this.generateBuyDirective(this.activeProductISP);
                    break;
                }
                case "refund": {
                    directive = this.generateCancelDirective(this.activeProductISP);
                    break;
                }
                }
            }
    
            if (directive) {
                handlerInput.responseBuilder.addDirective(directive);
            }
        }
    }

    async pre(param: DriverExtensionParameter) {
        const handlerInput = param.userInputHelper.getHandlerInput();

        if (handlerInput && handlerInput.requestEnvelope.request.type == "Connections.Response") {
            StoryStateHelper.setStoryPaused(param.storyState, false);
            
            param.userInputHelper.setInputIntent(this.parseAlexaMonetizationResponse(handlerInput.requestEnvelope));
        }        
    }

    async buy(param: InstructionExtensionParameter): Promise<void> {
        this.workflowType = "buy";

        this.registerMonetizationChoices(param);
    }

    async refund(param: InstructionExtensionParameter): Promise<void> {
        this.workflowType = "refund";

        this.registerMonetizationChoices(param);
    }

    private registerMonetizationChoices(param: InstructionExtensionParameter) {
        const instructionParam = param.instructionParameters;

        const successTarget: string = instructionParam.success? instructionParam.success.trim(): "";
        const failTarget: string = instructionParam.fail? instructionParam.fail.trim(): "";
        const declineTarget: string = instructionParam.declined? instructionParam.declined.trim(): failTarget;
        const errorTarget: string = instructionParam.error? instructionParam.error.trim(): failTarget;
        const alreadyTarget: string = instructionParam.already_purchased? instructionParam.already_purchased.trim(): failTarget;
        
        this.enterMonetization = true;

        let isp: string = this.productToISP[instructionParam.item];

        if (isp) {
            this.activeProductISP = isp;
        } else {
            throw new Error(`[AlexaMonetizationExtension Syntax Error] monetized item=[${instructionParam.item}] does not have the ISP configured.`);
        }

        if (this.enterMonetization) {
            let successChoice: Choice = {
                id: "purchase result sucess",
                sceneDirections: new SceneDirectionBuilder().goTo(successTarget).build(),
                utterances: ["Connections.Response.ACCEPTED"],
                saveToHistory: false
            }

            let declinedChoice: Choice = {
                id: "purchase result decline",
                sceneDirections: new SceneDirectionBuilder().goTo(declineTarget).build(),
                utterances: ["Connections.Response.DECLINED"],
                saveToHistory: false
            }

            let alreadyChoice: Choice = {
                id: "purchase result already purchased",
                sceneDirections: new SceneDirectionBuilder().goTo(alreadyTarget).build(),
                utterances: ["Connections.Response.ALREADY_PURCHASED"],
                saveToHistory: false
            }

            let errorChoice: Choice = {
                id: "purchase result error",
                sceneDirections: new SceneDirectionBuilder().goTo(errorTarget).build(),
                utterances: ["Connections.Response.ERROR"],
                saveToHistory: false
            }

            let forcedRelaunchChoice: Choice = {
                id: "purchase result launch",
                sceneDirections: new SceneDirectionBuilder().goTo(failTarget).build(),
                utterances: ["LaunchRequest"],
                saveToHistory: false
            }

            StoryStateHelper.enqueueAvailableChoice(param.storyState, successChoice);
            StoryStateHelper.enqueueAvailableChoice(param.storyState, declinedChoice);
            StoryStateHelper.enqueueAvailableChoice(param.storyState, alreadyChoice);
            StoryStateHelper.enqueueAvailableChoice(param.storyState, errorChoice);
            StoryStateHelper.enqueueAvailableChoice(param.storyState, forcedRelaunchChoice);
        }
    }

    private parseAlexaMonetizationResponse(response: any): string {
        let purchaseResult: string = "ERROR";

        if (response.request.payload) {
            purchaseResult = response.request.payload.purchaseResult;
            let productId: string = response.request.payload.productId;
    
            console.log("[INFO] Purchase Result: " + purchaseResult + " for Product ID: " + productId);    
        }

        return `Connections.Response.${purchaseResult}`;
    }

    /**
     * Generate buy directive for a given product.
     * As seen in https://developer.amazon.com/docs/in-skill-purchase/add-isps-to-a-skill.html#handle-results
     * @param productId 
     * @param token 
     */
    private generateBuyDirective(productId: string, token?: string): any {
        if(!token) {
            token = "noTokenProvided";
        }

        let buyDirective : any= {
            type: "Connections.SendRequest",
            name: "Buy",
            payload: {
                "InSkillProduct": {
                    "productId": productId
                }
            },
            token: token
        };

        return buyDirective;
    }

    /**
     * Generate refund directive for a given product.
     * As seen in https://developer.amazon.com/docs/in-skill-purchase/add-isps-to-a-skill.html#handle-results
     */
    private generateCancelDirective(productID:string, token: string = "noTokenProvided"): any {
        return {
            type: 'Connections.SendRequest',
            name: 'Cancel',
            payload: {
                InSkillProduct: {
                    productId: productID,
                }
            },
            token: token
        };
    }
}