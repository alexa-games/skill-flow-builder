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

import * as path from 'path';
import { strict as assert } from 'assert';

import { ConfigAccessor } from '../../configAccessor';
import { AdvancedAPLExtension } from '../../sfbExtension/advancedAPLExtension';

const CONFIG_FILE = "./src/test/data/abcConfig.json";

describe('Advanced Alexa APL Extension Test', () => {

    it('Initialization', async () => {

        const config = await ConfigAccessor.loadConfigFile(path.resolve(CONFIG_FILE), "./src/test/data");

        const alexaAPLExtension = new AdvancedAPLExtension('en-us', config);

        assert.ok(alexaAPLExtension);
    });

    it('Generate Alexa Speak Items', async () => {

        const config = await ConfigAccessor.loadConfigFile(path.resolve(CONFIG_FILE), "./src/test/data");

        const alexaAPLExtension = new AdvancedAPLExtension('en-us', config);

        assert.ok(alexaAPLExtension);

        const result = alexaAPLExtension.generateAlexaSpeakItemComponents(["test string", "another string"]);

        assert.ok(result);
        assert.ok(result.textComponents.length === 2);
        assert.ok(result.textDatasources.length === 2);
    });

    it('Test Add Layout and Commands to Dynamic Pager Directive', async () => {

        const config = await ConfigAccessor.loadConfigFile(path.resolve(CONFIG_FILE), "./src/test/data");

        const alexaAPLExtension = new AdvancedAPLExtension('en-us', config);

        assert.ok(alexaAPLExtension);

        const visualDirective = TEST_VISUAL_DIRECTIVE;

        const scenes = [
            {
                "template": "dynamic-pager",
                "layout": "DiceRollAutoLayout",
                "D": "20",
                "roll": "9",
                "sceneID": "display_dice_roll_auto"
            }
        ];

        alexaAPLExtension.addLayoutsAndCommandsToDynamicPagerDirective(visualDirective, scenes);

        console.log(JSON.stringify(visualDirective, undefined, 4));

        assert.ok(visualDirective);

    });



});

const TEST_VISUAL_DIRECTIVE = {
    "type": "Alexa.Presentation.APL.RenderDocument",
    "token": "ABC_RENDERED_DOCUMENT",
    "document": {
        "type": "APL",
        "version": "1.1",
        "commands": {},
        "layouts": {
            "DynamicPager": {
                "description": "A dynamic screen pager that takes layouts of any specified 'layout' type. Automatically pulls in all layouts/commands from any other APL template that defines at least one layout specified in an ABC for the given request.",
                "parameters": [
                    "data"
                ],
                "item": [
                    {
                        "type": "Pager",
                        "id": "primaryPager",
                        "navigation": "none",
                        "initialPage": 0,
                        "width": "100%",
                        "height": "100%",
                        "data": "${data}",
                        "items": [
                            {
                                "position": "absolute",
                                "type": "${data.layout}",
                                "pgIndex": "${index}"
                            }
                        ]
                    }
                ]
            }
        },
        "mainTemplate": {
            "description": "********* Minimal APL document **********",
            "parameters": [
                "payload"
            ],
            "items": [
                {
                    "type": "Container",
                    "width": "100%",
                    "height": "100%",
                    "items": [
                        {
                            "id": "SFBAudioAndAlexaSpeechContainer",
                            "description": "Please do not remove or change the ID of this component. Skill Flow Builder uses this id to play audio files and to add Alexa SpeakItem text blocks.",
                            "type": "Container",
                            "items": [
                                {
                                    "type": "Video",
                                    "id": "audioPlayerId",
                                    "description": "Please do not change this ID, skill flow builder uses this component to play audio files from your content.",
                                    "autoplay": false,
                                    "width": "0",
                                    "height": "0"
                                }
                            ]
                        },
                        {
                            "id": "sampleBackground",
                            "type": "Image",
                            "source": "${payload.visualProperties.background}",
                            "position": "absolute",
                            "width": "100vw",
                            "height": "100vh",
                            "scale": "best-fill"
                        },
                        {
                            "id": "logo",
                            "type": "Image",
                            "source": "",
                            "position": "absolute",
                            "left": "2vw",
                            "top": "2vh",
                            "width": "20vw",
                            "height": "10vh",
                            "scale": "best-fit"
                        },
                        {
                            "position": "absolute",
                            "type": "DynamicPager",
                            "data": "${payload.visualProperties.scenes}"
                        },
                        {
                            "position": "absolute",
                            "textAlign": "center",
                            "top": "10vh",
                            "left": "0vw",
                            "height": "20vh",
                            "width": "100vw",
                            "type": "Text",
                            "color": "#FFFFFF",
                            "text": "${payload.visualProperties.title}"
                        },
                        {
                            "position": "absolute",
                            "textAlign": "center",
                            "type": "Text",
                            "color": "#FFFFFF",
                            "width": "100vw",
                            "bottom": "0vh",
                            "text": "${payload.visualProperties.subtitle}"
                        }
                    ]
                }
            ]
        }
    },
    "datasources": {
        "visualProperties": {
            "title": "",
            "subtitle": "",
            "background": "",
            "scenes": [],
            "template": "dynamic-pager",
            "layout": "DiceRollAutoLayout",
            "D": "20",
            "roll": "9",
            "sceneID": "display_dice_roll_auto"
        }
    }
};
