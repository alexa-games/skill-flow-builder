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

/**
 * abc-importer
 * 
 * Imports and exports between various branched content formats and the Alexa Branching Content (ABC) format.
 */

import { DefaultFormatImportPlugin } from '../importPlugins/DefaultFormatImportPlugin';
import { AlexaABCVerifier } from "../verificationHandlers/alexa-abc-verifier";
import { ImportResult, ImportErrorLine, ImportError } from "./importerEntity";
import { ABCImportPlugin } from './../importPlugins/importerPlugin';
import { ABCExporter } from './../exportHandlers/exporter';
import { StoryMetadata, InstructionType } from './../story/storyMetadata';
import { VoiceModel } from '../bakeUtilities/languageModel';
import { ModelBuilder, AlexaVoiceModelBuilder } from '../bakeUtilities/VoiceModelBuilder';
import { BUILT_IN_INTENT_UTTERANCES as builtInIntents } from '../bakeUtilities/BuiltInIntents';
import { DriverExtension, ImporterExtension, InstructionExtension, isImporterExtension } from "../extensions/SFBExtension";
import { StoryMetadataHelper } from "../importPlugins/storyMetadataHelper";
import { SourceContentHelper } from "../importPlugins/sourceContentHelper";

import { readUtf8FileExcludingBomSync } from '@alexa-games/sfb-util';

import * as fs from "fs";

export interface ContentItem {
    id?: string,
    text: string
}

export interface ImportOption {
	/**
	 * raw string of content to import.
	 */
	content?: string;
	/**
	 * list of contents to import as one story.
	 */
	contents?: ContentItem[];
	/**
	 * content format version. default is 1
	 */
	version?: number;
	/**
	 * importing locale
	 */
	locale?: string;
	/**
	 * if true, the import does not throw on import error.
	 */
	ignoreSyntaxError?: boolean;
	modelBuilder?: ModelBuilder;
	/**
	 * Base Alexa interaction model. If provided the importer will try to match the utterances in the story to this model.
	 */
	baseModel?: {
	    interactionModel: VoiceModel;
	};
	invocationName?: string;
	customSlots?: {[key: string]: string[]};
}


export class SFBImporter
{	
	static readonly fallBackEnabledLocales = [
		"en",
		"de-DE"
	];

	importHandlersByType : {[key: string] : ABCImportPlugin} = {};
	
	exportHandlersByType : {[key: string] : ABCExporter} = {};

	importExtensions: (DriverExtension|ImporterExtension|InstructionExtension)[] = [];

	verifier : AlexaABCVerifier = new AlexaABCVerifier();

	// Constructor
	public constructor(customImporters?: ABCImportPlugin[], customerExporters?: {[key: string]: ABCExporter}, extensions?: (DriverExtension|ImporterExtension|InstructionExtension)[]) {
		let importPlugins: ABCImportPlugin[] = [
			new DefaultFormatImportPlugin()
		];
		
		if (customImporters) {
			importPlugins = importPlugins.concat(customImporters);
		}

		for (const importPlug of importPlugins) {
			this.importHandlersByType[importPlug.pluginName] = importPlug;
		}

		if (customerExporters) {
			Object.assign(this.exportHandlersByType, customerExporters);
		}

		if(extensions) {
			this.importExtensions = extensions;
		}
	}
	
