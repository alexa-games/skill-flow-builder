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

import * as fs from 'fs';
import * as path from 'path';
import { TextDocument } from 'vscode';
import { readUtf8FileExcludingBomSync } from '@alexa-games/sfb-util';
 
export interface ContentItem {
    id: string,
    text: string
}

export class Util {
    public static async getContentItemsFromDocument(document: TextDocument): Promise<ContentItem[]> {
        let filePath: string = path.resolve(document.uri.fsPath.replace(/\/[^\/]+?$/g, "").replace(/\\[^\\]+?$/g, ""));
        let manifestPath: string = path.join(filePath, "MANIFEST.json");
        let manifestFound: boolean = false;

        while (filePath.length > 0 && !manifestFound) {
            if (fs.existsSync(manifestPath)) {
                manifestFound = true;
                break;
            }
            
            filePath = path.resolve(filePath.replace(/\/[^\/]+?[\/]?$/g, ""));
            manifestPath = path.join(filePath, "MANIFEST.json");
        }

        let contentItems: ContentItem[] = [];

        try {
            if (manifestFound) {
                contentItems = await Util.getContentItems(JSON.parse(readUtf8FileExcludingBomSync(manifestPath)), filePath);
            } else {
                contentItems.push({
                    id: document.uri.toString(),
                    text: document.getText()
                });
            }
        } catch (err) {
            console.log("issue while parsing for content items: " + err);
        }
        
        return contentItems;

    }
    
    public static async getContentItems(manifest: any, srcDirectoryPath: string): Promise<ContentItem[]> {
        return new Promise<ContentItem[]> ((resolve, reject) => {
            try {
                let stories: string[] = manifest.include;
                let pathToRegex: {[key: string]: string} = {};
    
                for (let storyRegex of stories) {
                    let extractFileRegex: RegExp = /([\S]+\/)?([^\/]+?.abc)$/g;
                    let matchedPath: any = extractFileRegex.exec(storyRegex);
    
                    if (matchedPath != null) {
                        let postDir: string = matchedPath[1]? `/${matchedPath[1]}`: "";
                        if (!pathToRegex[`${srcDirectoryPath}${postDir}`]) {
                            pathToRegex[`${srcDirectoryPath}${postDir}`] = "";
                        } else {
                            pathToRegex[`${srcDirectoryPath}${postDir}`] += "|"
                        }
    
                        pathToRegex[`${srcDirectoryPath}${postDir}`] += `(?:^${matchedPath[2].replace(/\./g, "\\.").replace(/\*/g, ".*")}$)`;
                    }
                    
                }
    
                let combinedStoryContent: ContentItem[] = [];
    
                for (let searchDirectory of Object.keys(pathToRegex)) {
                    let files: string[] = fs.readdirSync(searchDirectory);
                    if (!files) {
                        throw new Error(`[Import ERROR] Cannot find story content files: ${JSON.stringify(stories, null, 4)}`);
                    }
                
                    for (var i = 0; i < files.length; i++) {
                        let file: string = files[i];
                        if (file.match(pathToRegex[searchDirectory])) {
                            combinedStoryContent.push({
                                id: path.join(searchDirectory, file),
                                text: fs.readFileSync(path.join(searchDirectory, file), { encoding: 'utf8' })
                            });
                        }
                    }
                }
            
                resolve(combinedStoryContent);
            } catch (err) {
                reject(err);
            }
        });
    }
}