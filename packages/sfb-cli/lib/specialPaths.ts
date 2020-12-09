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

import { FileUtils } from './fileUtils';
import { ConfigAccessor } from '@alexa-games/sfb-skill';
import * as fs from 'fs';
import * as pathModule from 'path';

export const ABC_CONFIG_FILE = 'abcConfig.json';
export const DEPLOY_DIRECTORY = '.deploy';
export const BUILD_OUTPUT_DIRECTORY = 'dist';
export const BUILT_RESOURCES_DIRECTORY = 'res';
export const BAKED_DIRECTORY = 'baked';
export const RESOURCES_DIRECTORY = 'resources';
export const METADATA_DIRECTORY = 'metadata';
export const ASK_METADATA_DIRECTORY = '.ask';
export const CODE_DIRECTORY = 'code';
export const CONTENT_DIRECTORY = 'content';
export const SKILL_SOURCE_TEMPLATES_DIRECTORY = 'samples';
export const NODE_MODULES_DIRECTORY = 'node_modules';
export const PACKAGE_MANIFEST_FILE = 'package.json';
export const SAMPLE_STORY = 'example_story';
export const EXTENSIONS_DIRECTORY = 'extensions';
export const SKILL_MANIFEST_FILE = 'skill.json';
export const STORED_ASK_CONFIG_FILE = 'ask_config';
export const ASK_CONFIG_FILE = 'config';
export const ASK_STATES_FILE = 'ask-states.json';
export const ASK_RESOURCES_FILE = 'ask-resources.json';
export const CLOUDFORMATION_TEMPLATE = 'skill-stack.yaml';
export const LAMBDA_LAYER_DIRECTORY = 'lambda-layer';
export const LAMBDA_LAYER_MODULE_DIRECTORY = 'nodejs';
export const LAMBDA_LAYER_CONFIG_FILE = 'lambda-layer.json';
export const HOOKS_DIRECTORY = 'hooks';

export interface ConfigPaths {
    askSkillDirectoryName: string;
    askSkillFullPath: string;
    askConfigPath: string;
    skillPackagePath: string;
    cloudFormationDeployerPath: string;
}

export class SpecialPaths {
    public readonly abcConfig: string;
    public readonly deployPath: string;
    public readonly storyPath: string;
    public readonly sfbRootPath: string;
    public readonly buildOutputPath: string;
    public readonly builtResourcesPath: string;
    public readonly bakedPath: string;
    public readonly metaDataStoragePath: string;
    public readonly storedAskConfigPath: string;
    public readonly codePath: string;
    public readonly codeBuildOutputPath: string;
    public readonly contentPath: string;
    public readonly skillSourceTemplates: string;
    public readonly skillSourceTemplateRoot: string;
    public readonly extensionLoaderPath: string;

    private configDirs?: ConfigPaths;

    constructor(storyPath: string) {
        this.storyPath = FileUtils.fixpath(storyPath);
        this.abcConfig = pathModule.join(this.storyPath, ABC_CONFIG_FILE);
        this.deployPath = pathModule.join(this.storyPath, DEPLOY_DIRECTORY);
        this.buildOutputPath = pathModule.join(this.deployPath, BUILD_OUTPUT_DIRECTORY);
        this.builtResourcesPath = pathModule.join(this.buildOutputPath, BUILT_RESOURCES_DIRECTORY);
        this.sfbRootPath = FileUtils.fixpath(pathModule.join(__dirname, '../..'));
        this.bakedPath = pathModule.join(this.storyPath, BAKED_DIRECTORY);
        this.codePath = pathModule.join(this.storyPath, CODE_DIRECTORY);
        this.codeBuildOutputPath = pathModule.join(this.codePath, BUILD_OUTPUT_DIRECTORY);
        this.contentPath = pathModule.join(this.storyPath, CONTENT_DIRECTORY);
        this.skillSourceTemplates = pathModule.join(this.sfbRootPath, SKILL_SOURCE_TEMPLATES_DIRECTORY, SAMPLE_STORY);
        this.skillSourceTemplateRoot = pathModule.join(this.sfbRootPath, SKILL_SOURCE_TEMPLATES_DIRECTORY);
        this.extensionLoaderPath = pathModule.join(this.codeBuildOutputPath, EXTENSIONS_DIRECTORY, 'ExtensionLoader');

        let stageAndLocale = "";
        if(process.env['stage']) {
            stageAndLocale += process.env['stage'];
            if(process.env['locale']) {
                stageAndLocale += '-';
            }
        }
        if(process.env['locale']) {
            stageAndLocale += process.env['locale'];
        }

        this.metaDataStoragePath = pathModule.join(this.storyPath, METADATA_DIRECTORY, stageAndLocale); // Support different stages and locales for metadata path
        this.storedAskConfigPath = pathModule.join(this.metaDataStoragePath, ASK_METADATA_DIRECTORY);
    }

