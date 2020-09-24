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

import { StoryAccessor } from "../story/storyAccessor";
import { Instruction, Scene, StoryMetadata } from '../story/storyMetadata';

/**
 * Help access and navigate the StoryMetadata used by the Driver
 */
export class StoryMetadataHelper extends StoryAccessor {
    constructor(story: StoryMetadata) {
        super(story);
    }

    /**
     * Set and replace all Scenes for the current import result.
     */
    public setAllScenes(scenes: Scene[]) {
        this.sourceData.scenes = JSON.parse(JSON.stringify(scenes));

        for (let scene of this.sourceData.scenes) {
            this.story[scene.id] = scene;
        }   
    }

    /**
     * Set and replace a scene for the current import result.
     */
    public setScene(sceneID: string, narration?: string, instructions?: Instruction[], customSceneProperty?: any): void {
        const adjustedSceneID: string = sceneID.trim().toLowerCase();

        const addingScene: Scene = {
            id: adjustedSceneID,
            contents: [
                {
                    narration: narration,
                    sceneDirections: instructions
                }
            ],
            customProperties: customSceneProperty
        }

        this.story[adjustedSceneID] = addingScene;
        this.sourceData.scenes.push(addingScene);
   }

   /**
    * Set and replace the narration property of the given scene.
    */
    public setSceneNarration(sceneID: string, narration: string): void {
        const scene = this.getSceneByID(sceneID);
        scene.contents[0].narration = narration;
    }

    /**
     * Set and replace instructions for the given scene.
     */
    public setSeceneInstructions(sceneID: string, instructions: Instruction[]): void {
        const scene = this.getSceneByID(sceneID);
        scene.contents[0].sceneDirections = instructions;
    }
    
}