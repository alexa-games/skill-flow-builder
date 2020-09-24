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
import { Utilities } from './utilities';
import {
    SpecialPaths,
    ASK_RESOURCES_FILE,
} from './specialPaths';
import { ConfigAccessor } from '@alexa-games/sfb-skill';
import { Logger } from './logger';
import { StdOutput } from './stdOutput';
import { Command } from './command';
import * as fs from 'fs';
import * as pathModule from 'path';

/**
 * Run this after import to copy files out to the baked folder for easy reference.
 * (Optional)
 * Reads: Deploy path
 * Writes: Cloud
 * Depends on: StageCommand
 */
export class DeployCommand implements Command {

    constructor(
        private readonly storyPath: string,
        private readonly logger: Logger,
        private readonly stdOutput: StdOutput) {
    }

    public async run() {
        const dirs = new SpecialPaths(this.storyPath);
        const config = await ConfigAccessor.loadConfigFile(dirs.abcConfig, dirs.builtResourcesPath);
        const configDirs = dirs.getConfigDirectories(config);
        const askProfileName = config.getValue("ask-profile-name");
        const startTime = Date.now();

        this.logger.status("Deploying...");

        await Utilities.restoreAskMetadata(dirs, configDirs);

        if (!SpecialPaths.isAskCliV1(configDirs)) {
            await Utilities.runAskCommandInDirectoryAsync(
                [ 'deploy', '--ignore-hash', '--profile', askProfileName ],
                configDirs.askSkillFullPath,
                this.stdOutput,
                {shell: true});
        } else {
            this.logger.warning('It seems that your project was built using ask-cli@1.x.x, which is no longer supported by Skill Flow Builder.');
            this.logger.warning('Do you want to start deploying your project with ask-cli@2.x.x ?');
            this.logger.warning('Your existing build artifacts will be modified to work with ask-cli@2.x.x.');
            process.stdout.write('[Y/n]: ');
            const answer = await Utilities.createYesNoPrompt();

            // User answered "no" OR canceled the command (e.g., SIGINT)
            if (!answer) {
                throw Error('Deployment canceled');
            }

            this.logger.status('Upgrading build artifacts...');
            await Utilities.runAskCommandInDirectoryAsync(
                [ 'util', 'upgrade-project', '--profile', askProfileName ],
                configDirs.askSkillFullPath,
                this.stdOutput,
                {shell: true},
                ['Y'],
            );

            // ASK auto-upgrade sets the code directory to lambda/lambdacustom, so we rename it
            const stagedAskResourcesFile = pathModule.join(configDirs.askSkillFullPath, ASK_RESOURCES_FILE);
            const askResources = FileUtils.loadJson(stagedAskResourcesFile);
            const upgradedCodeDir = askResources.profiles[askProfileName].code.default.src;
            // This path is also specified in SpecialPaths.getLambdaCodeDeployPath.
            askResources.profiles[askProfileName].code.default.src = 'lambda';
            fs.writeFileSync(stagedAskResourcesFile, JSON.stringify(askResources, null, 2));

            await FileUtils.renameFileIfExists(
                pathModule.join(configDirs.askSkillFullPath, upgradedCodeDir),
                pathModule.join(configDirs.askSkillFullPath, 'lambdatemp'),
            );
            await FileUtils.deleteDir(SpecialPaths.getLambdaCodeDeployPath(configDirs), this.stdOutput);
            await FileUtils.renameFileIfExists(
                pathModule.join(configDirs.askSkillFullPath, 'lambdatemp'),
                SpecialPaths.getLambdaCodeDeployPath(configDirs),
            );

            this.logger.status('Deploying with ask-cli@2.x.x...');
            await Utilities.runAskCommandInDirectoryAsync(
                [ 'deploy', '--ignore-hash', '--profile', askProfileName ],
                configDirs.askSkillFullPath,
                this.stdOutput,
                {shell: true});
        }

        await Utilities.preserveAskMetadata(dirs, configDirs, this.logger);

        const duration = Date.now() - startTime;
        this.logger.success(`Deployment finished in ${duration} ms.`);
    }
}
