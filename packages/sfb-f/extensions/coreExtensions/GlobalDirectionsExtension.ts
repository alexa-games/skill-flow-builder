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

import { ImporterExtension } from '../SFBExtension';
import { Scene, Instruction } from '../../story/storyMetadata';
import { SourceContentHelper } from '../../importPlugins/sourceContentHelper';
import { StoryMetadataHelper } from '../../importPlugins/storyMetadataHelper';


/**
 *  Append the Scene Directions of a "Global" to all other scenes.
 *  The "Global" must be named Global.
 *  If you wish to prepend before every scene, define a scene named "global prepend".
 *  If you wish to postpend after every scene, define a scene named "global postpend".
 *  conditional variation of the scene is not supported for the Global.
 */
export class GlobalDirectionsExtension implements ImporterExtension {
    private exceptionScenes: string[];

    constructor(exceptionScenes: string[] = []) {
        this.exceptionScenes = [];
        for (let id of exceptionScenes) {
            this.exceptionScenes.push(id.trim().toLowerCase());
        }
    }

    async extendSourceContent(sourceHelper: SourceContentHelper): Promise<void> {
    }

    async extendImportedContent(metadataHelper: StoryMetadataHelper): Promise<void> {
        let scenes: Scene[] = metadataHelper.getAllScenes();

        //search global scene
        let postpendGlobalScenes: Scene[] = scenes.filter(scene => {
            const isGlobalPostpend = this.isGlobalPostpend(scene.id);

            // Mark each scene direction with a sourceScene attribute before returning
            if(isGlobalPostpend && scene && scene.contents && scene.contents[0] && scene.contents[0].sceneDirections ) {
                for(let sceneDirection of scene.contents[0].sceneDirections) {
                    recursiveMarkSourceScene(sceneDirection, scene.id); // Mark the sourceScene in this direction and all child directions it may contain
                }
            }

            return isGlobalPostpend;
        });

        let prependGlobalScenes: Scene[] = scenes.filter(scene => {
            const isGlobalPrepend = this.isGlobalPrepend(scene.id);

            // Mark each scene direction with a sourceScene attribute before returning
            if(isGlobalPrepend && scene && scene.contents && scene.contents[0] && scene.contents[0].sceneDirections ) {
                for(let sceneDirection of scene.contents[0].sceneDirections) {
                    recursiveMarkSourceScene(sceneDirection, scene.id); // Mark the sourceScene in this direction and all child directions it may contain
                }
            }

            return isGlobalPrepend;
        });

        if (postpendGlobalScenes.length > 0) {
            scenes.filter(scene => {
                return !this.exceptionScenes.includes(scene.id.trim().toLowerCase());
            }).forEach(scene => {
                if (!this.isGlobalPostpend(scene.id) && !this.isGlobalPrepend(scene.id)) {
                    scene.contents.forEach(content => {
                        postpendGlobalScenes.forEach(postpendGlobalScene => {
                            if (content.sceneDirections) {
                                content.sceneDirections = content.sceneDirections.concat(postpendGlobalScene.contents[0].sceneDirections || []);
                            } else {
                                content.sceneDirections = postpendGlobalScene.contents[0].sceneDirections || [];
                            }

                            if (postpendGlobalScene.contents[0].narration && postpendGlobalScene.contents[0].narration.trim().length > 0) {
                                content.narration += " " + postpendGlobalScene.contents[0].narration;
                            }
                        });
                    });
                }
            });
        }

        if (prependGlobalScenes.length > 0) {
            scenes.filter(scene => {
                return !this.exceptionScenes.includes(scene.id.trim().toLowerCase());
            }).forEach(scene => {
                if (!this.isGlobalPostpend(scene.id) && !this.isGlobalPrepend(scene.id)) {
                    scene.contents.forEach(content => {
                        prependGlobalScenes.forEach(prependGlobalScene => {
                            if (content.sceneDirections) {
                                content.sceneDirections = (prependGlobalScene.contents[0].sceneDirections || []).concat(content.sceneDirections);
                            } else {
                                content.sceneDirections = prependGlobalScene.contents[0].sceneDirections || [];
                            }

                            if (prependGlobalScene.contents[0].narration && prependGlobalScene.contents[0].narration.trim().length > 0) {
                                content.narration = prependGlobalScene.contents[0].narration + " " + content.narration;
                            }
                        });
                    });
                }
            });
        }

        metadataHelper.setAllScenes(scenes);
    }
    
    private isGlobalPrepend(id: string): boolean{
        return id.toLowerCase().trim() === "global prepend".toLowerCase().trim();
    }

    private isGlobalPostpend(id: string): boolean{
        return id.toLowerCase().trim() === "Global".toLowerCase().trim() || id.toLowerCase().trim() === "global postpend".toLowerCase().trim() || id.toLowerCase().trim() === "global append".toLowerCase().trim();
    }
}

function recursiveMarkSourceScene(direction : Instruction, sourceScene : string) {
    direction.sourceScene = sourceScene;

    if(direction.parameters && direction.parameters.directions && direction.parameters.directions.length > 0) {

        for(let dir of direction.parameters.directions) {
            recursiveMarkSourceScene(dir, sourceScene);
        }
    }
}