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

import { UserInput } from "../driver/driverEntity";
import { StoryMetadata } from '../story/storyMetadata';

//import assert = require('assert');
import { strict as assert } from 'assert';
import { StoryStateHelper } from "..";
import { SFBDriver } from "../driver/driver";
import { ImporterExtension, InstructionExtension, DriverExtension, } from '../extensions/SFBExtension';

import {AudioFileAccessor, PollyUtil, PollyRequestItem, PollyOutFormat} from '@alexa-games/sfb-polly';

import * as path from 'path';
import * as fs from 'fs';

const testOutputDir = path.resolve(".", ".out");

type ExtensionType = ImporterExtension|DriverExtension|InstructionExtension;

class HappyAudioAccessor implements AudioFileAccessor {
    async exists(audioName: string): Promise<boolean> {
        return true;
    }

    async downloadAudio(audioName: string, workingDirectoryPath: string): Promise<void> {
        //do nothing
    }   

    async getAudioURL(audioName: string): Promise<string>{
        return `fake.url/${audioName}`;
    }

    async uploadAudio(audioName: string, workingDirectoryPath: string): Promise<string> {
        return await this.getAudioURL(audioName);
    }
}

class HappyPollyUtil extends PollyUtil {
    async synthesize(request: PollyRequestItem, workingDir: string, filename: string, outputFormat?: PollyOutFormat): Promise<any> {
        return;
    }

    async estimateSSMLDuration(ssml: string, workingDir: string): Promise<number> {
        return 1000;
    }
}

export class SFBContentTester {
    private story: StoryMetadata;

    private state: any;

    private extensions: ExtensionType[];
    private driver: SFBDriver;

    private getTestDriverInstance() {

        if (!fs.existsSync(testOutputDir)) {
            fs.mkdirSync(testOutputDir);
        }
        
        return new SFBDriver(this.story, [], this.extensions, {
            "enabled": false,
            "combineAudioTags": true,
            "dontUseCache": true,
            "FFMPEGLocation": this.ffmpegPath,
            "workingDir": testOutputDir,
            "bucketName": "test-bucket",
            "s3DomainName": "s3.amazon.com"
        },undefined, new HappyAudioAccessor(), new HappyPollyUtil(new HappyAudioAccessor()))
    }

    constructor(storyData: StoryMetadata, extensions: ExtensionType[], private ffmpegPath: string) {
        this.story = storyData;
        this.state = {};
        this.extensions = extensions;
        this.driver = this.getTestDriverInstance();
    }

    /**
     * Resets the state of the test, and prepare for a new test run.
     */
    public resetTest() {
        this.state = {};
        this.driver = this.getTestDriverInstance();
    }

    /**
     * Cleans out the current run state.
     */
    public givenCleanState() {
        this.state = {};
    }

    public givenAttribute(attributeName: string, value: any): void {
        this.state[attributeName] = value;
    }

    public givenAttributes(attributes: { [key: string]: any }) {
        this.state = Object.assign(this.state, attributes);
    }

    /**
     * Sets the test, so that the current scene is as defined by sceneID
     * @param sceneID scene ID the test should move to.
     */
    public givenCurrentScene(sceneID: string): void {
        StoryStateHelper.setCurrentSceneID(this.state, sceneID);
    }

    /**
     * Run the story for given user input.
     * @param userInput instance of UserInput class of SFB module
     */
    public async givenUserInput(userInput: UserInput): Promise<void> {
        this.driver = this.getTestDriverInstance();

        await this.driver.resumeStory(userInput, this.state);
        this.state = this.driver.getCurrentStoryState();
    }

    /**
     * Invoke system level pause by signaling for pause event.
     */
    public async givenPauseInvoked(): Promise<void> {
        this.driver = this.getTestDriverInstance();

        await this.driver.resumeStory({
            intent: "AMAZON.PauseIntent"
        },this.state);
        this.state = this.driver.getCurrentStoryState();
    }

    /**
     * Invoke system level resume by signlaing for resume event.
     */
    public async givenResumeInvoked(): Promise<void> {
        this.driver = this.getTestDriverInstance();

        await this.driver.resumeStory({
            intent: "LaunchRequest",
            value: "LaunchRequest"
        }, this.state);

        this.state = this.driver.getCurrentStoryState();
    }

    /**
     * Invoke system level start by signaling for start/launch event.
     */
    public async givenStartInvoked(): Promise<void> {
        this.driver = this.getTestDriverInstance();
        await this.givenResumeInvoked();
    }

    public assertAttributeDefined(attributeName: string): void {
        assert.equal(this.state[attributeName] == undefined, false, `Attribute Assertion Failed`);
    }

    public assertAttributeUndefined(attributeName: string): void {
        assert.equal(this.state[attributeName] == undefined, true, `Attribute Assertion Failed`);
    }

    public assertAttributeEquals(attributeName: string, expected: any): void {
        assert.equal(this.state[attributeName], expected, `Attribute Assertion Failed`);
    }

    public assertAttributeNotEquals(attributeName: string, expected: any): void {
        assert.notEqual(this.state[attributeName], expected, `Attribute Assertion Failed`);
    }

    public assertSceneID(sceneID: string, msg: string = ""): void {
        let actualScene: string | null = StoryStateHelper.getCurrentSceneID(this.state);
        assert.equal(actualScene == null ? null : actualScene.trim().toLocaleLowerCase(), sceneID.trim().toLowerCase(), `Scene ID Assertion Failed: ${msg}`);
    }

    public async assertSpeech(expected: string) {
        let actual: string = await this.driver.getSpeechSSMLText();
        assert.equal(actual.trim(), expected.trim(), `Speech Assertion Failed`);
    }

    public async assertPrettySpeech(expected: string) {
        let ssmlAndPretty = await this.driver.getSpeechSSMLAndPrettyText(); 
        let actual: string = ssmlAndPretty.pretty;
        assert.equal(actual.trim(), expected.trim(), `Pretty Speech Assertion Failed`);
    }

    public async assertPrettySpeechSSML(expected: string) {
        let ssmlAndPretty = await this.driver.getSpeechSSMLAndPrettyText(); 
        let actual: string = ssmlAndPretty.ssml;
        assert.equal(actual.trim(), expected.trim(), `Pretty Speech SSML Assertion Failed`);
    }

    public async assertSpeechSSMLPerScene(expected: string) {
        let scenesAndSsmlList = await this.driver.getSpeechSSMLTextPerScene(); 
        // TODO: Make this actually do something
    }

    public async assertSpeechOneOf(expected: string[]) {
        let actual: string = await this.driver.getSpeechSSMLText();
        assert(expected.includes(actual.trim()), `Speech Assertion Failed.`);
    }

    public async assertReprompt(expected: string) {
        let actual: string = await this.driver.getRepromptSSMLText();
        assert.equal(actual.trim(), expected.trim(), `Reprompt Assertion Failed`);
    }

    public async getSpeech() {
        return await this.driver.getSpeechSSMLText();
    }

    public async getReprompt() {
        return await this.driver.getRepromptSSMLText();
    }

    public async getAttributeValue(attributeName: string) {
        return this.state[attributeName];
    }

    public async assertAttributeExists(attributeName: string) {
        let actual: string = this.state[attributeName];
        assert(actual != undefined, attributeName + ' undefined');
    }

    public async assertTime(timeAttribute: string, before: number, after: number) {
        let time: number = +this.state[timeAttribute];
        assert(time >= before && time <= after, 'Invalid time');
    }
}
