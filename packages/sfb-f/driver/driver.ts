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

declare var process : {
	env: {
      platform: string,
      ABC_DEBUG_PAD_SIZE: string
	},
	platform: string
}

import { UserInput, Choice, AudioItem, SceneAudioItem, StateDiffItem, VisualOptions, ResultOption } from './driverEntity';

import { ABCImportPlugin } from './../importPlugins/importerPlugin';

import { BuiltInScenes, StoryMetadata, Instruction, InstructionType, Scene} from '../story/storyMetadata';

import { StoryAccessor } from '../story/storyAccessor';

import { DefaultFormatImportPlugin } from '../importPlugins/DefaultFormatImportPlugin';

import { isDriverExtension, isInstructionExtension,
    InstructionExtension, ImporterExtension, DriverExtension } from '../extensions/SFBExtension';

import { StoryStateHelper } from './storyStateHelper';

import { createHash } from 'crypto';
import { PlayStage } from './PlayStage';
import { UserInputHelper } from '../importPlugins/userInputHelper';

import { AudioFileAccessor, PollyUtil, S3AudioAccessor } from '@alexa-games/sfb-polly';

import { TokenReplacer } from '../transformers/tokenReplacer';
import { SegmenterBuilder } from '../transformers/segmenter';

import { AudioItemUtil } from './AudioItemUtil';
import { CallStackUtil } from './callStackUtil';

const TOTAL_SCENES_PROCESS_SAFEGUARD = 1000;
const isWin = (process.platform === "win32");

type SFBExtensionType = ImporterExtension | DriverExtension | InstructionExtension;

export interface Narrator {
    name: string;
    pitch: string;
    rate: string;
    volume: string;
    engine?: string;
}

export interface DriverPollyConfig {
    enabled: boolean;
    enabledInPreview?: boolean;
    previewPollyVoice?: string;
    combineAudioTags: boolean;
    dontUseCache: boolean;
    s3DomainName: string;
    bucketName: string;
    FFMPEGLocation: string;
    workingDir: string;
    [key: string]: any;
}

export class SFBDriver {
    static readonly SSML_AUDIO_LIMIT = 5;

    public static debug: boolean = false;
    public static testing: boolean = false;

    /**
     * flag this variable to alway run the average value for dice rolls.
     */
    public static probabilityOff: boolean = false;

    private isPollyAsDefault: boolean = false;

    private importHandlersByType : {[key: string] : ABCImportPlugin} = {};

    private customExtensions: SFBExtensionType[] = [];

    private resultOptions: ResultOption[] = [];

    public storyState: {[key: string]: any};

    public storyAccessor: StoryAccessor;

    public stage: PlayStage;

    public audioItemUtil: AudioItemUtil;

    private playQueue: {
        sceneID: string,
        property: string
    }[] = [];

    private unhandledChoiceFlag = false;
    private isPausing: boolean = false;
    private isRepeating: boolean = false;
    private locale: string;

    public pollyConfig: DriverPollyConfig;

    private defaultNarrator: Narrator = {
        name: "Joanna",
        pitch: "",
        rate: "",
        volume: "1.0"
    }

    private pollyUtil: PollyUtil;

    private audioAccessor: AudioFileAccessor;

    private callStack: CallStackUtil;

    historySize: number = 10;

    constructor(storyMetadata: StoryMetadata, customImportPlugins?: ABCImportPlugin[], extensions?: SFBExtensionType[], pollyConfiguration?: DriverPollyConfig, locale: string = 'en-US', audioAccessor?: AudioFileAccessor, pollyUtil?: PollyUtil) {
        this.locale = locale;

        if (pollyConfiguration) {
            this.pollyConfig = pollyConfiguration;
        } else if(isWin) {
            this.pollyConfig = {bucketName: "sfb-sample-bucket", combineAudioTags: true, dontUseCache: true, FFMPEGLocation: "..\\ffmpeg.exe", workingDir: "c:\\Tmp", enabledInPreview:false, enabled:false, s3DomainName:"s3.amazonaws.com"};
        } else {
            this.pollyConfig = {bucketName: "sfb-sample-bucket", combineAudioTags: true, dontUseCache: true, FFMPEGLocation: "./ffmpeg", workingDir: "/Tmp", enabledInPreview:false, enabled:false, s3DomainName:"s3.amazonaws.com"};
        }

        PollyUtil.configurePolly(this.pollyConfig);

        this.audioAccessor = audioAccessor ||
            new S3AudioAccessor({
                audioWorkingDir: this.pollyConfig.workingDir,
                s3DomainName: this.pollyConfig.s3DomainName || "s3.amazonaws.com",
                bucketName: this.pollyConfig.bucketName,
            });

        this.pollyUtil = pollyUtil ||  new PollyUtil(this.audioAccessor);

        this.storyAccessor = new StoryAccessor(storyMetadata);

        this.callStack = new CallStackUtil(this.storyAccessor);

        this.storyState = {};

        this.audioItemUtil = new AudioItemUtil();

        this.stage = new PlayStage(this.audioItemUtil);

        let importPlugins: ABCImportPlugin[] = [
			new DefaultFormatImportPlugin()
		];

		if (customImportPlugins) {
			importPlugins = importPlugins.concat(customImportPlugins);
        }

		for (let importPlug of importPlugins) {
			this.importHandlersByType[importPlug.pluginName] = importPlug;
        }

        if (extensions) {
            this.customExtensions = this.customExtensions.concat(extensions);
        }
    }

    /**
     * invoke before calling resumeStory if the story history and progress needs to be reset by running the start sequence.
     * onStart implementation of all registered extensions are run.
     *
     * @param startingStoryState
     */
    public async resetStory(startingStoryState?: {[key: string]: any}) {
        this.storyState = JSON.parse(JSON.stringify(startingStoryState || this.storyState));

        StoryStateHelper.setCurrentSceneID(this.storyState, BuiltInScenes.StartScene);
        StoryStateHelper.resetAvailableChoices(this.storyState);
        StoryStateHelper.resetChoiceHistory(this.storyState);

        return;
    }

