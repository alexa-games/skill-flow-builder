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

import { DriverExtension, InstructionExtension, DriverExtensionParameter, InstructionExtensionParameter, StoryStateHelper, Choice, SceneDirectionBuilder } from '@alexa-games/sfb-f';
import { ConfigAccessor } from './../configAccessor';

export interface AudioPlayerItem { 
    url: string,
    playBehavior?: string,
    offsetInMilliseconds?: number,
    metadata?: { title?: string,
                 subtitle?: string,
                 art?: string,
                 backgroundImage?: string }
};

export enum AudioPlayerDirective {
    Play= "AudioPlayer.Play",
    Stop= "AudioPlayer.Stop",
    ClearQueue= "AudioPlayer.ClearQueue",
    None= "None"
}

export class AlexaAudioPlayerExtension implements DriverExtension, InstructionExtension {

    private directivesToPost: any[] = [];

    public constructor(locale: string, configAccessor: ConfigAccessor) {
    }

    async post(param: DriverExtensionParameter) {
        const handlerInput = param.userInputHelper.getHandlerInput();

        if(handlerInput) {
            // Post all directives then clear them out again
            if(this.directivesToPost.length > 0) {
                this.directivesToPost.forEach((directive) => {
                    handlerInput.responseBuilder.addDirective(directive);
                });

                this.directivesToPost = [];
            }
        }
    }

    public generateAudioPlayerDirective(directive : AudioPlayerDirective, 
                                        audioPlayerItem? : AudioPlayerItem, 
                                        storyState? : {[key: string]: any}) : any {
        
        // Retrieve and set tokens in story state
        const previousToken = (storyState && storyState.audio_player_token) ? storyState.audio_player_token : "";

        const token = Math.floor(Math.random() * 1000000);

        if(storyState) {
            storyState.audio_player_token = token;
        }

        if(directive === AudioPlayerDirective.Play && audioPlayerItem) {

            const audioPlayerDirective = {
                    "type": directive,
                    "playBehavior": audioPlayerItem.playBehavior || "REPLACE_ALL",
                    "audioItem": {
                      "stream": {
                        "url": audioPlayerItem.url,
                        "token": token,
                        "expectedPreviousToken": previousToken,
                        "offsetInMilliseconds": audioPlayerItem.offsetInMilliseconds || 0
                      },
                      "metadata": {
                        "title": (audioPlayerItem.metadata && audioPlayerItem.metadata.title) ? audioPlayerItem.metadata.title : "",
                        "subtitle": (audioPlayerItem.metadata && audioPlayerItem.metadata.subtitle) ? audioPlayerItem.metadata.subtitle : "",
                        "art": {
                          "sources": [
                            {
                              "url": (audioPlayerItem.metadata && audioPlayerItem.metadata.art) ? audioPlayerItem.metadata.art : ""
                            }
                          ]
                        },
                        "backgroundImage": {
                          "sources": [
                            {
                              "url": (audioPlayerItem.metadata && audioPlayerItem.metadata.backgroundImage) ? audioPlayerItem.metadata.backgroundImage : ""
                            }
                          ]
                        }
                      }
                    }
            };

            // Delete expected previous token if not an ENQUEUE request
            if(audioPlayerDirective.playBehavior !== "ENQUEUE") {
                delete audioPlayerDirective.audioItem.stream.expectedPreviousToken;
            }

            return audioPlayerDirective;

        } else if(directive === AudioPlayerDirective.Stop) {

            return {
                "type": directive
            };

        } else if(directive === AudioPlayerDirective.ClearQueue) {

            return {
                "type": directive,
                "clearBehavior" : "CLEAR_ALL"
            }
        }

        // else return undefined
        return undefined;
    }

    async pre(param: DriverExtensionParameter) {
    }

    async audio_player_play(param: InstructionExtensionParameter): Promise<void> {

        if(!param.instructionParameters.url) {
            throw new Error("Audio Player Play directive requires 'url' param");
        }

        const audioItem : AudioPlayerItem = { url: param.instructionParameters.url};

        if(param.instructionParameters.playBehavior) {
            audioItem.playBehavior = param.instructionParameters.playBehavior;
        }

        if(param.instructionParameters.offsetInMilliseconds) {
            audioItem.offsetInMilliseconds = Number.parseInt(param.instructionParameters.offsetInMilliseconds);
        }

        if(param.instructionParameters.title || 
            param.instructionParameters.subtitle ||
            param.instructionParameters.art ||
            param.instructionParameters.backgroundImage
            ) {

            audioItem.metadata = {};

            if(param.instructionParameters.title) {
                audioItem.metadata.title = param.instructionParameters.title;
            }
            if(param.instructionParameters.subtitle) {
                audioItem.metadata.subtitle = param.instructionParameters.subtitle;
            }
            if(param.instructionParameters.art) {
                audioItem.metadata.art = param.instructionParameters.art;
            }
            if(param.instructionParameters.backgroundImage) {
                audioItem.metadata.backgroundImage = param.instructionParameters.backgroundImage;
            }
        }

        const directive = this.generateAudioPlayerDirective(AudioPlayerDirective.Play, audioItem, param.storyState);

        if(directive) {
            this.directivesToPost.push(directive);
        }
    }

    async audio_player_stop(param: InstructionExtensionParameter): Promise<void> {

        const directive = this.generateAudioPlayerDirective(AudioPlayerDirective.Stop);

        if(directive) {
            this.directivesToPost.push(directive);
        }
    }

    async audio_player_clear_queue(param: InstructionExtensionParameter): Promise<void> {

        const directive = this.generateAudioPlayerDirective(AudioPlayerDirective.ClearQueue);

        if(directive) {
            this.directivesToPost.push(directive);
        }
    }

}