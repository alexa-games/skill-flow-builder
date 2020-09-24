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

import {AudioFileAccessor} from './audioAccessor/audioFileAccessor';
import {AudioMixer, SequenceType, MixMode, TrimOption} from './audioMixer';
import {Polly, SharedIniFileCredentials, config as AWSConfig} from 'aws-sdk';
import * as fs from 'fs';
import * as path from 'path';

const mp3Duration = require('mp3-duration');

export interface PollyRequestItem {
    name: string;
    text: string;
    delayMs: number;
    engine: string;
    volume: string;
    rate: string;
    pitch: string;
    speechMarkTypes?: [string];
}

export enum PollyOutFormat {
    MP3 = 'mp3',
    JSON ='json'
}

export interface PollyConfig {
    dontUseCache?: boolean;
    dontCombineIfAudioTagSeperatedBySpace?: boolean;
    combineAudioTags?: boolean;
    dontUploadToS3?: boolean;
    awsProfileName?: string;
    awsRegion?: string;
    [key: string]: any;
}

export class PollyUtil {
    private static pollyClient: Polly;
    public static pollyConfig: PollyConfig;
    
    constructor(private audioAccessor: AudioFileAccessor, pollyClient?: Polly, awsRegion?: string) {
        if (pollyClient) {
            PollyUtil.pollyClient = pollyClient;
        } else {
            PollyUtil.pollyClient = new Polly({
                region: awsRegion||"us-east-1",
                signatureVersion: "v4"    
            });
        }
    }

    public static configurePolly(config: PollyConfig) {
        PollyUtil.pollyConfig = config;

        if(config.awsRegion) {
            AWSConfig.region = config.awsRegion;
        }

        if (config.awsProfileName) {
            const credentials = new SharedIniFileCredentials({profile: config.awsProfileName});
            AWSConfig.credentials = credentials;
        }
    }

    public synthesize(request: PollyRequestItem, workingDir: string, filename: string, outputFormat: PollyOutFormat = PollyOutFormat.MP3): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            let speechText = request.text.trim();

            let contentExtract = /^<speak>([\s\S]*?)<\/speak>$/.exec(speechText);
            if (contentExtract != null) {
                speechText = contentExtract[1];
            }

            const hasPitchChange = !!(request.pitch && request.pitch.length > 0 && request.pitch !== "+0%" && request.pitch !== "-0%");
            const hasRateChange = !!(request.rate && request.rate.length > 0 && request.rate !== "100%");
            const hasVolumeChange = !!(request.volume !== "1.0" && request.volume !== "1");

            let prosodyOpenTag: string = "";
            let prosodyCloseTag: string = "";

            if (hasPitchChange || hasRateChange || hasVolumeChange) {
                let prosodyOptions = "";
                if (hasPitchChange) {
                    prosodyOptions += `pitch='${request.pitch}'`;
                }

                if (hasRateChange) {
                    prosodyOptions += ` rate='${request.rate}'`;
                }

                if (hasVolumeChange) {
                    prosodyOptions += ` volume='${request.volume}'`;
                }
                
                prosodyOpenTag += `<prosody ${prosodyOptions}>`;
                prosodyCloseTag = `</prosody>`;
            }

            const params: Polly.SynthesizeSpeechInput = {
                'Text': `<speak>${prosodyOpenTag}${speechText}${prosodyCloseTag}</speak>`,
                'TextType': 'ssml', 
                'OutputFormat': outputFormat,
                'VoiceId': request.name,
                'SampleRate': '24000', 
            }

            if (request.engine) {
                params.Engine = request.engine;
            }

            if (request.speechMarkTypes) {
                params.SpeechMarkTypes = request.speechMarkTypes;
            }

            PollyUtil.pollyClient.synthesizeSpeech(params, (err: any, data: any) => {	
                if (err) {
                    // Adding a hook for catching Missing Credentails Error from auth
                    if(err.message && err.message.match(/Missing credentials in config/g)) {
                        err.message = "Voice Preview Error: Voice Preview will not work in offline mode or without a configured AWS account. Please connect to the internet, update aws-profile-name in the project configuration, or disable Voice Preview.";
                    } else {
                        err.message = "Voice Preview Error: '" + err.message + "' given voice '" + request.name + "' and text '" + request.text + "'";
                    }
        
                    return reject(err);
                } else if (data) {
                    if (data.AudioStream instanceof Buffer) {
                        // If outputFormat is ssml, just return the metadata directly in our callback instead of saving to disk
                        if(outputFormat === PollyOutFormat.JSON) {
                            const speechMarksData = data.AudioStream.toString('utf-8');
        
                            try {
                                const jsonSpeechMarksObj = JSON.parse(speechMarksData);
                                return resolve(jsonSpeechMarksObj)
                            } catch (err) {
                                reject(err);
                            }
                        } else {
                            const pollyFilename = path.join(workingDir, filename);
    
                            try {
                                fs.writeFileSync(pollyFilename, data.AudioStream);
                                resolve();
                            } catch(err) {
                                reject(err);
                            }
                        }
                    }
                }
            })
        });
    }

    public async estimateSSMLDuration(ssml: string, workingDir: string): Promise<number> {
        const audioTagRegex = /<audio[ \t]+?src=['"']([ \S]*?)['"][ \t]*?\/[ \t]*?>/g;

        let match = audioTagRegex.exec(ssml);
        let duration = 0;

        while (match !== null) {
            const url = match[1];
            const fileName = path.basename(url);
            const filePath = path.resolve(workingDir, fileName);

            if (!fs.existsSync(filePath)) {
                await this.audioAccessor.downloadAudio(url, workingDir);
            }

            duration += await this.calculateMP3Duration(filePath);

            match = audioTagRegex.exec(ssml);
        }

        duration += await this.estimateNonAudioTagDuration(ssml, workingDir);
    
        return duration;
    }

    public calculateMP3Duration(filePath: string): Promise<number> {
        return new Promise<number> ((resolve, reject) => {
            mp3Duration(filePath, function (err: any, durationForThisFile: any): any {
                if (err) {
                    return reject(err);
                }

                const durationInMs = durationForThisFile * 1000.0; // convert to milliseconds

                return resolve(durationInMs);
            });
        });
    }

    private async estimateNonAudioTagDuration(ssml: string, workingDir: string): Promise<number> {
        let duration = 0;
        const audioTagRegex = /<audio[ \t]+?src=['"'][ \S]*?['"][ \t]*?\/[ \t]*?>/g;

        let nonAudioOnlyText = ssml.replace(audioTagRegex, " ");
    
         // In tests, the Joanna voice takes the same time to read text as Alexa's natural voice does
        const defaultVoice = 'Joanna';

        // Add a <mark name='the_end'/> tag to the end of the request
        nonAudioOnlyText = nonAudioOnlyText.trim();

        if(nonAudioOnlyText && nonAudioOnlyText.length > 0) {
            nonAudioOnlyText += "<mark name='the_end'/>";

            const pollyConfig: PollyRequestItem  = {
                name: defaultVoice,
                text: nonAudioOnlyText,
                delayMs: 0,
                engine: "standard",
                speechMarkTypes: ["ssml"],
                pitch: "+0%",
                rate: "100%",
                volume: "1.0"
            };

            const speechMarks = await this.synthesize(pollyConfig, workingDir, "", PollyOutFormat.JSON);
            if(speechMarks && speechMarks.time) {
                duration = speechMarks.time;
            }
        }
    
        return duration;
    }
}