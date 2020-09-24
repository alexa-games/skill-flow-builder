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

import { ConfigAccessor } from './configAccessor';
import { StoryMetadata, ImporterExtension, DriverExtension, InstructionExtension, Slot, StoryStateHelper } from '@alexa-games/sfb-f';
import { SkillBuilders, RequestHandler, PersistenceAdapter } from 'ask-sdk';
import { ResponseEnvelope, RequestEnvelope } from 'ask-sdk-model';

import { strict as assert, AssertionError } from 'assert';
import * as fs from 'fs';
import * as path from 'path';

import { VoiceModel } from './voiceModel';
import { AlexaRequestBuilder } from './alexaRequestBuilder';
import { TestPersistenceAdapter } from './testPersistenceAdapter';
import { TestRequestHandler } from './testRequestHandler';
import { config } from 'aws-sdk';

type SFBExtension = ImporterExtension | DriverExtension | InstructionExtension;

/**
 * Test Driver for SFB projects.
 */
export class TestDriver {
    private static STATE_STORE: {[key: string]: any} = {};

    private requestBuilder: AlexaRequestBuilder;
    private story: StoryMetadata;
    private persistenceAdapter: TestPersistenceAdapter;
    private response: ResponseEnvelope;
    private extensionLoader: any;

    constructor(private projectPath: string, private locale: string) {
        if (!fs.existsSync(this.storyMetadataPath)) {
            throw new Error('Could not find imported story metadata. Please make sure to run: \'alexa-sfb build [project-path]\' to build first before running the test.');
        }

        if (!fs.existsSync(this.projectConfigPath)) {
            throw new Error(`Could not find project config file in path: '${this.projectConfigPath}'.`)
        }

        const configJSON = JSON.parse(fs.readFileSync(this.projectConfigPath, "utf8"));
        const configAccessor = new ConfigAccessor(configJSON, this.contentPath);

        const LoaderClass = require(path.resolve(this.codePath, 'dist', 'extensions', 'ExtensionLoader.js')).ExtensionLoader;

        this.extensionLoader= new LoaderClass({
            locale: this.locale,
            configAccessor: configAccessor        
        });

        this.story = <StoryMetadata> JSON.parse(fs.readFileSync(this.storyMetadataPath, "utf8"));
        this.persistenceAdapter = new TestPersistenceAdapter();
        this.requestBuilder = new AlexaRequestBuilder();
        this.response = {
            response: {

            },
            version: "1.0"
        }
    }

    private changeTestLocale(locale: string) {
        this.locale = locale;
    }

    private get bakedPath(): string {
        return path.resolve(this.projectPath, "baked");
    }

    private get codePath(): string {
        return path.resolve(this.projectPath, "code");
    }

    private get contentPath(): string {
        return path.resolve(this.projectPath, "content");
    }

    private get resourcePath(): string {
        return path.resolve(this.contentPath, this.locale, "resources");
    }

    private get storyMetadataPath(): string {
        return path.resolve(this.bakedPath, this.locale, "baked_story.json");
    }

    private get projectConfigPath(): string {
        return path.resolve(this.projectPath, "abcConfig.json");
    }

    private get savedState(): {[key: string]: any} {
        return this.persistenceAdapter.attributes;
    }

    private findIntentFromUtterance(model: VoiceModel, utterance: string): string {
        for (let intent of model.languageModel.intents) {
            if (intent.samples && intent.samples.includes(utterance.toLowerCase().trim())) {
                return intent.name; 
            }
        }

        return "";
    }

    public async givenSavedStates(state: any) {
        this.persistenceAdapter.attributes = state;
    }

    public async givenStateValue(name: string, value: any) {
        this.persistenceAdapter.attributes[name] = value;
    }

    public async givenUtterance(utterance: string) {
        const model = <VoiceModel>this.story.alexaVoiceModel;

        const intentName = this.findIntentFromUtterance(model, utterance);

        this.requestBuilder.setIntent(intentName);

        const request = this.requestBuilder.build();

        await this.givenRequestEvent(request);
    }

