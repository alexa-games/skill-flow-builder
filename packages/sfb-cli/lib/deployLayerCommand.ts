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

import * as fs from 'fs';
import * as pathModule from 'path';

import { ConfigAccessor } from '@alexa-games/sfb-skill';
import { sanitizeCommandLineParameter as sanitize } from '@alexa-games/sfb-util';

import { FileUtils } from './fileUtils';
import { Utilities } from './utilities';
import { Logger } from './logger';
import {
    SpecialPaths,
    ConfigPaths,
    LAMBDA_LAYER_CONFIG_FILE,
    SKILL_MANIFEST_FILE,
    PACKAGE_MANIFEST_FILE,
    NODE_MODULES_DIRECTORY,
    LAMBDA_LAYER_DIRECTORY,
    LAMBDA_LAYER_MODULE_DIRECTORY
} from './specialPaths';
import { Command } from './command';
import { StdOutput } from './stdOutput';

/**
 * Deploys our Lambda Layer, and move the node_modules back into the staged lambda code directory to maintain the same file hash
 */
export class DeployLayerCommand implements Command {

    constructor(
        private readonly storyPath: string,
        private readonly logger: Logger,
        private readonly stdOutput: StdOutput) {
    }

    private async shouldUpdateLayer(dirs: SpecialPaths, lambdaLayerZipName: string, lambdaLayerConfigPath: string, lambdaLayerConfigFilePath: string) {
        const newHash = await FileUtils.createFileHash(lambdaLayerConfigPath, lambdaLayerZipName);

        let lambdaLayerConfig;
        
        try {
            lambdaLayerConfig = FileUtils.loadJson(lambdaLayerConfigFilePath);
            const oldHash = lambdaLayerConfig.lambdaLayerHash;

            if (oldHash === newHash) {
                return false;
            }
            return true;
        } catch (e) {
            throw new Error(`There was a problem reading ${lambdaLayerConfigFilePath}. Please fix the errors, or remove it and retry.`);
        } 
    }

    private async setupLambdaLayer(dirs: SpecialPaths, configHelper: ConfigAccessor) {
        this.logger.status('Setting up a Lambda layer...');

        const skillDirectoryNameConfig = configHelper.askSkillDirectoryName;
        const skillDirectoryName = sanitize(skillDirectoryNameConfig.split(' ')[0]);
        const lambdaLayerName = `${skillDirectoryName}-lambda-layer`;
        const lambdaLayerZipName = lambdaLayerName + '.zip';

        const lambdaLayerConfigPath = pathModule.join(dirs.metaDataStoragePath, LAMBDA_LAYER_DIRECTORY);
        const lambdaLayerConfigFilePath = pathModule.join(dirs.metaDataStoragePath, LAMBDA_LAYER_CONFIG_FILE);
        
        let lambdaLayerData : any = {};

        if (fs.existsSync(lambdaLayerConfigFilePath)) { // Layer has already been deployed once
            const shouldUpdateLayer = await this.shouldUpdateLayer(dirs, lambdaLayerZipName, lambdaLayerConfigPath, lambdaLayerConfigFilePath);   
            if (shouldUpdateLayer) {
                this.logger.status('There are changes, redeploying your layer...');
                lambdaLayerData = await this.deployLambdaLayer(dirs, lambdaLayerName, lambdaLayerZipName, FileUtils.loadJson(lambdaLayerConfigFilePath));
            } else {
                return this.logger.success('Layer would remain the same. Nothing to do.');
            }
        } else {
            this.logger.status('Deploying a new lambda layer...');     
            lambdaLayerData = await this.deployLambdaLayer(dirs, lambdaLayerName, lambdaLayerZipName, {});
        }

        // Write a copy of the config and zip to the metadata to let us know it worked.
        fs.writeFileSync(lambdaLayerConfigFilePath, JSON.stringify(lambdaLayerData, null, 2));

        this.logger.success('Lambda layer code successfully uploaded.');
    };

