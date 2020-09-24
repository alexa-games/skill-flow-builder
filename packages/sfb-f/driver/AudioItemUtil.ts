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

import { SceneAudioItem, AudioItem, AlexaAudioType, AudioBlendOption } from '../driver/driverEntity';
import { AudioMixer, AudioFileAccessor, AudioMixSetting, TrimOption, SequenceType, MixMode, PollyUtil, S3AudioAccessor } from '@alexa-games/sfb-polly';
import { DriverPollyConfig, SFBDriver, Narrator } from './driver';

import * as path from 'path';
import * as fs from 'fs';

export class AudioItemUtil {
    private generatedFiles: {[key:string]: boolean;};

    constructor() {
        this.generatedFiles = {};
    }

    /**
     * Combines consecutive polly audio items in a sequence with same settings into one item.
     *
     * @param _sceneAudio audio item sequence to perform condensing on
     * @param keepScenesSeperate if true polly items the merge is performed per scene; otherwise combine all valid consecutive polly items across all scenes.
     */
    public condensePollyItem(_sceneAudio: SceneAudioItem[], keepScenesSeperate?: boolean): SceneAudioItem[] {
        let sceneAudio: SceneAudioItem[] = JSON.parse(JSON.stringify(_sceneAudio));
        let optimizedStageSpeechSequence: SceneAudioItem[] = [];
        // combine back-to-back polly items sharing same voice property into one.
        let tempItem: SceneAudioItem | undefined = undefined;
        let buildingItem: AudioItem | undefined = undefined;
        let tempPushed: boolean = false;
        let currentlyProcessingSceneID: string | undefined = undefined;

        for (let sceneItem of sceneAudio) {
            const processingNewSceneId = (currentlyProcessingSceneID !== undefined) && 
                (currentlyProcessingSceneID !== sceneItem.sceneID);

            currentlyProcessingSceneID = sceneItem.sceneID;

            if (sceneItem.background.length > 0 || (keepScenesSeperate && processingNewSceneId)) {
                if (tempItem) {
                    if (buildingItem) {
                        tempItem.foreground.push(buildingItem);
                        buildingItem = undefined;
                    }

                    tempPushed = true;
                    optimizedStageSpeechSequence.push(tempItem);
                    tempItem = undefined;
                }

                optimizedStageSpeechSequence.push(sceneItem);
                continue;
            }

            for (let foregroundItem of sceneItem.foreground) {
                if (!tempItem) {
                    tempPushed = false;
                    tempItem = {
                        sceneID: sceneItem.sceneID,
                        foreground: [],
                        background: []
                    };
                }

                if (foregroundItem.type === AlexaAudioType.POLLY) {
                    if (buildingItem) {
                        if (this.isEqualSetting(foregroundItem, buildingItem)) {
                            buildingItem.content += ` ${foregroundItem.content}`;
                        } else {
                            tempItem.foreground.push(buildingItem);

                            buildingItem = foregroundItem;
                        }
                    } else {
                        buildingItem = foregroundItem;
                    }
                } else {
                    if (buildingItem) {
                        tempItem.foreground.push(buildingItem);
                    }
                    tempItem.foreground.push(foregroundItem);
                    buildingItem = undefined;
                }
            }
        }

        if (buildingItem && tempItem) {
            tempItem.foreground.push(buildingItem);
        }


        if (!tempPushed && tempItem) {
            optimizedStageSpeechSequence.push(tempItem);
        }

        return optimizedStageSpeechSequence;
    }

    /**
     * Given two AudioItems, determines if the mix/modify setting for the audio item is identifcal.
     */
    public isEqualSetting(subjectAudio: AudioItem, comparingAudio: AudioItem): boolean {
        const isSameType = subjectAudio.type === comparingAudio.type;
        const hasSameOptions = JSON.stringify(subjectAudio.options) === JSON.stringify(comparingAudio.options);

        return isSameType && hasSameOptions;        
    }

