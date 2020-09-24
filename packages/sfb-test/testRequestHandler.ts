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

import { SFBDriver as SFBDriver, StoryMetadata, ImporterExtension, DriverExtension, InstructionExtension } from '@alexa-games/sfb-f';
import { HandlerInput, RequestHandler } from 'ask-sdk';
import { Response } from 'ask-sdk-model';

type SFBExtension = ImporterExtension | DriverExtension | InstructionExtension;

export class TestRequestHandler implements RequestHandler {
    private driver: SFBDriver;

    constructor(bakedStory: StoryMetadata, extensions: SFBExtension[], locale: string) {
        this.driver = new SFBDriver(bakedStory, [], extensions, undefined, locale);
    }

    public canHandle(handlerInput : HandlerInput): boolean {
        return true;
    }

    public async handle(handlerInput : HandlerInput): Promise<Response> {
        const state = await handlerInput.attributesManager.getPersistentAttributes();

        await this.driver.resumeStory({
            handlerInput: handlerInput
        }, state);

        const resultState = this.driver.getCurrentStoryState();

        handlerInput.attributesManager.setPersistentAttributes(resultState);
		await handlerInput.attributesManager.savePersistentAttributes();

        const response = handlerInput.responseBuilder.getResponse();

        return response;
    }
}
