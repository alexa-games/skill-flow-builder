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

/* 
    ABC Importer script 
*/
import * as fs from 'fs';
import * as path from 'path';

import {
    SFBImporter,
    ABCImportPlugin
} from '@alexa-games/sfb-f';

import { readUtf8FileExcludingBomSync } from '@alexa-games/sfb-util';

import { SpecialPaths, ABC_CONFIG_FILE, PACKAGE_MANIFEST_FILE } from './specialPaths';
import { ConfigAccessor, CoreExtensionLoader } from '@alexa-games/sfb-skill';
import { Utilities } from './utilities';
import { Logger } from './logger';
import { StdOutput } from './stdOutput';
import { FileUtils } from './fileUtils';
import { Command } from './command';
import { ManifestUtils, PackageMetadata } from './manifestUtils';
import semver from 'semver';

interface ContentItem {
    id: string,
    text: string
}

/**
 * Converts user's story to a runnable format.
 * Reads: Source path
 * Writes: Output path
 * Depends on: <nothing>
 */
export class ImportCommand implements Command {

    constructor(
        private readonly storyPath: string,
        private readonly enforceLatest: boolean,
        private readonly logger: Logger,
        private readonly stdOutput: StdOutput) {
    }

    public async run() {
        this.logger.status('Importing content...')

        if (!fs.existsSync(this.storyPath)) {
            throw new Error(`${this.storyPath}: The specified story path does not exist.`);
        }

        const dirs = new SpecialPaths(this.storyPath);
        const config = await ConfigAccessor.loadConfigFile(dirs.abcConfig, dirs.builtResourcesPath);

        await this.versionChecks(dirs);

        await this.copyAbcConfig(dirs);

        await this.compileCode(dirs, config.getValue("sfbLocalTesting", undefined, "en-US"));

        for (const locale of config.publishLocales) {
            await this.importResourceFiles(locale, dirs, config.validResourceFileExtensions);
            await this.importAdditionalDirectories(locale, dirs, config.additionalResourceDirectories);

            try {
                await this.importStory(locale, dirs, config);
            } catch (err) {
                if (!ImportCommand.isImportError(err)) {
                    throw err;
                }
                const count = this.reportErrors(err);
                throw new Error(`Found ${count} import errors.`);
            }
        }

        await this.copyGeneratedResources(dirs);

        this.logger.success('Content imported.');
    }

    private async versionChecks(dirs: SpecialPaths) {
        
        const toolingMetadata = ManifestUtils.readRawPackageNameVersion();

        await this.checkOnlineForNewerTooling(toolingMetadata);

        const storyCodeManifestPath = path.join(dirs.codePath, PACKAGE_MANIFEST_FILE);
        const storyCodeManifest = FileUtils.loadJson(storyCodeManifestPath);

        ManifestUtils.checkDeploymentPackageVersionWithTooling(storyCodeManifest, toolingMetadata, this.logger);
    }

    private async checkOnlineForNewerTooling(toolingMetadata: PackageMetadata) {
        // see if the running version is older than what is published

        let publishedVersion = '0.0.0';
        
        try 
        {
            publishedVersion = await ManifestUtils.getLatestsMajorVersionFromNpm(
                toolingMetadata,
                this.stdOutput);

            if (!publishedVersion || publishedVersion === '') {
                this.logger.warning(`SFB version check skipped. Unable to determine the latest version of ${toolingMetadata.name}.`);
                return;
            }
        } catch (e) {
            this.logger.warning(`SFB version check skipped. Error communicating with NPM.`);
            this.logger.warning(e);
            return;
        }

        if (semver.lt(toolingMetadata.version, publishedVersion)) {
            const message = `Current version Skill Flow Builder ${toolingMetadata.version} is behind latest available ${publishedVersion}.`;
            if (this.enforceLatest) {
                throw new Error(message);
            }
            
            this.logger.warning(message);
        }
    }

    private async compileCode(dirs: SpecialPaths, isLocalTest: boolean) {
        this.logger.status('Compiling TypeScript code...');

        if (isLocalTest) {
            await Utilities.runCommandInDirectoryAsync(
                Utilities.npxBin,
                [Utilities.yarnBin, 'install'],
                dirs.codePath,
                this.stdOutput,
                {shell: true});
            await Utilities.runCommandInDirectoryAsync(
                Utilities.yarnBin,
                ['compile'],
                dirs.codePath,
                this.stdOutput,
                {shell: true});
        } else {
            await Utilities.runCommandInDirectoryAsync(
                Utilities.npmBin,
                [ 'install'],
                dirs.codePath,
                this.stdOutput,
                {shell: true});
            await Utilities.runCommandInDirectoryAsync(
                Utilities.npmBin,
                [ 'run', 'compile'],
                dirs.codePath,
                this.stdOutput,
                {shell: true}); 
        }
        
        this.logger.success('Compile step completed.');
    }

