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
import { SourceContentHelper } from '../../importPlugins/sourceContentHelper';
import { StoryMetadataHelper } from '../../importPlugins/storyMetadataHelper';

export class SnippetExtension implements ImporterExtension {
    private snippetMap: {[key: string]: string};
    private s3ResourcesUri: string = "";

    constructor(snippetMap: {[key: string]: string}, s3ResourcesUri: string = "") {
        this.snippetMap = JSON.parse(JSON.stringify(snippetMap));
        this.s3ResourcesUri = s3ResourcesUri;
    }

    async extendSourceContent(sourceHelper: SourceContentHelper): Promise<void> {
        const contents = sourceHelper.getAllSourceContents();

        for (let contentItem of contents) {
            for (let snippetKey of Object.keys(this.snippetMap)) {
                // This regex has a check for no additional "[" or "<" signs in it, so those will not be allowed within a snippet name or arguments.
                let snippetKeyRegex: RegExp = new RegExp(`[<\\[][ \\t]*?${snippetKey}(?:[ \\t]+?([^>\\[\\] \\t]+?))?(?:[ \\t]+?([^>\\[\\] \\t]+?))?(?:[ \\t]+?([^>\\[\\] \\t]+?))?(?:[ \\t]+?([^>\\[\\] \\t]+?))?(?:[ \\t]+?([^>\\[\\] \\t]+?))?(?:[ \\t]+?([^>\\[\\] \\t]+?))?[ \\t]*?[>\\]]`, "gi"); // Allow up to 5 substitutions in snippets $1 through $5
    
                let snippetReplacementValue = this.snippetMap[snippetKey];
    
                snippetReplacementValue = snippetReplacementValue.replace(new RegExp('\\$SNIPPET_S3_RESOURCES_URI', 'gm'), this.s3ResourcesUri);
    
                // Replace until I don't need to replace anymore, or I hit 10 times so I don't infinite loop forever
                for(let i = 0; i < 10; i++) {
                    const beforeString = contentItem.text;
                    const newString = contentItem.text.replace(snippetKeyRegex, snippetReplacementValue);

                    contentItem.text = newString;
                    // If no difference, break out of the loop
                    if(newString === beforeString) {
                        break;
                    }
                }
            }
        }

        sourceHelper.setAllSourceContents(contents);
    }
    
    async extendImportedContent(metadataHelper: StoryMetadataHelper): Promise<void> {
    }
}