    /**
     * Resume the story.
     * If story has been paused, run the resume cycle by playing the 'Resume' scene first.
     * Otherwise, Run normally from the bookmarked scene ID.
     *
     * @param userInput
     * @param startingStoryState
     */
    public async resumeStory(_userInput: UserInput, startingStoryState?: {[key: string]: any}) {
        this.storyState = JSON.parse(JSON.stringify(startingStoryState || this.storyState));

        if (StoryStateHelper.isEndingReached(this.storyState)) {
            delete this.storyState.system_prevRecap;
            delete this.storyState.system_prevSpeech;

            StoryStateHelper.setEndingReached(this.storyState, false);
        }

        this.playQueue = [];
        this.unhandledChoiceFlag = false; // Reset to false
        this.isRepeating = false;

        // apply user input extension by DriverExtensions
        const inputHelper = new UserInputHelper(_userInput);
        for (let extension of this.customExtensions) {
            if (!isDriverExtension(extension)) {
                continue;
            }

            await extension.pre({
                driver: this,
                storyState: this.storyState,
                userInputHelper: inputHelper,
                locale: this.locale
            });
        }

        const userInput = inputHelper.getUserInput();

        if (!StoryStateHelper.isStoryPaused(this.storyState) && !this.isPausing) {
            await this.processChoice.call(this, userInput);
        }

        if (!this.isRepeating) {
            if(SFBDriver.debug) console.log("[DEBUG] Play queue length: " + this.playQueue.length);
            if (this.playQueue.length === 0) {
                let bookmarkedSceneID: string | null = StoryStateHelper.getCurrentSceneID(this.storyState);
                if(SFBDriver.debug) console.log("[DEBUG] Current bookmark: " + bookmarkedSceneID);

                if (bookmarkedSceneID == null) {
                    if(SFBDriver.debug) console.log("[DEBUG] Enqueue start scene");

                    this.playQueue.push({
                        sceneID: BuiltInScenes.StartScene,
                        property: "narration"
                    });
                } else {
                    let resumeExists: boolean = false;

                    try {
                        let scene: Scene = this.storyAccessor.getSceneByID(BuiltInScenes.ResumeScene);

                        if (scene) {
                            resumeExists = true;
                        }
                    } catch(err) {
                        resumeExists = false;
                    }

                    if (StoryStateHelper.isStoryPaused(this.storyState) && resumeExists) {
                        if(SFBDriver.debug) console.log("[DEBUG] Enqueue resume scene, and clear choices.");
                        StoryStateHelper.resetAvailableChoices(this.storyState);
                        if (StoryStateHelper.getCurrentSceneID(this.storyState) !== BuiltInScenes.PauseScene) {
                            this.storyState.resume = StoryStateHelper.getCurrentSceneID(this.storyState);
                        }
                        this.playQueue.push({
                            sceneID: BuiltInScenes.ResumeScene,
                            property: "narration"
                        });
                    } else {
                        if(SFBDriver.debug) console.log("[DEBUG] Enqueue saved scene: " + bookmarkedSceneID);

                        this.playQueue.push({
                            sceneID: bookmarkedSceneID,
                            property: "narration"
                        });
                    }

                    // Also set a flag to indicate that we hit an unhandled choice so the caller can do something different if they want to
                    this.unhandledChoiceFlag = true;
                }
            }

            StoryStateHelper.setStoryPaused(this.storyState, false);

            if (!this.storyState.system_originStack) {
                this.storyState.system_originStack = [];
            }

            this.storyState.system_originStack.push(this.playQueue[0]);

            if (this.storyState.system_originStack.length > this.historySize) {
                // too large, remove first item
                this.storyState.system_originStack.splice(0, 1);
            }

            let totalScenesProcessedCount = 0;

            while (this.playQueue.length > 0 && !this.isPausing) {

                let dequeuedSceneID: {
                    sceneID: string,
                    property: string
                } = this.playQueue.splice(0, 1)[0];

                if(SFBDriver.debug) console.log("[DEBUG] Setting the current scene to: " + dequeuedSceneID);
                this.stage.logVisitedScene(dequeuedSceneID.sceneID);

                StoryStateHelper.setCurrentSceneID(this.storyState, dequeuedSceneID.sceneID);

                let preProcessState: string = JSON.stringify(this.storyState);

                await this.processScene.call(this, undefined, dequeuedSceneID.property);

                if (SFBDriver.testing) {
                    let beforeStructure: any = JSON.parse(preProcessState);
                    console.log("\n");
                    check("", beforeStructure, this.storyState);
                }

                totalScenesProcessedCount++;
                if(totalScenesProcessedCount >= TOTAL_SCENES_PROCESS_SAFEGUARD) {
                    throw new Error("[SFB Driver - Infinite Loop] Looped " + TOTAL_SCENES_PROCESS_SAFEGUARD + " times, last scene ID was: " + dequeuedSceneID.sceneID + ". Please fix your infinite loop.");
                }
            }

            if (this.isPausing) {
                this.isPausing = false;
                await this.executePauseSequence(_userInput);
            }
        }

        this.storyState.system_prevSpeech = this.stage.getStageSpeechAudioSequence();
        this.storyState.system_prevReprompt = this.stage.getStageRepromptAudioSequence();
        this.storyState.system_prevRecap = this.stage.getStageRecapAudioSequence();

        // apply user input extension by DriverExtensions
        for (let extension of this.customExtensions) {
            if (!isDriverExtension(extension)) {
                continue;
            }

            await extension.post({
                driver: this,
                storyState: this.storyState,
                userInputHelper: inputHelper,
                locale: this.locale
            });
        }
    }

    public pauseStory() {
        this.isPausing = true;
    }

    /**
     * Run the pause sequence by playing the 'Pause' scene.
     *
     * @param startingStoryState
     */
    private async executePauseSequence(_userInput: UserInput, startingStoryState?: {[key: string]: any}) {
        this.storyState = Object.assign({}, startingStoryState || this.storyState);

        let savingSceneID: string | null = StoryStateHelper.getCurrentSceneID(this.storyState);

        if (savingSceneID == BuiltInScenes.ResumeScene) {
            savingSceneID = this.storyState.resume
        }

        StoryStateHelper.setCurrentSceneID(this.storyState, BuiltInScenes.PauseScene);

        let preProcessState: string = JSON.stringify(this.storyState);

        await this.processScene.call(this);

        if (SFBDriver.testing) {
            let beforeStructure: any = JSON.parse(preProcessState);
            console.log("\n");
            check("", beforeStructure, this.storyState);
        }

        // saving the previous scene for next resume.
        StoryStateHelper.setCurrentSceneID(this.storyState, savingSceneID === null ? BuiltInScenes.StartScene: savingSceneID);

        StoryStateHelper.setStoryPaused(this.storyState, true);

        // apply user input extension by DriverExtensions
        const inputHelper = new UserInputHelper(_userInput);
        for (let extension of this.customExtensions) {
            if (!isDriverExtension(extension)) {
                continue;
            }

            await extension.post({
                driver: this,
                storyState: this.storyState,
                userInputHelper: inputHelper,
                locale: this.locale
            });
        }

        return;
    }

