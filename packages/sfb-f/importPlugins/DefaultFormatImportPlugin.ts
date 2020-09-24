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

import { ImportResult, ImportErrorLine } from '../importer/importerEntity';
import { VisualOptions } from '../driver/driverEntity';
import { ABCImportPlugin } from '../importPlugins/importerPlugin';
import { Scene, Instruction, InstructionType, SceneVariation } from '../story/storyMetadata';
import { InstructionBuilder } from '../story/instructionBuilder';
import { ContentItem } from '../importer/importer';

export class DefaultFormatImportPlugin implements ABCImportPlugin {	
    parameters: any = {};
    pluginName = "default";
    public defaultRenderTemplate: string = "default";

    public static languageVersion = 1;

    public getVersion(): number {
        return DefaultFormatImportPlugin.languageVersion;
    }

    public async importData(contents : ContentItem[], param?: any): Promise<ImportResult> {
        const contentItems: ContentItem[] = contents;

        let parseSceneResult: ImportResult = parseScenes.call(this, contentItems, param.ignoreSyntaxError);

        if (param) {
            this.parameters = JSON.parse(JSON.stringify(param));
        }
        
        return parseSceneResult;
    }

    // Loop through all update commands and apply them, then return resulting content.
    public applyCommands(originalContents : string, updateCommandList : UpdateCommand[]) {

        let returnValues = {};
        let newContents = originalContents;

        for(let command of updateCommandList) {
            newContents = command.apply(newContents, returnValues);
        }
        
        return { content: newContents, returnValues: returnValues };
    }
}

function updateSceneProperty(scenePropertyName : string, newValues : any) {
    let updatedContentText = "";
    switch (scenePropertyName) {
        case "say": 
        case "recap": 
        case "reprompt": {
                // Don't put anything if not set, this will essentially clear things
            if(newValues.params[scenePropertyName] && newValues.params[scenePropertyName].length > 0) {

                updatedContentText += "\t*" + scenePropertyName + "\n\t\t";

                for(let i = 0; i < newValues.params[scenePropertyName].length; i++) {
                    updatedContentText += newValues.params[scenePropertyName][i] + "\n";

                    if(i < newValues.params[scenePropertyName].length - 1) {
                        updatedContentText += "||\n";
                    }
                }
            }
            
            break;
        }
        default: {
            updatedContentText += "\t*" + scenePropertyName + "\n\t\t" + newValues.params[scenePropertyName] + "\n";
            break;
        }
    }
    return updatedContentText;
}

function parseContentAndReplace(contentText : string, newValues : any) {
    const CONTENT_PARSE_REGEX: RegExp = /([\s]*\*[\s]*)([^\n]*?)\n([\s\S]+?)(?=\n[\s]*\*|$)/gi;

    var updatedContentText = "";
    var contentMatch = CONTENT_PARSE_REGEX.exec(contentText);
    //console.log("Matching content: " + JSON.stringify(contentMatch, null, 2));
    var originalSource = contentText;
    var parsedNodes = [];
    var prompts = "";
    var reprompts = "";
    var visualInstruction = undefined;
    let foundSceneProperties : any = {};

    updatedContentText += "@" + newValues.sceneId + "\n";

    while (contentMatch != null) {
        var scenePropertyName = contentMatch[2].trim();
        var contentValue = contentMatch[3].trim();

        foundSceneProperties[scenePropertyName] = 1;

        if(scenePropertyName in newValues.params) {
            updatedContentText += updateSceneProperty(scenePropertyName, newValues);
        } else {
            updatedContentText += "\t*" + scenePropertyName + "\n\t\t" + contentValue + "\n";
        }

        contentMatch = CONTENT_PARSE_REGEX.exec(contentText);
    }

    // Add items that weren't already in the scene already
    for (let key of Object.keys(newValues.params)) {
        if(!(key in foundSceneProperties) && newValues.params[key] && newValues.params[key].length > 0) {
            updatedContentText += updateSceneProperty(key, newValues) + "\n";    
        }
    }

    return updatedContentText;
}

function updateThenWithHear(contentText : string, original : HearActionMetadata, newHear : string, gotoId : string, action : string) {
    
    let newContent = "";

    newContent += "\t*then\n\t\t";

    let replacedHear = false;
    let deletedHear = false;

    // Holds in process hear sections
    let hearSectionLines : string[] = [];
    let pullOutCurrentHearSection = false;
    let currentHearSectionContainsMatchingGoto = false;

    for (let line of contentText.split('\n')) {

        let trimmedline: string = line.trim();

        if(pullOutCurrentHearSection) {
            hearSectionLines.push(line);

            // Check processing hear section to see if it contains a goto target we are looking for
            if(original.goto && (trimmedline === ("-> " + original.goto) || trimmedline === ("<-> " + original.goto))) {
                currentHearSectionContainsMatchingGoto = true;
            }

            // Only handles single nesting of "}" signs
            if(trimmedline === ("}")) {

                let deletingHear = false;
                // Check to see if this was a hear section we wanted
                // If no goto set, or if goto matched existing then we are ready to modify this hear section
                if(!original.goto || currentHearSectionContainsMatchingGoto) {

                    // Process the pulled out hear section
                    if(!newHear) {
                        deletingHear = true;                
                        deletedHear = true;
                    } else {
                        hearSectionLines[0] = "\t\thear " + newHear + " {";        
                        replacedHear = true;
                    }

                    hearSectionLines = hearSectionLines.map((innerLine) => {
                        const innerLineTrimmed = innerLine.trim();

                        if((!original.goto && (innerLineTrimmed.startsWith("->") 
                                               || innerLineTrimmed.startsWith("<->"))) 
                            ||
                            (original.goto && (innerLineTrimmed === ("-> " + original.goto) 
                                               || innerLineTrimmed === ("<-> " + original.goto)))
                            ) {
                            return "\t\t\t" + getFormattedStringForAction(action, gotoId); 
                        }

                        // Else return the line as is
                        return innerLine;
                    });
                }

                if(!deletingHear) {
                    // Now add this entire hear section as you normally would
                    hearSectionLines.forEach((line) => { newContent += line + "\n"});
                }
    
                // Now break out of this inner conditional looping if
                pullOutCurrentHearSection = false;
            }
            continue;
        }

        if(trimmedline === `hear ${original.hear} {`) {
            hearSectionLines = [];
            hearSectionLines.push(line);
            pullOutCurrentHearSection = true;
            currentHearSectionContainsMatchingGoto = false;
        } else {
            newContent += line + "\n";
        }
    };

    if(!deletedHear && !replacedHear) {
        newContent += "\t\thear " + newHear + " {\n";
        newContent += "\t\t\t" + getFormattedStringForAction(action, gotoId) + "\n";
        newContent += "\t\t}\n";
    }

    return newContent;
}

function getFormattedStringForAction(action : string, gotoId : string) {

    let val = "";

    if(action === InstructionType.SAVE_AND_GO) {
        val += "<-> " + gotoId;
    } else if(action === InstructionType.GO_TO) {
        val += "-> " + gotoId;
    } else if(action === InstructionType.RESTART) {
        val += ">> RESTART";
    } else if(action === InstructionType.PAUSE) {
        val += ">> PAUSE";
    } else if(action === InstructionType.RESUME) {
        val += ">> RESUME";
    } else if(action === InstructionType.REPEAT) {
        val += ">> REPEAT";
    } else if(action === InstructionType.REPROMPT) {
        val += ">> REPROMPT";
    } else if(action === InstructionType.BACK) {
        val += ">> BACK";
    } else if(action === InstructionType.END) {
        val += ">> END";
    } else if(action === InstructionType.RETURN) {
        val += ">> RETURN";
    }

    return val;
}

