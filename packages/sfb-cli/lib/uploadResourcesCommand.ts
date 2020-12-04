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

import { ConfigAccessor } from '@alexa-games/sfb-skill';
import { sanitizeCommandLineParameter as sanitize } from '@alexa-games/sfb-util'
import { FileUtils } from './fileUtils';
import { SpecialPaths } from './specialPaths';
import { Utilities } from './utilities';
import { Logger } from './logger';
import { StdOutput } from './stdOutput';
import { Command } from './command';

/**
 * Run this after import to copy files out to the baked folder for easy reference.
 * (Optional)
 * Reads: Output path
 * Writes: Baked path
 * Depends on: ImportCommand
 */
export class UploadResourcesCommand implements Command {

    constructor(
        private readonly storyPath: string,
        private readonly logger: Logger,
        private readonly stdOutput: StdOutput) {
    }

    public async run() {
        const dirs = new SpecialPaths(this.storyPath);
        const config = await ConfigAccessor.loadConfigFile(dirs.abcConfig, dirs.builtResourcesPath);

        for (let locale of config.publishLocales) {
            await this.uploadContent(locale, dirs, config);
        }
    }

    private async uploadContent(locale: string, dirs: SpecialPaths, config: ConfigAccessor) {

        const publicResourceFolders = config.getValue("public-resource-folders", undefined, locale);
        const localeResourcePath = dirs.getResourcePath(locale);
        const s3BucketName = config.getValue("s3-bucket-name", undefined, locale);
        const askSkillDirectoryName = config.askSkillDirectoryName;

        // Backwards compatible with missing aws profile name, use ask profile name
        let awsProfileName = config.getValue('aws-profile-name', undefined, locale) || config.getValue('ask-profile-name', undefined, locale);

        const sourceFolder = FileUtils.fixpath(`${localeResourcePath}/public`);
        const destFolder = sanitize(`s3://${s3BucketName}/${askSkillDirectoryName}/${locale}`);

        for(let folderName of publicResourceFolders) {
            const sanitizedFolderName = sanitize(folderName);
            this.logger.status(`Using config value for 'aws-profile-name' of '${awsProfileName}' from abcConfig.json`)
            this.logger.status(`Uploading ${sourceFolder} ...`)

            const folderToUpload = FileUtils.fixpath(pathModule.join(sourceFolder, sanitizedFolderName));

            if(!fs.existsSync(folderToUpload)) {
                // Tell the user we are skipping the folder, but this is not an error
                this.logger.status(`Folder does not exist, skipping ${sourceFolder} ...`)
                continue;
            }

            await Utilities.runCommandAsync(
                Utilities.awsBin,
                [
                    's3',
                    'cp',
                    `"${folderToUpload}"`,
                    `"${destFolder}/${sanitizedFolderName}/"`,
                    '--recursive',
                    '--acl',
                    'public-read',
                    '--profile',
                    awsProfileName
                ],
                this.stdOutput,
                {shell: true});


            this.logger.success(`Success!`);
        }
    }
}