    /**
     * Configure the default polly narrator settings.
     */
    public configureDefaultPollyNarrator(narrator: Narrator) {
        console.info("[INFO] Default narrator set: " + JSON.stringify(narrator));
        this.defaultNarrator = narrator;
    }

    /**
     * Turning on the 'default polly' causes all narration texts (including the ones not surrounded by the 'voice' tag) to be read in polly voice.
     * The polly voice setting for this can be configured by calling configureDefaultPollyNarrator().
     */
    public turnOnDefaultPolly() {
        this.isPollyAsDefault = true;
    }

    /**
     * Turning off the 'default polly' causes all narration texts (texts NOT surrounded by the 'voice' tag) to be processed as non-polly voice.
     */
    public turnOffDefaultPolly() {
        this.isPollyAsDefault = false;
    }

    public async getSpeechSSMLText() {
        let {ssml} = await this.buildAudioScenes(this.stage.getStageSpeechAudioSequence());

        return ssml;
    }

    public async getSpeechSSMLTextPerScene() {
        const sceneAudioItems = this.stage.getStageSpeechAudioSequence(true);

        const scenesAndSsmlList: any = [];

        for(let item of sceneAudioItems) {

            let {ssml} = await this.buildAudioScenes([item]);

            let sceneAndSsml = { sceneID: item.sceneID, sceneAudioItem: item, ssml }

            scenesAndSsmlList.push(sceneAndSsml);
        }

        return scenesAndSsmlList;
    }

    public getVisitedSceneIDsOnRun(): string[] {
        return this.stage.getVisitedSceneIDsOnRun();
    }

    public async getSpeechSSMLAndPrettyText() {
        let {ssml, pretty, errorMessage} = await this.buildAudioScenes(this.stage.getStageSpeechAudioSequence());

        return {ssml, pretty, errorMessage};
    }

    public async getRepromptSSMLText() {
        let {ssml} = await this.buildAudioScenes(this.stage.getStageRepromptAudioSequence());

        return ssml;
    }

    public async getRepromptSSMLAndPrettyText() {
        let {ssml, pretty, errorMessage} = await this.buildAudioScenes(this.stage.getStageRepromptAudioSequence());

        return {ssml, pretty, errorMessage};
    }

    public async getVisuals() : Promise<VisualOptions[] | undefined> {
        return this.stage.getStageVisualOptions();
    }

    public async buildAudioScenes(sceneAudioItemList: SceneAudioItem[]): Promise<{ssml: string, pretty: string, errorMessage?: string}> {
        const mixedSceneAudio = await this.audioItemUtil.proccessSceneAudioItems(sceneAudioItemList, this.pollyConfig, this.audioAccessor);

        let ssml = "";
        let errorMessage;
        try {
            if (mixedSceneAudio.length > 0 ){
                const audioTypeCount: number = this.audioItemUtil.getAudioCount(mixedSceneAudio);

                if (this.pollyConfig.enabled && ((audioTypeCount > 5 && this.pollyConfig.combineAudioTags) || this.pollyConfig.enabledInPreview)) {

                    const combinedAudioItems = await this.audioItemUtil.combineConsecutiveAudioItems(mixedSceneAudio, this.pollyConfig, this.audioAccessor, SFBDriver.SSML_AUDIO_LIMIT);

                    ssml = this.audioItemUtil.generateSSMLText([{
                        foreground: combinedAudioItems,
                        background: []
                    }], this.pollyConfig);
                } else {
                    ssml = this.audioItemUtil.generateSSMLText(mixedSceneAudio, this.pollyConfig);
                }
            }
        } catch (err) {
            errorMessage = "[ERROR] Could not generate mixed audio. Please verify that your resources path and FFmpeg are correctly configured.";
            console.log(errorMessage, err);
        }

        const previewSSML = this.audioItemUtil.generateSSMLText(sceneAudioItemList, this.pollyConfig);

        if (!this.pollyConfig.dontUploadToS3) {
            await this.audioItemUtil.uploadGeneratedFiles(this.audioAccessor, this.pollyConfig.workingDir);
        }

        return {ssml: ssml, pretty: previewSSML, errorMessage};
    }

    /**
     * Get the current story state.
     */
    public getCurrentStoryState(): {[key: string]: any} {
        return JSON.parse(JSON.stringify(this.storyState)); //deep copy
    }

    public getResultOptions(): ResultOption[] {
        return this.resultOptions;
    }

    /**
     * See if the scene marked as ending, or scene leading to no new choice has been reached as a result of the current resume/run.
     */
    public isEndingReached(): boolean {
        return StoryStateHelper.isEndingReached(this.storyState);
    }

    /**
     * See if a choice was unhandled and allow the caller to do something else if they need to.
     */
    public isUnhandledChoice(): boolean {
        return this.unhandledChoiceFlag;
    }

