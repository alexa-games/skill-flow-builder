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

import { pickBestResponse } from '@alexa-games/sfb-util';

import { Choice, UserInput, ChoiceHistoryItem, StateDiffItem, Slot } from './driverEntity';
import { PlayStage } from './PlayStage';

import { BUILT_IN_INTENT_UTTERANCES } from '../bakeUtilities/BuiltInIntents';

export class StoryStateHelper {
    public static hasStateChanged(beforeState: {[key: string]: any}, afterState: {[key: string]: any}): boolean {
        return JSON.stringify(beforeState) !== JSON.stringify(afterState);
    }

    /**
     * Set the next scene ID to read as the target scene ID for next SFBDriver run with this Story State.
     *
     * @param sceneID target scene ID to jump to.
     * @param storyState Story state data will be modified as a result of this call
     */
    public static jumpToScene(sceneID: string, storyState: {[key: string]: any}): void {
        storyState.system_bookmark = sceneID;
        StoryStateHelper.resetAvailableChoices(storyState);
        return;
    }

    /**
     * Get the current scene ID.
     * @param storyState 
     */
    public static getCurrentSceneID(storyState: {[key: string]: any}): string | null{
        if (storyState.system_bookmark) {
            return storyState.system_bookmark;
        }
        
        return null;
    }

    /**
     * Set the current scene ID to the given value {newSceneID}. Other story state variables are untouched.
     * @param storyState 
     */
    public static setCurrentSceneID(storyState: {[key: string]: any}, newSceneID: string): void {
        storyState.system_bookmark = newSceneID;
    }

    /**
     * Gets the choice history of the current story running.
     *
     * @param storyState 
     */
    public static getChoiceHistory(storyState: {[key: string]: any}): ChoiceHistoryItem[] {
        if (storyState.system_choiceHistory) {
            return JSON.parse(JSON.stringify(storyState.system_choiceHistory));
        }
        return [];
    }

    /**
     * Add the newly selected choice to choice history.
     *
     * @param storyState 
     */
    public static addChoiceHistory(storyState: {[key: string]: any}, choiceMade: Choice, stateDiff: StateDiffItem[], historySize: number = 15): void {
        if (!storyState.system_choiceHistory) {
            storyState.system_choiceHistory = [];
        }

        let currentSceneID: string | null = StoryStateHelper.getCurrentSceneID(storyState);

        if (currentSceneID == null) {
            throw new Error("Cannot make choice from a 'null' scene.")
        }

        let choiceHistoryItem : ChoiceHistoryItem = {
            sourceSceneID: currentSceneID,
            choiceID: choiceMade.id,
            stateDiff: stateDiff
        }

        storyState.system_choiceHistory.push(choiceHistoryItem);
        
        if(storyState.system_choiceHistory.length > historySize) {
            storyState.system_choiceHistory.splice(0 ,storyState.system_choiceHistory.length - historySize);
        }
    }

    public static resetChoiceHistory(storyState: {[key: string]: any}): void {
        delete storyState.system_choiceHistory;
    }

    public static setChoiceHistory(storyState: {[key: string]: any}, choiceHistroy: ChoiceHistoryItem[]): void {
        storyState.system_choiceHistory = choiceHistroy;
    }

    public static enqueueAvailableChoice(storyState: {[key: string]: any}, choice: Choice): void {
        if (!storyState.system_branch) {
            storyState.system_branch = {
            }
            storyState.system_utteranceChoiceMap = {

            }
        };

        for (let utterance of choice.utterances) {
            storyState.system_utteranceChoiceMap[utterance] = choice.id;
        }

        storyState.system_branch[choice.id] = choice;
    }

    public static getAvailableChoices(storyState: {[key: string]: any}): Choice[] { 
        let availableChoices: Choice[] = [];
        if (storyState.system_branch) {
            for (let choiceId of Object.keys(storyState.system_branch)) {
                availableChoices.push(storyState.system_branch[choiceId]);
            }
        }
        
        return availableChoices;
    }

    public static isCustomSlotExpected(storyState: {[key: string]: any}, slotName: string) {
        return storyState.system_expectedSlots && storyState.system_expectedSlots.includes(slotName);
    }

    public static addExpectedCustomSlot(storyState: {[key: string]: any}, slotName: string) {
        if (!storyState.system_expectedSlots) {
            storyState.system_expectedSlots = [];
        }

        if (!storyState.system_expectedSlots.includes(slotName)) {
            storyState.system_expectedSlots.push(slotName);
        }
    }

    public static clearExpectedCustomSlots(storyState: {[key: string]: any}) {
        delete storyState.system_expectedSlots;
    }

