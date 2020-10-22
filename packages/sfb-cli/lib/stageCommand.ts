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

import {
    SpecialPaths,
    ConfigPaths,
    PACKAGE_MANIFEST_FILE,
    SKILL_MANIFEST_FILE,
    CLOUDFORMATION_TEMPLATE,
} from './specialPaths';
import { Utilities } from './utilities';
import { Logger } from './logger';
import { StdOutput } from './stdOutput';
import { FileUtils } from './fileUtils';
import { ConfigAccessor } from '@alexa-games/sfb-skill';
import { Command } from './command';
import * as fs from 'fs';
import * as pathModule from 'path';
import { EOL } from 'os';

const ASK_DEPLOYER_LAMBDA = "lambda";
const ASK_DEPLOYER_CFN = "cfn";

const SFB_STORY_ID_PLACEHOLDER = "SFB-STORY-ID";
const SFB_ENV_VAR_PLACEHOLDER = "SFB-ENVIRONMENT-VARIABLES"

const SKIP_FFMPEG_COPY_PROPERTY = "skipFFMPEGInclude";
const SKILL_FFMPEG_LOCATION_PROPERTY = "ffmpeg-location-for-skill";

/**
 * Gathers all files to the deployment folder.
 * Reads: Output path
 * Writes: Deploy path
 * Depends on: ImportCommand
 */

export class StageCommand implements Command {

    private readonly stage: string | undefined;
    private readonly locale: string | undefined;

    constructor(
        private readonly storyPath: string,
        private readonly deployer: string,
        private readonly logger: Logger,
        private readonly stdOutput: StdOutput) {
        if (this.isInvalidDeployer()) {
            throw new Error(`Invalid deployer: '${this.deployer}'`);
        }

        if(process.env['stage']) {
            this.stage = process.env['stage'];
        }
        if(process.env['locale']) {
            this.locale = process.env['locale'];
        }
    }

    public async run() {

        const specialDirectories = new SpecialPaths(this.storyPath);
        if (!fs.existsSync(specialDirectories.storyPath)) {
            throw new Error('Cannot find path ' + specialDirectories.storyPath);
        }
        const configHelper = await ConfigAccessor.loadConfigFile(specialDirectories.abcConfig, specialDirectories.builtResourcesPath);
        const configDirs = specialDirectories.getConfigDirectories(configHelper);

        await this.makeAskPayload(specialDirectories, configDirs, configHelper);

        await this.copyOverAskSkillFiles(specialDirectories, configDirs, configHelper.publishLocales, configHelper)

        await this.modifySkillManifest(specialDirectories, configDirs, configHelper.publishLocales);

        await this.preserveSkillManifest(specialDirectories, configDirs);
    }

    private isInvalidDeployer() {
        return this.deployer && this.deployer !== ASK_DEPLOYER_LAMBDA && this.deployer !== ASK_DEPLOYER_CFN;
    }

    /**
     * Since we modify the skill manifest during build, we copy it back into
     * the SFB metadata directory, so that the user can see what was modified.
     * This way, the user knows what SFB does under the hood.
     */
    private async preserveSkillManifest(dirs: SpecialPaths, configDirs: ConfigPaths) {
        // skill.json
        await Utilities.copyIfPresent(
            SpecialPaths.getStagedSkillManifestFilePath(configDirs),
            pathModule.join(dirs.metaDataStoragePath, SKILL_MANIFEST_FILE),
        );
    }

