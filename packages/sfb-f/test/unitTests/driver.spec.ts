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

import {SFBDriver} from '../../driver/driver';
import {SceneAudioItem, AlexaAudioType} from './../../driver/driverEntity';
import {AudioFileAccessor, PollyUtil, PollyRequestItem, PollyOutFormat} from '@alexa-games/sfb-polly';
import { strict as assert } from 'assert';

import * as path from 'path';
import * as fs from 'fs';

const ffmpeg = { // FFMPEG Stub for Testing
    path: "",
};
const testOutputDir = path.resolve(".", ".out");

if (!fs.existsSync(testOutputDir)) {
    fs.mkdirSync(testOutputDir);
}

describe("Driver Unit Test", function () {
    it("buildAudioScenes(): modified polly item w/ SFB polly disabled.", async function () {
        const driver = getDefaultBaseDriver();

        const testVoiceName = "Brian";
        const testPitch = "+10%";
        const testRate = "120%";
        const testContent = "this the text to be wrapped in polly tag."
        // polly audio item with pitch and/or rate changed
        const modifiedPollyAudio: SceneAudioItem = {
            sceneID: "modified polly audio scene",
            background: [],
            foreground: [{
                content: testContent,
                delay: 0,
                options: {
                    voice: testVoiceName,
                    pitch: testPitch, 
                    rate: testRate
                },
                type: AlexaAudioType.POLLY,
                volume: 1
            }]
        }

        const {ssml, pretty} = await driver.buildAudioScenes([modifiedPollyAudio]);

        assert.equal(ssml, `<voice name='${testVoiceName}'><prosody pitch='${testPitch}' rate='${testRate}'>${testContent}</prosody></voice>`);
        assert.equal(pretty, `<voice name='${testVoiceName}'><prosody pitch='${testPitch}' rate='${testRate}'>${testContent}</prosody></voice>`);
    });

    it("buildAudioScenes(): UN-modified polly item w/ SFB polly disabled.", async function () {
        const driver = getDefaultBaseDriver();

        // polly audio item with pitch and/or rate UN-changed
        const testVoiceName = "Brian";
        const testPitch = "+0%";
        const testRate = "100%";
        const testContent = "this the text to be wrapped in polly tag."
        const unmodifiedPollyAudio: SceneAudioItem = {
            sceneID: "modified polly audio scene",
            background: [],
            foreground: [{
                content: testContent,
                delay: 0,
                options: {
                    voice: testVoiceName,
                    pitch: testPitch, 
                    rate: testRate
                },
                type: AlexaAudioType.POLLY,
                volume: 1
            }]
        }

        const {ssml, pretty} = await driver.buildAudioScenes([unmodifiedPollyAudio]);
        assert.equal(ssml, `<voice name='${testVoiceName}'>${testContent}</voice>`);
        assert.equal(pretty, `<voice name='${testVoiceName}'>${testContent}</voice>`);
    });

    /**
     * Background audio items should be ignored when SFB polly is not used.
     */
    it("buildAudioScenes(): background exists w/ SFB polly disabled. ", async function () {
        const driver = getDefaultBaseDriver();

        const testContent = "https://audio.url/file.mp3";
        const testBackgroundContent = "https://background.url/file.mp3";
        const audioTagItem: SceneAudioItem = {
            sceneID: "modified polly audio scene",
            background: [{
                content: testBackgroundContent,
                delay: 0,
                type: AlexaAudioType.AUDIO,
                volume: 1
            }],
            foreground: [{
                content: testContent,
                delay: 0,
                type: AlexaAudioType.AUDIO,
                volume: 1
            }]
        }

        const {ssml, pretty} = await driver.buildAudioScenes([audioTagItem]);
        assert.equal(ssml, `<audio src='${testContent}' />`);
        assert.equal(pretty, `<audio src='${testContent}' />`);
    });

    it("buildAudioScenes(): modified polly item w/ SFB polly enabled.", async function () {
        this.timeout(10000);
        const mockAudioAccessor = new HappyAudioAccessor();
        const mockPollyUtil = new HappyPollyUtil(mockAudioAccessor);

        const driver = getSFBPollyEnabledDriver(mockAudioAccessor, mockPollyUtil);
        
        const testVoiceName = "Brian";
        const testPitch = "+10%";
        const testRate = "120%";
        const testContent = "this the text to be wrapped in polly tag."
        // polly audio item with pitch and/or rate changed
        const modifiedPollyAudio: SceneAudioItem = {
            sceneID: "modified polly audio scene",
            background: [],
            foreground: [{
                content: testContent,
                delay: 0,
                options: {
                    voice: testVoiceName,
                    pitch: testPitch, 
                    rate: testRate
                },
                type: AlexaAudioType.POLLY,
                volume: 1
            }]
        }

        const {ssml, pretty} = await driver.buildAudioScenes([modifiedPollyAudio]);

        assert.equal(ssml, `<audio src='fake.url/pollyb3bd98f337deb388f02cc9e180790018.mp3' />`);
        assert.equal(pretty, `<voice name='${testVoiceName}'><prosody pitch='${testPitch}' rate='${testRate}'>${testContent}</prosody></voice>`);
    });

    it("buildAudioScenes(): UN-modified polly item w/ SFB polly enabled.", async function () {
        this.timeout(10000);
        const mockAudioAccessor = new HappyAudioAccessor();
        const mockPollyUtil = new HappyPollyUtil(mockAudioAccessor);

        const driver = getSFBPollyEnabledDriver(mockAudioAccessor, mockPollyUtil);

        // polly audio item with pitch and/or rate UN-changed
        const testVoiceName = "Brian";
        const testPitch = "+0%";
        const testRate = "100%";
        const testContent = "this the text to be wrapped in polly tag."
        const unmodifiedPollyAudio: SceneAudioItem = {
            sceneID: "modified polly audio scene",
            background: [],
            foreground: [{
                content: testContent,
                delay: 0,
                options: {
                    voice: testVoiceName,
                    pitch: testPitch, 
                    rate: testRate
                },
                type: AlexaAudioType.POLLY,
                volume: 1
            }]
        }

        const {ssml, pretty} = await driver.buildAudioScenes([unmodifiedPollyAudio]);
        assert.equal(ssml, `<audio src='fake.url/polly1e53b9853a4800f917b7718b64b39321.mp3' />`);
        assert.equal(pretty, `<voice name='${testVoiceName}'>${testContent}</voice>`);
    });

    it("buildAudioScenes(): Audio tag", async function () {
        const driver = getDefaultBaseDriver();

        const testContent = "https://audio.url/file.mp3";

        const audioTagItem: SceneAudioItem = {
            sceneID: "modified polly audio scene",
            background: [],
            foreground: [{
                content: testContent,
                delay: 0,
                type: AlexaAudioType.AUDIO,
                volume: 1
            }]
        }

        const {ssml, pretty} = await driver.buildAudioScenes([audioTagItem]);
        assert.equal(ssml, `<audio src='${testContent}' />`);
        assert.equal(pretty, `<audio src='${testContent}' />`);
    });

    it("buildAudioScenes(): reduce 6 consecutive audio to 5 audio tags", async function () {
        const mockAudioAccessor = new HappyAudioAccessor();
        const mockPollyUtil = new HappyPollyUtil(mockAudioAccessor);

        const driver = getSFBPollyEnabledDriver(mockAudioAccessor, mockPollyUtil);

        const testContent = "https://audio.url/file";

        const audioTagItem: SceneAudioItem = {
            sceneID: "modified polly audio scene",
            background: [],
            foreground: [{
                content: `${testContent}1.mp3`,
                delay: 0,
                type: AlexaAudioType.AUDIO,
                volume: 1
            },
            {
                content: `${testContent}2.mp3`,
                delay: 0,
                type: AlexaAudioType.AUDIO,
                volume: 1
            },
            {
                content: `${testContent}3.mp3`,
                delay: 0,
                type: AlexaAudioType.AUDIO,
                volume: 1
            },
            {
                content: `${testContent}4.mp3`,
                delay: 0,
                type: AlexaAudioType.AUDIO,
                volume: 1
            },
            {
                content: `${testContent}5.mp3`,
                delay: 0,
                type: AlexaAudioType.AUDIO,
                volume: 1
            },
            {
                content: `${testContent}6.mp3` ,
                delay: 0,
                type: AlexaAudioType.AUDIO,
                volume: 1
            }]
        }

        const {ssml, pretty} = await driver.buildAudioScenes([audioTagItem]);

        const tagMatch = ssml.match(/<audio src=\'[\S]+?\' \/>/g);

        if (tagMatch !== null) {
            assert.equal(tagMatch.length, 5);
        } else {
            assert.fail();
        }

        assert.equal(ssml, `<audio src='fake.url/a455dfecd690dcdfe1a5874e3228747b.mp3' /><audio src='${testContent}3.mp3' /><audio src='${testContent}4.mp3' /><audio src='${testContent}5.mp3' /><audio src='${testContent}6.mp3' />`);
        assert.equal(pretty, `<audio src='${testContent}1.mp3' /><audio src='${testContent}2.mp3' /><audio src='${testContent}3.mp3' /><audio src='${testContent}4.mp3' /><audio src='${testContent}5.mp3' /><audio src='${testContent}6.mp3' />`);
    });

    it("buildAudioScenes(): reduce 6 audio items with text item in the middle to 5 audio tags", async function () {
        const mockAudioAccessor = new HappyAudioAccessor();
        const mockPollyUtil = new HappyPollyUtil(mockAudioAccessor);

        const driver = getSFBPollyEnabledDriver(mockAudioAccessor, mockPollyUtil);

        const testContent = "https://audio.url/file";

        const audioTagItem: SceneAudioItem = {
            sceneID: "modified polly audio scene",
            background: [],
            foreground: [{
                content: `${testContent}1.mp3`,
                delay: 0,
                type: AlexaAudioType.AUDIO,
                volume: 1
            },
            {
                content: `${testContent}2.mp3`,
                delay: 0,
                type: AlexaAudioType.AUDIO,
                volume: 1
            },
            {
                content: `${testContent}3.mp3`,
                delay: 0,
                type: AlexaAudioType.AUDIO,
                volume: 1
            },
            {
                content: `some text`,
                delay: 0,
                type: AlexaAudioType.TEXT,
                volume: 1
            },
            {
                content: `${testContent}4.mp3`,
                delay: 0,
                type: AlexaAudioType.AUDIO,
                volume: 1
            },
            {
                content: `${testContent}5.mp3`,
                delay: 0,
                type: AlexaAudioType.AUDIO,
                volume: 1
            },
            {
                content: `${testContent}6.mp3` ,
                delay: 0,
                type: AlexaAudioType.AUDIO,
                volume: 1
            }]
        }

        const {ssml, pretty} = await driver.buildAudioScenes([audioTagItem]);

        const tagMatch = ssml.match(/<audio src=\'[\S]+?\' \/>/g);

        if (tagMatch !== null) {
            assert.equal(tagMatch.length, 5);
        } else {
            assert.fail();
        }

        assert.equal(ssml, `<audio src='fake.url/a455dfecd690dcdfe1a5874e3228747b.mp3' /><audio src='${testContent}3.mp3' /> some text<audio src='${testContent}4.mp3' /><audio src='${testContent}5.mp3' /><audio src='${testContent}6.mp3' />`);
        assert.equal(pretty, `<audio src='${testContent}1.mp3' /><audio src='${testContent}2.mp3' /><audio src='${testContent}3.mp3' /> some text<audio src='${testContent}4.mp3' /><audio src='${testContent}5.mp3' /><audio src='${testContent}6.mp3' />`);
    });
});

function getDefaultBaseDriver(): SFBDriver {
    const driver = new SFBDriver({
        storyTitle: 'test story',
        storyID: "test-story",
        pluginName: 'default',
        scenes: [{
            id: "start",
            contents: [
                {
                    narration: "test narration"
                }
            ]
        }]
    });

    return driver;
}

function getSFBPollyEnabledDriver(audioAccessorMock: AudioFileAccessor, pollyUtilMock: PollyUtil): SFBDriver {
    const driver = new SFBDriver({
        storyTitle: 'test story',
        storyID: "test-story",
        pluginName: 'default',
        scenes: [{
            id: "start",
            contents: [
                {
                    narration: "test narration"
                }
            ]
        }]
    }, undefined, undefined, {
        "enabled": true,
        "combineAudioTags": true,
        "dontUseCache": false,
        "FFMPEGLocation": ffmpeg.path,
        "workingDir": testOutputDir,
        "bucketName": "test-bucket",
        "s3DomainName": "s3.amazon.com"
    },undefined,audioAccessorMock,pollyUtilMock);

    return driver;
}

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