    public getResourcePath(locale: string) {
        return pathModule.join(this.getLocaleContentPath(locale), RESOURCES_DIRECTORY);
    }

    public getLocaleContentPath(locale: string) {
        return pathModule.join(this.contentPath, locale);
    }

    public getLocaleBuiltResourcesPath(locale: string) {
        return pathModule.join(this.builtResourcesPath, locale);
    }

    public async loadConfigDirectories(): Promise<ConfigPaths> {

        if (!this.configDirs) {
            const config = await ConfigAccessor.loadConfigFile(this.abcConfig, this.builtResourcesPath);
            this.configDirs = this.getConfigDirectories(config);
        }
        return this.configDirs;
    }

    public getConfigDirectories(config: ConfigAccessor): ConfigPaths {
        const askSkillDirectoryName = config.askSkillDirectoryName;
        const askSkillFullPath = pathModule.join(this.deployPath, askSkillDirectoryName);
        const skillPackagePath = pathModule.join(askSkillFullPath, 'skill-package');

        return {
            askSkillDirectoryName,
            askSkillFullPath,
            askConfigPath: pathModule.join(askSkillFullPath, '.ask'),
            skillPackagePath,
            cloudFormationDeployerPath: pathModule.join(askSkillFullPath, 'infrastructure', 'cfn-deployer'),
        };
    }

    /**
     * Indicates if project was built using ASK CLI v1
     */
    public static isAskCliV1(configPaths: ConfigPaths) {
        return !fs.existsSync(configPaths.skillPackagePath);
    }

    public static getStagedSkillManifestFilePath(configPaths: ConfigPaths) {
        return SpecialPaths.isAskCliV1(configPaths)
            ? pathModule.join(configPaths.askSkillFullPath, SKILL_MANIFEST_FILE)
            : pathModule.join(configPaths.skillPackagePath, SKILL_MANIFEST_FILE);
    }

    public static getLambdaCodeDeployPath(configPaths: ConfigPaths) {
        return SpecialPaths.isAskCliV1(configPaths)
            ? pathModule.join(configPaths.askSkillFullPath, 'lambda', 'custom')
            : pathModule.join(configPaths.askSkillFullPath, 'lambda');
    }

    public static getModelsDeployPath(configPaths: ConfigPaths) {
        return SpecialPaths.isAskCliV1(configPaths)
            ? pathModule.join(configPaths.askSkillFullPath, 'models')
            : pathModule.join(configPaths.skillPackagePath, 'interactionModels', 'custom');
    }

    public static getAskLambdaCodeDeployPath(configPaths: ConfigPaths) {
        return SpecialPaths.isAskCliV1(configPaths)
        ? SpecialPaths.getLambdaCodeDeployPath(configPaths)
        : pathModule.join(configPaths.askSkillFullPath, ASK_METADATA_DIRECTORY, 'lambda');
    }
}
