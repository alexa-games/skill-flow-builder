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

import { VoiceOverExtension } from './../../../extensions/coreExtensions/VoiceOverExtension'
import { StoryMetadataHelper } from '../../../importPlugins/storyMetadataHelper';
import { StoryMetadata, InstructionType } from './../../../story/storyMetadata';
import { SourceContentHelper } from '../../../importPlugins/sourceContentHelper';

import { strict as assert } from 'assert';

import * as sinon from 'sinon';

describe("Voice Over Extension Test", function () {
    it("No voice over tag in story.", async function () {
        const storyhelper = new StoryMetadataHelper(TEST_STORY);

        const voiceOverExtension = new VoiceOverExtension('https://my.custom.url/{{filename}}');
        await voiceOverExtension.extendImportedContent(storyhelper);

        const resultingScript = voiceOverExtension.getRecordingScript();

        assert.equal(resultingScript, "");
        assert.equal(storyhelper.getSceneNarration('start'), TEST_STORY.scenes[0].contents[0].narration);
    });

    it("Tagged narration - file exists.", async function () {
        const mockHTTP = {
            request: (options: any, callback: any) => {
                callback({
                    statusCode: 200
                });

                return {
                    end: () => null
                }
            }
        }

        sinon.spy(mockHTTP, "request");

        const storyhelper = new StoryMetadataHelper(VO_STORY);

        const voiceOverExtension = new VoiceOverExtension('https://localhost/{{filename}}', mockHTTP);
        await voiceOverExtension.extendImportedContent(storyhelper);

        const resultingScript = voiceOverExtension.getRecordingScript();

        assert.notEqual(resultingScript, "");
        assert.notEqual(storyhelper.getSceneNarration('start'), TEST_STORY.scenes[0].contents[0].narration);
    });

    it("Tagged narration - file does not exists.", async function () {
        const mockHTTP = {
            request: (options: any, callback: any) => {
                callback({
                    statusCode: 500
                });

                return {
                    end: () => null
                }
            }
        }

        sinon.spy(mockHTTP, "request");

        const storyhelper = new StoryMetadataHelper(VO_STORY);

        const voiceOverExtension = new VoiceOverExtension('https://localhost/{{filename}}', mockHTTP);
        await voiceOverExtension.extendImportedContent(storyhelper);

        const resultingScript = voiceOverExtension.getRecordingScript();

        assert.notEqual(resultingScript, "");
        assert.equal(storyhelper.getSceneNarration('start'), TEST_STORY.scenes[0].contents[0].narration);
    });

    // set up to check and make sure http correctly detects existing mp3 via the url
    it("Tagged narration - file exists - integration test", async function () {
        const storyhelper = new StoryMetadataHelper(VO_STORY);

        const voiceOverExtension = new VoiceOverExtension('https://sfb-framework.s3.amazonaws.com/examples/sounds/Copy_Machine_1.mp3');
        await voiceOverExtension.extendImportedContent(storyhelper);

        const resultingScript = voiceOverExtension.getRecordingScript();

        assert.notEqual(resultingScript, "");
        assert.equal(storyhelper.getSceneNarration('start'), "<audio src=\'https://sfb-framework.s3.amazonaws.com/examples/sounds/Copy_Machine_1.mp3\' />");
    });

    it ("Unused extension method 'extendSourceContent' does not throw when called", async function () {
        const voiceOverExtension = new VoiceOverExtension('https://sfb-framework.s3.amazonaws.com/examples/sounds/Copy_Machine_1.mp3');
        await voiceOverExtension.extendSourceContent(new SourceContentHelper([
            {
                id: "test.abc",
                text: "@start"
            }
        ]));
    });
});

const TEST_STORY: StoryMetadata = {
    pluginName: "something",
    scenes: [
        {
            contents: [
                {
                    narration: "testing narration",
                    sceneDirections: [
                        {
                            directionType: InstructionType.REPROMPT,
                            parameters: {
                                message: "this is a reprompt"
                            }
                        },
                        {
                            directionType: InstructionType.REPROMPT,
                            parameters: {
                                message: "this is a recap"
                            }
                        },
                        {
                            directionType: InstructionType.CHOICE,
                            parameters: {
                                "utterances": [
                                    "restart",
                                    "start over"
                                ],
                                "saveToHistory": "true",
                                "directions": [
                                    {
                                        "directionType": "bookmark",
                                        "parameters": {
                                            "variableName": "bookmark"
                                        },
                                    },
                                    {
                                        "directionType": "go to",
                                        "parameters": {
                                            "target": "restart confirm",
                                            "targetSceneProperty": "narration"
                                        },
                                    }
                                ]
                            }
                        }
                    ]
                },
                
            ],
            id: "start"
        }
    ],
    storyID: "something",
    storyTitle: "something"
}

const VO_STORY: StoryMetadata = {
    pluginName: "something",
    scenes: [
        {
            contents: [
                {
                    narration: "<vo>testing narration</vo>",
                    sceneDirections: [
                        {
                            directionType: InstructionType.REPROMPT,
                            parameters: {
                                message: "this is a reprompt"
                            }
                        },
                        {
                            directionType: InstructionType.REPROMPT,
                            parameters: {
                                message: "this is a recap"
                            }
                        },
                        {
                            directionType: InstructionType.CHOICE,
                            parameters: {
                                "utterances": [
                                    "restart",
                                    "start over"
                                ],
                                "saveToHistory": "true",
                                "directions": [
                                    {
                                        "directionType": "bookmark",
                                        "parameters": {
                                            "variableName": "bookmark"
                                        },
                                    },
                                    {
                                        "directionType": "go to",
                                        "parameters": {
                                            "target": "restart confirm",
                                            "targetSceneProperty": "narration"
                                        },
                                    }
                                ]
                            }
                        }
                    ]
                },
                
            ],
            id: "start"
        }
    ],
    storyID: "something",
    storyTitle: "something"
}