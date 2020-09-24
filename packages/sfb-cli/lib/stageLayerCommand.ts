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

import * as fs from 'fs';
import * as pathModule from 'path';

import { FileUtils } from './fileUtils';
import { Utilities } from './utilities';
import { Logger } from './logger';
import {
    SpecialPaths,
    PACKAGE_MANIFEST_FILE,
    ConfigPaths,
    NODE_MODULES_DIRECTORY,
    LAMBDA_LAYER_DIRECTORY,
    LAMBDA_LAYER_MODULE_DIRECTORY,
    LAMBDA_LAYER_CONFIG_FILE
} from './specialPaths';
import { ConfigAccessor } from '@alexa-games/sfb-skill';
import { Command } from './command';
import { StdOutput } from './stdOutput';

/**
 * Sets everything we need regarding Lambda Layers up
 * Depends on: `StageCommand`
 */
export class StageLayerCommand implements Command {

    constructor(
        private readonly storyPath: string,
        private readonly logger: Logger,
        private readonly stdOutput: StdOutput) {
    }

    public async setupCodeDirectory(dirs: SpecialPaths, configDirs: ConfigPaths, configHelper: ConfigAccessor) {
        this.logger.status('Preparing the lambda code directory for deployment with a lambda layer...');

        const skillDirectoryName = configHelper.askSkillDirectoryName;
        const lambdaLayerName = `${skillDirectoryName}-lambda-layer`;
        const lambdaLayerZipName = lambdaLayerName + '.zip';

        const lambdaLayerConfigPath = pathModule.join(dirs.metaDataStoragePath, LAMBDA_LAYER_DIRECTORY);
        const lambdaLayerModulesPath = pathModule.join(lambdaLayerConfigPath, LAMBDA_LAYER_MODULE_DIRECTORY);

        await FileUtils.deleteDir(pathModule.join(dirs.metaDataStoragePath, LAMBDA_LAYER_DIRECTORY), this.stdOutput);  // Remove any layer deployment artifacts (if the user cancelled deployment midway)

        await FileUtils.makeDir(pathModule.join(lambdaLayerConfigPath, LAMBDA_LAYER_MODULE_DIRECTORY));

        await FileUtils.moveFile(pathModule.join(SpecialPaths.getLambdaCodeDeployPath(configDirs), NODE_MODULES_DIRECTORY), lambdaLayerModulesPath, this.stdOutput); // Move the node_modules to avoid deploying them and to maintain the same hash

        await Utilities.zipDirectory(lambdaLayerConfigPath, LAMBDA_LAYER_MODULE_DIRECTORY, lambdaLayerZipName, this.stdOutput);

        const packageJsonPath = pathModule.join(SpecialPaths.getLambdaCodeDeployPath(configDirs), PACKAGE_MANIFEST_FILE);

        const packageJson = await FileUtils.loadJson(packageJsonPath);

        const backupPackageJson = JSON.parse(JSON.stringify(packageJson));

        packageJson.dependencies = {}; // Empty the dependencies in case ask runs npm install

        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

        return backupPackageJson;
    }

    public async run() {
        const dirs = new SpecialPaths(this.storyPath);
        const config = await ConfigAccessor.loadConfigFile(dirs.abcConfig, dirs.builtResourcesPath);
        const configDirs = dirs.getConfigDirectories(config);

        if (!config.useLambdaLayer) return;

        const lambdaLayerConfigPath = pathModule.join(dirs.metaDataStoragePath, LAMBDA_LAYER_DIRECTORY);

        if (!fs.existsSync(lambdaLayerConfigPath)) { // Make the metadata directory (if a lambda hasn't been deployed yet)
            FileUtils.makeDir(lambdaLayerConfigPath);
        }

        const backupPackageJson = await this.setupCodeDirectory(dirs, configDirs, config);

        const backupPackageJsonPath = pathModule.join(lambdaLayerConfigPath, PACKAGE_MANIFEST_FILE);
        fs.writeFileSync(backupPackageJsonPath, JSON.stringify(backupPackageJson, null, 2));
    }
}