    /**
     * Execute the selected choice indicated by the user input.
     */
    public async processChoice(userInput: UserInput): Promise<any> {
        return new Promise<any> (async (resolve, reject) => {
            if (SFBDriver.debug) console.log("[DEBUG] Calling processChoice");

            const availableChoices: Choice[] = StoryStateHelper.getAvailableChoices(this.storyState)

            if (SFBDriver.debug) console.log("[DEBUG] Loading Available Choices: " + JSON.stringify(availableChoices, null, 4));

            const selectedChoice: Choice | null = StoryStateHelper.getChoiceByUserInput(this.storyState, userInput, this.locale);

            if (SFBDriver.debug) console.log(`[DEBUG] With UserInput=${JSON.stringify(userInput)}, Selected Choice=${JSON.stringify(selectedChoice, null, 4)}`);

            if (selectedChoice == null) {
                if ((!this.storyState.system_prevRecap || this.storyState.system_prevRecap.length == 0)
                    && (!this.storyState.system_prevSpeech || this.storyState.system_prevSpeech.length == 0)) {
                    this.isRepeating = false;
                } else {
                    if (this.storyState.system_prevRecap && this.storyState.system_prevRecap.length > 0) {
                        this.stage.appendStageSpeechAudioSequence(this.storyState.system_prevRecap);
                        this.stage.appendStageRepromptAudioSequence(this.storyState.system_prevRecap);
                    } else if (this.storyState.system_prevSpeech && this.storyState.system_prevSpeech.length > 0) {
                        this.stage.appendStageSpeechAudioSequence(this.storyState.system_prevSpeech);
                        this.stage.appendStageRepromptAudioSequence(this.storyState.system_prevSpeech);
                    }

                    if (this.storyState.system_prevReprompt && this.storyState.system_prevReprompt.length > 0) {
                        this.stage.setStageRepromptAudioSequence(this.storyState.system_prevReprompt);
                    }

                    this.isRepeating = true;
                }
            } else {
                StoryStateHelper.setSelectedChoiceID(this.storyState, selectedChoice.id);

                const beforeState: any = JSON.parse(JSON.stringify(this.storyState));

                try {
                    if (selectedChoice.sceneDirections) {
                        // Keep for backwards compatibility.
                        let tempChoiceInstructionAddress: string = StoryStateHelper.getCurrentSceneID(this.storyState) + ":" + selectedChoice.id + ":" + -1;
                        this.storyState.system_instruction_mem = this.storyState.system_instruction_mem || [];
                        this.storyState.system_instruction_mem[tempChoiceInstructionAddress] = selectedChoice.sceneDirections;
    
                        await this.performInstructions.call(this, tempChoiceInstructionAddress);
                    } else if (selectedChoice.instructionAddress) {
                        await this.performInstructions.call(this, selectedChoice.instructionAddress);
                    }
                } catch (err) {
                    reject(err);
                }

                if (!this.isRepeating) {
                    StoryStateHelper.resetAvailableChoices(this.storyState);

                    if (selectedChoice.saveToHistory) {
                        StoryStateHelper.addChoiceHistory(this.storyState, selectedChoice, getStateDiffs(beforeState, this.storyState), this.historySize);
                    }
                }
            }

            StoryStateHelper.clearSelectedChoiceID(this.storyState);
            resolve();
        });
    }

    /**
     * Process the current scene. Updating speech, reprompt, variables as indicated by the scene.
     */
    private async processScene(sceneID?: string, sceneProperty?: string): Promise<any> {
        if (SFBDriver.debug) console.log("[INFO] Calling processScene.");

        let currentSceneID: string | null = StoryStateHelper.getCurrentSceneID(this.storyState);

        if (sceneID) {
            currentSceneID = sceneID;
        }

        if (SFBDriver.testing) {
            console.log("\n\nSCENE '" + currentSceneID + "'");
            console.log("........................");
        }

        let currentScene: Scene | undefined = undefined;
        if (currentSceneID != null) {
            currentScene = this.storyAccessor.getSceneByID(currentSceneID || "");
        }

        if (!currentScene) {
            if (SFBDriver.debug) throw new Error(`[WARN] Cannot find the Scene=[${currentSceneID}]`);
            else return;
        }

        this.stage.startNewScene(currentSceneID || "");

        StoryStateHelper.clearRecap(this.storyState);

        for (let variation of currentScene.contents) {
            // evaluate body's conditional
            let conditionPassed: boolean = true;

            if (variation.condition && !variation.condition.startsWith("otherwise")) {
                if (SFBDriver.debug) console.log("[DEBUG] pre-substitution condition= " + JSON.stringify(variation.condition, null, 4));

                let substitution  = replaceVariables(variation.condition, this.storyState, true);

                if (SFBDriver.debug) console.log("[DEBUG] post-substitution condition= " + substitution);

                if(!evalInContext(substitution, this)) {
                    conditionPassed = false;
                }
                
            }

            if (!conditionPassed) {
                if (SFBDriver.testing && variation.condition) console.log(`${padString("FAILED",8)}\t>${variation.condition}`);
                continue;
            }

            if (SFBDriver.testing && variation.condition) console.log(`${padString("PASSED",8)}\t>${variation.condition}`);

            /*
            * Narration
            */
            let sceneNarration: AudioItem[] = [];

            if (variation.narration) {
                let narrationText: string = replaceVariables(variation.narration, this.storyState, false)
                    .replace(/\n/g, " ")
                    .replace(/[\s]+/g, " ");

                let narrationVariations: string[] = narrationText.split("||");

                let selectedNarration: string = narrationVariations[Math.floor(Math.random() * narrationVariations.length)];
                sceneNarration = this.audioItemUtil.buildAudioItemsFromSSML(selectedNarration, this.isPollyAsDefault? this.defaultNarrator : undefined);
            }

            /*
            * Scene Directions
            */
            if (variation.sceneDirections && variation.sceneDirections.length > 0) {
                const instructionSetAddress = this.callStack.getSceneAddress(currentSceneID || "", 0);

                await this.performInstructions(instructionSetAddress);
            }

            if (sceneProperty && sceneProperty.trim().toLowerCase() == "reprompt" && this.stage.getRepromptSceneAudio().foreground.length > 0) {
                sceneNarration = this.stage.getRepromptSceneAudio().foreground;
            }

            if (sceneProperty && sceneProperty.trim().toLowerCase() == "recap" && this.stage.getRecapSceneAudio().foreground.length > 0) {
                sceneNarration = this.stage.getRecapSceneAudio().foreground;
            }

            // If scene property is 'then' section, then clear out any speech for this scene
            if (sceneProperty && sceneProperty.trim().toLowerCase() === "then") {
                sceneNarration = [];
            }

            this.stage.appendSceneSpeechForeground(sceneNarration);

            break; // Only one of the scene variations are played.
        }

        this.stage.closeScene();
    }

