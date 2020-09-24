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

import { ImportErrorLine } from "../importer/importerEntity";
import { BuiltInScenes, StoryMetadata } from "../story/storyMetadata";

export class AlexaABCVerifier {
    public async verify(story: StoryMetadata): Promise<ImportErrorLine[]> {
        return new Promise<ImportErrorLine[]> ((resolve, reject) => {
            let foundErrors: ImportErrorLine[] = [];
            
            let hasStart: boolean = false;
            for (let scene of story.scenes) {
                if (scene.id.trim().toLowerCase() == BuiltInScenes.StartScene.trim().toLowerCase()) {
                    hasStart = true;
                }
            }

            if (!hasStart) {
                foundErrors.push({
                    lineNumber: 0,
                    errorName: "MissingScene",
                    errorMessage: "Cannot find the required scene 'start'."
                })
            }

            resolve(foundErrors);
        });
    }

}