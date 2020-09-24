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


import { HandlerInput, RequestHandler } from 'ask-sdk-core';
import { Response, Slot } from 'ask-sdk-model';
import { SFBDriver, UserInput, StoryMetadata, ABCImportPlugin, Choice, StoryStateHelper, Slot as ABCSlot, DriverExtension, ImporterExtension, InstructionExtension } from '@alexa-games/sfb-f';
import { ConfigAccessor } from '../configAccessor';

type ExtensionType = DriverExtension | ImporterExtension | InstructionExtension;
export interface SFBHandlerConfig {
    locale: string;
    story: StoryMetadata;
    pollyVoiceConfig: any;
    defaultVoiceConfig: any;
    attributeTableName: any;
}

export class SFBRequestHandler implements RequestHandler {
	public static debug = false;

	constructor(public config: SFBHandlerConfig, public customExtensions: ExtensionType[],
		public configAccessor: ConfigAccessor, public projectDir: string) {
    }

	canHandle(handlerInput : HandlerInput): boolean {
		return true;
    }

    getTableName(): string {
		return this.config.attributeTableName;
    }

	async handle(handlerInput : HandlerInput): Promise<Response> {
		if (SFBRequestHandler.debug) console.debug("Starting SFBRequestHandler handle().");
		const handleStart = new Date().getTime();

		// Load the story metadata
		const storyData: StoryMetadata = this.config.story;

		// Load persistent attributes (previous state)
		let gameState: any;

		try {
			if (SFBRequestHandler.debug) console.debug("Starting persistent attributes request.");
			const startTime = new Date().getTime();

			gameState = await handlerInput.attributesManager.getPersistentAttributes();
			const duration = new Date().getTime() - startTime;
			if (SFBRequestHandler.debug) console.debug(`Persistent attributes retrieved in ${duration}ms.`);
		} catch (error) {
			return this.buildPersistentAttributeErrorResponse(error, handlerInput);
		}

		// Set up import plugins used (if any)
		let customImportPlugins: ABCImportPlugin[] = [];

		let userInput: UserInput = {
			handlerInput: handlerInput
		}
		//this.parseAsUserInput(handlerInput, extensionLoader.monetizationExtension, sessionAttributes);

		// Set up the ABC Story Driver
		let storyDriver: SFBDriver = new SFBDriver(storyData, customImportPlugins, this.customExtensions, this.config.pollyVoiceConfig, this.config.locale);

        // Configure default polly narrator
        const NARRATOR: any = this.config.defaultVoiceConfig;
		if (NARRATOR && this.config.defaultVoiceConfig.enabled) {
			storyDriver.configureDefaultPollyNarrator(NARRATOR);
			storyDriver.turnOnDefaultPolly();
		} else {
			storyDriver.turnOffDefaultPolly();
		}

		/*
		* RUN Content
		*/
		console.log(`[INFO] Begin story run with state: ${JSON.stringify(gameState, null, 4)}`);
		const startTime = new Date().getTime();

		await storyDriver.resumeStory(userInput, gameState);

		const duration = new Date().getTime() - startTime;
		if (SFBRequestHandler.debug) console.debug(`SFB Driver finished in ${duration}ms.`);

		// Save the story state for the session
		const resultState = storyDriver.getCurrentStoryState();
		console.log(`[INFO] Story run complete with state=${JSON.stringify(resultState, null, 4)}`);
		handlerInput.attributesManager.setPersistentAttributes(resultState);

		const saveStartTime = new Date().getTime();
		await handlerInput.attributesManager.savePersistentAttributes();
		const saveDuration = new Date().getTime() - saveStartTime;
		if (SFBRequestHandler.debug) console.debug(`persistent attributes saved in ${saveDuration}ms.`);

		const response = handlerInput.responseBuilder.getResponse();

		/**
		 * Some fundamental Alexa Response rules
		 */
		if (response.directives) {
			for (let directive of response.directives) {
				if (directive.type === "Connections.SendRequest" ||
				    directive.type === "AudioPlayer.Play") {
					// should end session has to be TRUE when sending Connections.SendRequest response.
					response.shouldEndSession = true;
					break;
				}
			}
		}

		if (response.shouldEndSession && response.reprompt) {
			// cannot have reprompt when shouldEndSession is true.
			delete response.reprompt;
		}
		const handleDuration = new Date().getTime() - handleStart;
		if (SFBRequestHandler.debug) console.debug(`SFB Request Handler handle() finished in ${handleDuration}ms.`);

		return response;
	}

	protected isPausingRequest(handlerInput: HandlerInput): boolean {
		if (handlerInput.requestEnvelope.request.type === "SessionEndedRequest") {
			return true;
		}

		if (handlerInput.requestEnvelope.request.type === 'IntentRequest') {
			const intent = handlerInput.requestEnvelope.request.intent.name;

			return intent == "SessionEndedRequest" || intent == "AMAZON.StopIntent" || intent == "AMAZON.PauseIntent" || intent == "AMAZON.CancelIntent"
		}

		return false;
	}

	private buildPersistentAttributeErrorResponse(error: any, handlerInput: HandlerInput): Response {
		let err: string = error.toString();
		if (err.match(new RegExp("is not authorized to perform", "gi")) != null) {
			return handlerInput.responseBuilder
				.speak("Could not create or access your DynamoDB Table. Please verify that your IAM role has a Full Access permission to use DynamoDB.")
				.getResponse();
		} else if (err.match(new RegExp("Requested resource not found", "gi")) != null) {
			return handlerInput.responseBuilder
				.speak("A DynamoDB Table for this skill is being created. Please try again in 5 minutes.")
				.getResponse();
		} else {
			return handlerInput.responseBuilder
				.speak("Something went wrong while loading your progress. Try again later, and if the problem persists please contact the skill publisher.")
				.getResponse();
		}
	}
}