    private async deployLambdaLayer(dirs: SpecialPaths, lambdaLayerName: string, lambdaLayerZipName: string, layerOptions: { compatibleRuntimes?: string[] }) {
        const compatibleRuntimes: string[] = layerOptions.compatibleRuntimes || ['nodejs10.x'];
        const metadataFilePath = pathModule.join(dirs.metaDataStoragePath, SKILL_MANIFEST_FILE);

        let skillManifest;
        let lambdaArn;

        try {
            skillManifest = FileUtils.loadJson(metadataFilePath);
            lambdaArn = skillManifest.manifest.apis.custom.endpoint.uri;
        } catch (e) {
            throw new Error(`There was a problem reading ${metadataFilePath} or there was a problem finding a valid lambda URI for this project. Please ensure that the deploy step sucessfully finished.`);
        }

        const lambdaLayerConfigPath = pathModule.join(dirs.metaDataStoragePath, LAMBDA_LAYER_DIRECTORY);
        const sanitizedCompatibleRuntimes = compatibleRuntimes.map((x: string) => `"${sanitize(x.split(' ')[0])}"`).join(' ').trim();
        
        const publishLayerOutput = await Utilities.runCommandInDirectoryAsync(
            Utilities.awsBin,
            ['lambda', 'publish-layer-version', '--layer-name', `"${sanitize(lambdaLayerName)}"`, '--zip-file', `"fileb://${sanitize(lambdaLayerZipName)}"`, '--compatible-runtimes', sanitizedCompatibleRuntimes, '--cli-connect-timeout 30000'],
            lambdaLayerConfigPath,
            this.stdOutput,
            {shell: true}
        );

        const layerInfo = JSON.parse(publishLayerOutput[0]);

        const { LayerArn: lambdaLayerArn, LayerVersionArn: lambdaLayerVersionArn, Version: lambdaLayerVersion } = layerInfo;
        
        const getFunctionConfigurationOutput = await Utilities.runCommandAsync(
            Utilities.awsBin,
            ['lambda', 'get-function-configuration', '--function-name', `"${sanitize(lambdaArn)}"`],
            this.stdOutput,
            {shell: true}
        );

        const prevLambdaConfiguration = JSON.parse(getFunctionConfigurationOutput[0]);

        let prevLayersNames = '';

        if (prevLambdaConfiguration.Layers && Array.isArray(prevLambdaConfiguration.Layers)) {
            prevLayersNames = prevLambdaConfiguration.Layers
            .filter((e: any) => !e.Arn.includes(lambdaLayerArn))
            .map((e: any) => `"${sanitize(e.Arn)}"`)
            .join(' ');
        }

        const updateFunctionConfigOutput = await Utilities.runCommandAsync(
            Utilities.awsBin,
            ['lambda', 'update-function-configuration', '--function-name', `"${sanitize(lambdaArn)}"`, '--layers', `${prevLayersNames} "${sanitize(lambdaLayerVersionArn)}"`.trim()],
            this.stdOutput,
            {shell: true}
        );

        const lambdaInfo = JSON.parse(updateFunctionConfigOutput[0]);

        if (!lambdaInfo.Layers || lambdaInfo.Layers.filter((e: any) => e.Arn === lambdaLayerVersionArn).length <= 0) {
            throw new Error(`There was a problem updating your existing Lambda function configuration. Please ensure you have the correct permissions to edit it, or you have less than 5 previous layers.`);
        }

        const lambdaLayerHash = await FileUtils.createFileHash(lambdaLayerConfigPath, lambdaLayerZipName);

        return {
            lambdaLayerZipName,
            lambdaLayerName,
            compatibleRuntimes,
            lambdaArn,
            lambdaLayerArn,
            lambdaLayerVersionArn,
            lambdaLayerVersion,
            lambdaLayerHash
        };
    }

    private async rollbackCodeDirectory(dirs: SpecialPaths, configDirs: ConfigPaths) {
        const lambdaLayerConfigPath = pathModule.join(dirs.metaDataStoragePath, LAMBDA_LAYER_DIRECTORY);
        const lambdaLayerModulesPath = pathModule.join(lambdaLayerConfigPath, LAMBDA_LAYER_MODULE_DIRECTORY);

        await FileUtils.moveFile(pathModule.join(lambdaLayerModulesPath, NODE_MODULES_DIRECTORY), SpecialPaths.getLambdaCodeDeployPath(configDirs), this.stdOutput);
        await FileUtils.moveFile(pathModule.join(lambdaLayerModulesPath, PACKAGE_MANIFEST_FILE), SpecialPaths.getLambdaCodeDeployPath(configDirs), this.stdOutput);
    }

