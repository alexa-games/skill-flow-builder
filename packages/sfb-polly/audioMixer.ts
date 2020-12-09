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

import { sanitizeCommandLineParameter as sanitize } from '@alexa-games/sfb-util';
import { createHash } from 'crypto';
import { execSync } from 'child_process';

import * as path from 'path';
import * as fs from 'fs';

import { AudioFileAccessor } from './audioAccessor/audioFileAccessor';
import { PollyRequestItem, PollyUtil } from './pollyUtil';

export interface AudioSequence {
	sequenceType: SequenceType;
	filename: string;
	url: string;
	delayMs: number;
	volume: number;
	fadeOutTime: number;
	fadeOutDuration: number;
	fadeInDuration: number;
}

export interface AudioMixSetting {
	trim: TrimOption;
	mode: MixMode
}

export enum SequenceType {
    MUSIC = 'MUSIC',
	SFX = 'SFX'
}

/**
 * Trim option for mixing down the sequence of audio
 */
export enum TrimOption {
    /**
     * mix down the audio to the longest audio in the sequence
     */
    LONGEST = 'longest',
    /**
     * mix down the audio to the length of the first audio in the sequence
     */
    FIRST = 'first'
}

export enum MixMode {
	CONCATENATE = 'concat',
	LAYER = 'layer'
}

/**
 * Builder for mixing multiple audio files using the FFMPEG binary
 */
export class AudioMixer {
	private audioSequence: AudioSequence[] = [];

    constructor(private ffmpegPath: string, private audioWorkingDir: string, private audioAccessor: AudioFileAccessor) {}

	/**
	 * add audio item to the sequence to mix
	 * @param audio 
	 */
    public addAudio(audio: AudioSequence) {
		this.audioSequence.push(audio);
	}

	/**
	 * add polly item in the audio sequence
	 * @param polly 
	 * @returns resulting audio file path in disc.
	 */
	public async addPollyItem(request: PollyRequestItem): Promise<string> {
		const pollyKeyString: string = JSON.stringify(request);
		const pollyFileName: string = `polly${createHash('md5').update(pollyKeyString).digest('hex')}.mp3`;

		try {
			const exists = !PollyUtil.pollyConfig.dontUseCache && await this.audioAccessor.exists(pollyFileName);

			if (!exists && !fs.existsSync(path.resolve(this.audioWorkingDir, pollyFileName))) {
				console.info(`[INFO] Calling AWS Polly with request=${JSON.stringify(request, null, 4)}`);
				const pollyUtil = new PollyUtil(this.audioAccessor);
	
				await pollyUtil.synthesize(request, this.audioWorkingDir, pollyFileName);
			}
	
			const pollyUrl = await this.audioAccessor.getAudioURL(pollyFileName);
	
			this.audioSequence.push({
				sequenceType: SequenceType.SFX,
				filename: pollyFileName,
				url: pollyUrl,
				delayMs: request.delayMs,
				fadeInDuration: 0,
				fadeOutDuration: 0,
				fadeOutTime: 0,
				volume: 1.0 // Use Polly Volume to adjust your voice volume before mixing, will be better this way
			});

			return path.resolve(this.audioWorkingDir, pollyFileName);
		} catch (err) {
			throw err;
		}
	}

	/**
	 * Mix down the audio using FFMPEG binary with the generated file name, and return the URL of the resulting audio.
	 * @param setting audio mix setting
	 * @returns resulting audio file path in disc
	 */
	public async mix(setting: AudioMixSetting): Promise<string> {
		if (this.audioSequence.length === 0) {
			return "";
		}

		if (this.audioSequence.length === 1) {
			const item = this.audioSequence[0];
			if (!this.isAudioModified(item)) {
				return path.resolve(this.audioWorkingDir, item.filename);
			}
		}
		
		const sequenceString = this.audioSequence
			.map((audio) => JSON.stringify(audio))
			.reduce((prev: string, curr: string, i: number, arr: string[]): string => {
				if (prev) {
					return `${prev} ${curr}`;
				} else {
					return curr;
				}
			});
		
		const checksum = createHash('md5').update(sequenceString + JSON.stringify(setting)).digest('hex');
        const generatedFilename = `${checksum}.mp3`;
		const mixedAudioPath = path.resolve(this.audioWorkingDir, generatedFilename);

		const audioExistsInCache = !PollyUtil.pollyConfig.dontUseCache && await this.audioAccessor.exists(generatedFilename);
		const audioExistsInDisc = fs.existsSync(mixedAudioPath);

		if (!audioExistsInCache) {
			await this.downloadSequenceItems(this.audioSequence);
			const command = this.getFFMPEGCommand(this.audioSequence, generatedFilename, setting);
			try {
				if (!audioExistsInDisc) {
					console.info(`Processing audio with FFMPEG: ${command}`);
					const execStart = new Date().getTime();
					execSync(command);
					const execDuration = new Date().getTime() - execStart;
					console.debug(`ffmpeg process finished in ${execDuration} ms.`);
				} else {
					console.info(`Skipping ffmpeg to generate '${generatedFilename}' since it exists in disc already. `);
				}
			} catch (err) {
				throw err;
			}
		}

		return mixedAudioPath;
	}
	
