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

import { ImporterExtension, DriverExtension, InstructionExtension, DriverExtensionParameter, UserInputHelper, SFBDriver as SFBDriver, StoryMetadata, Slot } from '@alexa-games/sfb-f';
import { PersistenceAdapter, AttributesManagerFactory, ResponseFactory, HandlerInput } from 'ask-sdk';

import { AlexaRequestBuilder } from './alexaRequestBuilder';

type SFBExtension = ImporterExtension | DriverExtension | InstructionExtension;

export class DriverExtensionTester {
    private storyState: {[key: string]: any;};
    private story: StoryMetadata;
    private locale: string;
    private extensions: SFBExtension[];
    private request: any;

    constructor(testingParam: {
        storyState: {[key: string]: any;};
        story: StoryMetadata;
        locale: string;
        extensions: SFBExtension[];
    }) {
        this.storyState = testingParam.storyState;
        this.story = testingParam.story;
        this.locale = testingParam.locale;
        this.extensions = testingParam.extensions;
        this.request = {};
    }

    public givenStory(story: StoryMetadata) {
        this.story = story;
    }

    public givenState(state: {[key: string]: any;}) {
        this.storyState = state;
    }

    public givenLocale(locale: string) {
        this.locale = locale;
    }

    public givenExtensions(extensions: SFBExtension[]) {
        this.extensions = extensions;
    }

    public async givenLaunchRequest() {
        const requestBuilder = new AlexaRequestBuilder();
        requestBuilder.setRequestType("LaunchRequest");

        requestBuilder.setNewSession(true);

        this.request = requestBuilder.build();
    }

    public async givenSessionEndedRequest() {
        const requestBuilder = new AlexaRequestBuilder();

        requestBuilder.setRequestType("SessionEndedRequest");

        this.request = requestBuilder.build();
    }

    public async givenIntentRequest(intent: string) {
        const requestBuilder = new AlexaRequestBuilder();

        requestBuilder.setIntent(intent);

        this.request = requestBuilder.build();
    }

    public async givenIntentRequestWithSlots(intentName: string, slots: Slot[]) {
        const requestBuilder = new AlexaRequestBuilder();

        slots.forEach((slot) => {
            requestBuilder.addSlot(intentName, slot.name, slot.value);
        });

        this.request = requestBuilder.build();
    }

    public generateDriverExtensionParameter(): DriverExtensionParameter {
        const driver = new SFBDriver(this.story, [], this.extensions, undefined, this.locale);

        driver.storyState = this.storyState;
        
        return {
            driver: driver,
            locale: this.locale,
            storyState: this.storyState,
            userInputHelper: new UserInputHelper({
                handlerInput: this.buildInputHandler(this.request, {})
            })
        };
    }

    private buildInputHandler(requestEvent: any, requestContext: any, persistenceAdapter?: PersistenceAdapter): HandlerInput {
        return {
            requestEnvelope: requestEvent,
            context: requestContext,
            attributesManager: AttributesManagerFactory.init({
                requestEnvelope: requestEvent,
                persistenceAdapter: persistenceAdapter,
            }),
            responseBuilder: ResponseFactory.init(),
            serviceClientFactory: undefined
        };
    }
}