    public async givenIntent(intent: string) {
        const model = <VoiceModel>this.story.alexaVoiceModel;

        this.requestBuilder.setIntent(intent);

        const request = this.requestBuilder.build();

        await this.givenRequestEvent(request);

    }

    public async givenSlots(slots: Slot[]) {
        const intentName = 'CatchAllIntent';
        slots.forEach((slot) => {
            this.requestBuilder.addSlot(intentName, slot.name, slot.value);
        });

        const request = this.requestBuilder.build();

        await this.givenRequestEvent(request);
    }

    public async givenLaunched() {
        const model = <VoiceModel>this.story.alexaVoiceModel;

        this.requestBuilder.setRequestType("LaunchRequest");
        this.requestBuilder.setNewSession(true);
        const request = this.requestBuilder.build();

        await this.givenRequestEvent(request);
    }

    public async givenSessionEnded() {
        const model = <VoiceModel>this.story.alexaVoiceModel;

        this.requestBuilder.setRequestType("SessionEndedRequest");

        const request = this.requestBuilder.build();

        await this.givenRequestEvent(request);
    }

    public async givenRequestEvent(event: any) {

        const skill = SkillBuilders.custom()
            .addRequestHandlers(
                new TestRequestHandler(this.story, this.extensionLoader.getExtensions(), this.locale)
            )
            .withPersistenceAdapter(
                this.persistenceAdapter
            )
            .create();
        
        this.response = await skill.invoke(event, {});

    }

    public get state(): any {
        return this.savedState;
    }

    public assertScene(expectedSceneId: string, message?: string | Error ) {
        const currentScene = StoryStateHelper.getCurrentSceneID(this.savedState);
        assert.equal(currentScene, expectedSceneId, message);
    }

    public assertOutputSSML(expectedSsml: string, message?: string | Error) {
        const responseOutputSpeech = (<any>this.response.response.outputSpeech).ssml;

        assert.equal(responseOutputSpeech, expectedSsml, message);
    }

    public assertOutputSSMLVariation(expectedSsml: string[], message?: string | Error) {
        const responseOutputSpeech = (<any>this.response.response.outputSpeech).ssml;

        if (expectedSsml.filter((out) => {
            try {
                assert.equal(responseOutputSpeech, out, message);
                return true;
            } catch(err) {
                return false;
            }
        }).length > 0) {
            assert.ok(true);
        } else {
            if (message) {
                assert.fail(message);
            } else {
                assert.fail(`Actual does not match any of expected variations\n+actual:${responseOutputSpeech}\n\n-expected: ${JSON.stringify(expectedSsml, null, 4)}`);
            }        }
    }

    public assertRepromptSSML(expectedSsml: string, message?: string | Error) {
        const responseOutputSpeech = (<any>this.response.response.outputSpeech).ssml;

        assert.equal(responseOutputSpeech, expectedSsml, message);
    }

    public assertRepromptSSMLVariation(expectedSsml: string[], message?: string | Error) {
        const responseOutputSpeech = (<any>this.response.response.outputSpeech).ssml;

        if (expectedSsml.filter((out) => {
            try {
                assert.equal(responseOutputSpeech, out, message);
                return true;
            } catch(err) {
                return false;
            }
        }).length > 0) {
            assert.ok(true);
        } else {
            if (message) {
                assert.fail(message);
            } else {
                assert.fail(`Actual does not match any of expected variations\n+actual:${responseOutputSpeech}\n\n-expected: ${JSON.stringify(expectedSsml, null, 4)}`);
            }
        }
    }

    public saveState(saveName: string) {
        TestDriver.STATE_STORE[saveName] = this.savedState;
    }

    public async loadSavedState(saveName: string) {
        await this.givenSavedStates(TestDriver.STATE_STORE[saveName]);
    }
}