function updateThenWithGoto(contentText : string, originalGoto : string, gotoId : string, action : string) {
    
    let newContent = "";

    newContent += "\t*then\n\t\t";

    let replacedGoto = false;

    for (let line of contentText.split('\n')) {

        let trimmedline: string = line.trim();

        // TODO: Check to see if we are in any nested hear { } signs and don't change those goto commands

        if(trimmedline === ("-> " + originalGoto) || trimmedline === ("<-> " + originalGoto)) {

            if(!gotoId) {
                // Don't append the line, we are deleting this goto
            } else {

                let firstPartSpacing = "";
                if(trimmedline === ("-> " + originalGoto)) {
                    firstPartSpacing = line.split("->")[0];
                } else if(trimmedline === ("<-> " + originalGoto)) {
                    firstPartSpacing = line.split("<->")[0];
                }

                // Then this is the one we should update
                newContent += firstPartSpacing + getFormattedStringForAction(action, gotoId) + "\n";
                replacedGoto = true;
            }
        } else {
            newContent += line + "\n";
        }
    };

    if(!replacedGoto) {
        newContent += "\t\t" + getFormattedStringForAction(action, gotoId) + "\n";
    }

    return newContent;
}

interface HearActionMetadata {
    hear: string;
    goto: string;
    action: string;
}

function updateHear(contentText : string, sceneId : string, original : HearActionMetadata, newHear : string, gotoId : string, action : string) {
    const CONTENT_PARSE_REGEX: RegExp = /([\s]*\*[\s]*)([^\n]*?)\n([\s\S]+?)(?=\n[\s]*\*|$)/gi;

    var updatedContentText = "";
    var contentMatch = CONTENT_PARSE_REGEX.exec(contentText);
    //console.log("Matching content: " + JSON.stringify(contentMatch, null, 2));
    var originalSource = contentText;
    var parsedNodes = [];
    var prompts = "";
    var reprompts = "";
    var visualInstruction = undefined;
    let foundSceneProperties : any = {};

    updatedContentText += "@" + sceneId + "\n";

    while (contentMatch != null) {
        var scenePropertyName = contentMatch[2].trim();
        var contentValue = contentMatch[3].trim();

        foundSceneProperties[scenePropertyName] = 1;

        if(scenePropertyName === "then") {
            updatedContentText += updateThenWithHear(contentValue, original, newHear, gotoId, action);
        } else {
            updatedContentText += "\t*" + scenePropertyName + "\n\t\t" + contentValue + "\n";
        }

        contentMatch = CONTENT_PARSE_REGEX.exec(contentText);
    }

    if(!foundSceneProperties["then"] && newHear) {
        updatedContentText += "\t*then\n\t\thear " + newHear + " {\n\t\t\t" + getFormattedStringForAction(action, gotoId) + "\n\t\t}\n\n";
    }

    return updatedContentText;
}

function updateGoto(contentText : string, sceneId : string, originalGoto : string, gotoId : string, action : string) {
    const CONTENT_PARSE_REGEX: RegExp = /([\s]*\*[\s]*)([^\n]*?)\n([\s\S]+?)(?=\n[\s]*\*|$)/gi;

    var updatedContentText = "";
    var contentMatch = CONTENT_PARSE_REGEX.exec(contentText);
    //console.log("Matching content: " + JSON.stringify(contentMatch, null, 2));
    var originalSource = contentText;
    var parsedNodes = [];
    var prompts = "";
    var reprompts = "";
    var visualInstruction = undefined;
    let foundSceneProperties : any = {};

    updatedContentText += "@" + sceneId + "\n";

    while (contentMatch != null) {
        var scenePropertyName = contentMatch[2].trim();
        var contentValue = contentMatch[3].trim();

        foundSceneProperties[scenePropertyName] = 1;

        if(scenePropertyName === "then") {
            updatedContentText += updateThenWithGoto(contentValue, originalGoto, gotoId, action);
        } else {
            updatedContentText += "\t*" + scenePropertyName + "\n\t\t" + contentValue + "\n";
        }

        contentMatch = CONTENT_PARSE_REGEX.exec(contentText);
    }

    if(!foundSceneProperties["then"] && gotoId) {
        updatedContentText += "\t*then\n\t" + getFormattedStringForAction(action, gotoId) + "\n\n";
    }

    return updatedContentText;
}

function removeReferencesFromThen(contentText : string, sceneIdToRemove : string) {
    
    let newContent = "";

    newContent += "\t*then\n\t\t";

    let replacedHear = false;
    let replaceNextGoto = false;

    let insideHereMutex = 0;

    let insideHearContent = "";
    let containedSceneIdToRemove = false;

    for (let line of contentText.split('\n')) {

        let trimmedline: string = line.trim();

        if(trimmedline.startsWith("hear")) {

            insideHereMutex++;

            // Then this is the one we should update
            insideHearContent += line + "\n";

            // TODO: Need to count other "{" signs found and increment the mutex

        } else if(trimmedline === ("}")) {

                if(insideHereMutex > 0) {
                    insideHereMutex--;
                }
                
                // Then this is the one we should update
                insideHearContent += line + "\n";

                if(insideHereMutex == 0) {
                    // Actually, don't append anything if this contained the goto we were looking for
                    if(containedSceneIdToRemove) {

                    } else {
                        // Otherwise, append this good hear to the content
                        newContent += insideHearContent;
                    }
                    insideHearContent = "";
                    containedSceneIdToRemove = false;
                }
    
        } else if (trimmedline === ("-> " + sceneIdToRemove) ||
                   trimmedline === ("<-> " + sceneIdToRemove)){
            if(insideHereMutex > 0) {
                containedSceneIdToRemove = true;
            }

            // Otherwise, this may have been a global -> that wasn't in a hear, so don't output it here either.

        } else {
            if(insideHereMutex > 0) {
                insideHearContent += line + "\n";
            } else {
                newContent += line + "\n";
            }
        }
    };

    return newContent;
}

function updateReferencesFromThen(contentText : string, originalSceneIdRef : string, newSceneIdRef : string) {
    
    let newContent = "";

    newContent += "\t*then\n\t\t";

    for (let line of contentText.split('\n')) {

        let trimmedline: string = line.trim();

        if (trimmedline === ("-> " + originalSceneIdRef)){
            // Trying to preserve original indentation
            newContent += line.split("->")[0] + "-> " + newSceneIdRef + "\n";
        } else if (trimmedline === ("<-> " + originalSceneIdRef)){
            // Trying to preserve original indentation
            newContent += line.split("<->")[0] + "<-> " + newSceneIdRef + "\n";
        } else {
            newContent += line + "\n";
        }
    };

    return newContent;
}

function updateReferencesFromScene(contentText : string, sceneId : string, originalSceneIdRef : string, newSceneIdRef: string) {
    const CONTENT_PARSE_REGEX: RegExp = /([\s]*\*[\s]*)([^\n]*?)\n([\s\S]+?)(?=\n[\s]*\*|$)/gi;

    var updatedContentText = "";
    var contentMatch = CONTENT_PARSE_REGEX.exec(contentText);
    //console.log("Matching content: " + JSON.stringify(contentMatch, null, 2));
    var originalSource = contentText;
    var parsedNodes = [];
    var prompts = "";
    var reprompts = "";
    var visualInstruction = undefined;
    let foundSceneProperties : any = {};

    updatedContentText += "@" + sceneId + "\n";

    while (contentMatch != null) {
        var scenePropertyName = contentMatch[2].trim();
        var contentValue = contentMatch[3].trim();

        foundSceneProperties[scenePropertyName] = 1;

        if(scenePropertyName === "then") {
            updatedContentText += updateReferencesFromThen(contentValue, originalSceneIdRef, newSceneIdRef);
        } else {
            updatedContentText += "\t*" + scenePropertyName + "\n\t\t" + contentValue + "\n";
        }

        contentMatch = CONTENT_PARSE_REGEX.exec(contentText);
    }

    updatedContentText += "\n";

    return updatedContentText;
}

