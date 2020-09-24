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

import {HandlerInput} from 'ask-sdk';
import {Instruction} from './../story/storyMetadata';

export interface UserInput {
    intent?: string,
    slots?: Slot[],
    value?: string,
    handlerInput?: HandlerInput
}

export interface ResultOption {
    name: string,
    value: any
}

export interface Slot {
    name: string,
    value: string
}

export const BuiltInUserInput: {[key:string]: UserInput} = {
    "Resume Story": {
        intent: "LaunchRequest",
    },
    "Exit Story": {
        intent: "ExitRequest"
    }
}

export interface Choice {
    id: string;
    utterances: string[];
    narration?: string;
    sceneDirections?: Instruction[];
    instructionAddress?: string;
    saveToHistory: boolean;
}

export interface ChoiceHistoryItem {
    sourceSceneID: string,
    choiceID: string,
    stateDiff: StateDiffItem[]
}

export interface StateDiffItem {
    itemName: string,
    beforeValue: any,
    afterValue: any
}

export interface AudioItem {
    type: AlexaAudioType,
    content: string,
    volume: number,
    delay: number,
    options?: {[key: string]: string;}
}

export enum AudioBlendOption {
    TRIM = 'trim',
    LONGEST = 'longest'
}

export interface SceneAudioItem {
    sceneID?: string,
    foreground: AudioItem[],
    background: AudioItem[]
}

export enum AlexaAudioType {
    POLLY = "polly",
    AUDIO = "audio",
    TEXT = "text"
}

export interface StorySlide {
    prompt: string,
    reprompt: string,
    recap: string,
    visual: VisualOptions
}

export interface VisualOptions {
    sceneID? : string,
    onMountCommands?: string[], 
    commands?: string[], 
    [key:string]: any; // Add index signature
}