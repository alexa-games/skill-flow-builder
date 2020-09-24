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
    ConfigPaths,
    SKILL_MANIFEST_FILE,
    ASK_RESOURCES_FILE,
    ASK_STATES_FILE,
} from './specialPaths';
import { ConfigAccessor } from '@alexa-games/sfb-skill';
import { Logger } from './logger';
import { StdOutput } from './stdOutput';
import { Command } from './command';
import * as fs from 'fs';
import * as pathModule from 'path';


/**
 * Run this to deploy just the voice model and skill manifest files, and skill the Lambda file upload.
 * Useful if your lambda is large and you do not want to update it, or if you are uploading your lambda
 * from an S3 linked file.
 * (Optional)
 * Reads: Deploy path
 * Writes: Cloud
 * Depends on: StageCommand
 */
export class DeployMetadataCommand implements Command {

    constructor(
        private readonly storyPath: string,
        private readonly skillStage: string,
        private readonly logger: Logger,
        private readonly stdOutput: StdOutput) {
    }

    public async run() {
        this.logger.status("Deploying only Metadata...");

        const dirs = new SpecialPaths(this.storyPath);
        const config = await ConfigAccessor.loadConfigFile(dirs.abcConfig, dirs.builtResourcesPath);
        const configDirs = dirs.getConfigDirectories(config);
        const askProfileName = config.getValue("ask-profile-name");
        const startTime = Date.now();

        await Utilities.restoreAskMetadata(dirs, configDirs);

        if (!SpecialPaths.isAskCliV1(configDirs)) {
            this.logger.status('Detected project built with ask-cli@2.x.x.');

            const askStatesFilePath = pathModule.join(configDirs.askConfigPath, ASK_STATES_FILE);
            let askStates;
            let skillId;
            try {
                askStates = FileUtils.loadJson(askStatesFilePath);
                skillId = askStates.profiles[askProfileName].skillId;
            } catch (e) {
                this.logger.error(e);
                throw new Error(`There was a problem reading ${askStatesFilePath} or there was a problem finding a valid skillId for this project. Try running \`alexa-sfb deploy\` successfully first.`);
            }


            const availableSkillStages = ['live', 'development', 'certified'];
            if (!availableSkillStages.includes(this.skillStage)) {
                throw new Error(`Invalid skill stage selected. Please choose one of the following: ${availableSkillStages.join(',')}.`);
            }


            const skillManifestFilePath = pathModule.join(configDirs.skillPackagePath, SKILL_MANIFEST_FILE);
            await Utilities.runAskCommandInDirectoryAsync(
                ['smapi', 'update-skill-manifest', '--stage', this.skillStage, '--skill-id', skillId, '--manifest', `file:${skillManifestFilePath}`, '--profile', askProfileName],
                configDirs.askSkillFullPath,
                this.stdOutput,
                {shell: true});

        } else {
            this.logger.status('Detected project built with ask-cli@1.x.x.');
            await Utilities.runCommandInDirectoryAsync(
                'ask',
                [ 'deploy', '--target', 'skill', '--no-wait', '--force', '--profile', askProfileName ],
                configDirs.askSkillFullPath,
                this.stdOutput,
                {shell: true});
        }

        await Utilities.preserveAskMetadata(dirs, configDirs, this.logger);

        const duration = Date.now() - startTime;
        this.logger.success(`Deployment finished in ${duration} ms.`);
    }
}