function removeReferencesFromScene(contentText : string, sceneId : string, sceneIdToRemove : string) {
    const CONTENT_PARSE_REGEX: RegExp = /([\s]*\*[\s]*)([^\n]*?)\n([\s\S]+?)(?=\n[\s]*\*|$)/gi;

    var updatedContentText = "";
    var contentMatch = CONTENT_PARSE_REGEX.exec(contentText);
    //console.log("Matching content: " + JSON.stringify(contentMatch, null, 2));
    var originalSource = contentText;
    var parsedNodes = [];
    var prompts = "";
    var reprompts = "";
    var visualInstruction = undefined;
    let foundSceneProperties : any = {};

    updatedContentText += "@" + sceneId + "\n";

    while (contentMatch != null) {
        var scenePropertyName = contentMatch[2].trim();
        var contentValue = contentMatch[3].trim();

        foundSceneProperties[scenePropertyName] = 1;

        if(scenePropertyName === "then") {
            updatedContentText += removeReferencesFromThen(contentValue, sceneIdToRemove);
        } else {
            updatedContentText += "\t*" + scenePropertyName + "\n\t\t" + contentValue + "\n";
        }

        contentMatch = CONTENT_PARSE_REGEX.exec(contentText);
    }

    updatedContentText += "\n";

    return updatedContentText;
}

function parseScenesForReplacement(text : string, sceneId : string | undefined, updatedScene : any, applyFunc? : any) {
    let newText = "";

    let sceneParseRegex: RegExp = /(?:(?:\n[ \t]*?)|^)\@[\s]*([^\n]*?)\n([\s\S]+?)(?=\n[\s]*\@|$)/gi;
    var sceneMatch = sceneParseRegex.exec(text);
    while (sceneMatch != null) {
        var sceneID = sceneMatch[1].trim();
        var sceneContent = sceneMatch[2].trim();

            if(!sceneId && applyFunc) {
                newText += applyFunc(sceneContent, sceneID);
            } else if(sceneId === sceneID) {

                if(applyFunc) {
                    //console.log("Found scene to update with an apply function");
                    newText += applyFunc(sceneContent, sceneID);        
                } else {
                    //console.log("Found scene to update");
                    newText += parseContentAndReplace(sceneContent, updatedScene);        
                }

            } else {
                newText += "@" + sceneID + "\n\t" + sceneContent + "\n\n";
            }
        sceneMatch = sceneParseRegex.exec(text);
    }
    return newText;
}

export class UpdateCommand {	
    sceneId = "";

    constructor(params : any) {
        this.sceneId = params.sceneId;
    }

    // Desired new scene id, ok if blank, will inherit from parent
    public setSceneId(sceneId : string) {
        this.sceneId = sceneId;
    }
    
    // Actually apply this content to the original content
    apply(originalContent: string, returnValues: any) : string {
        return originalContent;
    }
}

function getSceneNames(originalContent : string) {

    let sceneMap : any = {};

    let sceneParseRegex: RegExp = /(?:(?:\n[ \t]*?)|^)\@[\s]*([^\n]*?)\n([\s\S]+?)(?=\n[\s]*\@|$)/gi;
    var sceneMatch = sceneParseRegex.exec(originalContent);
    while (sceneMatch != null) {
        var sceneID = sceneMatch[1].trim();

        sceneMap[sceneID] = 1;

        sceneMatch = sceneParseRegex.exec(originalContent);
    }

    return sceneMap;
}

function generateNextSceneId(originalContent : string, parentSceneId : string) {

    let newSceneId = "";

    let sceneMap : any = getSceneNames(originalContent);

    // Trim the parent scene id at the first _
    if(parentSceneId) {
        parentSceneId = parentSceneId.split("_")[0];
    }

    let count = 1;
    newSceneId = parentSceneId + "_" + count;
    while(sceneMap[newSceneId]) {
        count++;
        newSceneId = parentSceneId + "_" + count;
    }

    return newSceneId;
}

export class NewNodeCommand extends UpdateCommand {

    parentSceneId = "";
    say = "";
    reprompt = "";
    then = "";
    show = "";

    constructor(params : any) {
        super(params);
        this.parentSceneId = params.parentSceneId;
    }

    // Parent scene id
    public setParentSceneId(parentSceneId : string) {
        this.parentSceneId = parentSceneId;
    }

    public setSay(say : string) {
        this.say = say;
    }

    public setReprompt(reprompt : string) {
        this.reprompt = reprompt;
    }

    public setThen(then : string) {
        this.then = then;
    }

    public setShow(show : string) {
        this.show = show;
    }

    public apply(originalContent : string, returnValues : any) : string {

        if(!this.sceneId) {
            this.sceneId = generateNextSceneId(originalContent, this.parentSceneId);            
        }

        returnValues.newSceneId = this.sceneId;

        let newContent = originalContent;

        newContent += "\n@" + this.sceneId + "\n";

        if(this.say) {
            newContent += "\t*say\n\t\t" + this.say + "\n\n";
        } else {
            newContent += "\t*say\n\t\t" + "Put say text here" + "\n\n";
        }

        if(this.reprompt) {
            newContent += "\t*reprompt\n\t\t" + this.reprompt + "\n\n";
        }

        if(this.show) {
            newContent += "\t*show\n\t\t" + this.show + "\n\n";
        }

        if(this.then) {
            newContent += "\t*then\n\t\t" + this.then + "\n\n";
        }
        newContent += "\n";

        return newContent;
    }
}

export class DeleteNodeCommand extends UpdateCommand {

    constructor(params : any) {
        super(params);
    }

    public apply(originalContent : string, returnValues : any) : string {

        // Use a "" applyFunction to delete this scene
        let newContents = parseScenesForReplacement(originalContent, this.sceneId, {}, 
            () => {return "";});

        return newContents;
    }
}

export class RemoveReferencesToNodeCommand extends UpdateCommand {

    constructor(params : any) {
        super(params);

        this.applyFunc = this.applyFunc.bind(this);
    }

    applyFunc(originalContents : string, sceneId : string) {

        let newContents = removeReferencesFromScene(originalContents, sceneId, this.sceneId);

        return newContents;
    }

    public apply(originalContent : string, returnValues : any) : string {

        // Remove any hear or goto lines that go to the given scene id, at least in this file that is being updated.

        let newContents = parseScenesForReplacement(originalContent, undefined, {}, this.applyFunc);


        return newContents;
    }
}

export class UpdateSayCommand extends UpdateCommand {

    sayList : string[] = [];

    constructor(params : any) {
        super(params);
    }

    public setSay(say : string) {
        this.sayList = [say];
    }

    public setSayList(sayList : string[]) {
        this.sayList = sayList;
    }

    public apply(originalContent : string, returnValues : any) : string {

        let newContents = parseScenesForReplacement(originalContent, this.sceneId, {sceneId: this.sceneId, params: {say: this.sayList}});

        return newContents;
    }
}

export class UpdateRecapCommand extends UpdateCommand {

    recapList : string[] = [];

    constructor(params : any) {
        super(params);
    }

    public setRecap(recap : string) {
        this.recapList = [recap];
    }

    public setRecapList(recapList : string[]) {
        this.recapList = recapList;
    }

    public apply(originalContent : string, returnValues : any) : string {

        let newContents = parseScenesForReplacement(originalContent, this.sceneId, {sceneId: this.sceneId, params: {recap: this.recapList}});

        return newContents;
    }
}

export class UpdateRepromptCommand extends UpdateCommand {

    repromptList : string[] = [];

    constructor(params : any) {
        super(params);
    }

    public setReprompt(reprompt : string) {
        this.repromptList = [reprompt];
    }

    public setRepromptList(repromptList : string[]) {
        this.repromptList = repromptList;
    }

    public apply(originalContent : string, returnValues : any) : string {

        let newContents = parseScenesForReplacement(originalContent, this.sceneId, {sceneId: this.sceneId, params: {reprompt: this.repromptList}});

        return newContents;
    }
}