    public static getChoiceByUserInput(storyState: {[key: string]: any}, userInput: UserInput, _locale: string): Choice | null {
        //console.log("Processing userinput: " + JSON.stringify(userInput, null, 4));
        let locale: string = _locale;
        if (!BUILT_IN_INTENT_UTTERANCES[locale] && BUILT_IN_INTENT_UTTERANCES[locale.split("-")[0]]) {
            locale = locale.split("-")[0];
        }

        if (storyState.system_branch) {
            let utterance2Choice: {[key:string]: Choice} = {};

            for (let choiceId of Object.keys(storyState.system_branch)) {
                
                let testingChoice: Choice = storyState.system_branch[choiceId];

                for (let utterance of testingChoice.utterances) {
                    if (!storyState.system_utteranceChoiceMap || storyState.system_utteranceChoiceMap[utterance] === choiceId) {
                        utterance2Choice[utterance] = testingChoice;
                    }
                }
            }

            let fuzziedMatch: any;
    
            if (userInput.slots && userInput.slots.length > 0) {
                let slotWords: string = "";
                let slotWordsExact: string = "";

                for (let slot of userInput.slots) {
                    slotWords += `${slot.name}} `;
                    slotWordsExact += `{${slot.name}} `;
                }
                
                fuzziedMatch = pickBestResponse(slotWords, Object.keys(utterance2Choice)) ||
                    pickBestResponse(slotWordsExact, Object.keys(utterance2Choice));
                    
            }

            if (!fuzziedMatch && userInput.value && userInput.value.length > 0) {
                fuzziedMatch = pickBestResponse(userInput.value, Object.keys(utterance2Choice));
            }

            if (!fuzziedMatch && userInput.intent && userInput.intent.length > 0) {
                fuzziedMatch = pickBestResponse(userInput.intent, Object.keys(utterance2Choice));
            }

            if (!fuzziedMatch && utterance2Choice["*"]) {
                fuzziedMatch = {
                    response: "*"
                }
            }

            if (fuzziedMatch) {
                let matchingUtterance: string = fuzziedMatch.response;
                let slotRegex: RegExp = /{([\s\S]+?)(?: as ([\s\S]+?))?}/g;
                
                const selectedChoice = utterance2Choice[matchingUtterance];
                const siblingUtterances = JSON.stringify(selectedChoice.utterances);
                let slotMatch: any = slotRegex.exec(siblingUtterances);
                // variable assignment from the utterances
                while (slotMatch != null) {
                    let slotSaveName: string = slotMatch[2] || slotMatch[1];

                    let abcSlot: Slot | undefined;

                    if (userInput.slots) {
                        abcSlot = userInput.slots.filter((slot: Slot) => {
                            return slot.name == slotSaveName;
                        })[0];
                    }

                    if (abcSlot && StoryStateHelper.isCustomSlotExpected(storyState, slotSaveName)) {
                        storyState[slotSaveName] = abcSlot.value;
                    } else {
                        delete storyState[slotSaveName];
                    }

                    slotMatch = slotRegex.exec(siblingUtterances);
                }

                return selectedChoice;
            }
        }

        return null;
    }

    public static resetAvailableChoices(storyState: {[key: string]: any}): void {
        delete storyState.system_branch;
        delete storyState.system_utteranceChoiceMap;
        delete storyState.system_expectedSlots;
    }

    /**
    * Save necessary state variables for resuming later
    * @param storyState
    */
    public static saveForResume(storyState: {[key: string]: any}): void {
        const resumePartial: any = {
            branch: storyState.system_branch,
            utteranceMap: storyState.system_utteranceChoiceMap,
            expectedSlots: storyState.system_expectedSlots,
            speech: storyState.system_prevSpeech,
            reprompt: storyState.system_prevReprompt,
            recap: storyState.system_prevRecap
        };

        const sceneName = this.getCurrentSceneID(storyState);
        if (sceneName == null) {
            throw new Error("Something went wrong. There is no current scene information to save for resume.");
        } else {
            resumePartial.resumeScene = sceneName;
        }

        storyState.system_resume_save = resumePartial;
    }

    /**
    * Load states saved from [[StoryStateHelper.saveForResume()]] in preparation for resuming.
    * @param storyState
    */
    public static loadForResume(storyState: {[ket: string]: any}, stage: PlayStage): any {
        const resumeAttributes: any = storyState.system_resume_save;

        storyState.system_branch = resumeAttributes.branch;

        storyState.system_expectedSlots = resumeAttributes.expectedSlots;

        storyState.system_utteranceChoiceMap = resumeAttributes.utteranceMap;

        this.setCurrentSceneID(storyState, resumeAttributes.resumeScene);

        return {
            speech: resumeAttributes.speech,
            reprompt: resumeAttributes.reprompt,
            recap: resumeAttributes.recap
        };
    }

    public static clearResumeSave(storyState: {[key: string]: any}): void {
        delete storyState.system_resume_save;
    }

    public static hasResumeSave(storyState: {[key: string]: any}): boolean {
        return !!storyState.system_resume_save;
    }

    /**
     * Given the current state of the story, see if the given user input is expected.
     */
    public static isInputExpected(storyState: {[key: string]: any}, userInput: UserInput, locale: string): boolean {
        const selectedChoice = StoryStateHelper.getChoiceByUserInput(storyState, userInput, locale);

        return selectedChoice !== null && !selectedChoice.utterances.includes("*");
    }

    public static getSceneIDForRecap(storyState: {[key: string]: any}): string | null {
        if (storyState.system_recapSceneID) {
            return storyState.system_recapSceneID;
        }

        return null;
    }

    public static setSceneIDForRecap(storyState: {[key: string]: any}, recapSceneID: string) {
        storyState.system_recapSceneID = recapSceneID;
    }

    public static clearRecap(storyState:  {[key: string]: any}) {
        delete storyState.system_recapSceneID;
    }

    public static setStoryPaused(storyState: {[key: string]: any}, isPaused: boolean) {
        storyState.system_isStoryPaused = isPaused;
    }

    public static isStoryPaused(storyState: {[key: string]: any}) {
        return storyState.system_isStoryPaused;
    }

    public static isEndingReached(storyState: {[key: string]: any}): boolean {
        return storyState.system_isEndingReached;
    }

    public static setEndingReached(storyState: {[key: string]: any}, isEndingReached: boolean) {
        storyState.system_isEndingReached = isEndingReached;
    }

    public static setSelectedChoiceID(storyState: {[key: string]: any}, choiceID: string) {
        storyState.system_selectedChoiceID = choiceID;
    }
    
    public static clearSelectedChoiceID(storyState: {[key: string]: any}): void {
        delete storyState.system_selectedChoiceID;
    }
    
    public static getSelectedChoiceID(storyState: {[key: string]: any}) {
        return storyState.system_selectedChoiceID;
    }
}