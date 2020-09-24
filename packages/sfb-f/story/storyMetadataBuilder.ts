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

import { StoryMetadata, Instruction, Scene } from './storyMetadata';
import { InstructionBuilder } from './instructionBuilder';


interface BuilderScene {
    id: string;
    say?: string;
    reprompt?: string;
    recap?: string;
    then?: Instruction[];
}

/**
 * Builder for [[StoryMetadata]] used for SFB.
 */
export class StoryMetadataBuilder {
    private scenes: BuilderScene[];

    constructor(private storyID: string, private storyTitle: string) {
        this.scenes = [];
    }

    public addScene(sceneParam :BuilderScene) {
        this.scenes.push(sceneParam);
    }

    public setSceneSay(sceneId: string, say: string) {
        const i = this.indexOf(sceneId);

        if (i < 0) {
            throw new Error(`Cannot find a scene with ID: '${sceneId}'`);
        }

        this.scenes[i].say = say;
    }

    public setSceneRecap(sceneId: string, recap: string) {
        const i = this.indexOf(sceneId);

        if (i < 0) {
            throw new Error(`Cannot find a scene with ID: '${sceneId}'`);
        }

        this.scenes[i].recap = recap;
    }

    public setSceneReprompt(sceneId: string, reprompt: string) {
        const i = this.indexOf(sceneId);

        if (i < 0) {
            throw new Error(`Cannot find a scene with ID: '${sceneId}'`);
        }

        this.scenes[i].reprompt = reprompt;
    }

    public setSceneInstructions(sceneId: string, instructions: Instruction[]) {
        const i = this.indexOf(sceneId);

        if (i < 0) {
            throw new Error(`Cannot find a scene with ID: '${sceneId}'`);
        }

        this.scenes[i].then = instructions;
    }

    public appendSceneSay(sceneId: string, say: string) {
        const i = this.indexOf(sceneId);

        if (i < 0) {
            throw new Error(`Cannot find a scene with ID: '${sceneId}'`);
        }

        this.scenes[i].say += " " + say;
    }

    public appendSceneRecap(sceneId: string, recap: string) {
        const i = this.indexOf(sceneId);

        if (i < 0) {
            throw new Error(`Cannot find a scene with ID: '${sceneId}'`);
        }

        this.scenes[i].recap += " " + recap;
    }

    public appendSceneReprompt(sceneId: string, reprompt: string) {
        const i = this.indexOf(sceneId);

        if (i < 0) {
            throw new Error(`Cannot find a scene with ID: '${sceneId}'`);
        }

        this.scenes[i].reprompt += " " + reprompt;
    }

    public appendSceneInstructions(sceneId: string, instructions: Instruction[]) {
        const i = this.indexOf(sceneId);

        if (i < 0) {
            throw new Error(`Cannot find a scene with ID: '${sceneId}'`);
        }

        this.scenes[i].then = (this.scenes[i].then || []).concat(instructions);
    }

    private indexOf(sceneId: string): number {
        for (let i = 0; i < this.scenes.length; i++) {
            const scene = this.scenes[i];

            if (scene.id === sceneId) {
                return i;
            }
        }

        return -1;
    }

    build(): StoryMetadata {
        const story: StoryMetadata = {
            pluginName: "default",
            storyID: this.storyID,
            storyTitle: this.storyTitle,
            scenes: [

            ]
        }

        this.scenes.forEach((builderScene) => {

            const instructionBuilder = new InstructionBuilder();

            if (builderScene.recap) {
                instructionBuilder.setRecap(builderScene.recap);
            }

            if (builderScene.reprompt) {
                instructionBuilder.setReprompt(builderScene.reprompt);
            }

            if (builderScene.then) {
                builderScene.then.forEach((instruction) => {
                    instructionBuilder.addInstruction(instruction);
                });
            }

            story.scenes.push({
                id: builderScene.id,
                contents: [
                    {
                        narration: builderScene.say,
                        sceneDirections: instructionBuilder.build()
                    }
                ]
            });
        });

        return story;
    }
}