export class RenameNodeCommand extends UpdateCommand {

    originalSceneId : string = "";

    constructor(params : any) {
        super(params);

        this.originalSceneId = params.originalSceneId;
    }

    public apply(originalContent : string, returnValues : any) : string {

        // Just rename the scene id, don't change any other contents
        let newContents = parseScenesForReplacement(originalContent, this.originalSceneId, {sceneId: this.sceneId, params: {}});

        return newContents;
    }
}

export class UpdateReferencesToNodeCommand extends UpdateCommand {

    originalSceneId : string = "";

    constructor(params : any) {
        super(params);

        this.applyFunc = this.applyFunc.bind(this);
        this.originalSceneId = params.originalSceneId;
    }

    public setOriginalSceneId(originalSceneId : string) {
        this.originalSceneId = originalSceneId;
    }

    applyFunc(originalContents : string, sceneId : string) {

        let newContents = updateReferencesFromScene(originalContents, sceneId, this.originalSceneId, this.sceneId);

        return newContents;
    }

    public apply(originalContent : string, returnValues : any) : string {

        // Update any hear or goto lines that go to the given scene id and send them to the new scene id.

        let newContents = parseScenesForReplacement(originalContent, undefined, {}, this.applyFunc);


        return newContents;
    }
}

// If no original hear set, then add a new hear. If no hear specified, then delete this hear.
export class UpdateHearCommand extends UpdateCommand {

    original : HearActionMetadata = { hear: "", goto: "", action: ""};
    hear : string = "";
    goto : string = "";
    action : string = "";

    constructor(params : any) {
        super(params);
        this.original.hear = params.originalHear;
        this.original.goto = params.originalGoto;
        this.original.action = params.originalAction;
        this.hear = params.hear;
        this.goto = params.goto;
        this.action = params.action;

        this.applyFunc = this.applyFunc.bind(this);
    }

    applyFunc(originalContents : string, sceneId : string) {
        let newContents = originalContents;

        newContents = updateHear(newContents, sceneId, this.original, this.hear, this.goto, this.action);

        return newContents;
    }

    public apply(originalContent : string, returnValues : any) : string {

        let newContents = parseScenesForReplacement(originalContent, this.sceneId, {}, this.applyFunc);

        return newContents;
    }
}

export class UpdateGotoCommand extends UpdateCommand {

    originalGoto : string = "";
    goto : string = "";
    action : string = "";

    constructor(params : any) {
        super(params);
        this.originalGoto = params.originalGoto;
        this.goto = params.goto;
        this.action = params.action;

        this.applyFunc = this.applyFunc.bind(this);
    }

    applyFunc(originalContents : string, sceneId : string) {
        let newContents = originalContents;

        newContents = updateGoto(newContents, sceneId, this.originalGoto, this.goto, this.action);

        return newContents;
    }

    public apply(originalContent : string, returnValues : any) : string {

        let newContents = parseScenesForReplacement(originalContent, this.sceneId, {}, this.applyFunc);

        return newContents;
    }
}

function parseScenes(this: any, contents: ContentItem[], ignoreSyntaxError: boolean = false): ImportResult {
    let errors: ImportErrorLine[] = [];

    let sceneIDs: {[key:string]: string} = {};

    for (let content of contents) {
        let lineNumber = 0;
        for (let line of content.text.split("\n")) {
            lineNumber++;
            let sceneNameGrabber: RegExp = /^\s*\@\s*([^@]*)/gi;
            let match = sceneNameGrabber.exec(line);
            if (match != null && match.length > 1) {
                let sceneID: string = match[1].trim().toLowerCase();
    
                if (sceneIDs[sceneID]) {
                    const errorResultItem: ImportErrorLine = {
                        lineNumber: lineNumber,
                        errorName: "Duplicate Scene ID",
                        errorMessage: `Scene ID '${sceneID}' has already been used in ${sceneIDs[sceneID]}.`,
                        sourceID: content.id
                    }
                    errors.push(errorResultItem);
                } else {
                    sceneIDs[sceneID] = content.id || "none";
                }
            }

            const bookmarkGrabber = /^[\s]*?bookmark[\s]+?([\S\s]+?)$/gi;
            const bookmarkMatch = bookmarkGrabber.exec(line);
            if (bookmarkMatch != null && bookmarkMatch.length > 1) {
                let bookmarkName: string = bookmarkMatch[1].trim();
    
                sceneIDs[bookmarkName] = content.id || "none";
            }
        }
    }
    
    let result: Scene[] = [];

    for (let content of contents) {
        let text:string = content.text.replace(/\r\n/g, " \n").replace(/\r/g, "\n");

        let sceneParseRegex: RegExp = /(?:(?:\n[ \t]*?)|^)\@[\s]*([^\n]*?)\n([\s\S]+?)(?=\n[\s]*\@|$)/gi;
        let sceneMatch: any = sceneParseRegex.exec(text);

        while (sceneMatch != null) {
            let sceneID: string = sceneMatch[1].replace(/^[ \t]*?\/\/[\s\S]*?$/gm, "").trim();
            let sceneContent: string = sceneMatch[2].replace(/^[ \t]*?\/\/[\s\S]*?$/gm, "");
        
            try {
                let variations: SceneVariation[] = parseContent.call(this, sceneID, sceneContent, sceneIDs, ignoreSyntaxError);
                let locationIndex: number = sceneMatch.index;

                while(text.charAt(locationIndex) != "@") {
                    locationIndex ++;
                }

                const currentScene: Scene = {
                    contents: variations,
                    id: sceneID,
                    customProperties: {
                        sourceLocation: locationIndex
                    }
                }
        
                if (content.id && currentScene.customProperties) {
                    currentScene.customProperties.sourceID = content.id;
                }

                result.push(currentScene);    
    
            } catch (err) {
                const currentScene: Scene = {
                    contents: [],
                    id: sceneID
                }
                result.push(currentScene);    

                let sceneContentLine: number = 1;
                for (let i = 0; i <= sceneMatch.index; i++) {
                    if (text[i] == "\n") {
                        sceneContentLine ++;
                    }
                }
    
                for (let errorItem of err) {

                    let errorResultItem: any = {
                        lineNumber: errorItem.line + sceneContentLine,
                        errorName: "Syntax Error",
                        errorMessage: errorItem.reason,
                    }

                    if (content.id) {
                        errorResultItem.sourceID = content.id;
                    }

                    errors.push(errorResultItem);
                }
            }
    
            sceneMatch = sceneParseRegex.exec(text);
        }
    }

    return {
        importedScenes: result,
        errors: errors
    };
}

