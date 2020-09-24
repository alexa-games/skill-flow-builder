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

import { GlobalDirectionsExtension } from './../../../extensions/coreExtensions/GlobalDirectionsExtension'
import { StoryMetadataHelper } from '../../../importPlugins/storyMetadataHelper';
import { StoryMetadata, InstructionType } from './../../../story/storyMetadata';
import { SourceContentHelper } from '../../../importPlugins/sourceContentHelper';
import { strict as assert } from 'assert';

import * as sinon from 'sinon';

describe("Global Scene Extension Test", function () {
    it("No global scene", async function () {
        const storyHelper = new StoryMetadataHelper(TEST_STORY);
        const globalExtension = new GlobalDirectionsExtension();
        await globalExtension.extendImportedContent(storyHelper);

        const resultingInstructions = storyHelper.getSceneInstructions('start');
        assert.equal(resultingInstructions.length, 3);
    });

    it("prepend global scene", async function () {
        const storyHelper = new StoryMetadataHelper(PREPEND_STORY);
        const globalExtension = new GlobalDirectionsExtension();
        await globalExtension.extendImportedContent(storyHelper);

        const resultingInstructions = storyHelper.getSceneInstructions('start');
        const reusltingNarration = storyHelper.getSceneNarration('start');
        
        assert.equal(resultingInstructions.length, 4);
        assert.equal(resultingInstructions[0].directionType, InstructionType.FLAG);
        assert.ok(reusltingNarration.match(/^appended narration /g));
    });

    it("postpend global scene", async function () {
        const storyHelper = new StoryMetadataHelper(POSTPEND_STORY);
        const globalExtension = new GlobalDirectionsExtension();
        await globalExtension.extendImportedContent(storyHelper);

        const resultingInstructions = storyHelper.getSceneInstructions('start');
        const reusltingNarration = storyHelper.getSceneNarration('start')

        assert.equal(resultingInstructions.length, 4);
        assert.equal(resultingInstructions[resultingInstructions.length - 1].directionType, InstructionType.FLAG);
        assert.ok(reusltingNarration.match(/ appended narration$/g));
    });

    it("append global scene", async function () {
        const storyHelper = new StoryMetadataHelper(APPEND_STORY);
        const globalExtension = new GlobalDirectionsExtension();
        await globalExtension.extendImportedContent(storyHelper);

        const resultingInstructions = storyHelper.getSceneInstructions('start');
        const reusltingNarration = storyHelper.getSceneNarration('start')

        assert.equal(resultingInstructions.length, 4);
        assert.equal(resultingInstructions[resultingInstructions.length - 1].directionType, InstructionType.FLAG);
        assert.ok(reusltingNarration.match(/ appended narration$/g));
    });

    it("default global scene", async function () {
        const storyHelper = new StoryMetadataHelper(STANDARD_GLOBAL_STORY);
        const globalExtension = new GlobalDirectionsExtension();
        await globalExtension.extendImportedContent(storyHelper);

        const resultingInstructions = storyHelper.getSceneInstructions('start');
        const reusltingNarration = storyHelper.getSceneNarration('start')

        assert.equal(resultingInstructions.length, 4);
        assert.equal(resultingInstructions[resultingInstructions.length - 1].directionType, InstructionType.FLAG);
        assert.ok(reusltingNarration.match(/ appended narration$/g));
    });

    it("default global scene with exception scene", async function () {
        const storyHelper = new StoryMetadataHelper(STANDARD_GLOBAL_MULTI_SCENES_STORY);
        const globalExtension = new GlobalDirectionsExtension(['start']);
        await globalExtension.extendImportedContent(storyHelper);

        const exceptionSceneInstruction = storyHelper.getSceneInstructions('start');
        const exceptionNarration = storyHelper.getSceneNarration('start')

        assert.equal(exceptionSceneInstruction.length, 3);
        assert.equal(exceptionNarration.match(/ appended narration$/g), null);

        const globaledSceneInstruction = storyHelper.getSceneInstructions('something else');
        const globaledSceneNarration = storyHelper.getSceneNarration('something else')

        assert.equal(globaledSceneInstruction.length, 4);
        assert.equal(globaledSceneInstruction[globaledSceneInstruction.length - 1].directionType, InstructionType.FLAG);
        assert.ok(globaledSceneNarration.match(/ appended narration$/g));
    });

    it("default global scene without scene instructions", async function () {
        const storyHelper = new StoryMetadataHelper(STANDARD_GLOBAL_STORY_NO_INSTRUCTIONS);
        const globalExtension = new GlobalDirectionsExtension();
        await globalExtension.extendImportedContent(storyHelper);

        const resultingInstructions = storyHelper.getSceneInstructions('start');
        const reusltingNarration = storyHelper.getSceneNarration('start')

        assert.equal(resultingInstructions.length, 3);
        assert.ok(reusltingNarration.match(/ appended narration$/g));
    });

    it("append global instruction on empty scene", async function () {
        const storyHelper = new StoryMetadataHelper(STANDARD_GLOBAL_STORY_ON_EMPTY);
        const globalExtension = new GlobalDirectionsExtension();
        await globalExtension.extendImportedContent(storyHelper);

        const resultingInstructions = storyHelper.getSceneInstructions('start');
        const reusltingNarration = storyHelper.getSceneNarration('start')

        assert.equal(resultingInstructions.length, 1);
        assert.ok(reusltingNarration.match(/ appended narration$/g));
    });

    it("prepend global instruction on empty scene", async function () {
        const storyHelper = new StoryMetadataHelper(PREPEND_GLOBAL_STORY_ON_EMPTY);
        const globalExtension = new GlobalDirectionsExtension();
        await globalExtension.extendImportedContent(storyHelper);

        const resultingInstructions = storyHelper.getSceneInstructions('start');
        const reusltingNarration = storyHelper.getSceneNarration('start')

        assert.equal(resultingInstructions.length, 1);
        assert.ok(reusltingNarration.match(/^appended narration /g));
    });

    it ("Unused extension method 'extendSourceContent' does not throw when called", async function () {
        const globalExtension = new GlobalDirectionsExtension();
        await globalExtension.extendSourceContent(new SourceContentHelper([
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

const PREPEND_STORY: StoryMetadata = {
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
        },
        {
            id: 'global prepend',
            contents: [
                {
                    narration: "appended narration",
                    sceneDirections: [
                        {
                            directionType: InstructionType.FLAG,
                            parameters: {
                                variableName: "someFlag"
                            }
                        }
                    ]
                }
            ]
        }
    ],
    storyID: "something",
    storyTitle: "something"
}

const POSTPEND_STORY: StoryMetadata = {
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
        },
        {
            id: 'global postpend',
            contents: [
                {
                    narration: "appended narration",
                    sceneDirections: [
                        {
                            directionType: InstructionType.FLAG,
                            parameters: {
                                variableName: "someFlag"
                            }
                        }
                    ]
                }
            ]
        }
    ],
    storyID: "something",
    storyTitle: "something"
}

const APPEND_STORY: StoryMetadata = {
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
        },
        {
            id: 'global append',
            contents: [
                {
                    narration: "appended narration",
                    sceneDirections: [
                        {
                            directionType: InstructionType.FLAG,
                            parameters: {
                                variableName: "someFlag"
                            }
                        }
                    ]
                }
            ]
        }
    ],
    storyID: "something",
    storyTitle: "something"
}

const STANDARD_GLOBAL_STORY: StoryMetadata = {
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
        },
        {
            id: 'global',
            contents: [
                {
                    narration: "appended narration",
                    sceneDirections: [
                        {
                            directionType: InstructionType.FLAG,
                            parameters: {
                                variableName: "someFlag"
                            }
                        }
                    ]
                }
            ]
        }
    ],
    storyID: "something",
    storyTitle: "something"
}

