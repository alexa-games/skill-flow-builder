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

const pathModule = require('path');
const fs = require('fs')

import { FileUtils } from './fileUtils';
import { Logger } from './logger';
import {
    SpecialPaths,
    PACKAGE_MANIFEST_FILE,
    ABC_CONFIG_FILE
} from './specialPaths';
import { Command } from './command';
import { StdOutput } from './stdOutput';
import { ManifestUtils } from './manifestUtils';

const template = {
    storyId: 'my-branch-story',
    storyTitle: 'My Branch Story'
}

/**
 * Creates a new project from sample.
 */
export class NewProjectCommand implements Command {

    constructor(
        private readonly storyPath: string,
        private readonly template: string,
        private readonly logger: Logger,
        private readonly stdOutput: StdOutput) {
    }

    private isValidInvocationName(invocationName: string): boolean {
        if (
            invocationName.length < 2 || // Needs to be at least 2 characters long
            !invocationName[0].match(/[a-z]/) ||  // First character must be a letter
            /\d/.test(invocationName) // No numbers are allowed
            ) {
            return false;
        }
        return true;
    }

    public async run() {

        const storyName = pathModule.basename(this.storyPath);

        const storyId = storyName.replace(/[^a-zA-Z0-9-]+/g, '-').toLowerCase().trim();
        const storyTitle = storyName.replace(/[^a-zA-Z0-9]+/g, ' ').trim();

        const dirs = new SpecialPaths(this.storyPath);

        const dest = FileUtils.fixpath(this.storyPath);
        if (fs.existsSync(dest)) {
            throw new Error(`Directory already exists: ${dest}`);
        }

        const samplesSource = pathModule.join(dirs.skillSourceTemplateRoot, this.template, '*');

        this.logger.status(`Copying ${samplesSource} to ${dest}...`);

        // Copy sample template to new folder.
        await FileUtils.recursiveCopy(samplesSource, dest, { makeDestinationWritable: true });

        const configFile = pathModule.join(dest, 'abcConfig.json');
        await FileUtils.replaceInFile(configFile, new RegExp(template.storyId, 'g'), storyId);
        await FileUtils.replaceInFile(configFile, new RegExp(template.storyTitle, 'g'), storyTitle);

        // Rename and fix up package.json file for the code. We changed the package.json file to _package.json in our
        // samples because Electron builder messes with the file contents otherwise.
        const placeholderPackageManifestFilePath = pathModule.join(dirs.codePath, `_${PACKAGE_MANIFEST_FILE}`);
        const packageManifestFilePath = pathModule.join(dirs.codePath, PACKAGE_MANIFEST_FILE);
        await FileUtils.renameFileIfExists(placeholderPackageManifestFilePath, packageManifestFilePath);

        const manifest = FileUtils.loadJson(packageManifestFilePath);
        await ManifestUtils.repairPackageManifest(manifest);
        fs.writeFileSync(packageManifestFilePath, JSON.stringify(manifest, null, 4));

        this.logger.success(`New story ${storyName} is ready.`);
        if (!this.isValidInvocationName(storyTitle)) {
            this.logger.warning(`You've created a new project with an invalid invocation name. Please edit the project's ${ABC_CONFIG_FILE} to deploy successfully.`);
        }
    }
}
