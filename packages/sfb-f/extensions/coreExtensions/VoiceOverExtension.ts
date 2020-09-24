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


import * as _http from 'http';
import * as url from 'url';
import { ImporterExtension } from '../SFBExtension';
import { SourceContentHelper } from '../../importPlugins/sourceContentHelper';
import { StoryMetadataHelper } from '../../importPlugins/storyMetadataHelper';

import { createHash } from 'crypto';

async function urlExists(urlString : string, http: any): Promise<boolean> {
    return new Promise<boolean> ((resolve) => {
        let options: any = {
            method: 'HEAD',
            host: url.parse(urlString).host,
            port: 80,
            path: url.parse(urlString).pathname
        };
    
        let request: any = http.request(options, function(r: any) {
            resolve(r.statusCode == 200);
        });
        
        request.end();
    });
}

/**
 * Replaces a section of speech surrounded by voice over marker with appropriate sound file.
 * A section surrounded by voice over tags (<vo> </vo>) is considered the voice over section.
 * Also, prints out the script and the generated file name for the section.
 */
export class VoiceOverExtension implements ImporterExtension {
    private urlFormat: string;
    private recordingScript: string;
    private http: any;

    /**
     * @param urlFormat string showing the url pattern. {{file_name}} is replaced with the auto generated file name.
     */
    public constructor(urlFormat: string, http?: any) {
        this.urlFormat = urlFormat;
        this.recordingScript = "";
        this.http =  http || _http;
    }

    async extendSourceContent(sourceHelper: SourceContentHelper): Promise<void> {
    }

    async extendImportedContent(metadataHelper: StoryMetadataHelper): Promise<void> {
        let voiceOverRegex: RegExp = /<[\s]*?vo[\s]*?>([\s\S]+?)<[\s]*?\/[\s]*?vo[\s]*?>/g
        let recordingScript: string = "";

        let urlFormat: string = this.urlFormat;
        let nonExistingURLs: string[] = [];

        let sceneString: string = JSON.stringify(metadataHelper.getAllScenes());
        let resultString: string = JSON.stringify(metadataHelper.getAllScenes());
        let voTagMatch: any = voiceOverRegex.exec(sceneString);

        let alreadyCaptured: any = {};
        while (voTagMatch) {
            let match: string = voTagMatch[0];
            let p1: string = voTagMatch[1];

            let scriptHash: string = createHash('md5').update(p1.trim().toLowerCase().replace(/[\s]+/g, "")).digest('hex');

            let fileName: string = `${scriptHash}.mp3`;
            let fileURL: string = urlFormat.replace("{{file_name}}", fileName);

            if (!alreadyCaptured[scriptHash]) {
                alreadyCaptured[scriptHash] = true;

                let scriptContent: string = p1.replace(/\\n/g, "\n").replace(/\\t/g, "\t")
                    .replace(/\\'/g, "'").replace(/\\"/g, "\"");

                recordingScript += `\n\n[FILENAME] = '${fileName}'`;
                recordingScript += "\n" + scriptContent + "\n";

            }

            let exists: boolean = await urlExists(fileURL, this.http);

            if (exists) {
                resultString = resultString.replace(match, `<audio src='${fileURL}' />`);
            } else {
                nonExistingURLs.push(fileURL);
                resultString = resultString.replace(match, p1);
            }

            voTagMatch = voiceOverRegex.exec(sceneString);
        }

        this.recordingScript = recordingScript;

        if (nonExistingURLs.length > 0 ) {
            console.warn(`Voice-over file do not exist for the following URLs: ${JSON.stringify(nonExistingURLs, null, 4)}`);
        }

        metadataHelper.setAllScenes(JSON.parse(resultString));
    }

    public getRecordingScript(): string {
        return this.recordingScript;
    }
}
