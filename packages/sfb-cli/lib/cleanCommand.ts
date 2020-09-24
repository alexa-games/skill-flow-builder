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

import {
    SpecialPaths,
    NODE_MODULES_DIRECTORY
} from './specialPaths';
import { Logger } from './logger';
import { StdOutput } from './stdOutput';
import { FileUtils } from './fileUtils';
import { ConfigAccessor } from '@alexa-games/sfb-skill';
import { Command } from './command';
import { Utilities } from './utilities';


/**
 * Does a clean of the story's .deploy, node_modules, and calls clean on the code directory
 */

export class CleanCommand implements Command {

    constructor(
        private readonly storyPath: string,
        private readonly logger: Logger,
        private readonly stdOutput: StdOutput) {
    }

    public async run() {
        const specialDirectories = new SpecialPaths(this.storyPath);
        const config = await ConfigAccessor.loadConfigFile(specialDirectories.abcConfig, specialDirectories.builtResourcesPath);

        this.logger.status(`Checking for ${specialDirectories.deployPath}`);
        if (fs.existsSync(specialDirectories.deployPath)) {
            this.logger.status(`Deleting ${specialDirectories.deployPath}`);
            await FileUtils.deleteDir(specialDirectories.deployPath, this.stdOutput);
        }

        const storyPathNodeModules = pathModule.join(specialDirectories.storyPath, NODE_MODULES_DIRECTORY);
        this.logger.status(`Checking for ${storyPathNodeModules}`);
        if (fs.existsSync(storyPathNodeModules)) {
            this.logger.status(`Deleting ${storyPathNodeModules}`);
            await FileUtils.deleteDir(storyPathNodeModules, this.stdOutput);
        }

        await this.cleanCode(specialDirectories, config.getValue("sfbLocalTesting"));
    }

    private async cleanCode(dirs: SpecialPaths, isLocalTest: boolean) {
        this.logger.status('Cleaning TypeScript code...');

        if (isLocalTest) {
            await Utilities.runCommandInDirectoryAsync(
                Utilities.npxBin,
                [Utilities.yarnBin, 'clean'],
                dirs.codePath,
                this.stdOutput,
                {shell: true});
        } else {
            await Utilities.runCommandInDirectoryAsync(
                Utilities.npmBin,
                [ 'run', 'clean'],
                dirs.codePath,
                this.stdOutput,
                {shell: true});
        }

        this.logger.success('Clean step completed.');
    }
}
