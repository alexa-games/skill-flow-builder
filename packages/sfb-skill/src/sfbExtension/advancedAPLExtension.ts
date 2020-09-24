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

import { SFBDriver, DriverExtensionParameter, VisualOptions } from '@alexa-games/sfb-f';
import { ConfigAccessor } from './../configAccessor';
import { AlexaAPLExtension } from './alexaAPLExtension';
import { HandlerInput } from 'ask-sdk';
import * as _ from 'lodash';

const ALEXA_SPEECH_TEXT_BLOCK_ID = "alexaSpeechTextBlock";
const ALEXA_SPEECH_ID = "alexaSpeech";

export class AdvancedAPLExtension extends AlexaAPLExtension {

    constructor(locale: string, configAccessor: ConfigAccessor) {
        super(locale, configAccessor);
    }

    async post(param: DriverExtensionParameter) {
        const handlerInput = param.userInputHelper.getHandlerInput();
        const driver = param.driver;

        let visualProperties: VisualOptions[] | undefined = await driver.getVisuals();

        // Visual properties list looks like
        /*
            [
                {
                    "template": "default",
                    "background": "https://sfb-framework.s3.amazonaws.com/examples/images/green-plant.jpg",
                    "title": "",
                    "subtitle": "",
                    "sceneID": "intro"
                }
                ,
                {
                    "template": "default2",
                    "background": "https://sfb-framework.s3.amazonaws.com/examples/images/blue-sea.jpg",
                    "title": "",
                    "subtitle": "",
                    "sceneID": "intro2"
                }
            ]
        */

        // Only handle the visual response if there are some visual properties in this request
        if (handlerInput && visualProperties && visualProperties.length > 0 && this.aplHelper.supportsDisplay(handlerInput)) {
            await this.handleVisualResponse(visualProperties, handlerInput, driver);
        }
    }

    // Handle touch events
    async pre(param: DriverExtensionParameter) {
        const handlerInput = param.userInputHelper.getHandlerInput();

        // Arguments are in format: ["Utterance", "utterance goes here"]
        // or ["SlotNameValue", "slotName goes here", "slotValue goes here"]

        if (_.get(handlerInput, "requestEnvelope.request.type", "") === "Alexa.Presentation.APL.UserEvent") {

            const command = _.get(handlerInput, "requestEnvelope.request.arguments[0]", "");

            if(command === "Utterance") {
                const utterance = _.get(handlerInput, "requestEnvelope.request.arguments[1]", "");
                if(utterance) {
                    param.userInputHelper.setInputValue(utterance);
                }
            }

            if(command === "SlotNameValue") {
                const slotName = _.get(handlerInput, "requestEnvelope.request.arguments[1]", "");
                const slotValue = _.get(handlerInput, "requestEnvelope.request.arguments[2]", "");

                if(slotName && slotValue) {
                    param.userInputHelper.addInputSlot(slotName, slotValue);
                }
            }
        }
    }
    

    async handleVisualResponse(visualProperties: VisualOptions[], handlerInput: HandlerInput, driver: SFBDriver) {

        this.deserializeVisualProperties(visualProperties);

        // Handle the visual options for this response
        let combinedVisualProps = { ...visualProperties[0] };

        // Then add a list of all of the visual properties for scenes that follow, including the first one
        combinedVisualProps.scenes = [];

        visualProperties.forEach((visualProp) => {

            // Only add scenes that actually specify templates or layouts, otherwise they could just be commands that don't
            // want to transition scenes
            // TOOD: Check for onlyCommands on a default template, which means to not add it to this list or above when
            // adding nextScene commands
            if( (visualProp.template && visualProp.template !== "default") || visualProp.layout) {
                combinedVisualProps.scenes.push(visualProp);
            }
        });

        // render our default response. Note: This function really should only always return a single apl directive.
        let visualDirectives: any[] = this.aplHelper.generateAPLDirectiveWithVisualOptions([combinedVisualProps]);

        // If no APL directives, then don't return any extra APL commands or APL audio
        if (visualDirectives.length > 0) {

            // Make a clone so that when layouts/commands are added it does not modify the original template
            visualDirectives[0] = _.cloneDeep(visualDirectives[0]);

            // special case: If this was a 'dynamic-pager' template, load all layouts/commands dynamically
            if(combinedVisualProps && combinedVisualProps.template === 'dynamic-pager') {
                this.addLayoutsAndCommandsToDynamicPagerDirective(visualDirectives[0], combinedVisualProps.scenes);
            }

            const aplCommandResult = await this.buildAPLCommandsAndAudio(visualDirectives, visualProperties, handlerInput, driver);

            // Only if there were some additional visual directives to execute, modify the apl document to include extra SpeakItem components
            if (aplCommandResult.addedANonAudioCommand) {

                // Before returning the direcives, add any additional speak item text components and datasources
                for (let aplDirective of visualDirectives) {

                    // Find the SFB containger in the APL doc to add these SpeakItem components to
                    const aplSFBContainer = deepSearch(aplDirective, "id", (k : string, v : any) => v === 'SFBAudioAndAlexaSpeechContainer');

                    if(aplSFBContainer && aplSFBContainer.items) {
                        // Add in any speak item text blocks
                        aplCommandResult.textComponents.forEach((speakItemTextComponent: any) => {
                            aplSFBContainer.items.push(speakItemTextComponent);
                        });
                    }

                    // Add in any additional datasources
                    aplCommandResult.textDatasources.forEach((speakItemTextDatasource: any, index: number) => {
                        aplDirective.datasources[ALEXA_SPEECH_ID + index] = speakItemTextDatasource;
                    });
                }
            }

            // Now add the directives
            for (let aplDirective of visualDirectives) {
                handlerInput.responseBuilder.addDirective(aplDirective);
            }

            // Only if there were some additional visual directives to execute, add them and blank out the "speak" from this request.
            if (aplCommandResult.addedANonAudioCommand) {

                handlerInput.responseBuilder.addDirective({
                    "type": "Alexa.Presentation.APL.ExecuteCommands",
                    "token": "ABC_RENDERED_DOCUMENT",
                    "commands": aplCommandResult.commands
                });

                handlerInput.responseBuilder.speak("");
            }
        }

    }

