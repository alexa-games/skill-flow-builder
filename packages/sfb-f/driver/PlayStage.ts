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

import { SceneAudioItem, VisualOptions, AudioItem } from '../driver/driverEntity';
import { AudioItemUtil } from './AudioItemUtil';

export class PlayStage {
    private visitedSceneIDsOnRun: string[] = [];

    private speechAudioSequence: SceneAudioItem[] = [];

    private repromptAudioSequence: SceneAudioItem[] = [];

    private recapAudioSequence: SceneAudioItem[] = [];

    private visualOptions: VisualOptions[] | undefined = undefined;

    private currentSceneID: string = "";

    private currentSceneAudioQueue: SceneAudioItem = {
        foreground: [],
        background: []
    };

    private currentSceneRepromptAudioQueue: SceneAudioItem = {
        foreground: [],
        background: []
    };

    private currentSceneRecapAudioQueue: SceneAudioItem = {
        foreground: [],
        background: []
    };

    constructor(private audioItemUtil: AudioItemUtil) {
        this.resetStage();
    }

    public resetStage(): void {
        this.currentSceneID = "";

        this.visitedSceneIDsOnRun = [];

        this.speechAudioSequence = [];
    
        this.repromptAudioSequence = [];
    
        this.recapAudioSequence = [];
    
        this.visualOptions = undefined;
    
        this.currentSceneAudioQueue = {
            foreground: [],
            background: []
        };
    
        this.currentSceneRepromptAudioQueue = {
            foreground: [],
            background: []
        };
    
        this.currentSceneRecapAudioQueue = {
            foreground: [],
            background: []
        };
    }

    public logVisitedScene(sceneID: string): void {
        this.visitedSceneIDsOnRun.push(sceneID);
    }

    public getVisitedSceneIDsOnRun(): string[] {
        return this.visitedSceneIDsOnRun;
    }

    public getStageSpeechAudioSequence(keepScenesSeperate?: boolean): SceneAudioItem[] {
        return this.audioItemUtil.condensePollyItem(this.speechAudioSequence, keepScenesSeperate);
    }

    public getStageRepromptAudioSequence(): SceneAudioItem[] {
        return this.audioItemUtil.condensePollyItem(this.repromptAudioSequence);
    }

    public getStageRecapAudioSequence(): SceneAudioItem[] {
        return this.audioItemUtil.condensePollyItem(this.recapAudioSequence);
    }
    
    public getStageVisualOptions(): VisualOptions[] | undefined {
        return this.visualOptions;
    }

    public setStageSpeechAudioSequence(audio: SceneAudioItem[]): void {
        this.speechAudioSequence = audio;
    }

    public setStageRepromptAudioSequence(audio: SceneAudioItem[]): void {
        this.repromptAudioSequence = audio;
    }

    public setStageRecapAudioSequence(audio: SceneAudioItem[]): void {
        this.recapAudioSequence = audio;
    }
    
    public setStageVisualOptions(visuals: VisualOptions[]): void {
        this.visualOptions = visuals;
    }

    public appendStageSpeechAudioSequence(audio: SceneAudioItem[]): void {
        this.speechAudioSequence = this.speechAudioSequence.concat(audio);
    }

    public appendStageRepromptAudioSequence(audio: SceneAudioItem[]): void {
        this.repromptAudioSequence = this.repromptAudioSequence.concat(audio);
    }

    public appendStageRecapAudioSequence(audio: SceneAudioItem[]): void {
        this.recapAudioSequence = this.recapAudioSequence.concat(audio);
    }

    public appendStageVisuals(visuals: VisualOptions): void {
        if (!this.visualOptions) {
            this.visualOptions = [];
        }
        
        // Set the sceneID for these visuals to the current scene
        visuals.sceneID = this.currentSceneID;

        this.visualOptions.push(visuals);
    }

    public startNewScene(sceneID : string): void {
        this.currentSceneID = sceneID;

        this.currentSceneAudioQueue = {
            sceneID,
            foreground: [],
            background: []
        };
    
        this.currentSceneRepromptAudioQueue = {
            sceneID,
            foreground: [],
            background: []
        };
    
        this.currentSceneRecapAudioQueue = {
            sceneID,
            foreground: [],
            background: []
        };
    }

    public appendSceneSpeechForeground(audioItem: AudioItem[]): void {
        this.currentSceneAudioQueue.foreground = this.currentSceneAudioQueue.foreground.concat(audioItem);
    }

    public appendSceneSpeechBackground(audioItem: AudioItem[]): void {
        this.currentSceneAudioQueue.background = this.currentSceneAudioQueue.foreground.concat(audioItem);
    }

    public appendSceneRepromptForeground(audioItem: AudioItem[]): void {
        this.currentSceneRepromptAudioQueue.foreground = this.currentSceneRepromptAudioQueue.foreground.concat(audioItem);
    }

    public appendSceneRepromptBackground(audioItem: AudioItem[]): void {
        this.currentSceneRepromptAudioQueue.background = this.currentSceneRepromptAudioQueue.background.concat(audioItem);
    }

    public appendSceneRecapForeground(audioItem: AudioItem[]): void {
        this.currentSceneRecapAudioQueue.foreground = this.currentSceneRecapAudioQueue.foreground.concat(audioItem);
    }

    public appendSceneRecapBackground(audioItem: AudioItem[]): void {
        this.currentSceneRecapAudioQueue.background = this.currentSceneRecapAudioQueue.background.concat(audioItem);
    }

    public getSpeechSceneAudio(): SceneAudioItem {
        return this.currentSceneAudioQueue;
    }

    public getRepromptSceneAudio(): SceneAudioItem {
        return this.currentSceneRepromptAudioQueue;
    }

    public getRecapSceneAudio(): SceneAudioItem {
        return this.currentSceneRecapAudioQueue;
    }

    public closeScene(): void {
        if (this.currentSceneAudioQueue.foreground.length > 0 || this.currentSceneAudioQueue.background.length > 0) {
            this.speechAudioSequence = this.speechAudioSequence.concat(this.currentSceneAudioQueue);
        }

        if (this.currentSceneRepromptAudioQueue.foreground.length > 0 || this.currentSceneRepromptAudioQueue.background.length > 0) {
            this.repromptAudioSequence = this.repromptAudioSequence.concat(this.currentSceneRepromptAudioQueue);
        }

        if (this.currentSceneRecapAudioQueue.foreground.length > 0 || this.currentSceneRecapAudioQueue.background.length > 0) {
            this.recapAudioSequence = this.recapAudioSequence.concat(this.currentSceneRecapAudioQueue);
        }
    }
}