    /**
     * Peform given list of scene directions in order.
     *
     * @param directions Scene Directions to peform.
     * @return returns the resulting scene direction where all the variables are replaced by the actual values.
     */
    public async performInstructions(instructionAddress: string): Promise<boolean> {
        if (SFBDriver.debug) console.log(`[DEBUG] Calling performInstructions...`);

        let isTerminatingDirection: boolean = false;

        let visualAlreadyDefined: boolean = false;

        let directions: Instruction[] = [];

        if (this.storyState.system_instruction_mem && this.storyState.system_instruction_mem[instructionAddress]) {
            // For backward compatibility, needs to stay
            directions = this.storyState.system_instruction_mem[instructionAddress];
        } else {
            directions = this.callStack.getInstructions(instructionAddress, this.storyState);
        }

        for (let lineNumber = 0 ; lineNumber < directions.length; lineNumber++) {
            let parameters: {[key: string]: any;} = JSON.parse(JSON.stringify(directions[lineNumber].parameters));
            let type: InstructionType = directions[lineNumber].directionType;

            for (let paramName of Object.keys(parameters)) {
                if (typeof(parameters[paramName]) == 'string') {

                    const isCondition = paramName === "condition";

                    parameters[paramName] = replaceVariables(parameters[paramName], this.storyState, isCondition);
                }
            }

            switch(type) {
            case InstructionType.CUSTOM: {

                if (SFBDriver.testing) console.log(`${padString("CUSTOM",8)}\t> calling custom instruction with:\n${JSON.stringify(parameters, null, 4)}`);

                for (let extension of this.customExtensions) {
                    if (isInstructionExtension(extension)) {
                        const customInstructionName: string = parameters.customName;

                        if ((extension as any)[customInstructionName]) {
                            await (extension as any)[customInstructionName]({
                                    instructionName:parameters.customName,
                                    instructionParameters: parameters,
                                    playStage: this.stage,
                                    storyAccessor: this.storyAccessor,
                                    storyState: this.storyState
                                });
                        }
                    } else {
                        continue;
                    }
                }

                break;
            }
            case InstructionType.SLOT: {
                const variableName: string = parameters.variableName;
                const slotType: string = parameters.variableType;

                StoryStateHelper.addExpectedCustomSlot(this.storyState, variableName);

                if (SFBDriver.testing) console.log(`${padString("SLOT",8)}\t>'${variableName}' as ${slotType}`);
                break;
            }
            case InstructionType.BOOKMARK: {
                let bookmarkName: string = parameters.variableName;
                let targetName: string | null = parameters.variableValue;

                if (!targetName) {
                    targetName = StoryStateHelper.getCurrentSceneID(this.storyState);
                }

                if (targetName == null) {
                    throw new Error("SFBDriver: target is not defined for the bookmark command.");
                }

                this.storyState[bookmarkName] = {
                    type: 'sceneID',
                    value: targetName
                }

                if (SFBDriver.testing) console.log(`${padString("BOOKMARK",8)}\t>'${bookmarkName}' as ${targetName}`);
                break;

            }
            case InstructionType.CHOICE: {
                let choiceID: string = createHash('md5').update(JSON.stringify(parameters.utterances).trim().toLowerCase()).digest('hex');

                let utterances = parameters.utterances;

                if (parameters.utteranceIDs && parameters.utteranceIDs.length > 0) {
                    utterances = utterances.concat(parameters.utteranceIDs);
                }

                let choice: Choice = {
                    id: choiceID,
                    instructionAddress: this.callStack.getChoiceAddress(instructionAddress, lineNumber),
                    utterances: utterances,
                    saveToHistory: false//parameters.saveToHistory && parameters.saveToHistory.trim().toLowerCase() == 'true'? true: false
                }

                if (parameters.narration) {
                    choice.narration = parameters.narration;
                }

                StoryStateHelper.enqueueAvailableChoice(this.storyState, choice);

                if (SFBDriver.testing) console.log(`${padString("CHOICE",8)}\t> Register ChoiceID=[${choiceID}] for expected input '${parameters.utterances}'`);

                break;
            }
            case InstructionType.CONDITION: {
                let conditionPassed: boolean = true;

                let conditionString: string = parameters.condition;

                if (SFBDriver.debug) console.log("[DEBUG] pre-substitution condition= " + JSON.stringify(conditionString, null, 4));

                let substitution  = replaceVariables(conditionString, this.storyState, true);

                if (SFBDriver.debug) console.log("[DEBUG] post-substitution condition= " + substitution);

                if(!evalInContext(substitution, this)) {
                    conditionPassed = false;
                }

                if (!conditionPassed) {
                    if (SFBDriver.testing && conditionString) console.log(`${padString("FAILED",8)}\t>'${directions[lineNumber].parameters.condition}' evaluated as [${conditionString}]`);
                } else {
                    if (SFBDriver.testing && conditionString) console.log(`${padString("PASSED",8)}\t>'${directions[lineNumber].parameters.condition}' evaluated as [${conditionString}]`);
                    
                    if (parameters.directions && parameters.directions.length > 0) {

                        const conditionInstructionAddress: string = this.callStack.getConditionAddress(instructionAddress, lineNumber);

                        await this.performInstructions.call(this, conditionInstructionAddress);

                        isTerminatingDirection = true;
                    }
                }

                break;
            }
            case InstructionType.GO_TO: {
                let destinationPage: string = parameters.target;

                if (this.storyState[destinationPage] && this.storyState[destinationPage].type == 'sceneID') {
                    this.playQueue.push({
                        sceneID: this.storyState[destinationPage].value,
                        property: parameters.targetSceneProperty || "narration"
                    });

                } else {
                    this.playQueue.push({
                        sceneID: destinationPage.toLowerCase(),
                        property: parameters.targetSceneProperty || "narration"
                    });
                }

                isTerminatingDirection = true;

                if (SFBDriver.testing) console.log(`${padString("GO TO",8)}\t>scene '${destinationPage}'`);
                break;
            }
            case InstructionType.SAVE_AND_GO: {
                let destinationPage: string = parameters.target.toLowerCase();

                const savingAddress: string = this.callStack.getReturnAddress(instructionAddress, lineNumber);

                if (!this.storyState.system_call_stack) {
                    this.storyState.system_call_stack = [];
                }

                this.storyState.system_call_stack.push(savingAddress);

                if (SFBDriver.testing) console.log(`${padString("CALL",8)}\t>scene '${destinationPage}'`);

                this.playQueue.push({
                    sceneID: destinationPage,
                    property: parameters.targetSceneProperty || "narration"
                });

                isTerminatingDirection = true;

                break;
            }
            case InstructionType.RETURN: {
                if (this.storyState.system_call_stack && this.storyState.system_call_stack.length > 0) {
                    const returnAddress: string = this.storyState.system_call_stack.splice(-1, 1)[0];

                    if (SFBDriver.testing) console.log(`${padString("RETURN",8)}\t> Returning to address ${returnAddress}.'`);

                    const popSceneID = this.callStack.getSourceScene(returnAddress);
                    StoryStateHelper.setCurrentSceneID(this.storyState, popSceneID);
                    
                    await this.performInstructions.call(this, returnAddress);
                } else {
                    if (SFBDriver.testing) console.log(`${padString("RETURN",8)}\t> There is instructions to return to.'`);
                }

                isTerminatingDirection = true;

                break;
            }
            case InstructionType.RESTART: {
                await this.resetStory();
                this.playQueue.push({
                    sceneID: BuiltInScenes.StartScene,
                    property: parameters.targetSceneProperty || "narration"
                });

                if (SFBDriver.testing) console.log(`${padString("RESTART",8)}\t> Refresh and restart the story.`);

                isTerminatingDirection = true;
                break;
            }
            case InstructionType.REPEAT: {
                if (this.storyState.system_prevSpeech && this.storyState.system_prevSpeech.length > 0) {
                    this.stage.appendStageSpeechAudioSequence(this.storyState.system_prevSpeech);
                    this.stage.appendStageRepromptAudioSequence(this.storyState.system_prevReprompt);

                    if (SFBDriver.testing) console.log(`${padString("REPEAT",8)}\t> Repeating previously heard speech:\n${JSON.stringify(this.storyState.system_prevSpeech, null, 4)}\nreprompt:\n${JSON.stringify(this.storyState.system_prevReprompt, null, 4)}`);
                } else {
                    if (SFBDriver.testing) console.log(`${padString("REPEAT",8)}\t> Nothing to repeat.'`);
                }

                this.isRepeating = true;
                isTerminatingDirection = true;

                break;
            }
            case InstructionType.REPEAT_REPROMPT: {
                if (this.storyState.system_prevReprompt && this.storyState.system_prevReprompt.length > 0) {
                    this.stage.setStageSpeechAudioSequence(this.stage.getStageRepromptAudioSequence().concat(this.storyState.system_prevReprompt));
                    this.stage.appendStageRepromptAudioSequence(this.storyState.system_prevReprompt);

                    if (SFBDriver.testing) console.log(`${padString("RE-REPROMPT",8)}\t> Repeating previously heard reprompt:\n${JSON.stringify(this.storyState.system_prevReprompt, null, 4)}`);
                } else {
                    if (SFBDriver.testing) console.log(`${padString("RE-REPROMPT",8)}\t> Nothing to reprompt.'`);
                }

                this.isRepeating = true;
                isTerminatingDirection = true;

                break;
            }
            case InstructionType.BACK: {
                let countBack: number = parameters.count + 1;

                if (!this.storyState.system_originStack || this.storyState.system_originStack.length == 0) {
                    if (SFBDriver.testing) console.log(`${padString("BACK",8)}\t>There is no scene to go back to.`);
                } else {
                    let transitionStack: string[] = JSON.parse(JSON.stringify(this.storyState.system_originStack));

                    let destinationScene: any = undefined;

                    while (countBack-- > 0 && transitionStack.length > 0) {
                        destinationScene = transitionStack.splice(-1, 1)[0];
                    }

                    this.playQueue.push(destinationScene);

                    this.storyState.system_originStack = transitionStack;
                    if (SFBDriver.testing) console.log(`${padString("BACK",8)}\t> back count=${parameters.count} to scene '${JSON.stringify(destinationScene)}'`);
                }

                isTerminatingDirection = true;

                break;
            }
            case InstructionType.RECAP: {
                let recapMessage: string[] = replaceVariables(parameters.message, this.storyState, false)
                    .replace(/\n/g, " ")
                    .replace(/[\s]+/g, " ")
                    .split("||");

                let selectedRecap: string = recapMessage[Math.floor(Math.random() * recapMessage.length)];

                if (selectedRecap.trim().length > 0) {
                    this.stage.appendSceneRecapForeground(this.audioItemUtil.buildAudioItemsFromSSML(selectedRecap.replace(/\n/g, ' ').replace(/[\s]+/g, ' '), this.isPollyAsDefault? this.defaultNarrator : undefined));

                    if (SFBDriver.testing) console.log(`${padString("RECAP",8)}\t>'${selectedRecap}'`);
                } else {
                    if (SFBDriver.testing) console.log(`${padString("RECAP",8)}\t>'Nothing to set as recap message.'`);
                }

                break;
            }
            case InstructionType.END: {
                StoryStateHelper.setEndingReached(this.storyState, true);
                await this.resetStory();
                this.isRepeating = true;

                if (SFBDriver.testing) console.log(`END`);

                isTerminatingDirection = true;
                break;
            }
            case InstructionType.PAUSE: {
                this.isPausing = true;
                if (SFBDriver.testing) console.log(`PAUSE`);

                isTerminatingDirection = true;
                break;
            }
            case InstructionType.BGM: {
                let bgmURL: string = parameters.audioURL;

                this.stage.appendSceneSpeechBackground(
                    this.audioItemUtil.buildAudioItemsFromSSML(`<audio src='${bgmURL}' delay='${parameters.delayMs||""}' volume='${parameters.volume||""}' blend='${parameters.blend}'/>`, this.isPollyAsDefault? this.defaultNarrator : undefined));

                if (SFBDriver.testing) console.log(`${padString("BGM",8)}\t>${bgmURL}`);
                break;
            }
            case InstructionType.CLEAR: {
                let attributeName: string = parameters.variableName;

                if (attributeName.trim() == "*") {
                    attributeName = "";

                    for (let key of Object.keys(this.storyState)) {
                        if (!key.startsWith("system_")) {
                            attributeName += `${key} ; `;
                            delete this.storyState[key];
                        }
                    }

                } else {
                    delete this.storyState[attributeName];
                }

                if (SFBDriver.testing) console.log(`${padString("CLEAR",8)}\t>'${attributeName}'`);
                break;
            }
            case InstructionType.ADD_TO_INVENTORY: {
                let item: string = parameters.itemName;
                let listName: string = parameters.variableName;

                if (!this.storyState[listName]){
                    this.storyState[listName] = {};
                }

                if (!this.storyState[listName][item]) {
                    this.storyState[listName][item] = 0;
                }

                this.storyState[listName][item] ++;

                if (SFBDriver.testing) console.log(`${padString("ADD INVENTORY",8)}\t>'${item}' to '${listName}'`);
                break;
            }
            case InstructionType.ADD_ITEM: {
                let item: string = parameters.itemName;
                let listName: string = parameters.variableName;
                let sizeLimit: string = parameters.size || "-1";

                if (!this.storyState[listName]){
                    this.storyState[listName] = [];
                }

                this.storyState[listName].push(item);

                let size: number = parseInt(sizeLimit, 10);
                if (size > 0 && this.storyState[listName].length > size) {
                    this.storyState[listName].splice(0, this.storyState[listName].length - size);
                }

                if (SFBDriver.testing) console.log(`${padString("ADD ITEM",8)}\t>'${item}' to '${listName}'`);
                break;
            }
            case InstructionType.GET_TIME: {
                let currentTime: number = new Date().getTime();

                this.storyState.system_return = currentTime;

                if (SFBDriver.testing) console.log(`${padString("GET TIME",8)}\t>${currentTime}`);
            }
            case InstructionType.REMOVE_ITEM: {
                let item: string = parameters.itemName;
                let listName: string = parameters.variableName;

                if (this.storyState[listName] && typeof this.storyState[listName].length == 'number') {
                    let deletingIndex: number = -1;
                    for (let i = 0; i < this.storyState[listName].length; i ++) {
                        if (this.storyState[listName][i] == item) {
                            deletingIndex = i;
                            break;
                        }
                    }

                    if (deletingIndex >= 0) {
                       let removeResult: any = this.storyState[listName].splice(deletingIndex, 1)[0];
                       this.storyState.system_return = removeResult;
                    }
                } else if (this.storyState[listName] && typeof this.storyState[listName].length == 'undefined') {
                    if (typeof this.storyState[listName][item] == 'number' && this.storyState[listName][item] > 0) {
                        this.storyState[listName][item] --;
                    } else if (typeof this.storyState[listName][item] != 'number') {
                        delete this.storyState[listName][item];
                    }
                }

                if (SFBDriver.testing) console.log(`${padString("DEL ITEM",8)}\t>'${item}' from '${listName}'`);
                break;
            }
            case InstructionType.REMOVE_FIRST: {
                let listName: string = parameters.variableName;

                if (this.storyState[listName]) {
                    let removeResult: any = this.storyState[listName].splice(0, 1)[0]

                    this.storyState.system_return = removeResult;
                }

                if (SFBDriver.testing) console.log(`${padString("DEL ITEM",8)}\t>FIRST from '${listName}'`);
                break;
            }
            case InstructionType.REMOVE_LAST: {
                let listName: string = parameters.variableName;

                if (this.storyState[listName]) {
                    let removeResult: any = this.storyState[listName].splice(this.storyState[listName].length - 1, 1);

                    this.storyState.system_return = removeResult;
                }

                if (SFBDriver.testing) console.log(`${padString("DEL ITEM",8)}\t>LAST from '${listName}'`);
                break;
            }
            case InstructionType.FLAG: {
                let variableName: string = parameters.variableName;

                this.storyState[variableName] = true;

                if (SFBDriver.testing) console.log(`${padString("FLAG",8)}\t>'${variableName}'`);
                break;
            }
            case InstructionType.UNFLAG: {
                let variableName: string = parameters.variableName;

                this.storyState[variableName] = false;

                if (SFBDriver.testing) console.log(`${padString("UNFLAG",8)}\t>'${variableName}'`);
                break;
            }
            case InstructionType.SET: {
                let variableName: string = parameters.variableName;
                let value: number | any = parameters.variableValue == "undefined"? 0: parseFloat(parameters.variableValue);

                if (parameters.variableValue.length === 0) {
                    value = "";
                } else if (isNaN(parameters.variableValue)) {
                    value = parameters.variableValue;

                    if (value == 'true') {
                        value = true;
                    } else if (value == 'false') {
                        value = false;
                    }
                }


                if (this.storyState[variableName] == undefined) {
                    this.storyState[variableName] = 0;
                }

                this.storyState[variableName] = value;

                if (SFBDriver.testing) console.log(`${padString("SET",8)}\t>'${variableName}' as ${value}`);
                break;
            }
            case InstructionType.REDUCE: {
                let variableName: string = parameters.variableName;
                let value: number = parseFloat(parameters.variableValue);

                if (isNaN(parameters.variableValue)) {
                    value = 0;
                }

                if (isNaN(this.storyState[variableName])) {
                    this.storyState[variableName] = 0;
                }

                this.storyState[variableName] = Math.round((parseFloat(this.storyState[variableName]) - value) * 100) / 100;
                if (SFBDriver.testing) console.log(`${padString("REDUCE",8)}\t>'${variableName}' by ${value} = ${this.storyState[variableName]}`);
                break;
            }
            case InstructionType.INCREASE: {
                let variableName: string = parameters.variableName;
                let value: number = parseFloat(parameters.variableValue);

                if (isNaN(parameters.variableValue)) {
                    value = 0;
                }

                if (isNaN(this.storyState[variableName])) {
                    this.storyState[variableName] = 0;
                }

                this.storyState[variableName] = Math.round((parseFloat(this.storyState[variableName]) + value) * 100) / 100;

                if (SFBDriver.testing) console.log(`${padString("INCREASE",8)}\t>'${variableName}' by ${value} = ${this.storyState[variableName]}`);
                break;
            }
            case InstructionType.MULTIPLY: {
                let variableName: string = parameters.variableName;
                let value: number = parseFloat(parameters.variableValue);

                if (isNaN(parameters.variableValue)) {
                    value = 0;
                }

                if (isNaN(this.storyState[variableName])) {
                    this.storyState[variableName] = 0;
                }

                this.storyState[variableName] = Math.round((parseFloat(this.storyState[variableName]) * value) * 100) / 100;

                if (SFBDriver.testing) console.log(`${padString("MULTIPLY",8)}\t>'${variableName}' by ${value} = ${this.storyState[variableName]}`);
                break;
            }
            case InstructionType.DIVIDE: {
                let variableName: string = parameters.variableName;
                let value: number = parseFloat(parameters.variableValue);

                if (isNaN(parameters.variableValue)) {
                    value = 0;
                }

                if (isNaN(this.storyState[variableName])) {
                    this.storyState[variableName] = 0;
                }

                this.storyState[variableName] = Math.round((parseFloat(this.storyState[variableName]) / value) * 100)/100;

                if (SFBDriver.testing) console.log(`${padString("DIVIDE",8)}\t>'${variableName}' by ${value} = ${this.storyState[variableName]}`);
                break;
            }
            case InstructionType.MODULUS: {
                let variableName: string = parameters.variableName;
                let value: number = parseFloat(parameters.variableValue);

                if (isNaN(parameters.variableValue)) {
                    value = 0;
                }

                if (isNaN(this.storyState[variableName])) {
                    this.storyState[variableName] = 0;
                }

                this.storyState[variableName] = Math.round((parseFloat(this.storyState[variableName]) % value) * 100)/100;

                if (SFBDriver.testing) console.log(`${padString("MODULUS",8)}\t>'${variableName}' by ${value} = ${this.storyState[variableName]}`);
                break;
            }
            case InstructionType.ROLL: {
                let rollEval: string = parameters.diceString;

                this.evaluateDiceRoll(rollEval);

                if (SFBDriver.testing) console.log(`${padString("ROLL",8)}\t>'${rollEval}'`);
                break;
            }
            case InstructionType.REPROMPT: {
                let repromptMessages: string[] = replaceVariables(parameters.message, this.storyState, false)
                    .replace(/\n/g, " ")
                    .replace(/[\s]+/g, " ")
                    .split("||");

                let selectedReprompt: string = repromptMessages[Math.floor(Math.random() * repromptMessages.length)];
                this.stage.appendSceneRepromptForeground(
                    this.audioItemUtil.buildAudioItemsFromSSML(selectedReprompt.replace(/\n/g, ' ').replace(/[\s]+/g, ' '), this.isPollyAsDefault? this.defaultNarrator : undefined));

                if (SFBDriver.testing) console.log(`${padString("REPROMPT",8)}\t>'${selectedReprompt}'`);
                break;
            }
            case InstructionType.VISUALS: {
                if (visualAlreadyDefined) {
                    let currentVisuals: VisualOptions[] = this.stage.getStageVisualOptions() || [];
                    currentVisuals[currentVisuals.length - 1] = <VisualOptions>parameters;

                    this.stage.setStageVisualOptions(currentVisuals);
                } else {
                    visualAlreadyDefined = true;

                    this.stage.appendStageVisuals(<VisualOptions>parameters);
                }

                break;
            }
            default: {
                throw new Error("[STORY - SYNTAX ERROR] the story effect is not recognized.\nline number=["
                    + lineNumber + "]\nline content=["
                    + JSON.stringify(directions[lineNumber], null, 4) + "]\n"
                    + "pageID=[" + StoryStateHelper.getCurrentSceneID(this.storyState) + "]");
            }
            }

            if (isTerminatingDirection || lineNumber == directions.length - 1) {
                const stackExists = this.callStack.callStackExists(this.storyState);
                const addressInStack = this.callStack.addressInStack(this.storyState, instructionAddress);

                if (stackExists && addressInStack && this.storyState.system_instruction_mem && this.storyState.system_instruction_mem[instructionAddress]) {
                    delete this.storyState.system_instruction_mem[instructionAddress];
                }
                break;
            }
        }

        return isTerminatingDirection;
    }