    addLayoutsAndCommandsToDynamicPagerDirective(visualDirective: any, scenes: any[]) {
        
        const allAplTemplates = this.aplHelper.getAPLTemplates();
        if(!allAplTemplates) {
            return;
        }

        visualDirective.document.layouts = visualDirective.document.layouts || {};
        visualDirective.document.commands = visualDirective.document.commands || {};

        let layoutNames = new Set();

        // Loop through all requested layouts, and add them to a set
        scenes.forEach((scene) => {
            const layoutName = scene.layout;
            if(layoutName) {
                layoutNames.add(layoutName);
            }
        });

        // Now loop through all templates, and find all relevant templates
        Object.keys(allAplTemplates).forEach((templateName) => {

            const templateLayouts = allAplTemplates[templateName].document.layouts;
            const templateCommands = allAplTemplates[templateName].document.commands;

            if(templateLayouts) {
                for(const layoutName of Object.keys(templateLayouts)) {

                    if(layoutNames.has(layoutName)) {

                        // If this templateName contains at least one layout that is relevant, add all the layouts and commands from this apl template
                        visualDirective.document.layouts = _.assign(visualDirective.document.layouts, templateLayouts);
                        visualDirective.document.commands = _.assign(visualDirective.document.commands, templateCommands);

                        break;
                    }
                };
            }
        });

        // Now the visualDirective has all layouts/commands added from relevant APL Template files
    }