    private async copyAbcConfig(dirs: SpecialPaths) {
        const configFileDeployPath = path.join(dirs.buildOutputPath, 'abcConfig');
        FileUtils.makeDir(configFileDeployPath);

        await FileUtils.copyFile(dirs.abcConfig, path.join(configFileDeployPath, ABC_CONFIG_FILE));
    }

    /**
     * Logs error and returns a count of the number of errors found.
     * @param err Error object that follows the SFB-F error format
     */
    private reportErrors(err: any): number {
        if (err instanceof Array) {
           for (let i = 0; i < err.length; i++) {
               this.reportErrors(err[i]);
           }

           return err.length;
        } else {
            const message = `${err.errorName}: ${err.errorMessage}`;
            if (err.sourceID) {
                this.logger.failure(`${err.sourceID}:${err.lineNumber} - ${message}`);
            } else {
                this.logger.failure(`Line ${err.lineNumber} - ${message}`);
            }

            return 1;
        }
    }

    private static isImportError(err: any) {
        if (err instanceof Array) {
            if (err.length > 0) {
                return ImportCommand.isImportErrorObject(err[0]);
            }
        }

        return ImportCommand.isImportErrorObject(err);
    }

    private static isImportErrorObject(err?: any) {
        return err && 'lineNumber' in err && 'errorName' in err && 'errorMessage' in err;
    }

    private async copyGeneratedResources(dirs: SpecialPaths) {
        const contentPath = dirs.contentPath;
        const languageStringsFile = path.join(dirs.builtResourcesPath, 'languageStrings.json');

        await FileUtils.recursiveCopy(languageStringsFile, contentPath);
    }

    private async importStory(locale: string, dirs: SpecialPaths, config: ConfigAccessor): Promise<void> {
        this.logger.status(`Importing locale ${locale}...`)

        // Config values
        const contentPath = dirs.contentPath;
        const resourcePath = dirs.getResourcePath(locale);
        const localeBuiltResourcesPath = dirs.getLocaleBuiltResourcesPath(locale);

        const bakedFilePath = path.join(localeBuiltResourcesPath, config.getValue("abc-baked-filename", undefined, locale));  
        const recordingScriptFilePath = path.join(localeBuiltResourcesPath, config.getValue("abc-recording-script-filename", undefined, locale));  

        const storyTitle = config.getValue("story-title", undefined, locale);
        const storyId = config.getValue("story-id", undefined, locale);
        const invocationName = config.getValue("skill-invocation-name", undefined, locale).toLowerCase();

        const customSlotTypeFilePath = path.join(resourcePath, 
            config.getValue("custom-slottype-filename", undefined, locale));

        const manifestFilePath = path.join(contentPath, "MANIFEST.json");

        let storyManifest: any = {};
        if (fs.existsSync(manifestFilePath)) {
            storyManifest = FileUtils.loadJson(manifestFilePath);
        } else {
            throw new Error(`${manifestFilePath} does not exist.`);
        }

        const combinedContent: ContentItem[] = await this.getCombinedStoryContentFromManifest(
            storyManifest, 
            contentPath);

        /**
         * Build Configurations
         */
        const DEFAULT_IMPORT_PLUGIN_NAME: string = "default";

        let extensionLoader = new CoreExtensionLoader(locale, config, {
            contentSource: dirs.contentPath
        });
        
        const extensionLoaderModule = require(dirs.extensionLoaderPath);

        const customExtensions = new extensionLoaderModule.ExtensionLoader({
            locale: locale,
            configAccessor: config
        });

        let customStoryExtensions = customExtensions.getExtensions().concat(extensionLoader.getImportExtensions());

        let customImportPlugins: ABCImportPlugin[] = [];

        let importer = new SFBImporter(customImportPlugins, undefined, customStoryExtensions);

        let customSlots: any = {};
        if (!fs.existsSync(customSlotTypeFilePath)) {
            this.logger.warning(`[Import WARN] Custom Slot config '${customSlotTypeFilePath}' cannot be found.`);
        } else {
            customSlots = FileUtils.loadJson(customSlotTypeFilePath);
        }

        try {
            let importedStory = await importer.importABCStory(DEFAULT_IMPORT_PLUGIN_NAME, "", storyTitle, storyId, true, {
                customSlots: customSlots,
                contents: combinedContent,
                version: storyManifest.version || 1,
                locale: locale
            });

            importedStory.alexaVoiceModel.languageModel.invocationName = invocationName;

            FileUtils.makeDir(localeBuiltResourcesPath)

            let recordingScript: string = extensionLoader.voiceOverExtension.getRecordingScript();
            if (recordingScript && recordingScript.length > 0) {
                fs.writeFileSync(recordingScriptFilePath, recordingScript);    
            }

            let languageString: any = extensionLoader.localizationExtension.getLocalizedStringsObject();

            if (languageString && Object.keys(languageString).length > 0) {
                const languageStringsFile = path.join(dirs.builtResourcesPath, 'languageStrings.json');
                const languageStringsSourceFile = path.join(dirs.contentPath, 'languageStrings.json');

                fs.writeFileSync(languageStringsFile, JSON.stringify(languageString, null, 4));
                fs.writeFileSync(languageStringsSourceFile, JSON.stringify(languageString, null, 4));
            }

            fs.writeFileSync(bakedFilePath, JSON.stringify(importedStory, null, 4));    

            // Write voice model as well to a separate file
            fs.writeFileSync(FileUtils.fixpath(`${localeBuiltResourcesPath}/${locale}.json`), JSON.stringify({
                "interactionModel": importedStory['alexaVoiceModel'] }, null, 4));


            this.logger.status(`Importing of ${locale} completed.`)
        } catch (err) {
            if (err.errorItems) {
                throw err.errorItems;
            } else {
                throw err;
            }
        }
    }  

