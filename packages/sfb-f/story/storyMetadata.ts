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

export interface StoryMetadata {
    pluginName: string;
    storyTitle: string;
    storyID: string;
    scenes: Scene[];
    alexaVoiceModel?: any;
}

export interface Scene {
    readonly id: string;
    readonly contents: SceneVariation[];
    readonly customProperties?: {[key:string]: any}
}

export interface SceneVariation {
    condition?: string;
    narration?: string;
    sceneDirections?: Instruction[];
}

export interface Instruction {
    readonly directionType: InstructionType,
    readonly parameters: {[key: string]: any;},
    sourcePosition?: number,
    sourceScene?: string
}

export enum BuiltInScenes {
    ResumeScene= "Resume",
    PauseScene= "Pause",
    StartScene= "Start"
}

export enum InstructionType {
    CONDITION = "condition",
    CHOICE = "choice",
    BGM = "backgroundmusic",
    INCREASE = "increase",
    REDUCE = "reduce",
    MULTIPLY = "multiply",
    DIVIDE = "divide",
    MODULUS = "modulus",
    SET = "set",
    FLAG = "flag",
    UNFLAG = "unflag",
    CLEAR = "clear",
    RECAP = "recap",
    ROLL = "roll dice",
    ADD_TO_INVENTORY = "add inventory",
    ADD_ITEM = "add item",
    REMOVE_ITEM = "remove item",
    REMOVE_FIRST = "remove first",
    REMOVE_LAST = "remove last",
    ADD_COLLECTION = "add collection",
    CUSTOM = "custom",
    REPROMPT = "reprompt",
    GET_TIME = "get time",
    VISUALS = "visuals",
    SLOT = "slot",
    BOOKMARK = "bookmark",

    GO_TO = "go to",
    SAVE_AND_GO = "save and go",

    END = "ending",
    RESTART = "restart",
    RESUME = "resume",
    RETURN = "return",
    REPEAT = "repeat",
    BACK = "back",
    PAUSE = "pause",
    REPEAT_REPROMPT = "repeat reprompt"
}