    // Build up the sequential and parallel command sequences to group each visual scene's audio elements with any APL commands for that scene
    async buildAPLCommandsAndAudio(visualDirectives: any[], visualProperties: VisualOptions[], handlerInput: HandlerInput, driver: SFBDriver) {

        const firstAPLDirective = visualDirectives[0];
        const alexaSpokenDialogueList : string[] = [];

        // Get specific apl commands for this scene if there are any 'commands' in the document section
        const documentSpecificCommands = (firstAPLDirective.document && firstAPLDirective.document.commands) ? firstAPLDirective.document.commands : {};

        // Now get the text per scene
        const speechOutputScenesPerScene: any[] = await driver.getSpeechSSMLTextPerScene();
        const visitedSceneIds: string[] = driver.getVisitedSceneIDsOnRun();

        console.log("VISUALSCENES");
        console.log(JSON.stringify(visualProperties, undefined, 4));
        console.log(JSON.stringify(speechOutputScenesPerScene, undefined, 4));

        // Now build a series of apl commands, which start each scene's narrationa and commands in parallel for each scene.

        const overallAplCommandList: any[] = [];

        // Loop variables for the speech/audio scenes
        let speechOutputSceneIndex = 0;
        let nextSpeechScene: any = undefined;
        if (speechOutputScenesPerScene.length > speechOutputSceneIndex) {
            nextSpeechScene = speechOutputScenesPerScene[speechOutputSceneIndex];
        }

        // Loop variables for the visual scenes
        let visualSceneIndex = 0;
        let visualTemplateLayoutPgIndex = 0;
        let nextVisualScene: any = undefined;
        if (visualProperties.length > visualSceneIndex) {
            nextVisualScene = visualProperties[visualSceneIndex];
        }

        let addedANonAudioCommand = false;

        visitedSceneIds.forEach((visitedSceneId, sceneIndex) => {

            const sceneCommandList: any[] = [];

            console.log("SCENE");
            console.log(JSON.stringify(nextVisualScene, undefined, 4));
            console.log(JSON.stringify(nextSpeechScene, undefined, 4));

            if (nextSpeechScene && nextSpeechScene.sceneID === visitedSceneId) {

                // Add any audio/narration for this scene
                this.addAudioForScene(nextSpeechScene, sceneCommandList, alexaSpokenDialogueList);

                // Advance to next speech scene
                speechOutputSceneIndex++;
                if (speechOutputScenesPerScene && speechOutputScenesPerScene.length > speechOutputSceneIndex) {
                    nextSpeechScene = speechOutputScenesPerScene[speechOutputSceneIndex];
                } else {
                    nextSpeechScene = undefined;
                }
            }

            if (nextVisualScene && nextVisualScene.sceneID === visitedSceneId) {

                const beforeCount = sceneCommandList.length;

                // Add any commands for this scene
                this.addVisualCommandsForScene(nextVisualScene, sceneCommandList, visualTemplateLayoutPgIndex, documentSpecificCommands);

                // Check to see if any visual scenes were added, flag if so otherwise keep flag value
                addedANonAudioCommand = addedANonAudioCommand || (beforeCount !== sceneCommandList.length);

                // Advance to next visual scene
                visualSceneIndex++;
                if (visualProperties && visualProperties.length > visualSceneIndex) {
                    nextVisualScene = visualProperties[visualSceneIndex];
                } else {
                    nextVisualScene = undefined;
                }

                // Check to see if we really need to advance the visual template/layout index, as some visual properties only
                // contain commands
                if( nextVisualScene && ((nextVisualScene.template && nextVisualScene.template !== "default") || nextVisualScene.layout)) {
                    visualTemplateLayoutPgIndex++;
                }

            }

            // Now add all these commands in parallel to the overall command list
            if (sceneCommandList.length > 0) {
                overallAplCommandList.push(
                    {
                        "type": "Parallel",
                        "commands": sceneCommandList
                    }
                );
            }

        });

        // Generate extra components/datasources required for Alexa SpeakItem requests
        const speakItemRequests = this.generateAlexaSpeakItemComponents(alexaSpokenDialogueList);

        // Return a list of commands and also a flag indicating if any were non audio commands (like user defined APL commands)
        return {commands: overallAplCommandList, addedANonAudioCommand, textComponents: speakItemRequests.textComponents, textDatasources: speakItemRequests.textDatasources};
    }

    generateAlexaSpeakItemComponents(alexaSpeechList: string[]) : { textComponents: any[], textDatasources: any[] } {

        let additionalTextBlocks: any[] = [];
        let additionalDataSources: any[] = [];

        alexaSpeechList.forEach((speechSSML, index) => {

            additionalTextBlocks.push(
                {
                    "type": "Text",
                    "speech": "${payload." + ALEXA_SPEECH_ID + index + ".properties.speech}",
                    "id": ALEXA_SPEECH_TEXT_BLOCK_ID + index
                }
            );

            additionalDataSources.push(
                {
                    "type": "object",
                    "properties": {
                        "ssml": `<speak>${speechSSML}</speak>`
                    },
                    "transformers": [
                        {
                            "inputPath": "ssml",
                            "outputName": "speech",
                            "transformer": "ssmlToSpeech"
                        }
                    ]
                }
            );
        });

        return { textComponents: additionalTextBlocks, textDatasources: additionalDataSources};
    }