    /**
     * Compute a dice roll given a standard dice string.
     *
     * @param diceString
     */
    private evaluateDiceRoll(diceString: string) {
        let diceRegex: RegExp = /([\d])d([\d]*)+[k]?([\d]*)/gi

        let diceMatch: RegExpExecArray|null = diceRegex.exec(diceString);

        let rollResults: number[] = [];
        while (diceMatch != null) {
            let rollResult: number = 0;
            let diceCount: number = parseInt(diceMatch[1], 10);
            let faceCount: number = parseInt(diceMatch[2], 10);
            let selectCount: number = parseInt(diceMatch[3], 10);

            let rolls: number[] = [];
            for (let i = 0; i < diceCount; i++) {
                if (SFBDriver.probabilityOff) {
                    rolls.push((faceCount + 1) / 2);
                } else {
                    rolls.push(Math.floor(Math.random() * faceCount) + 1);
                }
            }

            let sumCount: number = rolls.length;
            if (selectCount) {
                rolls.sort().reverse(); //descending sort
                sumCount = selectCount
            }

            for (let i = 0 ; i < sumCount; i++) {
                rollResult += rolls[i];
            }

            rollResults.push(rollResult);

            diceMatch = diceRegex.exec(diceString);
        }

        let diceMatchReplace: string = diceString.replace(diceRegex, () => {
            return String(rollResults.splice(0, 1)[0]);
        });

        let rollFinalEval: any = eval(diceMatchReplace);
        if (SFBDriver.debug) console.log("[DEBUG] Roll result for the entire dice configuration=[" + diceMatchReplace + "], result=[" + rollFinalEval + "]" );

        this.storyState.rollResult = rollFinalEval;
    }
}