    /**
     * Use ASK to create the file structure for a skill using one of their templates.
     */
    private async makeAskPayload(dirs: SpecialPaths, configDirs: ConfigPaths, configHelper: ConfigAccessor) {
        this.logger.status('Staging deployment folder layout with ASK template...');

        const isCloudFormationDeployer = await this.isCloudFormationDeployer(dirs);

        try {
            const storedCloudFormationFile = pathModule.join(dirs.metaDataStoragePath, CLOUDFORMATION_TEMPLATE);
            if (isCloudFormationDeployer && !fs.existsSync(storedCloudFormationFile)) {
                this.logger.status('Copying recommended setup into CloudFormation template...');
                await Utilities.copyIfPresent(
                    pathModule.join(dirs.sfbRootPath, CLOUDFORMATION_TEMPLATE),
                    storedCloudFormationFile,
                );
                const storyId = configHelper.getValue("story-id", this.stage, this.locale);
                await FileUtils.replaceInFile(storedCloudFormationFile, new RegExp(SFB_STORY_ID_PLACEHOLDER, 'g'), storyId);
                await FileUtils.replaceInFile(storedCloudFormationFile, new RegExp(SFB_ENV_VAR_PLACEHOLDER, 'g'), this.getEnvironmentVariables());
            }

            if (fs.existsSync(configDirs.askSkillFullPath)) {
                this.logger.status(`${configDirs.askSkillFullPath}: The skill folder already exists, skipping creation.`);
                this.logger.success('Deployment folder layout was staged with ASK template.');
                return;
            }

            FileUtils.makeDir(dirs.deployPath);

            const askTemplateUrl = 'https://github.com/alexa/skill-sample-nodejs-hello-world.git';
            const askTemplateBranch = 'ask-cli-x';

            const askProfileName = configHelper.getValue("ask-profile-name");

            if (configDirs.askSkillDirectoryName.match(/[^a-zA-Z0-9-]/)) {
                throw Error('Skill directory name can only contain letters, numbers, and hyphen');
            }

            await Utilities.runAskCommandInDirectoryAsync(
                [ 'new', '--profile', askProfileName, '--template-url', askTemplateUrl, '--template-branch', askTemplateBranch ],
                dirs.deployPath,
                this.stdOutput,
                {shell: true},
                // ASK CLI v2 prompts for user input, so we auto-respond.
                [
                    isCloudFormationDeployer ? '2' : '3', // Infrastructure type
                    configDirs.askSkillDirectoryName, // Skill name
                    configDirs.askSkillDirectoryName, // Directory name
                ],
            );

            if (fs.existsSync(SpecialPaths.getLambdaCodeDeployPath(configDirs))) {
                await FileUtils.deleteDir(SpecialPaths.getLambdaCodeDeployPath(configDirs), this.stdOutput);
            }
        } finally {
            // ask setups git for the new project folder.  We don't want this since the folder is
            // temporary.
            await FileUtils.deleteDir(`${configDirs.askSkillFullPath}/.git`, this.stdOutput);

        }

        this.logger.success('Deployment folder layout was staged with ASK template.');
    }

    private async isCloudFormationDeployer(dirs: SpecialPaths): Promise<boolean> {
        // Case: Project has been built before, so we know which deployer to use.

        const skillManifestFilePath = pathModule.join(dirs.metaDataStoragePath, SKILL_MANIFEST_FILE);
        if (fs.existsSync(skillManifestFilePath)) {
            const cloudFormationFilePath = pathModule.join(dirs.metaDataStoragePath, CLOUDFORMATION_TEMPLATE);
            const cloudFormationFileExists = fs.existsSync(cloudFormationFilePath);

            // Check that user did not choose an incompatible deployer
            if (this.deployer) {
                let previousDifferentDeployer;
                if (cloudFormationFileExists && this.deployer !== ASK_DEPLOYER_CFN) {
                    previousDifferentDeployer = ASK_DEPLOYER_CFN;
                }
                else if (!cloudFormationFileExists && this.deployer !== ASK_DEPLOYER_LAMBDA) {
                    previousDifferentDeployer = ASK_DEPLOYER_LAMBDA;
                }
                if (previousDifferentDeployer) {
                    throw new Error(`Invalid ASK deployer chosen: '${this.deployer}'. Skill was previously deployed with '${previousDifferentDeployer}'`);
                }
            }

            return cloudFormationFileExists;
        }

        // Case: Project has never been built before, default to CloudFormation unless user overrides with parameter
        return (this.deployer !== ASK_DEPLOYER_LAMBDA);
    }

    private getEnvironmentVariables(): string {
        if (!this.stage) {
            return '';
        }

        let environmentVariables = '';
        environmentVariables += '      Environment:' + EOL;
        environmentVariables += '        Variables:' + EOL;
        environmentVariables += '          stage: ' + this.stage + EOL;
        return environmentVariables;
    }

    private async copyOverAskSkillFiles(dirs: SpecialPaths, configDirs: ConfigPaths, publishLocales: string[], configHelper: ConfigAccessor) {
        this.logger.status('Copying over story specific files...');

        this.logger.status('Copying build output files...');
        const lambdaCodeDeployPath = SpecialPaths.getLambdaCodeDeployPath(configDirs);

        await FileUtils.recursiveCopy(pathModule.join(dirs.buildOutputPath, '*'), lambdaCodeDeployPath, { makeDestinationWritable: true });

        await FileUtils.recursiveCopy(pathModule.join(dirs.codeBuildOutputPath, '*'), lambdaCodeDeployPath, { makeDestinationWritable: true });

        await this.setupNodeModulesUsingInstallProduction(dirs, lambdaCodeDeployPath, configHelper.getValue("sfbLocalTesting", undefined, "en-US"));

        if(!configHelper.getValue(SKIP_FFMPEG_COPY_PROPERTY, undefined, "en-US")) {
            let srcFFmpegPath = configHelper.getValue(SKILL_FFMPEG_LOCATION_PROPERTY, undefined, "en-US");
            if (!srcFFmpegPath || typeof srcFFmpegPath !== 'string') {
                srcFFmpegPath = pathModule.join(dirs.codePath, 'ffmpeg');
                if (!fs.existsSync(srcFFmpegPath)) {
                    srcFFmpegPath = pathModule.join(dirs.sfbRootPath, 'ffmpeg');
                }
            }
            
            if (fs.existsSync(srcFFmpegPath)) {
                this.logger.status('Copying ffmpeg...');
                await FileUtils.copyFile(srcFFmpegPath,
                        pathModule.join(SpecialPaths.getLambdaCodeDeployPath(configDirs), 'ffmpeg'));
            } else {
                this.logger.status(`FFmpeg not found in sfb-cli package, given story's code directory, or '${SKILL_FFMPEG_LOCATION_PROPERTY}' property in abcConfig.json, skipping copy.`);
            }
        }

        const modelsDeployPath = SpecialPaths.getModelsDeployPath(configDirs);
        let failure = false;
        for (let locale of publishLocales) {
            this.logger.status(`Copying model for ${locale} to deployment path.`);

            const modelOutput = pathModule.join(dirs.getLocaleBuiltResourcesPath(locale), `${locale}.json`);
            if (fs.existsSync(modelOutput)) {
                fs.copyFileSync(modelOutput, pathModule.join(modelsDeployPath, `${locale}.json`));
            } else {
                this.logger.status(`${modelOutput} does not exist.`)
                failure = true;
            }
        }

        if (failure) {
            throw new Error('Error copying models to deployment folder.')
        }

        this.logger.success('Story specific files copied over.');
    }