    /**
     * Process the given scene audio items, and generate / mix resulting audio files.
     * Returns resulting scene audio items.
     * 
     * @param sceneAudioItemList 
     */
    public async proccessSceneAudioItems(sceneAudioItemList: SceneAudioItem[], pollyConfig: DriverPollyConfig, audioAccessor: AudioFileAccessor): Promise<SceneAudioItem[]> {
        const result: Promise<SceneAudioItem>[] = [];
    
        for (let sceneAudio of sceneAudioItemList) {
            const sceneAudioPromise = new Promise<SceneAudioItem>(async (resolve, reject) => {
                try {
                    const processes: Promise<AudioItem>[] = [];

                    for (let foregroundAudio of sceneAudio.foreground) {
                        processes.push(this.processAudioItem(foregroundAudio, pollyConfig, audioAccessor));
                    }
    
                    const processedForeground: AudioItem[] = (await Promise.all(processes));
    
                    let primaryBackgroundAudioItem : AudioItem | undefined = undefined;
    
                    for (let backgroundAudio of sceneAudio.background) {
                        if (backgroundAudio.type === AlexaAudioType.AUDIO) {
                            // Currently only supports one background audio item
                            primaryBackgroundAudioItem = backgroundAudio;
                        }
                    }
    
                    let fullSceneAudio: AudioItem[] = processedForeground;
    
                    if(primaryBackgroundAudioItem && pollyConfig.enabled) {
                        if (!SFBDriver.testing || pollyConfig.enabledInPreview) {
                            if(processedForeground.length > 0) {
                                const foregroundAudio: AudioItem = await this.mixdownAudioItems(processedForeground, pollyConfig, audioAccessor, MixMode.CONCATENATE);
                                
                                const util = new PollyUtil(audioAccessor);
                                const foregroundName = path.basename(foregroundAudio.content);
                                const foregroundPath = path.resolve(pollyConfig.workingDir, foregroundName);

                                if (!fs.existsSync(foregroundPath)) {
                                    await audioAccessor.downloadAudio(foregroundAudio.content, pollyConfig.workingDir);
                                }

                                const backgroundDelay = primaryBackgroundAudioItem.delay;
                                
                                if(backgroundDelay < 0) {
                                    foregroundAudio.delay += Math.abs(backgroundDelay);
                                    primaryBackgroundAudioItem.delay = 0;
                                }

                                const foregroundDurationInMillis = await util.calculateMP3Duration(foregroundPath) + foregroundAudio.delay;

                                const combinedAudio = await this.mixdownAudioItems([
                                    foregroundAudio,
                                    primaryBackgroundAudioItem
                                ], pollyConfig, audioAccessor, MixMode.LAYER, foregroundDurationInMillis);
    
                                fullSceneAudio = [combinedAudio];
                            }
                        }
                    }
    
                    resolve({
                        foreground: fullSceneAudio,
                        background: [],
                        sceneID: sceneAudio.sceneID
                    });
                } catch(err) {
                    reject(err);
                }
            });
            result.push(sceneAudioPromise);
        }

        return await Promise.all(result);
    }

    /**
     * Appropriately process and generated a modified audio if needed.
     * Returns the modified AudioItem.
     * 
     * @param audioItem audio item to process
     * @param pollyConfig 
     * @param audioAccessor
     * @returns [[AudioItem]] of the resulting modified audio.
     */
    public async processAudioItem(audioItem: AudioItem, pollyConfig: DriverPollyConfig, audioAccessor: AudioFileAccessor): Promise<AudioItem> {
        if (!SFBDriver.testing || pollyConfig.enabledInPreview) {
            if (audioItem.type === AlexaAudioType.AUDIO) {
                // If values are defaults, then don't change the audio file at all and keep it at it's original quality
                if(!pollyConfig.enabled || (audioItem.delay == 0 && audioItem.volume == 1.0) ) {
                    return audioItem;
                } else {
                    const mixedAudio = await this.mixdownAudioItems([audioItem], pollyConfig, audioAccessor, MixMode.LAYER);
                    return mixedAudio;
                }
            } else if (audioItem.type === AlexaAudioType.POLLY) {
                if(audioItem.options) {
                    if(pollyConfig.enabled) {                                        
                        const mixedAudio = await this.mixdownAudioItems([audioItem], pollyConfig, audioAccessor, MixMode.LAYER);
                        return mixedAudio;
                    }
                }
            } else {
                if(SFBDriver.testing && pollyConfig.enabledInPreview) {
                    const previewPollyVoice = pollyConfig.previewPollyVoice || 'Joanna';

                    const simulatorDefaultSSML = `<voice name='${previewPollyVoice}'>${audioItem.content}</voice>`;

                    const textAudioItem = this.buildAudioItemsFromSSML(simulatorDefaultSSML);

                    const mixedAudioItem = await this.mixdownAudioItems(textAudioItem, pollyConfig, audioAccessor, MixMode.LAYER);
                    return mixedAudioItem;
                }
            }
        }

        return audioItem;            
    }