function parseContent(this: any, originSceneID: string, contentText: string, availableSceneIDs: {[key:string]: string}, ignoreSyntaxError: boolean): SceneVariation[] {
    const CONTENT_PARSE_REGEX: RegExp = /([ \t]*\*[ \t]*)([^\n]*?)\n([\s\S]+?)(?=\n[\s]*\*|$)/g;

    let contentMatch: any = CONTENT_PARSE_REGEX.exec(contentText);
    let prompts: string = "";
    let recapPrompts: string = "";
    let reprompts: string = "";
    let visualInstruction: any = undefined;
    let sceneDirections: Instruction[] = [];

    while (contentMatch != null) {
        let scenePropertyName: string = contentMatch[2];
        let contentValue: string = contentMatch[3];
    
        switch(scenePropertyName.trim()) {
        case "say": {
            prompts += contentValue.trim();
            break;
        }
        case "reprompt": {
            reprompts += contentValue.trim();
            break;
        }
        case "recap": {
            recapPrompts += contentValue.trim();                
            break;
        }
        case "show": {
            let visualOptions: VisualOptions = {template: this.defaultRenderTemplate};
            for (let showItem of contentValue.trim().split("\n")) {
                let keyValueRegex: RegExp = /^([^:]+?):[\s]*['"]?([\s\S]*?)['"]?[\s]*?$/g
                let keyValuPair: any = keyValueRegex.exec(showItem);
                if (keyValuPair != null && keyValuPair.length == 3) {
                    visualOptions[keyValuPair[1].trim()] = keyValuPair[2].trim();
                } else {
                    // Else look for commands to execute
                    const command = showItem;
                    if(command) {
                        const trimmedCommand = command.trim();

                        if(trimmedCommand) {
                            if(!visualOptions.commands) {
                                visualOptions.commands = [];
                            }
                            visualOptions.commands.push(trimmedCommand);
                        }
                    }
                }
            }

            visualInstruction = new InstructionBuilder().setVisuals(visualOptions).build();    
            break;
        }
        case "then":
        case "do" : {
            try {
                let parsedDirections: Instruction[] = parseInstructions.call(this, contentValue.replace(/\r/g, '').replace(/[\u200B-\u200D\uFEFF]/g, " "), availableSceneIDs, ignoreSyntaxError);
                sceneDirections = sceneDirections.concat(parsedDirections);
            } catch (err) {
                let errors: any[] = [];
                let propertyErrorLine: number = 1;

                for (let i = 0; i <= contentMatch.index; i++) {
                    if (contentText[i] == "\n") {
                        propertyErrorLine ++;
                    }
                }

                for (let errorItem of err) {
                    errors.push({
                        line: errorItem.line + propertyErrorLine,
                        content: errorItem.content,
                        reason: errorItem.reason
                    });
                }

                throw errors;
            }
            break;
        }
        }

        contentMatch = CONTENT_PARSE_REGEX.exec(contentText);
    }

    if (sceneDirections.length === 0 &&  !["global", "global prepend", "global postpend", "global append", "resume", "pause"].includes(originSceneID.trim().toLowerCase())) {
        sceneDirections = sceneDirections.concat(parseInstructions.call(this, ">> end", availableSceneIDs, ignoreSyntaxError));
    }

    if(visualInstruction) {
        sceneDirections = visualInstruction.concat(sceneDirections || []);
    }

    let sceneVariations: SceneVariation[] = [];

    let finalSceneInstructions: InstructionBuilder = new InstructionBuilder();

    if (reprompts && reprompts.trim().length > 0) {
        finalSceneInstructions.setReprompt(reprompts.trim());
    }

    if (recapPrompts && recapPrompts.trim().length > 0) {
        finalSceneInstructions.setRecap(recapPrompts.trim());
    }
    let variation: SceneVariation = {
        narration: prompts,
        sceneDirections: finalSceneInstructions.build()
            .concat(sceneDirections)
    }

    sceneVariations.push(variation);

    return sceneVariations;
}   

function parseInstructions(this: any, sceneDirectionBody: string, availableSceneIDs: {[key:string]: string}, ignoreSyntaxError: boolean): Instruction[] {
    let directionBuilder: InstructionBuilder = new InstructionBuilder();
    let lineNumber: number = 0;
    let errorLines: any[] = [];

    const bracketStack: number[] = [];

    for (let line of sceneDirectionBody.replace(/\r/g, '').split('\n')) {
        lineNumber++;
        let trimmedline: string = line.trim();

        if (trimmedline.length <= 0 || trimmedline.startsWith("//")) {
            continue;
        }

        try {
            interpretDirectionLine(trimmedline, directionBuilder, availableSceneIDs, ignoreSyntaxError, bracketStack, lineNumber);
        } catch (err) {
            errorLines.push({
                line: lineNumber,
                content: err.content,
                reason: err.reason
            });
        }

    };

    if (bracketStack.length > 0) {
        for (let openBracketLine of bracketStack) {
            errorLines.push({
                line: openBracketLine,
                content: "",
                reason: "Missing '}'"
            });
        }
    }

    if (errorLines.length > 0) {
        throw errorLines;
    } else {
        return directionBuilder.build();
    }
}

function interpretDirectionLine (directionLine: string, directionBuilder: InstructionBuilder, availableSceneIDs: {[key:string]: string}, ignoreSyntaxError: boolean, bracketStack: number[], lineNumber: number) {
    let line: string = directionLine.trim();
    let isSyntaxError: boolean = false;
    let sytaxErrorRegex: RegExp | undefined = undefined;
    let errorMessage: string = "";

    let commandStringMatch: any = /^[ \t]*?([\S]+?)( |$)/g.exec(line);
    let arrowStringMatch: any = /^[ \t]*?(->)([ \t]*?|$)/g.exec(line);
    let savengoMatch: any = /^[ \t]*?(<->)([ \t]*?|$)/g.exec(line);
    let terminatorMatch: any = /^[ \t]*?>>[ \t]*?([\S]+?)( |$)/g.exec(line);
    
    if (arrowStringMatch != null) {
        commandStringMatch = arrowStringMatch;
    } else if (savengoMatch != null) {
        commandStringMatch = savengoMatch;
    } else if (terminatorMatch != null) {
        commandStringMatch = terminatorMatch;
    }

    if (line.trim().length == 0) {
    } else if (commandStringMatch == null) {
        isSyntaxError = true;
        errorMessage = `Unrecognized instruction format: ${line}`;
    } else {
        switch(commandStringMatch[1].trim().toLowerCase()) {
        case "hear": {
            let heardSyntax: RegExp = /hear[ \t]+([\s\S]+?)(?=,[\s]*$|\.[\s]*$|[\s]*\{$|[\s]*$)/g;
            let match = heardSyntax.exec(line);
    
            if (!line.match(/\{[ \t]*?$/)) {
                isSyntaxError = true;
                errorMessage = `Missing '{': hear block must start with 'hear [utterances] {'`;
                
                break;
            } else if (!match) {
                isSyntaxError = true;
                sytaxErrorRegex = heardSyntax;
                errorMessage = "missing utterances for 'hear'";
            } else {
                let scrubbedUtterances: string = "";
                for (let utterance of match[1].split(",")) {
                    if (utterance.trim().length == 0) {
                        continue;
                    }

                    if (scrubbedUtterances.length > 0) {
                        scrubbedUtterances += ",";
                    }
    
                    scrubbedUtterances += utterance.trim();
                }
        
                directionBuilder.startChoice(scrubbedUtterances.split(","));
            }
            break;
        }
        case "if": {
            let conditionComponents: string = line.substr(2)
                .replace(/\bis less than or equal to\b/gi, "<=")
                .replace(/\bis smaller than or equal to\b/gi, "<=")
        
                .replace(/\bis greater than or equal to\b/gi, ">=")
                .replace(/\bis larger than or equal to\b/gi, ">=")
                .replace(/\bis bigger than or equal to\b/gi, ">=")
            
                .replace(/\bis larger than\b/gi, ">")
                .replace(/\bis greater than\b/gi, ">")
                .replace(/\bis bigger than\b/gi, ">")
                .replace(/\bis less than\b/gi, "<")
                .replace(/\bis smaller than\b/gi, "<")
        
                .replace(/\band\b/g, "&&")
                .replace(/\bor\b/g, "||")
                .replace(/\bis\b/g, "==")
                .replace(/\bnot\b/g, "!")
                .replace(/,$/g,"")
                .replace(/[\s]+/g, " ");

            if (!conditionComponents.match(/{[\s]*?$/)) {
                isSyntaxError = true;
                errorMessage = `Missing '{': if block must start with 'if [utterances] {'`;

                break;
            }

            conditionComponents = conditionComponents.replace(/{[\s]*?$/g, "")
            let conditionString: string = "";
            
            let findVariableRegex: RegExp = /(?:<|>|\|\||!=|>=|==|===|<=|&&|^)(?:[\(\)!\s]*)(?:([\d]+(?:.[\d]+)?)|([a-zA-Z0-9\_\-\.\s]+?)|('[a-zA-Z0-9\_\-\.\s]+?')|"([a-zA-Z0-9\_\-\.\s]+?)")(?:[\(\)\s]*)(?=<|>|\|\||>=|==|===|!=|<=|&&|,[\s]*$|\.[\s]*$|$)/g;
            
            let conditionStringVerify: string = conditionComponents.trim().replace(findVariableRegex, "");
    
            if (conditionComponents.trim().length === 0) {
                isSyntaxError = true;
                errorMessage = `Your 'if' condition is empty.`;
            } else if (conditionStringVerify.trim().length > 0) {
                isSyntaxError = true;
                errorMessage = `There is a problem with your condition. Erroring word(s): ${conditionStringVerify.trim()}`;
            } else {
                conditionString = conditionComponents.trim().replace(findVariableRegex, function(match: string, p1, p2, p3, p4): string {
                    if (p2 && p2 != "true" && p2 != "false") {
                        return match.replace(p2, `{${p2}}`);
                    } else if (p4) {
                        return `'${p4}'`;
                    } else {
                        return match;
                    }
                });
            
                directionBuilder.startCondition(conditionString);
            } 
            break;       
        }
        case "->": {
            let gotoSyntax: RegExp = /^[ \t]*?->[ \t]*'?([\S\s]+?)'?(?:[ \t]+?\*([\S]+?))?(?=,[\s]*$|\.[\s]*$|[\s]*$)/gim;
            let match: string[] | null = gotoSyntax.exec(line);
            if (!match) {
                isSyntaxError = true;
                sytaxErrorRegex = gotoSyntax;
                errorMessage = `Expected "-> [scene name]", but the scene name was missing.`;
            } else {
                let targetName: string = match[1].trim().toLowerCase();
                if(targetName != 'bookmark' && targetName.match(/{.*?}/g) == null && !availableSceneIDs[targetName] && !availableSceneIDs[match[1].trim()]) {
                    isSyntaxError = true;
                    sytaxErrorRegex = gotoSyntax;
                    errorMessage = `Cannot find the scene name=[${match[1].trim()}] to go to.`;
                } else {
                    let gotoProperty: string = !match[2] || match[2].trim().toLowerCase() == "say" ?
                    "narration": match[2].trim().toLowerCase();
    
                    directionBuilder.goTo(match[1].trim(), gotoProperty);
                }
            }
            break;
        }
        case "<->": {
            let saveNGoSyntax: RegExp = /^[ \t]*?<->[ \t]*([\S\s]+?)(?:[ \t]+?\*([\S]+?))?(?=,[\s]*$|\.[\s]*$|[\s]*$)/gim;
            let match: string[] | null = saveNGoSyntax.exec(line);
    
            if (!match) {
                isSyntaxError = true;
                sytaxErrorRegex = saveNGoSyntax;
                errorMessage = `Expected "<-> [scene name]", but the scene name was missing.`;
            } else {
                let targetName: string = match[1].trim().toLocaleLowerCase();
                if(targetName != 'bookmark' && targetName.match(/{.*?}/g) == null && !availableSceneIDs[targetName]) {
                    isSyntaxError = true;
                    sytaxErrorRegex = saveNGoSyntax;
                    errorMessage = `Cannot find the scene name=[${match[1].trim()}] to go to.`;
                } else {
                    let gotoProperty: string = !match[2] || match[2].trim().toLowerCase() == "say" ?
                    "narration": match[2].trim().toLowerCase();
    
                    directionBuilder.saveAndGoTo(match[1].trim(), gotoProperty);
                }
            }
            break;
        }
        case "return": {
            let returnRegex: RegExp = /^[ \t]*?>>[ \t]*?return[ \t]*?$/gim;
            let match: string[] | null = returnRegex.exec(line);
    
            if (!match) {
                isSyntaxError = true;
                sytaxErrorRegex = returnRegex;
                errorMessage = `Expected ">> return"`;
            } else {
                directionBuilder.return();
            }
            break;
        }
        case "restart": {
            let restartSyntax: RegExp = /^[ \t]*?>>[ \t]*?restart(?=,[\s]*$|\.[\s]*$|[\s]*$)/gim;
            let match: string[] | null = restartSyntax.exec(line);
    
            if (!match) {
                isSyntaxError = true;
                sytaxErrorRegex = restartSyntax;
                errorMessage = `Expected ">> restart"`;
            } else {
                directionBuilder.restart();
            }
            break;
        }
        case "resume": {
            let resumeSyntax: RegExp = /^[ \t]*?>>[ \t]*?resume(?:[\s]+?\*([\S]+?))?(?=,[\s]*$|\.[\s]*$|[\s]*$)/gim;
            let match: string[] | null = resumeSyntax.exec(line);
    
            if (!match) {
                isSyntaxError = true;
                sytaxErrorRegex = resumeSyntax;
                errorMessage = `Expected ">> resume [optional:*scene property]"`;
            } else {
    
                let gotoProperty: string = !match[1] || match[1].trim().toLowerCase() == "say" ?
                    "narration": match[1].trim().toLowerCase();
    
                directionBuilder.goTo("{resume}", gotoProperty);
            }
            break;
        }
        case "repeat": {
            let repeatSyntax: RegExp = /^[ \t]*?>>[ \t]*?repeat(?=,[\s]*$|\.[\s]*$|[\s]*$)/gim;
            let match: string[] | null = repeatSyntax.exec(line);
    
            if (!match) {
                isSyntaxError = true;
                sytaxErrorRegex = repeatSyntax;
                errorMessage = `Expected ">> repeat"`;
            } else {
                directionBuilder.repeat();
            }
            break;
        }
        case "reprompt": {
            let repeatSyntax: RegExp = /^[ \t]*?>>[ \t]*?reprompt(?=,[\s]*$|\.[\s]*$|[\s]*$)/gim;
            let match: string[] | null = repeatSyntax.exec(line);
    
            if (!match) {
                isSyntaxError = true;
                sytaxErrorRegex = repeatSyntax;
                errorMessage = `Expected ">> reprompt"`;
            } else {
                directionBuilder.repeatReprompt();
            }
            break;
        }
        case "back": {
            let backSyntax: RegExp = /^[ \t]*?>>[ \t]*?back(?:[ \t]*?([\d]+?))?(?=,[\s]*$|\.[\s]*$|[\s]*$)/gim;
            let match: string[] | null = backSyntax.exec(line);
    
            if (!match) {
                isSyntaxError = true;
                sytaxErrorRegex = backSyntax;
                errorMessage = `Expected ">> BACK [number to go back (default is 1)]"`;
            } else {
                let backNumber: number = !match[1] ? 1: parseInt(match[1].trim());
                directionBuilder.goBack(backNumber);
            }
            break;
        }
        case "pause": {
            directionBuilder.pause();
            break;
        }
        case "end": {
            directionBuilder.markEnding();
            break;
        }
        case "bgm": {
            let bgmSyntax: RegExp = /bgm[ \t]+'?([\S\s]+?)'?(?=,[\s]*$|\.[\s]*$|[\s]*$)/gm;
            let match: string[] | null = bgmSyntax.exec(line);
    
            if (!match) {   
                isSyntaxError = true;
                sytaxErrorRegex = bgmSyntax;
                errorMessage = `Expected "bgm [file url]", but the file url was missing.`;
            } else {
                directionBuilder.setBackgroundMusic(match[1].trim());
            }
            break;
        }
        case "clear": {
            let clearSyntax: RegExp = /clear[ \t]+?([\S]+?)(?=,[\s]*$|\.[\s]*$|[\s]*$)/gm;
            let match: string[] | null = clearSyntax.exec(line);
    
            if (!match) {
                isSyntaxError = true;
                sytaxErrorRegex = clearSyntax;
                errorMessage = `Expected "clear [variable]"`;
    
            } else {
                directionBuilder.clearVariable(match[1].trim());
            }
            break;
        }
        case "stack": {
            let stackSyntax: RegExp = /stack[ \t]+(?:'([\S\s]+?)'|('')|([\d]+?)|([\S\s]+?))[\s]+?on[\s]+([\S\s]+?)(?=,[\s]*$|\.[\s]*$|[\s]*$)/gm;
            let match: string[] | null = stackSyntax.exec(line);
        
            if (!match) {
                isSyntaxError = true;
                sytaxErrorRegex = stackSyntax;
                errorMessage = `Expected "stack [string|number|variable] on [variable]".`;
            } else {
                if (match[1]) {
                    directionBuilder.addItem(match[4].trim(), match[1].replace(/\\/g, "").trim());
                } else if (match[2]) {
                    directionBuilder.addItem(match[4].trim(), "");
                } else if (match[3]) {
                    directionBuilder.addItem(match[4].trim(), match[3].trim());
                } else {
                    directionBuilder.addItem(match[4].trim(), `{${match[4].trim()}}`);
                }
            }
            break;
        }
        case "pop": {
            let popSyntax: RegExp = /pop[ \t]+([\S\s]+?)(?=,[\s]*$|\.[\s]*$|[\s]*$)/gm;
            let match: string[] | null = popSyntax.exec(line);
    
            if (!match || match[1].trim().length == 0) {
                isSyntaxError = true;
                sytaxErrorRegex = popSyntax;
                errorMessage = `Expected "pop [variable]".`;
            } else {
                directionBuilder.removeLastItem(match[1].trim());
            }
            break;
        }
        case "dequeue": {
            let dequeueSyntax: RegExp = /dequeue[ \t]+([\s\S]+?)(?=,[\s]*$|\.[\s]*$|[\s]*$)/gm;
            let match: string[] | null = dequeueSyntax.exec(line);
    
            if (!match || match[1].trim().length == 0) {
                isSyntaxError = true;
                sytaxErrorRegex = dequeueSyntax;
                errorMessage = `Expected "dequeue [variable]".`;
            } else {
                directionBuilder.removeFirstItem(match[1].trim());
            }
            break;
        }
        case "put": {
            let putSyntax: RegExp = /put[ \t]+(?:'([\S\s]+?)'|('')|([\d]+?)|([\S\s]+?))[ \t]+?into[ \t]+([\S\s]+?)(?=,[\s]*$|\.[\s]*$|[\s]*$)/g;
            let match: string[] | null = putSyntax.exec(line);
    
            if (!match) {
                isSyntaxError = true;
                sytaxErrorRegex = putSyntax;
                errorMessage = `Expected "put [string|number|variable] into [variable]".`;
    
            } else {
                if (match[1]) {
                    directionBuilder.addToInventory(match[4].trim(), match[1].replace(/\\/g, "").trim());
                } else if (match[2]) {
                    directionBuilder.addToInventory(match[4].trim(), "");
                } else if (match[3]) {
                    directionBuilder.addToInventory(match[4].trim(), match[3].trim());
                } else {
                    directionBuilder.addToInventory(match[4].trim(), `{${match[4].trim()}}`);
                }
                }
        }
        case "remove": {
            let removeSyntax: RegExp = /remove[ \t]+(?:'([\S\s]+?)'|('')|([\d]+?)|([\S\s]+?))[\s]+?from[\s]+([\S\s]+?)(?=,[\s]*$|\.[\s]*$|[\s]*$)/g;
            let match: string[] | null = removeSyntax.exec(line);
    
            if (!match) {
                isSyntaxError = true;
                sytaxErrorRegex = removeSyntax;
                errorMessage = `Expected "remove [string|number|variable] from [variable]".`;
            } else {
                if (match[1]) {
                    directionBuilder.removeItem(match[4].trim(), match[1].replace(/\\/g, "").trim());
                } else if (match[2]) {
                    directionBuilder.removeItem(match[4].trim(), "");
                } else if (match[3]) {
                    directionBuilder.removeItem(match[4].trim(), match[3].trim());
                } else {
                    directionBuilder.removeItem(match[4].trim(), `{${match[3].trim()}}`);
                }
            }
            break;
        }
        case "flag": {
            let flagSyntax: RegExp = /flag[ \t]+([\s\S]+?)(?=,[\s]*$|\.[\s]*$|[\s]*$)/g;
            let match: string[] | null = flagSyntax.exec(line);
    
            if (!match || match[1].trim().length == 0) {
                isSyntaxError = true;
                sytaxErrorRegex = flagSyntax;
                errorMessage = `Expected "flag [variable]".`;
            } else {
                directionBuilder.flag(match[1].trim());
            }
            break;
        }
        case "unflag": {
            let unflagSyntax: RegExp = /unflag[ \t]+([\s\S]+?)(?=,[\s]*$|\.[\s]*$|[\s]*$)/g;
            let match: string[] | null = unflagSyntax.exec(line);
    
            if (!match || match[1].trim().length == 0) {
                isSyntaxError = true;
                sytaxErrorRegex = unflagSyntax;
                errorMessage = `Expected "unflag [variable]".`;
            } else {
                directionBuilder.unflag(match[1].trim());
            }
            break;
        } 
        case "slot": {
            let setSyntax: RegExp = /slot[ \t]+([\S\s]+?)[ \t]+?(?:(?:as)|(?:to))[ \t]+(?:'([\S\s]+?)'|('')|([\S\s]+?))(?=,[\s]*$|\.[\s]*$|[\s]*$)/gm;
            let match: string[] | null = setSyntax.exec(line);
            if (!match || match[1].trim().length == 0 || (!match[2] && !match[3] && !match[4] && match[5].trim().length == 0)) {
                isSyntaxError = true;
                sytaxErrorRegex = setSyntax;
                errorMessage = `Expected "set [variable] as [string|number|variable]".`;
            } else {
                if (match[4]) {
                    directionBuilder.setSlot(match[1].trim(), `{${match[4].trim()}}`);
                } else if (match[3]) {
                    directionBuilder.setSlot(match[1].trim(), "");
                } else {
                    directionBuilder.setSlot(match[1].trim(), match[2].replace(/\\/g, "").trim());
                }
            }
            break;
        }
        case "set": {
            let setSyntax: RegExp = /set[ \t]+([\S\s]+?)[ \t]+(?:(?:as)|(?:to))[ \t]+(?:'([\S\s]+?)'|('')|([\d]+?)|([\S\s]+?))(?=,[\s]*$|\.[\s]*$|[\s]*$)/gm;
            let match: string[] | null = setSyntax.exec(line);

            if (!match || match[1].trim().length == 0 || (!match[2] && !match[3] && !match[4] && match[5].trim().length == 0)) {
                isSyntaxError = true;
                sytaxErrorRegex = setSyntax;
                errorMessage = `Expected "set [variable] as [string|number|variable]".`;
            } else {
                if (match[5]) {
                    directionBuilder.setVariable(match[1].trim(), `{${match[5].trim()}}`);
                } else if (match[4]) {
                    directionBuilder.setVariable(match[1].trim(), match[4].trim());
                } else if (match[3]) {
                    directionBuilder.setVariable(match[1].trim(), "");
                } else {
                    directionBuilder.setVariable(match[1].trim(), match[2].replace(/\\/g, "").trim());
                }
            }
            break;
        }
        case "reduce": {
            let reduceSyntax: RegExp = /reduce[ \t]+([\S\s]+?)[ \t]+?by[ \t]+(?:([\d]+?)|([\S\s]+?))(?=,[\s]*$|\.[\s]*$|[\s]*$)/g;
            let match: string[] | null = reduceSyntax.exec(line);
    
            if (!match) {
                isSyntaxError = true;
                sytaxErrorRegex = reduceSyntax;
                errorMessage = `Expected "reduce [variable] as [string|number|variable]".`;
            } else {
                if (match[3]) {
                    directionBuilder.reduceVariable(match[1].trim(), `{${match[3].trim()}}`);
                } else {
                    directionBuilder.reduceVariable(match[1].trim(), match[2].trim());
                }
            }
            break;
        }
        case "increase": {
            let increaseSyntax: RegExp = /increase[ \t]+([\s\S]+?)[ \t]+?by[ \t]+(?:([\d]+?)|([\S\s]+?))(?=,[\s]*$|\.[\s]*$|[\s]*$)/g;
            let match: string[] | null = increaseSyntax.exec(line);
    
            if (!match) {
                isSyntaxError = true;
                sytaxErrorRegex = increaseSyntax;
                errorMessage = `Expected "increase [variable] by [number|variable]".`;
            } else {
                if (match[3]) {
                    directionBuilder.increaseVariable(match[1].trim(), `{${match[3].trim()}}`);
                } else {
                    directionBuilder.increaseVariable(match[1].trim(), match[2].trim())
                }
            }
            break;
        }
        case "decrease": {
            let decreaseSyntax: RegExp = /decrease[ \t]+([\s\S]+?)[ \t]+?by[ \t]+(?:([\d]+?)|([\S\s]+?))(?=,[\s]*$|\.[\s]*$|[\s]*$)/g;
            let match: string[] | null = decreaseSyntax.exec(line);
    
            if (!match) {
                isSyntaxError = true;
                sytaxErrorRegex = decreaseSyntax;
                errorMessage = `Expected "decrease [variable] by [number|variable]".`;
            } else {
                if (match[3]) {
                directionBuilder.reduceVariable(match[1].trim(), `{${match[3].trim()}}`);
                } else {
                    directionBuilder.reduceVariable(match[1].trim(), match[2].trim());
                }
            }
            break;
        }
        case "multiply": {
            let multiplySyntax: RegExp = /multiply[ \t]+([\s\S]+?)[ \t]+?by[ \t]+(?:([\d]+?)|([\S\s]+?))(?=,[\s]*$|\.[\s]*$|[\s]*$)/g;
            let match: string[] | null = multiplySyntax.exec(line);
    
            if (!match) {
                isSyntaxError = true;
                sytaxErrorRegex = multiplySyntax;
                errorMessage = `Expected "multiply [variable] by [number|variable]".`;
            } else {
                if (match[3]) {
                    directionBuilder.multiplyVariable(match[1].trim(), `{${match[3].trim()}}`);
                } else {
                    directionBuilder.multiplyVariable(match[1].trim(), match[2].trim())
                }
            }
            break;
        }
        case "divide": {
            let divideSyntax: RegExp = /divide[ \t]+([\s\S]+?)[ \t]+?by[ \t]+(?:([\d]+?)|([\S\s]+?))(?=,[\s]*$|\.[\s]*$|[\s]*$)/g;
            let match: string[] | null = divideSyntax.exec(line);
    
            if (!match) {
                isSyntaxError = true;
                sytaxErrorRegex = divideSyntax;
                errorMessage = `Expected "divide [variable] by [number|variable]".`;
            } else {
                if (match[3]) {
                    directionBuilder.divideVariable(match[1].trim(), `{${match[3].trim()}}`);
                } else {
                    directionBuilder.divideVariable(match[1].trim(), match[2].trim())
                }
            }
            break;
        }
        case "mod": {
            let modSyntax: RegExp = /mod[ \t]+(.+?)[ \t]+?by[ \t]+(?:([\d]+?)|(.+?))(?=,[\s]*$|\.[\s]*$|[\s]*$)/g;
            let match: string[] | null = modSyntax.exec(line);
    
            if (!match) {
                isSyntaxError = true;
                sytaxErrorRegex = modSyntax;
                errorMessage = `Expected "mod [variable] by [number|variable]".`;
            } else {
                if (match[3]) {
                    directionBuilder.modVariable(match[1].trim(), `{${match[3].trim()}}`);
                } else {
                    directionBuilder.modVariable(match[1].trim(), match[2].trim())
                }
            }
            break;
        }
        case "roll": {
            let rollSyntax: RegExp = /roll[ \t]+([\S\s]+?)(?=,[\s]*$|\.[\s]*$|[\s]*$)/gm;
            let match: string[] | null = rollSyntax.exec(line);
    
            if (!match) {
                isSyntaxError = true;
                sytaxErrorRegex = rollSyntax;
                errorMessage = `Expected "roll [dice roll notation].`;
            } else {
                directionBuilder.rollDice(match[1].trim());
            }
            break;
        }
        case "time": {
            directionBuilder.getCurrentEpochTime();
            break;
        }
        case "bookmark": {
            let bookmarkSyntax: RegExp = /^[ \t]*?bookmark(?:[ \t]+([\S\s]+?)(?:->([\S\s]+?))?)?$/gm;
            let match: any = bookmarkSyntax.exec(line);
    
            if (!match) {
                isSyntaxError = true;
                sytaxErrorRegex = bookmarkSyntax;
            } else {
                let bookmarkName: string = match[1] || 'bookmark';
                let targetName: string = match[2];
    
                if (bookmarkName) {
                    bookmarkName = bookmarkName.trim();
                }
                
                if (targetName) {
                    targetName = targetName.trim();
                }
    
                directionBuilder.setBookmark(bookmarkName, targetName);
            }
            break;
        }
        default: {
            if (line.length > 0 && !line.startsWith("//") && !line.startsWith("}") && !line.startsWith("{") ) {
                let customSyntax: RegExp = /^[ \t]*?([\S]+)(?:[ \t]+([\S\s]+?))?(?=,[\s]*$|\.[\s]*$|[\s]*$)/gm;
                let match: string[] | null = customSyntax.exec(line);
        
                if (!match) {
                    isSyntaxError = true;
                    sytaxErrorRegex = customSyntax;
                } else {
                    let customParam: any = {};
        
                    if (match[2] && match[2].trim().length > 0) {
                        let customParamRegex: RegExp = /([\S]+?)[\t ]*?=[ \t]*(?:'([\S\s]+?)'|('')|([\S]+))/g;
        
                        let customParamMatch: any = customParamRegex.exec(match[2]);
                        while (customParamMatch != null) {
                            if (customParamMatch[3]) {
                                customParam[customParamMatch[1].trim()] = "";
                            } else if (customParamMatch[4]) {
                                customParam[customParamMatch[1].trim()] = `{${customParamMatch[4]}}`;
                            } else {
                                customParam[customParamMatch[1].trim()] = customParamMatch[2].replace(/\\/g, "");
                            }

                            customParamMatch = customParamRegex.exec(match[2]);
                        }
                    }
        
                    directionBuilder.customDirection(match[1].trim(), customParam);
                }
            }
        }
        }
    }
    const lastOpenBracket = bracketStack.length > 0 ? bracketStack[bracketStack.length - 1]: -1;
    const bracketRegex = /[\{\}]/g;
    let bracketMatch = bracketRegex.exec(line);
    while (bracketMatch != null) {
        //console.log(`found bracket in ${lineNumber} with ${line} for match ${JSON.stringify(bracketMatch)}`);
        //console.log(`last open line ${lastOpenBracket}`);
        if (bracketMatch[0] === "{") {
            bracketStack.push(lineNumber);
        } else if (bracketMatch[0] === "}") {
            if (bracketStack.length > 0) {
                const splicingNumber = bracketStack.splice(-1, 1)[0];
                //console.log(`closing out line ${splicingNumber}`)
                if (splicingNumber === lastOpenBracket) {
                    directionBuilder.closeChoice();
                }
            } else {
                isSyntaxError = true;
                errorMessage = "Unexpected bracket closing: '}'";
            }
        }

        bracketMatch = bracketRegex.exec(line);
    }
    
    if (isSyntaxError && !ignoreSyntaxError) {
        throw {
            reason: errorMessage,
            content: line
        }
    }

    return;
}
