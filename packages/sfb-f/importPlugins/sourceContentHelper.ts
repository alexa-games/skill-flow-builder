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

import { ContentItem } from '../importer/importer';

/**
 * Helper class to access and modify the raw source content.
 */
export class SourceContentHelper {

    constructor (private source: ContentItem[]) {
    }

    /**
     * Get the raw text from the source content matching the ID given.
     * @param contentID Often a file path/ file name of the source file, uniquely identifies a group of content.
     */
    getSourceContent(contentID: string): ContentItem {
        const selectedContent = this.source.filter((contentItem) => {
            return contentItem.id == contentID;
        });

        if (selectedContent.length > 0) {
            const result = selectedContent[0];
            return result;
        } else {
            throw new Error(`Content for ID='${contentID}' could not be found.`);
        }
    }

    /**
     * Set and replaces the raw text content for the given content ID.
     * 
     * @param contentID Often a file path/ file name of the source file, uniquely identifies a group of content.
     * @param content New raw source content
     */
    setSourceContent(contentID: string, content: string): void {
        let foundIndex: number = -1;

        for (let i = 0; i < this.source.length; i ++) {
            if (this.source[i].id === contentID) {
                foundIndex = i;
            }
        }

        if (foundIndex >= 0) {
            this.source[foundIndex].text = content;
        } else {
            throw new Error(`Content for ID='${contentID}' could not be found.`);
        }
    }

    /**
     * Add a new content group with a given contentID and a content text.
     * @param contentID identifier for this group of content
     * @param content raw content text
     */
    addSourceContent(contentID: string, content: string): void {
        const selectedContent = this.source.filter((contentItem) => {
            return contentItem.id == contentID;
        });

        if (selectedContent.length > 0) {
            throw new Error(`Content for ID='${contentID}' already exists.`);
        }

        this.source.push({
            id: contentID,
            text: content
        });
    }

    /**
     * Get all the source contents being processed for this importation run.
     */
    getAllSourceContents(): ContentItem[] {
        return this.source;
    }

    /**
     * Set and replace all the source contents for this importation run.
     */
    setAllSourceContents(contentItems: ContentItem[]): void {
        this.source = contentItems;
    }
}