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

declare var require: any;
declare var process: any;

const chalk: any = require('chalk');

import * as fs from "fs";
import * as path from "path";

import { StoryMetadata, UserInput, StoryStateHelper, SFBExtension, Choice, SFBDriver } from '@alexa-games/sfb-f';
import { readUtf8FileExcludingBomSync } from '@alexa-games/sfb-util';

interface ABCSessionData {
    input: string,
    output: any
}

type SFBExtensionType = SFBExtension.DriverExtension | SFBExtension.InstructionExtension | SFBExtension.ImporterExtension;
 
let debuggingStory: StoryMetadata;
let gameStatus: any = {};
let runTimeHistory: ABCSessionData[] =  [];
let wordToIntent: any = {};
let wordToSlotType: any = {};

let intentToUtterances: any = {};
let slotTypeToUtterances: any = {};

let filePath: string = "";
let extensions: SFBExtensionType[] = [];
let pollyConfig: any = undefined;
let projectPath: string = "";

export class ABCDebugger {
    public verbose: boolean;

    constructor(storyData: StoryMetadata, _extensions?: SFBExtensionType[], storyFilePath?: string, pollyConfiguration?: any, projectPathArg?: string) {
        this.verbose = true;
        gameStatus = {};
        runTimeHistory = [];
        wordToIntent = {};
        wordToSlotType = {};
        intentToUtterances = {};
        slotTypeToUtterances = {};
        filePath = "";
        extensions = [];
        pollyConfig = pollyConfiguration;
        projectPath = projectPathArg || "";

        debuggingStory = storyData;
        filePath = storyFilePath || "";

        if (debuggingStory.alexaVoiceModel && debuggingStory.alexaVoiceModel.languageModel && debuggingStory.alexaVoiceModel.languageModel.intents) {
            for (let intent of debuggingStory.alexaVoiceModel.languageModel.intents) {
                intentToUtterances[intent.name] = intent.samples;

                if (!intent.name.startsWith("AMAZON.")) {
                    for (let sample of intent.samples) {
                        wordToIntent[sample] = intent.name;
                    }
                }
            }
        }

        if (debuggingStory.alexaVoiceModel && debuggingStory.alexaVoiceModel.languageModel && debuggingStory.alexaVoiceModel.languageModel.types) {
            for (let slotTypes of debuggingStory.alexaVoiceModel.languageModel.types) {
                let slotTypeValues: string[] = [];
                for (let slotTypeValue of slotTypes.values) {
                    slotTypeValues.push(slotTypeValue.name.value);
                }
                slotTypeToUtterances[slotTypes.name] = slotTypeValues;

                for (let sample of slotTypeValues) {
                    wordToSlotType[sample] = slotTypes.name;
                }

            }
        }

        for (let defaultIntentName of Object.keys(BUILT_IN_INTENT_UTTERANCES)) {
            let utterances: string[] = BUILT_IN_INTENT_UTTERANCES[defaultIntentName];
            for (let intentUtterance of utterances) {
                wordToIntent[intentUtterance] = defaultIntentName;
            }
        }

        if (_extensions) {
            extensions = _extensions;
        }
    }

    public clearState() {
        gameStatus = {};
    }