    private async setupNodeModulesUsingInstallProduction(dirs: SpecialPaths, lambdaCodeDeployPath: string, isLocalTest: boolean) {
        this.logger.status('Installing production node_modules...');

        const lambdaPackageManifestFilePath = pathModule.join(lambdaCodeDeployPath, PACKAGE_MANIFEST_FILE);

        const packageManifest = JSON.parse(fs.readFileSync(pathModule.join(dirs.codePath, PACKAGE_MANIFEST_FILE), "utf8"));

        // Since we're moving the manifest to a different directory for deployment, we need to updated any local runtime
        // dependencies that are using relative paths.
        for (const [name, path] of Object.entries(packageManifest.dependencies as Record<string, string>)) {
            if (path.match(/^file:[^\/]/)) { // package path starts with non-root file path -> relative local dependency
                const relativePath = path.replace(/^file:/, '');
                const absolutePath = pathModule.resolve(dirs.codePath, relativePath);
                // Adjust the relative path for the deployment path we're moving the manifest to.
                const adjustedRelativePath = pathModule.relative(lambdaCodeDeployPath, absolutePath);
                // Updated the manifest with the corrected relative path.
                packageManifest.dependencies[name] = `file:${adjustedRelativePath}`;
            }
        }

        fs.writeFileSync(lambdaPackageManifestFilePath, JSON.stringify(packageManifest, null, 4));
        // End of alternate solution

        if (isLocalTest) {
            await Utilities.runCommandInDirectoryAsync(
                Utilities.npxBin,
                [ Utilities.yarnBin, 'install', '--production' ],
                lambdaCodeDeployPath,
                this.stdOutput,
                {shell: true});
        } else {
            await Utilities.runCommandInDirectoryAsync(
                Utilities.npmBin,
                [ 'install', '--production' ],
                lambdaCodeDeployPath,
                this.stdOutput,
                {shell: true});
        }
    }

    /**
     * Take the stored skill manifest file from the SFB metadata directory
     * (if one exists), modify it so that it has attributes required by SFB,
     * and write it to the build artifact directory.
     *
     * The modified file will later be used by ASK to deploy the skill.
     */
    private async modifySkillManifest(dirs: SpecialPaths, configDirs: ConfigPaths, publishLocales: string[]) {
        // duplicate manifest for all locales
        this.logger.status('Updating skill manifest...');

        const skillSourcePath = pathModule.join(dirs.metaDataStoragePath, SKILL_MANIFEST_FILE);
        const skillManifestPath = SpecialPaths.getStagedSkillManifestFilePath(configDirs);
        if (fs.existsSync(skillSourcePath)) {
            await FileUtils.copyFile(skillSourcePath, skillManifestPath);
        }

        let manifest = FileUtils.loadJson(skillManifestPath);
        let updated = false;
        for (let locale of publishLocales) {
            if (!manifest.manifest.publishingInformation.locales[locale]) {
                updated = true;
                manifest.manifest.publishingInformation.locales[locale] = JSON.parse(JSON.stringify(manifest.manifest.publishingInformation.locales["en-US"]));
            }
        }

        for (let locale of Object.keys(manifest.manifest.publishingInformation.locales)) {
            if (!publishLocales.includes(locale)) {
                updated = true;
                delete manifest.manifest.publishingInformation.locales[locale];
            }
        }

        if (!manifest.manifest.apis.custom.interfaces) {
            manifest.manifest.apis.custom.interfaces = [
                {
                    "type":"ALEXA_PRESENTATION_APL"
                }
            ];
            updated = true;
        }

        if (updated) {
            fs.writeFileSync(skillManifestPath, JSON.stringify(manifest, null, 2));
        }

        this.logger.success('Skill manifest updated.');
    }
}