    /**
     * Get total count of AudioItems of type [[AlexaAudioType.AUDIO]] in the given SceneAudioItem list.
     */
    public getAudioCount(sceneAudioList: SceneAudioItem[]): number {
        const audioCount = sceneAudioList.map((scene): number => {
            if (scene.foreground.length > 0) {
                return scene.foreground
                    .map((item): number => {return item.type === AlexaAudioType.AUDIO ? 1: 0})
                    .reduce((prev, curr, i, arr) => {
                        return prev + curr;
                    });
            } else {
                return 0;
            }
            
        })
        .reduce((prev, curr, i, arr) => {return prev + curr});

        return audioCount
    }
    /**
     * Combine consecutive audio items to achieve the number of audio items of type [[AlexaAudioType.AUDIO]] to the given target.
     *
     * @param upperItemLimit maximum number of audio files
     * @param pollyConfig [[@alexa-games/sfb-polly/DriverPollyConfig]] SFB polly configuration key value map.
     * @param audioAccessor [[@alexa-games/sfb-polly/AudioFileAccessor]] audio file accessor used for downloading, and uploading audio files.
     * @param targetAudioCount number of audio items of type [[AlexaAudioType.AUDIO]] to target for the result.
     * @returns list of resulting audio items.
     */
    public async combineConsecutiveAudioItems(sceneAudioItemList: SceneAudioItem[], pollyConfig: DriverPollyConfig, audioAccessor: AudioFileAccessor, targetAudioCount: number): Promise<AudioItem[]> {
        const result: Promise<AudioItem>[] = [];

        const totalAudioCount: number = this.getAudioCount(sceneAudioItemList);
        const reductionTarget = totalAudioCount - targetAudioCount;
        let reducedCount: number = 0;

        let mixGroup: AudioItem[] = [];

        for (let scene of sceneAudioItemList) {
            for (let audioItem of scene.foreground) {
                if (audioItem.type === AlexaAudioType.AUDIO && reducedCount < reductionTarget) {
                    mixGroup.push(audioItem);

                    if (mixGroup.length > 1) {
                        reducedCount ++;
                    }

                    continue;
                }
                
                if (mixGroup.length > 1) {
                    const copyGroup = JSON.parse(JSON.stringify(mixGroup));

                    const concatPromise = new Promise<AudioItem> (async (resolve) => {
                        const concatenatedAudio = await this.mixdownAudioItems(copyGroup, pollyConfig, audioAccessor, MixMode.CONCATENATE);
                        resolve(concatenatedAudio);
                    });

                    mixGroup = [];
                    result.push(concatPromise);
                } 

                result.push(new Promise<AudioItem>((resolve) => {resolve(audioItem)}));
            }
        }

        if (mixGroup.length > 0) {
            const copyGroup = JSON.parse(JSON.stringify(mixGroup));
            const concatPromise = new Promise<AudioItem> (async (resolve, reject) => {
                try {
                    const concatenatedAudio = await this.mixdownAudioItems(copyGroup, pollyConfig, audioAccessor, MixMode.CONCATENATE);
                    resolve(concatenatedAudio);    
                } catch (err) {
                    reject(err);
                }
            });

            result.push(concatPromise);
        }

        return await Promise.all(result);
    }