    public async runCommand(lineIn : string, outputLogger: any) {
        if (this.verbose) {
            SFBDriver.debug = false;
            SFBDriver.testing = true;
        } else {
            SFBDriver.debug = false;
            SFBDriver.testing = false;
        }

        if (["!exit","!q","!e","!x","!done", "!quit"].indexOf(lineIn) > -1) {
            process.stdin.destroy();
        } else if(lineIn.startsWith("!")) {
            let commandMatch: any = /!([\S]+?)(?:[\s]+([\S\s]*))?$/g.exec(lineIn);

            if (commandMatch == null) {
                outputLogger.log(`[ABC DEBUG Error] \'${lineIn}\' is an unrecognized debugger command.`);
            } else {
                let command: string = commandMatch[1].toLowerCase();
                switch(command) {
                case "relaunch":
                case "rl":
                case "reload": {
                    outputLogger.log(`Reloading the story file '${filePath}'...`);
                    debuggingStory = require(filePath);
                    gameStatus = {};
                    outputLogger.log(chalk.green(`Loading successful! Press [Enter] to start.`))

                    break;
                }
                case "g":
                case "value":
                case "get": {
                    let param: string = commandMatch[2]? commandMatch[2].trim(): commandMatch[2];
                    if (!param || param.length == 0) {
                        outputLogger.log(chalk.green(`Available Variables: ${JSON.stringify(Object.keys(runTimeHistory[runTimeHistory.length - 1].output), null, 4)}`))
                    } else {
                        outputLogger.log(chalk.green(`'${param}' = ${JSON.stringify(runTimeHistory[runTimeHistory.length - 1].output[param], null, 4)}`))
                    }
                    break;
                }
                case "set": {
                    let param: string = commandMatch[2]? commandMatch[2].trim(): commandMatch[2];

                    // split on "=", so you would have to input "!set variable name=variable value here"
                    if(param) {
                        let indexOfFirst = param.indexOf("=");
                        let key = param.substr(0, indexOfFirst);
                        key = key ? key.trim() : key;
                        let value : any = param.substr(indexOfFirst + 1);
                        value = value ? value.trim() : value;

                        // Try and convert "value" into a boolean. Number conversion is more difficult and contains
                        // way more exceptions, and actually is not causing issues in the simulator.
                        if(value === "true") {
                            value = true;
                        } else if(value === "false") {
                            value = false;
                        }

                        // Set the given variable in the history and in the game status
                        if(runTimeHistory.length > 0) {
                            runTimeHistory[runTimeHistory.length - 1].output[key] = value;
                        }
                        gameStatus[key] = value;

                        outputLogger.log(chalk.green(`Updating variable ${key} to value ${value}`));

                        // Check if we are using a special output logger from the ABC Editor and if so output a JSON response object
                        if(outputLogger.outputResponse) {
                            outputLogger.outputResponse(undefined, gameStatus);
                        }

                    } else {
                        outputLogger.log(chalk.red(`Please call !set with argument <variable name>=<variable value>`));
                    }
                    break;
                }
                case "s":
                case "save": {
                    let saveMatch: string = commandMatch[2]? commandMatch[2].trim(): commandMatch[2];

                    if (!saveMatch || saveMatch[1].length == 0) {
                        outputLogger.log(chalk.red(`[ABC DEBUG Error] Need save NAME ie. \`!save NAME\``));
                        break;
                    }

                    // If project path for save files is set, use it
                    if(projectPath) {
                        let saveDirPath = path.resolve(projectPath, "saves");

                        if(!fs.existsSync(saveDirPath)) {
                            fs.mkdirSync(saveDirPath);
                        }

                        saveMatch = path.resolve(saveDirPath, saveMatch);
                    }

                    outputLogger.log("Saving the current test session...");
                    fs.writeFileSync(saveMatch + ".json", JSON.stringify(runTimeHistory));
                    outputLogger.log(`Save Successful! Saved Test Name='${saveMatch}'. To load this session, type '!load ${saveMatch}' .`);

                    break;
                }
                case "l":
                case "load": {
                    let loadMatch: string = commandMatch[2]? commandMatch[2].trim(): commandMatch[2];

                    if (!loadMatch || loadMatch.length == 0) {
                        outputLogger.log(chalk.red(`[ABC DEBUG Error] Need load NAME ie. \`!load NAME\``));
                        break;
                    }

                    // If project path for save files is set, use it
                    if(projectPath) {
                        let loadPath = path.resolve(projectPath, "saves", loadMatch + ".json")

                        if(fs.existsSync(loadPath)) {
                            loadMatch = path.resolve(projectPath, "saves", loadMatch);
                        }
                    }

                    outputLogger.log(chalk.blue("Clearing current test history..."));
                    runTimeHistory = [];

                    outputLogger.log(`Loading saved test: ${loadMatch}.json`);

                    try {
                        const loadData: ABCSessionData[] = JSON.parse(readUtf8FileExcludingBomSync(loadMatch + ".json"));

                        // Actually fetch the state from 2 times ago, and the input from the last scene. Because the latest state
                        // doesn't matter and was the state that was went to after the input was "inputted", not the state during
                        // which the input was "inputted"

                        // If no load data, something is wrong
                        if(!loadData || loadData.length == 0) {
                            outputLogger.log(chalk.red(`No load data available`));
                            break;    
                        }

                        // Calculate correct "previous previous" scene, if more than two scenes, or use the only scene if just 1 scene
                        const gameStateIndex = loadData.length >= 2 ? loadData.length - 2 : 0;

                        gameStatus = loadData[gameStateIndex].output || {};
                        // Also set the run time history to what was loaded, but remove the last step because it will be
                        // redone by the latest input
                        runTimeHistory = loadData;
                        const userInput = loadData[loadData.length - 1].input;

                        runTimeHistory.splice(runTimeHistory.length - 1, 1);

                        await testContent(userInput, outputLogger, runTimeHistory);

                    } catch (err) {
                        outputLogger.log(chalk.red(`[ABC DEBUG Error] File \`!load NAME\` doesn't exist. `));
                    }

                    break;
                }
                case "b":
                case "undo":
                case "back": {
                    if(runTimeHistory.length >= 2) {
                        //const historyEntryCurrent = runTimeHistory[runTimeHistory.length - 1];
                        const historyEntryPrevious = runTimeHistory[runTimeHistory.length - 2];
                        const historyEntryPreviousPrevious = runTimeHistory.length >= 3 ? runTimeHistory[runTimeHistory.length - 3] : {input: "", output: {}};

                        // So, we actually have to use the input from previous with the state from previous previous to get the
                        // results to output like we have gone back one step in the simulator.

                        // Remove the last 2 states from the run time history, because we will go back and reexecute that state
                        runTimeHistory.splice(runTimeHistory.length - 2, 2);

                        gameStatus = historyEntryPreviousPrevious.output;

                        await testContent(historyEntryPrevious.input, outputLogger, runTimeHistory);
                    }
                    else {
                        outputLogger.log(chalk.red(`Not enough history to go back to.`));
                    }

                    break;
                }
                case ">":
                case "->":
                case "goto": {
                    let sceneId: string = commandMatch[2]? commandMatch[2].trim(): commandMatch[2];

                    if (!sceneId || sceneId.length == 0) {
                        outputLogger.log(chalk.red(`[ABC DEBUG Error] Need scene ID to go to ie. \`!goto NAME\``));
                    } else {
                        StoryStateHelper.jumpToScene(sceneId, gameStatus);
                        await testContent("", outputLogger, runTimeHistory);
                    }
                    break;
                }
                case "clear_and_goto": {
                    let sceneId: string = commandMatch[2]? commandMatch[2].trim(): commandMatch[2];

                    if (!sceneId || sceneId.length == 0) {
                        outputLogger.log(chalk.red(`[ABC DEBUG Error] Need scene ID to go to ie. \`!clear_and_goto NAME\``));
                    } else {
                        gameStatus = {};
                        runTimeHistory = [];
                        StoryStateHelper.jumpToScene(sceneId, gameStatus);
                        await testContent("", outputLogger, runTimeHistory);
                    }
                    break;
                }
                case "r":
                case "rs":
                case "startover":
                case "restart": {
                    gameStatus = {};
                    runTimeHistory = [];
                    await testContent("", outputLogger, runTimeHistory);
                    break;
                }
                case "p":
                case "pause": {
                    await testContent("SessionEndedRequest", outputLogger, runTimeHistory);
                    break;
                }
                case "h":
                case "commands":
                case "help": {
                    let helpMessages: any = [
                        {
                            command: "!x",
                            description: "Exit the story debugger."
                        },
                        {
                            command: "!p",
                            description: "Pause the story and test for end of session. Press [Enter] to relaunch once paused."
                        },
                        {
                            command: "!b",
                            description: "Go back one input, undoing all state changes."
                        },
                        {
                            command: "!s [testName]",
                            description: "Save the current test state as [testName]."
                        },
                        {
                            command: "!l [testName]",
                            description: "Load and resume the saved state [testName]."
                        },
                        {
                            command: "!relaunch",
                            description: "RE-load the currently testing baked file, and restart the story."
                        },
                        {
                            command: "!restart",
                            description: "Reset the story state, and restart the story as new."
                        },
                        {
                            command: "!g [variable]",
                            description: "View the value of the state variable [variable]. If [variable] is not provided, a list of available state variables is displayed."
                        },
                        {
                            command: "!set [variable]=[value]",
                            description: "Set the value of [variable name] to [variable value]."
                        }
                    ];

                    for (let help of helpMessages) {
                        outputLogger.log("\t" + chalk.green(padString(help.command, 24)) + "\t" + help.description);
                    }

                    outputLogger.log(chalk.blue("\n[Enter] to resume."));
                }
                }
            }

        } else {
            await testContent(lineIn, outputLogger, runTimeHistory);
        }
    }