function replaceVariables(line: string, eventParams: any, isCondition: boolean): string {
    const tokenReplacer = new TokenReplacer(SegmenterBuilder.getVariableSegmenter(), eventParams);

    return tokenReplacer.replaceTokens(line, isCondition);
}

// Evalute the given string given the limited context given
function evalInContext(js : string, context : any) {
    //# Return the results of the in-line anonymous function we .call with the passed context
    return function() { return eval(js.replace(/\bundefined\b/g, "false")); }.call(context);
}

function check(pre:string, before:any, after:any) {
    let padSize: any = process.env.ABC_DEBUG_PAD_SIZE || 20;

    if ((before === undefined && after !== undefined) || (before !== undefined && after === undefined)) {
        console.log(`[${padString(pre,padSize)}\t|\t${padString(JSON.stringify(before),padSize)}\t>>>\t${padString(JSON.stringify(after), padSize)}]`);
        return;
    }

    if (after == undefined || after == null) {
        return;
    }

    for (let key of Object.keys(after)) {
        if (typeof after[key] === "object") {
            check(pre + "." +  key, before[key], after[key]);
        } else {
            if (before[key] !== after[key]) {
                if (pre.length > 0) {
                    console.log(`[${padString(pre + "." + key, padSize)}\t|\t${padString(before[key], padSize)}\t>>>\t${padString(after[key], padSize)}]`);
                } else {
                    console.log(`[${padString(key, padSize)}\t|\t${padString(before[key], padSize)}\t>>>\t${padString(after[key], padSize)}]`);
                }
            }
        }
    }
    return;
}

function getStateDiffs(before:any, after:any): StateDiffItem[] {
    let stateDiffs: StateDiffItem[] = [];
    // check removed items
    for (let key of Object.keys(before)) {
        if (before[key] && after[key] === undefined) {
            stateDiffs.push({
                itemName: key,
                beforeValue: JSON.parse(JSON.stringify(before[key])),
                afterValue: undefined
            });
        }
    }

    for (let key of Object.keys(after)) {
        if (JSON.stringify(after[key]) != JSON.stringify(before[key])) {
            stateDiffs.push({
                itemName: key,
                beforeValue: before[key]? JSON.parse(JSON.stringify(before[key])) : undefined,
                afterValue: JSON.parse(JSON.stringify(after[key]))
            });
        }
    }

    return stateDiffs;
}

function padString(incomingText: string, length: number) {
    let text: string = String(incomingText);

    let result: string = text;
    if (text.length < length) {
        for (let i = 0 ; i <= length - text.length; i ++) {
            result += " ";
        }
    } else {
        result = "~" + result.substring(text.length - length);
    }
    return result;
}
