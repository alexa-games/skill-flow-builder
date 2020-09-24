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

import { StoryMetadata, Scene, Instruction, BuiltInScenes } from "./storyMetadata";

/**
 * Accessor / Helper for StoryMetadata object.
 */
export class StoryAccessor {
    protected story: {[key: string]: Scene};
    protected sourceData: StoryMetadata;

    constructor(story: StoryMetadata) {
        this.sourceData = JSON.parse(JSON.stringify(story));

        this.story = {};

        let id2Page: {[key: string]: Scene} = {};

        for (let scene of this.sourceData.scenes) {
            id2Page[scene.id.toLowerCase()] = scene;
        }

        this.story = id2Page;
    }

    /**
     * Get the scene object of the currently driving story givene the scene ID.
     * @param sceneID scene ID
     */
    public getSceneByID(sceneID: string): Scene {
        let adjustedSceneID: string = sceneID.trim().toLowerCase();

        if (this.story[adjustedSceneID] || BuiltInScenes.PauseScene.toLowerCase() == adjustedSceneID ||
            BuiltInScenes.ResumeScene.toLowerCase() == adjustedSceneID) {
            return this.story[adjustedSceneID];
        } else {
            throw new Error(`Cannot find the scene ${adjustedSceneID}.`); 
        }
    }

    public getSceneNarration(sceneID: string): string {
        let adjustedSceneID: string = sceneID.trim().toLowerCase();

        if (this.story[adjustedSceneID] && this.story[adjustedSceneID].contents && this.story[adjustedSceneID].contents[0]) {
            const narration = this.story[adjustedSceneID].contents[0].narration;
            if (narration) {
                return narration;
            }
        }

        throw new Error(`Cannot find the scene ${adjustedSceneID}.`);
    }

    public getSceneInstructions(sceneID: string): Instruction[] {
        let adjustedSceneID: string = sceneID.trim().toLowerCase();

        if (this.story[adjustedSceneID] && this.story[adjustedSceneID].contents && this.story[adjustedSceneID].contents[0]) {
            const instructions = this.story[adjustedSceneID].contents[0].sceneDirections;
            if (instructions) {
                return instructions;
            }
        }

        throw new Error(`Cannot find the scene ${adjustedSceneID}.`);
    }

    /**
     * Gets a list of Scenes within the current story.
     */
    public getAllScenes(): Scene[] {
        let storyReference: {[key: string]: Scene} = JSON.parse(JSON.stringify(this.story));
        let scenes: Scene[] = Object.keys(storyReference).map(function (value: string, index: number, array: string[]) {
            return storyReference[value];
        });

        return scenes;
    }

    public async getStoryID(): Promise<string> {
        return this.sourceData.storyID;
    }

    public async getStoryMetadata(): Promise<StoryMetadata> {
        return JSON.parse(JSON.stringify(this.sourceData));
    }
}