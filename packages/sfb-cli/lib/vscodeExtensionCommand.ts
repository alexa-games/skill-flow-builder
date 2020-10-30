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

import { Utilities } from './utilities';
import { FileUtils } from './fileUtils';
import { PACKAGE_MANIFEST_FILE, SpecialPaths } from './specialPaths';
import { Logger } from './logger';
import { StdOutput } from './stdOutput';
import { Command } from './command';
import { existsSync, fstat, readdirSync } from 'fs';

const pathModule = require('path');
const fs = require('fs');

/**
 * Converts user's story to a runnable format.
 * Reads: vscode node_modules folder
 * Depends on: <nothing>
 */
export class VscodeExtensionCommand implements Command {

    constructor(
        private readonly logger: Logger,
        private readonly stdOutput: StdOutput) {
    }

    public async run() {
        this.logger.status('Setting up SFB vscode extension ...');

        let dirs = new SpecialPaths('na');

        let homeDir = Utilities.isWin32 ? process.env['USERPROFILE'] : process.env['HOME'];

        const SFB_VSCODE_EXTENSION = 'sfb-vscode-extension';

        const vscodeExtDestPath = FileUtils.fixpath(`${homeDir}/.vscode/extensions/${SFB_VSCODE_EXTENSION}`);

        let vscodeExtSoucePath = pathModule.join(dirs.sfbRootPath, 'node_modules', '@alexa-games', SFB_VSCODE_EXTENSION);
        if (!existsSync(vscodeExtSoucePath)) {
            // if not installed with sfb-cli, try looking in the parent folder.
            vscodeExtSoucePath = pathModule.join(dirs.sfbRootPath, '..', SFB_VSCODE_EXTENSION);
        }

        await FileUtils.deleteDir(vscodeExtDestPath, this.stdOutput); // Delete any previous installation

        try { // Case: the package was installed remotely

            await FileUtils.recursiveCopy(
                pathModule.join(vscodeExtSoucePath, '*'),
                vscodeExtDestPath);

            await Utilities.runCommandInDirectoryAsync( // Ensure module is fully resolved once moved. Do this in the destination since user won't need to be root.
                Utilities.npxBin,
                ['npm', 'install', '--production'],
                vscodeExtDestPath,
                this.stdOutput,
                { shell: true });
        } catch (e) { // Case: the package was installed locally
            this.logger.warning('Package was installed locally, updating package manifest paths...');

            const packageJson = FileUtils.loadJson(pathModule.join(vscodeExtDestPath, PACKAGE_MANIFEST_FILE));

            const packageMatch = new RegExp(/^@alexa-games\/(sfb-[a-z].*)/);
            
            for (const dependency in packageJson.dependencies) {
                const match = packageMatch.exec(dependency);
                if (match) {
                    packageJson.dependencies[dependency] = `file:${pathModule.join(dirs.sfbRootPath, '..', match[1])}`;
                }
            }

            fs.writeFileSync(pathModule.join(vscodeExtDestPath, PACKAGE_MANIFEST_FILE), JSON.stringify(packageJson, null, 4));

            try {
                await Utilities.runCommandInDirectoryAsync(
                    Utilities.npxBin,
                    ['npm', 'install', '--production'],
                    vscodeExtDestPath,
                    this.stdOutput,
                    { shell: true });
            } catch (e) {
                this.logger.error(e);
            }
        }

        this.logger.success('Success. Restart vscode to pickup extension features.');
    }
}