const STANDARD_GLOBAL_MULTI_SCENES_STORY: StoryMetadata = {
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
        },
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
            id: "something else"
        },
        {
            id: 'global',
            contents: [
                {
                    narration: "appended narration",
                    sceneDirections: [
                        {
                            directionType: InstructionType.FLAG,
                            parameters: {
                                variableName: "someFlag"
                            }
                        }
                    ]
                }
            ]
        }
    ],
    storyID: "something",
    storyTitle: "something"
}

const STANDARD_GLOBAL_STORY_NO_INSTRUCTIONS: StoryMetadata = {
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
        },
        {
            id: 'global',
            contents: [
                {
                    narration: "appended narration"
                }
            ]
        }
    ],
    storyID: "something",
    storyTitle: "something"
}

const STANDARD_GLOBAL_STORY_ON_EMPTY: StoryMetadata = {
    pluginName: "something",
    scenes: [
        {
            contents: [
                {
                    narration: "testing narration"
                },
                
            ],
            id: "start"
        },
        {
            id: 'global',
            contents: [
                {
                    narration: "appended narration",
                    sceneDirections: [
                        {
                            directionType: InstructionType.FLAG,
                            parameters: {
                                variableName: "someFlag"
                            }
                        }
                    ]
                }
            ]
        }
    ],
    storyID: "something",
    storyTitle: "something"
}

const PREPEND_GLOBAL_STORY_ON_EMPTY: StoryMetadata = {
    pluginName: "something",
    scenes: [
        {
            contents: [
                {
                    narration: "testing narration"
                },
                
            ],
            id: "start"
        },
        {
            id: 'global prepend',
            contents: [
                {
                    narration: "appended narration",
                    sceneDirections: [
                        {
                            directionType: InstructionType.FLAG,
                            parameters: {
                                variableName: "someFlag"
                            }
                        }
                    ]
                }
            ]
        }
    ],
    storyID: "something",
    storyTitle: "something"
}