	public async importABCStory(format : string, filename : string, storyTitle: string, storyID: string, autoIntentGrouping?: boolean, param: ImportOption = {}): Promise<StoryMetadata> {
		let contents: ContentItem[] = [];

		if (param.content) {
			contents.push({
				id: "default",
				text: param.content
			});
		} else if (param.contents) {
			contents = param.contents;
		} else {
			contents.push({
				id: filename,
				text: readUtf8FileExcludingBomSync(filename)
			});
		}
		

		for (const extension of this.importExtensions) {
			if (isImporterExtension(extension)) {
				const sourceHelper = new SourceContentHelper(contents);
				await extension.extendSourceContent(sourceHelper);
				param.contents = sourceHelper.getAllSourceContents();
			}
		}

		const importHandler : ABCImportPlugin = this.importHandlersByType[format];

		const contentVersion: number = param.version || 1;
		const optimalVersion = importHandler.getVersion();
		if (optimalVersion < contentVersion) {
			throw new Error(`Unsupported Language Version: Importer expected content version ${optimalVersion}, but detected version ${contentVersion}.`);
		}

		const thisObj = this;
		const importResult: ImportResult = await importHandler.importData(contents, param);
		const importedScenes = importResult.importedScenes;
		const importErrors = importResult.errors || [];

		let jsonObjOutput: StoryMetadata = {
			pluginName: importHandler.pluginName,
			scenes: importedScenes,
			storyID: storyID,
			storyTitle: storyTitle
		}

		for (const extension of this.importExtensions) {
			try {
				if (isImporterExtension(extension)) {
					const metadataHelper = new StoryMetadataHelper(jsonObjOutput);
					await extension.extendImportedContent(metadataHelper);
					jsonObjOutput = await metadataHelper.getStoryMetadata();
				}
			} catch (err) {
				const extensionError: ImportErrorLine = {
					lineNumber: 0,						
					errorMessage: err,
					errorName: `Import Extension Error on ${extension.constructor.name}`
				};

				importErrors.push(extensionError);
			}
		}
		
		if (!param.ignoreSyntaxError) {
			const finalError = await thisObj.verifier.verify(jsonObjOutput);
			finalError.forEach((errorItem) => {
				importErrors.push(errorItem);
			});
		}

		try {
			let modelBuilder: ModelBuilder;
			if (param.modelBuilder) {
				modelBuilder = param.modelBuilder;
			} else {
				modelBuilder = new AlexaVoiceModelBuilder();
			}
			
			const locale = param.locale || "en-US";
			const language: string = locale.split("-")[0];
			const storyHelper = new StoryMetadataHelper(jsonObjOutput);
			const localizedBuiltIn = builtInIntents[locale] || builtInIntents[language];

			if (SFBImporter.fallBackEnabledLocales.includes(locale) || SFBImporter.fallBackEnabledLocales.includes(language)) {
				localizedBuiltIn["AMAZON.FallbackIntent"] = [];
			}

			const voiceModel = modelBuilder.build({
				customSlots: Object.assign(param.customSlots || {}),
				builtInIntents: localizedBuiltIn,
				invocationName: jsonObjOutput.storyTitle,
				story: storyHelper,
				locale: locale,
				baseVoiceModel: param.baseModel ? param.baseModel.interactionModel : undefined
			});

			const finalStoryMetadata = await storyHelper.getStoryMetadata();
			if (autoIntentGrouping) {
				finalStoryMetadata.alexaVoiceModel = voiceModel;	
			} else {
				let allUtterances: any = {};

				for (let scene of finalStoryMetadata.scenes) {
					for (let content of scene.contents) {
						if (content.sceneDirections) {
							for (let direction of content.sceneDirections) {
								if (direction.directionType == InstructionType.CHOICE) {
									allUtterances[direction.parameters.utterances] = 1;
								}
							}
						}
					}
				}

				finalStoryMetadata.alexaVoiceModel = Object.keys(allUtterances);	
			}

			jsonObjOutput = finalStoryMetadata;
		} catch(err) {
			if (err instanceof Error) {
				importErrors.push({
					errorName: "VoiceModelBuildError",
					lineNumber: 0,
					errorMessage: err.message + "\n" + err.stack
				});
			} else {
				importErrors.push({
					errorName: "VoiceModelBuildError",
					lineNumber: 0,
					errorMessage: err
				});
			}
			
		}

		if (importErrors && importErrors.length > 0) {
			throw ({
				errorItems: importErrors,
				importedData: jsonObjOutput
			} as ImportError);
		} else {
			return jsonObjOutput;
		}
	}

	public exportTo(format : string, filename : string, outputFilename : string) {

		const fileData = readUtf8FileExcludingBomSync(filename);

		const jsonInputObj = JSON.parse(fileData);

		const exportHandler : ABCExporter = this.exportHandlersByType[format];

		console.log(this.exportHandlersByType);

		exportHandler.exportData(jsonInputObj, function(outputData : {}) {

			console.log("Output Data:");
			console.log(outputData);
		
			fs.writeFileSync(outputFilename, outputData);
		});
	}
}