    /**
     * Mixdown collection of audio items into a single audio, then return a resulting AudioItem for the resulting audio file.
     *
     * @param audioItems audio items to process/readjust/edit
     * @param pollyConfig polly configuration defining how [[AlexaAudioType.POLLY]] should be handled
     * @param audioAccessor accessor for downloading, uploading, generating url for denoted audio files.
     * @returns Mixedown AudioItem
     */
    public async mixdownAudioItems(audioItems: AudioItem[], pollyConfig: DriverPollyConfig, audioAccessor: AudioFileAccessor, mixMode: MixMode, trimSpotInMillis: number = 0): Promise<AudioItem> {
        const audioBuilder = new AudioMixer(pollyConfig.FFMPEGLocation, pollyConfig.workingDir, audioAccessor);

        for (let audio of audioItems) {
            const filename = path.basename(audio.content);
            
            if (audio.type == AlexaAudioType.AUDIO) {
                audioBuilder.addAudio({
                    sequenceType: SequenceType.SFX,
                    filename: filename,
                    url: audio.content,
                    delayMs: audio.delay,
                    volume: audio.volume,
                    fadeInDuration: audio.options && audio.options.fadeIn? parseInt(audio.options.fadeIn)/1000: 0,
                    fadeOutDuration: audio.options && audio.options.fadeOut ? parseInt(audio.options.fadeOut)/1000 : 0,
                    fadeOutTime: audio.options && audio.options.fadeOut ? (trimSpotInMillis - parseInt(audio.options.fadeOut))/1000 : 0,
                });
            } else if (audio.type == AlexaAudioType.POLLY) {
                if (!audio.options) {
                    throw new Error("SFBDriver: Polly is missing required properties 'voice'");
                }
    
                if (audio.content && audio.content.trim().length > 0) {
                    const pollyAudioPath = await audioBuilder.addPollyItem({
                        name: audio.options.voice,
                        text: audio.content,
                        delayMs: audio.delay,
                        volume: "1.0",
                        rate: audio.options.rate,
                        pitch: audio.options.pitch,
                        engine: audio.options.engine
                    });

                    this.generatedFiles[pollyAudioPath] = true;
                }
            }
        }
        
        const mixSetting: AudioMixSetting = {
            trim: TrimOption.FIRST,
            mode: mixMode
        }

        if (audioItems[0].options && audioItems[0].options.blend === AudioBlendOption.LONGEST) {
            mixSetting.trim = TrimOption.LONGEST;
        }

        const mixedAudioPath = await audioBuilder.mix(mixSetting);

        const mixedAudioURL = await audioAccessor.getAudioURL(path.basename(mixedAudioPath));

        this.generatedFiles[mixedAudioPath] = true;        

        return {
            delay: 0,
            type: AlexaAudioType.AUDIO,
            content: pollyConfig.dontUploadToS3? mixedAudioPath: mixedAudioURL,
            volume: 1.0
        }
    }