    private getCombinedStoryContentFromManifest(manifest: any, srcDirectoryPath: string) {
        const stories: string[] = manifest.include;
        const pathToRegex: {[key: string]: string} = {};

        for (const storyRegex of stories) {
            const extractFileRegex: RegExp = /([\S]+\/)?([^\/]+?)$/g;
            const matchedPath: any = extractFileRegex.exec(storyRegex);

            if (matchedPath != null) {
                const postDir: string = matchedPath[1]? `/${matchedPath[1]}`: "";
                if (!pathToRegex[`${srcDirectoryPath}${postDir}`]) {
                    pathToRegex[`${srcDirectoryPath}${postDir}`] = "";
                } else {
                    pathToRegex[`${srcDirectoryPath}${postDir}`] += "|"
                }

                pathToRegex[`${srcDirectoryPath}${postDir}`] += `(?:^${matchedPath[2].replace(/\./g, "\\.").replace(/\*/g, ".*")}$)`;
            }
        }

        const combinedStoryContent: ContentItem[] = [];

        for (const searchDirectory of Object.keys(pathToRegex)) {
            const files: string[] = fs.readdirSync(searchDirectory);
            if (!files) {
                throw new Error(`[Import ERROR] Cannot find story content files: ${JSON.stringify(stories, null, 4)}`);
            }
        
            for (var i = 0; i < files.length; i++) {
                const file: string = files[i];
                if (file.match(pathToRegex[searchDirectory])) {
                    combinedStoryContent.push({
                        id: path.join(path.relative(srcDirectoryPath, searchDirectory), file),
                        text: readUtf8FileExcludingBomSync(path.join(searchDirectory, file))
                    });
                }
            }
        }

        return combinedStoryContent;
    }

    // Copy over any additional directories requested to be included
    private async importAdditionalDirectories(locale: string, dirs: SpecialPaths, directories: string[]) {

        const resourceFolder = dirs.getResourcePath(locale);
        const localeBuildOutputPath = dirs.getLocaleBuiltResourcesPath(locale);

        for(let dir of directories) {
            await FileUtils.recursiveCopy(path.join(resourceFolder, dir), localeBuildOutputPath);
        }
    }

    private async importResourceFiles(locale: string, dirs: SpecialPaths, extensions: string[]) {
        const resourceFolder = dirs.getResourcePath(locale);
        const localeBuildOutputPath = dirs.getLocaleBuiltResourcesPath(locale);

        // Support multiple extensions
        for(let ext of extensions) {
            await FileUtils.recursiveCopy(`${resourceFolder}/*.${ext}`, localeBuildOutputPath);
        }
    }
}
