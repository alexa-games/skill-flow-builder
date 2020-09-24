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

import {AudioFileAccessor} from './audioFileAccessor';
import {S3} from 'aws-sdk';

import * as fs from 'fs';
import * as path from 'path';
import * as urlParser from 'url';

import * as http from 'http';
import * as https from 'https';

const supportedProtocol: {[key: string]: any} = {
    "http:": http,
    "https:": https
}

export enum S3FileStatus {
    Unknown = 0,
    Exists = 1,
    NotExists = 2
}

// This cache prevents repeat S3 Head requests for files to speed up .exists commands,
// and updates this cache when an upload is successful.
export const s3FileStatusStaticCache : {[key: string]: S3FileStatus} = {}; 

/**
 * Implentation of AudioFileAccessor to use S3 as cache storage.
 */
export class S3AudioAccessor implements AudioFileAccessor {
    static readonly CACHE_DIR_NAME = "pollyCache";

    private static s3Client: S3;

    constructor(private setting: {
        bucketName: string;
        s3DomainName: string;
        audioWorkingDir: string;
        s3Client?: S3
    }) {
        if (setting.s3Client) {
            S3AudioAccessor.s3Client = setting.s3Client;
        } else {
            S3AudioAccessor.s3Client = new S3();
        }
    }

    exists(audioName: string): Promise<boolean> {
        return new Promise<boolean> (async (resolve) => {

            const key = `${S3AudioAccessor.CACHE_DIR_NAME}/${audioName}`;

            const statusKey = this.setting.bucketName + ":" + key;
            const s3FileStatus = s3FileStatusStaticCache[statusKey];
            if(s3FileStatus === S3FileStatus.Exists) {
                return resolve(true); 
            } else if(s3FileStatus === S3FileStatus.NotExists) {
                return resolve(false);
            }

            const params: S3.HeadObjectRequest = {
                Bucket: this.setting.bucketName, 
                Key: key            
            };
        
            try {
                S3AudioAccessor.s3Client.headObject(params, function(err: any, data: any) {
                    if (err) {
                        s3FileStatusStaticCache[statusKey] = S3FileStatus.NotExists;
                        resolve(false);
                    } else {
                        s3FileStatusStaticCache[statusKey] = S3FileStatus.Exists;
                        resolve(true);
                    }
                });
            } catch (err) {
                // Don't update S3 file status cache on s3 exception, maybe it was a temporary error
                resolve(false);
            }
        });        
    }

    async getAudioURL(audioName: string): Promise<string> {
        return `https://${this.setting.s3DomainName}/${this.setting.bucketName}/pollyCache/${audioName}`;
    }

    async uploadAudio(audioName: string, workingDirectory: string): Promise<string> {
        return new Promise<string> (async (resolve, reject) => {
            const localFilePath = path.resolve(workingDirectory, audioName);

            const key = `${S3AudioAccessor.CACHE_DIR_NAME}/${audioName}`;

            const statusKey = this.setting.bucketName + ":" + key;
            const s3FileStatus = s3FileStatusStaticCache[statusKey];

            // If the file already exists in S3, don't upload it again. To fix a bad file, you must go delete it.
            if(s3FileStatus === S3FileStatus.Exists) {
                return resolve(await this.getAudioURL(audioName)); 
            }

            try {
                if(!fs.existsSync(localFilePath)) {
                    return reject("Upload audio filepath does not exist: " + localFilePath);
                }

                const audioFileData = fs.readFileSync(localFilePath);

                const params: S3.PutObjectRequest = {
                    Bucket: this.setting.bucketName,
                    Key: key,
                    Body: audioFileData,
                    ACL: 'public-read'
                };

                console.info(`Uploading audio file '${audioName}'.`);

                S3AudioAccessor.s3Client.putObject(params, async (err: any, data: any) => {
                    if (err) {
                        return reject(err);
                    }

                    // On success, update the S3 file status cache
                    s3FileStatusStaticCache[statusKey] = S3FileStatus.Exists;
                    return resolve(await this.getAudioURL(audioName));
                });
            } catch (err) {
                throw err;
            }
        });
    }

    async downloadAudio(audioUrl: string, workingDirectory: string): Promise<void> {
        return new Promise<void> (async (resolve, reject) => {

            const parsedUrl = urlParser.parse(audioUrl);
            
            const lib = supportedProtocol[parsedUrl.protocol || "http:"];

            if (lib) {
                lib.get(audioUrl, (response: any) => {
                    const filename = path.basename(audioUrl);
                    const localFilePath = path.resolve(workingDirectory, filename);
                    const writeStream = fs.createWriteStream(localFilePath);

                    const stream = response.pipe(writeStream);
                    stream.on('close', function () {
                        return resolve();
                    });
                });
            } else {
                return reject("invalid URL Protocol");
            }
        });
    }
}