	private isAudioModified(item: AudioSequence) {
		return !((!item.delayMs || item.delayMs === 0) && (!item.fadeInDuration || item.fadeInDuration === 0) 
			&& (!item.fadeOutDuration || item.fadeOutDuration === 0) && (!item.fadeOutTime || item.fadeOutTime === 0) && (!item.volume || item.volume === 1.0));
	}

	/**
	 * Check if the audio files in the sequence are available locally, then download the ones that are not available.
	 */
	private async downloadSequenceItems(sequence: AudioSequence[]): Promise<void> {
		const downloadTasks: Promise<void>[] = [];

		for (let audio of sequence) {
			downloadTasks.push(this.checkAndDownloadAudio(audio));
		}

		await Promise.all(downloadTasks);
	}

	/**
	 * Check if the given audio file exists locally, if not download that file.
	 */
	private async checkAndDownloadAudio(audio: AudioSequence): Promise<void> {
		const filePath = path.resolve(this.audioWorkingDir, audio.filename);

		const existsLocally = fs.existsSync(filePath);
		
		if (!existsLocally) {
			console.info(`[INFO] Downloading '${audio.url}' for mixing.`);

			await this.audioAccessor.downloadAudio(audio.url, this.audioWorkingDir);
		} else {
			console.info(`[INFO] Skip downloading ${audio.url}. Available locally already.`);
		}
	}

	/**
	 * Generate a FFMPEG command string with option flags and values given the audio sequence and setting
	 */
	private getFFMPEGCommand(audioSequence: AudioSequence[], outputName: string, setting: AudioMixSetting): string {
		const postMixFilepath = path.join(this.audioWorkingDir, outputName);

		if (setting.mode === MixMode.LAYER) {
			let inputFiles = "";
			let streamProcessingList = "";
			let streamList = "";
	
			for (let i = 0; i < audioSequence.length; i++) {
				const sequence = audioSequence[i];
				
				inputFiles += ` -i "${sanitize(path.join(this.audioWorkingDir, sequence.filename))}" `;
	
				// Use adelay filter to add a delay to the start of various sounds
				// List this  [1:a] adelay=2500|2500 [delayed];  // 2500 listed for each audio channel
				const volumeFilter = (sequence.volume != 1.0) ? `volume=volume=${sanitize(sequence.volume)}` : "";
				const fadeInFilter = (sequence.fadeInDuration) ? `afade=t=in:start_time=0:d=${sanitize(sequence.fadeInDuration)}` : "";
				const fadeOutFilter = (sequence.fadeOutTime && sequence.fadeOutDuration) ? `afade=t=out:start_time=${sanitize(sequence.fadeOutTime)}:d=${sanitize(sequence.fadeOutDuration)},atrim=duration=${sanitize(sequence.fadeOutTime + sequence.fadeOutDuration)}` : "";
				const adelayFilter = (sequence.delayMs) ? `adelay=${sanitize(sequence.delayMs)}|${sanitize(sequence.delayMs)}` : "";
	
				let filtersString = "";
				if(fadeInFilter) {
					filtersString += fadeInFilter;
				}
	
				if(fadeOutFilter) {
					if(filtersString) {
						filtersString += ",";
					}
					filtersString += fadeOutFilter;
				}
	
				if(adelayFilter) {
					if(filtersString) {
						filtersString += ",";
					}
					filtersString += adelayFilter;
				}
	
				if(volumeFilter) {
					if(filtersString) {
						filtersString += ",";
					}
					filtersString += volumeFilter;
				}
	
				if (filtersString.trim().length > 0) {
					streamProcessingList += `[${i}:0] ${filtersString}[in${i}]; `; 
					streamList += `[in${i}]`;
				} else {
					streamList += `[${i}:0]`;
				}
			};
	
			const trimCommand = setting.trim ? sanitize(setting.trim) : TrimOption.LONGEST;
	
			const ffmpegOptions = ` -filter_complex "${streamProcessingList} ${streamList} amix=inputs=${this.audioSequence.length}:duration=${trimCommand}:dropout_transition=0[out];[out]volume=${this.audioSequence.length}" -t 240 -ac 1 -c:a libmp3lame -b:a 48k -ar 24000 -write_xing 0 "${sanitize(postMixFilepath)}" -loglevel fatal`;
			const ffmpegCommand = `"${sanitize(this.ffmpegPath)}" -y ${inputFiles} ${ffmpegOptions}`;
	
			return ffmpegCommand;
		} else {
			let inputFiles = "";
			let concatenatingStreams = "";
	
			for (let i = 0; i < audioSequence.length; i++) {
				const sequence = audioSequence[i];
				const inputStream = `[${i}:0]`;

				inputFiles += ` -i "${sanitize(path.join(this.audioWorkingDir, sequence.filename))}" `;
				concatenatingStreams += inputStream;
			};

			const concatCommand = `"${sanitize(this.ffmpegPath)}" -y ${inputFiles} -filter_complex "${concatenatingStreams} concat=n=${audioSequence.length}:v=0:a=1" -t 240 -ac 1 -c:a libmp3lame -b:a 48k -ar 24000 -write_xing 0 "${sanitize(postMixFilepath)}" -loglevel fatal`;

			return concatCommand;
		}
	}
}