    private async unlinkLayer(dirs: SpecialPaths) {
        const lambdaLayerConfigFilePath = pathModule.join(dirs.metaDataStoragePath, LAMBDA_LAYER_CONFIG_FILE);

        this.logger.status('Lambda Layer config option turned off. Removing existing layer...');
        let lambdaLayerData;
        try {
            lambdaLayerData = FileUtils.loadJson(lambdaLayerConfigFilePath);
            const { lambdaArn, lambdaLayerArn, lambdaLayerVersionArn } = lambdaLayerData;

            const getFunctionConfigurationOutput = await Utilities.runCommandAsync(
                Utilities.awsBin,
                ['lambda', 'get-function-configuration', '--function-name', `"${sanitize(lambdaArn)}"`],
                this.stdOutput,
                {shell: true}
            );

            const prevLambdaConfiguration = JSON.parse(getFunctionConfigurationOutput[0]);

            let prevLayersNames = '';

            if (prevLambdaConfiguration.Layers && Array.isArray(prevLambdaConfiguration.Layers)) {
                prevLayersNames = prevLambdaConfiguration.Layers
                .filter((e: any) => !e.Arn.includes(lambdaLayerArn))
                .map((e: any) => `"${sanitize(e.Arn)}"`)
                .join(' ')
                .trim();
            }

            const updateFunctionConfigOutput = await Utilities.runCommandAsync(
                Utilities.awsBin,
                ['lambda', 'update-function-configuration', '--function-name', `"${sanitize(lambdaArn)}"`, '--layers', prevLayersNames],
                this.stdOutput,
                {shell: true}
            );

            const lambdaInfo = JSON.parse(updateFunctionConfigOutput[0]);

            if (lambdaInfo.Layers && Array.isArray(lambdaInfo.Layers) && lambdaInfo.Layers.filter((e: any) => e.Arn === lambdaLayerVersionArn).length > 0) {
                this.logger.error(`There was a problem removing your existing layer from your Lambda function configuration. Please ensure you have the correct permissions to edit it.`);
            }
        } catch(e) {
            this.logger.error(`Error accessing ${lambdaLayerConfigFilePath} or finding a valid Lambda Layer ARN/Lambda Layer version: ${e}. If you want to remove an existing Lambda Layer, please delete it yourself on your Lambda function page.`);
        } finally { // Remove all Lambda Layer metadata
            await FileUtils.deleteFile(lambdaLayerConfigFilePath);
            await FileUtils.deleteDir(pathModule.join(dirs.metaDataStoragePath, LAMBDA_LAYER_DIRECTORY), this.stdOutput);
        }
             
    }

    public async run() {
        const dirs = new SpecialPaths(this.storyPath);
        const config = await ConfigAccessor.loadConfigFile(dirs.abcConfig, dirs.builtResourcesPath);
        const configDirs = dirs.getConfigDirectories(config);

        const lambdaLayerConfigFilePath = pathModule.join(dirs.metaDataStoragePath, LAMBDA_LAYER_CONFIG_FILE);

        if (!config.useLambdaLayer) {
            if (fs.existsSync(lambdaLayerConfigFilePath)) { // Case: User once turned on lambda layers but now has it turned off. Need to delete existing layer and all previous versions
                await this.unlinkLayer(dirs); 
            }
            return;
        }
        
        const startTime = Date.now();

        try {
            await this.setupLambdaLayer(dirs, config);
            const duration = Date.now() - startTime;
            await this.rollbackCodeDirectory(dirs, configDirs);
            return this.logger.success(`Layer deployment finished in ${duration} ms.`);
        } catch(e) {
            await this.rollbackCodeDirectory(dirs, configDirs);
            throw new Error(`Layer deployment failed: ${e}`);
        }
    }
}