    // Add audio commands for all the audio files in this scenes SSML text, play them sequentially
    // Scene content looks like
    /*
    {
        "sceneID": "intro",
        "sceneAudioItem": {
            "sceneID": "intro",
            "foreground": [
                {
                    "type": "polly",
                    "content": "Welcome to our story. We are <emphasis>very</emphasis> happy you joined us.",
                    "volume": "1.0",
                    "delay": 0,
                    "options": {
                        "pitch": "+22%",
                        "rate": "+12%",
                        "voice": "Salli"
                    }
                }
            ],
            "background": [
                {
                    "type": "audio",
                    "content": "https://sfb-framework.s3.amazonaws.com/examples/images/dark-background.jpg",
                    "volume": 1,
                    "delay": 0,
                    "options": {
                        "blend": "undefined"
                    }
                }
            ]
        },
        "ssml": "<audio src='https://s3.amazonaws.com/sfb-framework/tempPolly/445aab7b1dccffaf51254f4cecc5b900.mp3' /><audio src='https://s3.amazonaws.com/sfb-example/tempPolly/otherSfx.mp3' />"
    }
    */
    addAudioForScene(scene: any, sceneCommandList: any[], alexaSpokenDialogueList: string[]) {
        // Handle Alexa voice as well as audio tag responses and mixtures of the two
        let audioCommandListToPlay: any[] = [];

        // Trim string if defined
        const ssml = scene.ssml ? scene.ssml.trim() : scene.ssml;

        let partitioningRegex: RegExp = /(<audio[\s]+src='[^><]+?'[\s]*?\/>)|([\s\S]+?)(?=<audio|$)/g;    
        let partitionMatch: string[] | null = partitioningRegex.exec(ssml);
    
        while (partitionMatch != null) {
            
            if (partitionMatch[1] && partitionMatch[1].trim().length > 0) {

                const srcUrlRegex = /<audio src='([^']*?)'/g;
                let srcUrlMatch = srcUrlRegex.exec(partitionMatch[1]);

                if (srcUrlMatch && srcUrlMatch.length > 1) {
                    const audioUrl = srcUrlMatch[1];

                    // Play all the audio files in the *say section for this scene
                    let playAudioCommand: any = {
                        "type": "PlayMedia",
                        "componentId": "audioPlayerId",
                        "source": audioUrl
                    };

                    audioCommandListToPlay.push(playAudioCommand);
                }


            } else if (partitionMatch[2] && partitionMatch[2].trim().length > 0) {   

                // Add a command for the SpeakItem and add it to the spken dialogue list so that a text component and datasource can be created for this SpeakItem
                const speakItemText = partitionMatch[2].trim();

                let speakItemCommand = {
                    "delay": 200,
                    "type": "SpeakItem",
                    "componentId": ALEXA_SPEECH_TEXT_BLOCK_ID + alexaSpokenDialogueList.length,
                    "highlightMode": "line",
                    "align": "center"
                };

                audioCommandListToPlay.push(speakItemCommand);

                alexaSpokenDialogueList.push(speakItemText);
            }
    
            partitionMatch = partitioningRegex.exec(ssml);
        }


        if (audioCommandListToPlay.length > 0) {
            sceneCommandList.push({
                "type": "Sequential",
                "commands": audioCommandListToPlay
            });
        }
    }

    addVisualCommandsForScene(scene: any, sceneCommandList: any[], pgIndex: number, documentSpecificCommands: any) {
        // Make sure these are done in parallel with the PlayMedia/Speech command further below
        // Also make sure they are done in parallel with each other? (because you could use different scenes if you wanted them sequentially?)
        // or use some sort of flag to group parallel vs. sequential commands

        if (pgIndex !== 0) {
            // Add a nextScene command if defined and not the first pgIndex,
            // and the given visual scenes has a "template" or "layout" property, and that they are not default because that could
            // mean that they are only using commands
            if( (scene.template && scene.template !== "default") || scene.layout) {
                this.addCommandIfExists("nextScene", sceneCommandList, documentSpecificCommands, pgIndex);
            }
        }

        // Push any commands from this visual command
        if (scene.commands) {
            scene.commands.forEach((commandName: string) => {
                this.addCommandIfExists(commandName, sceneCommandList, documentSpecificCommands, pgIndex);
            });
        }
    }

    addCommandIfExists(command: string, commandList: any[], documentSpecificCommands: any, pgIndex: number) {
        // Check for document specific nextScene command first, then default nextScene from apl-commands file second
        if (documentSpecificCommands[command]) {
            commandList.push({
                "type": command,
                "pgIndex": pgIndex // Set pgIndex which can be used to reference components by id of what page they are on
            });

        } else {
            const commandFromCommonFile = this.aplHelper.generateAPLCommand(command);
            if (commandFromCommonFile) {
                commandFromCommonFile['pgIndex'] = pgIndex; // Set pgIndex which can be used to reference components by id of what page they are on
                commandList.push(commandFromCommonFile);
            }
        }
    }

    // Mutate visualProperties from string values to objects if the string starts with [ or {, as it could be a JSON
    // array or object. 
    deserializeVisualProperties(visualProperties: VisualOptions[]) {

        visualProperties.forEach((visualProp) => {

            for(var propt in visualProp){
                if(typeof(visualProp[propt]) === 'string') {
                    if(visualProp[propt].startsWith("{") || visualProp[propt].startsWith("[")) {
                        try {
                            // try to deserialize from JSON
                            const jsonObj = JSON.parse(visualProp[propt]);

                            visualProp[propt] = jsonObj;

                        } catch(e) {
                            // Not a JSON object so do nothing
                        }
                    }
                }
            }
            
        });
    }

}

function deepSearch(object : any, key : string, predicate : any) : any {

    if (object.hasOwnProperty(key) && predicate(key, object[key]) === true) {
        return object;
    }

    for (let i = 0; i < Object.keys(object).length; i++) {
      if (typeof object[Object.keys(object)[i]] === "object") {
        let o : any = deepSearch(object[Object.keys(object)[i]], key, predicate);
        if (o != null) {
            return o;
        }
      }
    }
    return null;
}