    public run(eventEmitter : any, outputLogger: any) {
        outputLogger.log(chalk.green('Vroom! vroom! SFB Story Debugger is launching...\nTo see available commands type ') + chalk.blue('!help') + chalk.green('.\n\nPress [Enter] to start.'));

        let stdin: any = process.openStdin();

        let thisObj = this;

        // If an eventEmitter is passed in, register it as well as stdin
        if(eventEmitter) {
            eventEmitter.addListener("data", async function(lineIn: string) {
                await thisObj.runCommand(lineIn.trim(), outputLogger);
            });
        } else {
            stdin.addListener("data", async function(d: any) {
                // note:  d is an object, and when converted to a string it will
                // end with a linefeed.  so we (rather crudely) account for that
                // with toString() and then trim()
                let lineIn: string = d.toString().trim();

                await thisObj.runCommand(lineIn, outputLogger);
            });
        }
    }
}

async function testContent(input: string, outputLogger: any, runTimeHistory: ABCSessionData[]) {
    
    const logError = (errorMessage: string | undefined) => {
        if (!errorMessage) {
            return;
        }
        console.log("ERROR");
        console.log(errorMessage);
        if(outputLogger.logError) {
            outputLogger.logError({message: errorMessage});
        }
    };

    try {
        let contentDriver: SFBDriver = new SFBDriver(debuggingStory, [], extensions, pollyConfig);

        let expectedChoices: Choice[] = StoryStateHelper.getAvailableChoices(gameStatus);
        let expectedWords: string[] = [];

        let userInput: UserInput = {
            intent: "",
            slots: [],
            value: input
        };

        if (input.length === 0 ) {
            userInput.intent = "LaunchRequest"
            userInput.value = "LaunchRequest"
        } else if (input.trim() == 'SessionEndedRequest') {
            userInput.intent = "SessionEndedRequest"
            userInput.value = "SessionEndedRequest"
        } else {
            let longestMatch: number = -1;
            let matchedUtterance: string = "";

            for (let choice of expectedChoices) {
                for (let utterance of choice.utterances) {
                    if (utterance.match(/{[\s\S]+?}/g)) {
                        let slotFindingRegexString: string = "^" + utterance.replace(/{([\s\S]+?)(?: as ([\s\S]+?))?}/g, function (match: any, p1: string, p2: string) {
                            let slotType: string = p1;

                            if (debuggingStory.alexaVoiceModel.languageModel && debuggingStory.alexaVoiceModel.languageModel.types && debuggingStory.alexaVoiceModel.languageModel.types.length >= 0) {
                                let typeDefinition: any = debuggingStory.alexaVoiceModel.languageModel.types.filter((typeItem: any) => {
                                    return typeItem.name == slotType;
                                });

                                if (typeDefinition && typeDefinition.length > 0) {
                                    let sampleCollection: string = "";
                                    let first: boolean = true;
                                    for (let slotSample of typeDefinition[0].values) {
                                        if (first) {
                                            first = false;
                                        } else {
                                            sampleCollection += "|";
                                        }

                                        sampleCollection += slotSample.name.value;
                                    }

                                    return `(${sampleCollection})`;
                                }
                            }

                            return "([\\s\\S]+?)";
                        }) + "$";

                        let slotFindingRegex: RegExp = new RegExp(slotFindingRegexString, "gi");

                        let slotValueMatch: any = slotFindingRegex.exec(input);
                        if (slotValueMatch != null && longestMatch < slotFindingRegexString.split(" ").length) {
                            userInput.slots = [];

                            let tempUtterance: string = utterance;
                            let slotExtractingRegex: RegExp = /{([\s\S]+?)(?: as ([\s\S]+?))?}/g;

                            let slotNameMatch: any = slotExtractingRegex.exec(tempUtterance);
                            let foundIndex: number = 0;
                            while (slotNameMatch != null) {
                                foundIndex ++;
                                let slotName: string = slotNameMatch[2] || slotNameMatch[1];

                                userInput.slots.push({
                                    name: slotName,
                                    value: slotValueMatch[foundIndex]
                                });
                                matchedUtterance = tempUtterance.replace(/{([\s\S]+?)(?: as ([\s\S]+?))?}/g, "");

                                slotNameMatch = slotExtractingRegex.exec(tempUtterance);
                            }

                            longestMatch = slotFindingRegexString.split(" ").length;

                        }
                    } else {
                        expectedWords.push(utterance);
                    }
                }
            }

            let fuzziedMatchUtterance: any = pickBestResponse(input, expectedWords);

            let slot: string = "";
            if (fuzziedMatchUtterance && matchedUtterance.length == 0) {
                slot = wordToSlotType[fuzziedMatchUtterance.response];

                if (slot) {
                    userInput.intent = wordToIntent[`{${slot}}`];
                } else {
                    userInput.intent = wordToIntent[fuzziedMatchUtterance.response];
                }
                delete userInput.slots;
            }
        }

        outputLogger.log(chalk.green(JSON.stringify(userInput, null, 4)));
        outputLogger.log(chalk.black.bgWhite.bold("\n\n\n_______________________SUBMIT PLAYER IN_______________________"));

        let currentSceneId = StoryStateHelper.getCurrentSceneID(gameStatus);

        await contentDriver.resumeStory(userInput, gameStatus);

        gameStatus = contentDriver.getCurrentStoryState();

        //outputLogger.log("game states:\n" + JSON.stringify(gameStatus, null, 4));
        outputLogger.log(chalk.bold("_________________________           __________________________"));
        outputLogger.log(chalk.bold("_________________________    OUT    __________________________"));
        outputLogger.log(chalk.green("%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%"));

        let transitioningSceneID = StoryStateHelper.getCurrentSceneID(gameStatus);

        let outputLoggerResponse : any = {id: transitioningSceneID, visuals: [], choices: [], prompt: "", reprompt: "", ending: false};

        if (contentDriver.isEndingReached()) {
            let {ssml, pretty, errorMessage} = await contentDriver.getSpeechSSMLAndPrettyText();
            outputLogger.log(chalk.red("\n\"" + ssml.replace(/[\s]+/g, " ") + "\"\n"));
            outputLogger.log(chalk.blue('Ending reached. Type !x to exit the debugger. Type !restart to start over from the beginning.'));

            outputLoggerResponse.ending = true;
            outputLoggerResponse.prompt = ssml;
            outputLoggerResponse.pretty = pretty;
            logError(errorMessage);
        } else if (StoryStateHelper.isStoryPaused(contentDriver.getCurrentStoryState())) {
            let {ssml, pretty, errorMessage} = await contentDriver.getSpeechSSMLAndPrettyText();
            outputLogger.log(chalk.red("\n\"" + ssml.replace(/[\s]+/g, " ") + "\"\n"));
            outputLogger.log(chalk.blue('The story is Paused. Press [Enter] to resume the story.'));

            outputLoggerResponse.ending = true;
            outputLoggerResponse.prompt = ssml;
            outputLoggerResponse.pretty = pretty;
            logError(errorMessage);
        } else {
            let {ssml, pretty, errorMessage} = await contentDriver.getSpeechSSMLAndPrettyText();
            outputLogger.log(chalk.yellow("\n\"" + ssml.replace(/[\s]+/g, " ") + "\"\n"));

            outputLoggerResponse.prompt = ssml;
            outputLoggerResponse.pretty = pretty;
            logError(errorMessage);
        }

        let {ssml, pretty, errorMessage} = await contentDriver.getRepromptSSMLAndPrettyText();
        logError(errorMessage);

        if (ssml) {
            if(ssml.length > 0) {
                outputLogger.log(chalk.red("...\n"));
                outputLogger.log(chalk.yellow("\n\"" + ssml.replace(/[\s]+/g, " ") + "\"\n"));

                outputLoggerResponse.reprompt = ssml;
                outputLoggerResponse.repromptPretty = pretty;
            }
        }


        // get visuals
        let visuals = await contentDriver.getVisuals();
        if(visuals) {
            outputLoggerResponse.visuals = visuals;

            outputLogger.log("================================Visuals===============================");
            outputLogger.log(visuals);
            outputLogger.log("======================================================================");
        }
        outputLogger.log(chalk.blue(`Size of Saved State = `) + chalk.white(`${JSON.stringify(contentDriver.getCurrentStoryState()).length * 8} Bytes`))
        outputLogger.log(chalk.green("--------------------------------------------------------------"));
        runTimeHistory.push({
            input: input,
            output: JSON.parse(JSON.stringify(contentDriver.getCurrentStoryState()))
        });

        if (!StoryStateHelper.isStoryPaused(contentDriver.getCurrentStoryState()) && !StoryStateHelper.isEndingReached(contentDriver.getCurrentStoryState())) {
            for (let choice of StoryStateHelper.getAvailableChoices(contentDriver.getCurrentStoryState())) {
                outputLogger.log("[] " + chalk.cyan(choice.utterances));
            }
        }

        // Check if we are using a special output logger from the ABC Editor and if so output a JSON response object
        if(outputLogger.outputResponse) {

            // Set story state for returning to the UI, and previous story state as well.
            outputLoggerResponse.storyState = gameStatus;
            outputLoggerResponse.previousStoryState = runTimeHistory.length >= 2 ? runTimeHistory[runTimeHistory.length - 2].output : {};

            if (!StoryStateHelper.isStoryPaused(contentDriver.getCurrentStoryState()) && !StoryStateHelper.isEndingReached(contentDriver.getCurrentStoryState())) {
                for (let choice of StoryStateHelper.getAvailableChoices(contentDriver.getCurrentStoryState())) {
                    outputLoggerResponse.choices.push(choice.utterances);
                }
            }

            outputLogger.outputResponse(outputLoggerResponse);
        }

        return;
    } catch (err) {
        console.log("ERROR");
        console.log(err);
        if(outputLogger.logError) {
            outputLogger.logError(err);
        }
    }
}

