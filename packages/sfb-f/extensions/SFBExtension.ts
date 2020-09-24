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

import { StoryAccessor } from '../story/storyAccessor';
import { PlayStage } from '../driver/PlayStage';

import { SFBDriver } from "../driver/driver";

import { SourceContentHelper } from '../importPlugins/sourceContentHelper';
import { StoryMetadataHelper } from '../importPlugins/storyMetadataHelper';
import { UserInputHelper } from '../importPlugins/userInputHelper';

/**
 * Implement ImporterExtension to modify the source content (string),
 * and/or modify the imported content (resulting StoryMetadata).
 */
export interface ImporterExtension {
    /**
     * Called before the import process begins.
     * Implement to modify the raw source content before importing.
     */
    extendSourceContent(sourceHelper: SourceContentHelper): Promise<void>;

    /**
     * Called right after the content has been imported as a StoryMetadata object.
     * Implement to process and modify the imported object.
     */
    extendImportedContent(metadataHelper: StoryMetadataHelper): Promise<void>;
}

/**
 * Parameter interface for DriverExtension
 */
export interface DriverExtensionParameter {
    /**
     * story variable name to variable value mapping. Story variables persisted per user.
     */
    storyState: {[key: string]: any};

    /**
     * instance of a helper class to get / modify prased UserInput object.
     */
    userInputHelper: UserInputHelper;

    /**
     * instance of the driver, currently processing the story.
     */
    driver: SFBDriver;

    /**
     * locale
     */
    locale: string;
}

/**
 * Implement DriverExtension to modify the incoming UserInput or to add to the resulting output.
 */
export interface DriverExtension {
    /**
     * Called right before the driver processes the story.
     */
    pre(param: DriverExtensionParameter): Promise<void>;

    /**
     * Called right after the driver finished processing the story.
     */
    post(param: DriverExtensionParameter): Promise<void>;
}

/**
 * Parameter interface for InstructionExtension.
 */
export interface InstructionExtensionParameter {
    /**
     * name of the custom instruction
     */
    instructionName: string;

    /**
     * parameters provided along with the custom instruction call
     */
    instructionParameters: {[key: string]: string}

    /**
     * variable name to variable value mapping. Story variables are persisted per user.
     */
    storyState: {[key: string]: any};

    /**
     * accessor for imported story metadata
     */
    storyAccessor: StoryAccessor;

    /**
     * Speech, reprompt, audio, and visual properties objects staged so far. Information here is used to respond with.
     */
    playStage: PlayStage;
}

/**
 * Implement InstructionExtensinon to define the behavior of your custom instructions.
 * 
 * Story Driver checks for a public method of this instance matching the name of the custom instruction used in the story.
 * If such a method exists, the driver calls the method with an instance of InstructionExtensionParameter as an argument.
 * 
 * If multiple extensions have a support for a same custom instruction, all methods are executed in the order of extensions added.
 */
export interface InstructionExtension {
}

export function isInstructionExtension(extension: InstructionExtension | DriverExtension | ImporterExtension ): extension is InstructionExtension {
    return true; // Since "InstructionExtension" doesn't have required methods, any object is "technically" an InstructionExtension
}

export function isDriverExtension(extension: InstructionExtension | DriverExtension | ImporterExtension ): extension is DriverExtension {
    return (<DriverExtension>extension).pre !== undefined;
}

export function isImporterExtension(extension: InstructionExtension | DriverExtension | ImporterExtension): extension is ImporterExtension {
    return (<ImporterExtension>extension).extendImportedContent !== undefined;
}

export { GlobalDirectionsExtension } from './coreExtensions/GlobalDirectionsExtension';
export { LocalizationExtension } from './coreExtensions/LocalizationExtension';
export { SnippetExtension } from './coreExtensions/SnippetExtension';
export { VoiceOverExtension } from './coreExtensions/VoiceOverExtension';