    /**
     * Given a string of ssml (supported with voice, audio tags), create an array of Audio Items.
     * @param ssml string of ssml text
     */
    public buildAudioItemsFromSSML(ssml: string, defaultNarrator?: Narrator): AudioItem[] {
        let dialogue: string = ssml.trim();
        
        let partitioningRegex: RegExp = /(<audio[ \t]+?src=["'][^><]+?["'][ \t]*?\/>)|(<voice[ \t]+?.+?<\/voice>)|([\s\S]+?)(?=(?:<audio[ \t]+?src=["'][^><]+?["'][ \t]*?\/>)|(?:<voice[ \t]+?.+?<\/voice>)|$)/g;
    
        let partitionMatch: string[] | null = partitioningRegex.exec(dialogue);
    
        let audioItems: AudioItem[] = [];
        while (partitionMatch != null) {
            
            if (partitionMatch[1] && partitionMatch[1].trim().length > 0) {
                let audioTagParse: RegExp = /\b(src|volume|delay|blend)=[\"']([\S]+?)[\"']/g;
    
                let audioTagText: string = partitionMatch[1];
                let audioTagMatch: any = audioTagParse.exec(audioTagText);
    
                let volume: number = 1.0;
                let delay: number = 0;
                let content: string = "";
                let blendOption: string = AudioBlendOption.TRIM;
                while (audioTagMatch != null) {

                    if (!audioTagMatch[2] || audioTagMatch[2].trim().length <= 0) {
                        // skip for no attribute value
                    } else if (audioTagMatch[1].trim() == "src") {
                        content = audioTagMatch[2]
                    } else if (audioTagMatch[1].trim() == "volume") {
                        volume = parseFloat(audioTagMatch[2]);
                    } else if (audioTagMatch[1].trim() == "delay") {
                        delay = parseInt(audioTagMatch[2]);
                    } else if (audioTagMatch[1].trim() == "blend") {
                        blendOption = audioTagMatch[2];
                    }

                    audioTagMatch = audioTagParse.exec(audioTagText);
                }
    
                audioItems.push({
                    type: AlexaAudioType.AUDIO,
                    content: content,
                    volume: volume,
                    delay: delay,
                    options: {
                        blend: blendOption
                    }
                });
            } else if (partitionMatch[2] && partitionMatch[2].trim().length > 0) {   
                const pollyTagText: string = partitionMatch[2];
                const contentMatch: any = /<voice([\s\S]+?)>([\s\S]*?)<\/voice>/g.exec(pollyTagText);

                const voiceHeader: string = contentMatch[1];
                const content: string = contentMatch[2];

                let pollyTagParse: RegExp = /(name|volume|delay|pitch|rate|engine)=[\"']([\S]+?)[\"']/g;
                let pollyTagMatch: any = pollyTagParse.exec(voiceHeader);
    
                let name: string = "";
                let volume: number = 1.0;
                let delay: number = 0;
                let rate: string = "";
                let pitch: string = "";
                let engine: string = "";
                while (pollyTagMatch != null) {
                    if (!pollyTagMatch[2] || pollyTagMatch[2].trim().length <= 0) {
                        // skip for no attribute value
                    } else if (pollyTagMatch[1].trim() == "name") {
                        name = pollyTagMatch[2];
                    } else if (pollyTagMatch[1].trim() == "volume") {
                        volume = parseFloat(pollyTagMatch[2]);
                    } else if (pollyTagMatch[1].trim() == "delay") {
                        delay = parseInt(pollyTagMatch[2]);
                    } else if (pollyTagMatch[1].trim() == "pitch") {
                        pitch = pollyTagMatch[2];
                    } else if (pollyTagMatch[1].trim() == "rate") {
                        rate = pollyTagMatch[2];
                    } else if (pollyTagMatch[1].trim() == "engine") {
                        engine = pollyTagMatch[2];
                    }
    
                    pollyTagMatch = pollyTagParse.exec(voiceHeader);
                }
        
                audioItems.push({
                    type: AlexaAudioType.POLLY,
                    content: content,
                    volume: volume,
                    delay: delay,
                    options: {
                        pitch: pitch,
                        rate: rate,
                        voice: name,
                        engine: engine
                    }
                });
            } else if (defaultNarrator) {
                if (partitionMatch[3].trim().length > 0) {
                    audioItems.push({
                        type: AlexaAudioType.POLLY,
                        content: partitionMatch[3],
                        volume: parseFloat(defaultNarrator.volume),
                        delay: 0,
                        options: {
                            pitch: defaultNarrator.pitch,
                            rate: defaultNarrator.rate,
                            voice: defaultNarrator.name,
                            engine: defaultNarrator.engine || ""
                        }
                    });
                }
            } else {
                if (partitionMatch[3].trim().length > 0) {
                    audioItems.push({
                        type: AlexaAudioType.TEXT,
                        content: partitionMatch[3],
                        volume: 1.0,
                        delay: 0
                    });
                }
            }
    
            partitionMatch = partitioningRegex.exec(dialogue);
        }
    
        return audioItems;
    }

    public generateSSMLText(sceneAudioItemList: SceneAudioItem[], pollyConfig: DriverPollyConfig): string {
        let finalSSML : string = "";

        for (let audioItem of sceneAudioItemList) {
            for (let foregroundAudio of audioItem.foreground) {
                let ssml = "";

                // Build the foreground audio up into a single ssml tag
                if (!SFBDriver.testing || pollyConfig.enabledInPreview) {
                    if (foregroundAudio.type === AlexaAudioType.AUDIO) {
                        ssml = `<audio src='${foregroundAudio.content}' />`;    
                    } else if (foregroundAudio.type === AlexaAudioType.POLLY) {
                        if(foregroundAudio.options) {
                            const voiceOpenTag: string = `<voice name='${foregroundAudio.options.voice}'>`;
                            const voiceCloseTag: string = `</voice>`;

                            const hasPitchChange = !!(foregroundAudio.options.pitch && foregroundAudio.options.pitch.length > 0 && foregroundAudio.options.pitch !== "+0%" && foregroundAudio.options.pitch !== "-0%");
                            const hasRateChange = !!(foregroundAudio.options.rate && foregroundAudio.options.rate.length > 0 && foregroundAudio.options.rate !== "100%");
                            const hasVolumeChange = !!(foregroundAudio.options.volume && foregroundAudio.options.volume.length > 0 && foregroundAudio.options.volume.trim() !== "1.0");

                            let prosodyOpenTag: string = "";
                            let prosodyCloseTag: string = "";

                            if (hasPitchChange || hasRateChange || hasVolumeChange) {
                                let prosodyOptions = "";
                                if (hasPitchChange) {
                                    prosodyOptions += `pitch='${foregroundAudio.options.pitch}'`;
                                }

                                if (hasRateChange) {
                                    prosodyOptions += ` rate='${foregroundAudio.options.rate}'`;
                                }

                                if (hasVolumeChange) {
                                    prosodyOptions += ` volume='${foregroundAudio.options.volume}'`;
                                }
                                
                                prosodyOpenTag += `<prosody ${prosodyOptions}>`;
                                prosodyCloseTag = `</prosody>`;
                            }
                            
                            ssml = `${voiceOpenTag}${prosodyOpenTag}${foregroundAudio.content}${prosodyCloseTag}${voiceCloseTag}`;
                        } else {
                            ssml = ` ${foregroundAudio.content}`;
                        }
                    } else {
                        ssml = ` ${foregroundAudio.content}`;
                    }
                } else {
                    // We are testing, so just return something that will not be valid ssml
                    if (foregroundAudio.type === AlexaAudioType.AUDIO) {
                        ssml = `<audio src='${foregroundAudio.content}'/>`;
                    } else if (foregroundAudio.type === AlexaAudioType.POLLY) {
                        if(foregroundAudio.options) {
                            ssml = `<voice name='${foregroundAudio.options.voice}'>${foregroundAudio.content}</voice>`;
                        } else {
                            ssml = `(POLLY:name=ERROR_NO_POLLY_NAME_SET text=${foregroundAudio.content} delayMs=${foregroundAudio.delay} volume=${foregroundAudio.volume})`;
                        }
                    } else {
                        ssml = ` ${foregroundAudio.content}`;
                    }
                }

                finalSSML += ssml;
            }
        }

        return finalSSML;
    }

    /**
	 * Upload all files generated by this instance of AudioMixer to a cache/storage using the uploadAudio() of its [[AudioFileAccessor]].
	 */
	public async uploadGeneratedFiles(audioAccessor: AudioFileAccessor, workingDir: string): Promise<void> {
		if (Object.keys(this.generatedFiles).length > 0) { 
            const uploadTasks = Object.keys(this.generatedFiles)
                .filter((filePath) => fs.existsSync(filePath))
                .map((filePath: string) => {
                    return audioAccessor.uploadAudio(path.basename(filePath), workingDir);
                });
	
			await Promise.all(uploadTasks);
		}
	}
}