function escapeRegExp(str: string) {
	return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

// Pick best response from the given list of strings, if key is provided, instead of a list of strings you can pass a list
// of objects and the item inside of the object named key will be used for the text match.
function pickBestResponse(actualResponse: string, fuzzyResponses: any[], key?: string) {
    let fuzzyResponseScores: {[key:string]: {match: number, ratio: number}} = {};

    if(!actualResponse) {
        actualResponse = "";
    }

    fuzzyResponses.forEach(function(fuzzyResponse: any) {
        let results = null;

        let fuzzyResponseComparisonVal = fuzzyResponse;

        if(key) {
            fuzzyResponseComparisonVal = fuzzyResponse[key];
        }

        fuzzyResponseScores[fuzzyResponseComparisonVal] = {
            match: 0,
            ratio: 0
        };

        actualResponse.split(" ").forEach(function(item) {
            let regExp = new RegExp('(^|\\s)' + escapeRegExp(item) + '($|\\s)', 'ig');

            while ((results = regExp.exec(fuzzyResponseComparisonVal)) !== null) {
                fuzzyResponseScores[fuzzyResponseComparisonVal].match += 1;

                // Repeated words in the response string only count for 1 (like for word 'the' for example), by 'break'ing here
                break;
            }
        });

        fuzzyResponseScores[fuzzyResponseComparisonVal].ratio = fuzzyResponseScores[fuzzyResponseComparisonVal].match/fuzzyResponseComparisonVal.split(" ").length;
    });

    let fuzzyResponseMax: any = null;
    let fuzzyResponseMaxScore: any = {
        match: 0,
        ratio: 0
    };

    for (const fuzzyResponse in fuzzyResponseScores) {
        let fuzzyResponseScore = fuzzyResponseScores[fuzzyResponse];

        if (fuzzyResponseScore.match >= fuzzyResponseMaxScore.match && fuzzyResponseScore.ratio >= fuzzyResponseMaxScore.ratio) {
            fuzzyResponseMax = fuzzyResponse;
            fuzzyResponseMaxScore = fuzzyResponseScore;
        }
    }

    let matchedIndex = -1;
    let matchedItem = null;
    if(!key) {
        matchedIndex = fuzzyResponses.indexOf(fuzzyResponseMax);
        matchedItem = fuzzyResponseMax;
    } else {
        for(let i = 0; i < fuzzyResponses.length; i++) {
            let resp:any = fuzzyResponses[i];

            let content = resp[key];
            if(fuzzyResponseMax === content) {
                matchedIndex = i;
                matchedItem = resp;
                break;
            }
        }
    }

    if (fuzzyResponseMaxScore.match > 0) {
        return {
            index: matchedIndex,
            response: matchedItem
        };
    } else {
        return undefined;
    }
}

const BUILT_IN_INTENT_UTTERANCES: {[key: string]: string[]} = {
    'AMAZON.CancelIntent': [
        'cancel',
        'never mind',
        'nevermind',
        'forget it'
    ],
    'AMAZON.HelpIntent': [
        'help',
        'help me',
        'can you help me'
    ],
    'AMAZON.LoopOffIntent': [
        'loop off'
    ],
    'AMAZON.LoopOnIntent': [
        'loop',
        'loop on',
        'keep playing this'
    ],
    'AMAZON.NextIntent': [
        'next',
        'skip',
        'skip forward'
    ],
    'AMAZON.NoIntent': [
        'no',
        'no thanks'
    ],
    'AMAZON.PauseIntent': [
        'pause',
        'pause that'
    ],
    'AMAZON.PreviousIntent': [
        'go back',
        'skip back',
        'back up'
    ],
    'AMAZON.RepeatIntent': [
        'repeat',
        'say that again',
        'repeat that'
    ],
    'AMAZON.ResumeIntent': [
        'resume',
        'continue',
        'keep going'
    ],
    'AMAZON.ShuffleOffIntent': [
        'stop shuffling',
        'shuffle off',
        'turn off shuffle'
    ],
    'AMAZON.ShuffleOnIntent': [
        'shuffle',
        'shuffle on',
        'shuffle the music',
        'shuffle mode'
    ],
    'AMAZON.StartOverIntent': [
        'start over',
        'restart',
        'start again'
    ],
    'AMAZON.StopIntent': [
        'stop',
        'off',
        'shut up'
    ],
    'AMAZON.YesIntent': [
        'yes',
        'yes please',
        'sure'
    ]
};

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
