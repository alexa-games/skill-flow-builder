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

/* 
    Story Simulator script 
*/
import * as fs from 'fs';
import * as path from 'path';

import { SpecialPaths } from './specialPaths';
import { ConfigAccessor } from '@alexa-games/sfb-skill';
import { Logger } from './logger';
import { FileUtils } from './fileUtils';
import { Command } from './command';

/**
 * Converts user's story to a runnable format, then run the test cases defined in the user's project.
 * 
 * Reads: Source path
 * Depends on: <nothing>
 */
export class TestCommand implements Command {

    constructor(
        private readonly storyPath: string,
        private readonly locale: string,
        private readonly logger: Logger) {
    }

    public async run() {
        this.logger.status('Testing content ...')

        if (!fs.existsSync(this.storyPath)) {
            throw new Error(`${this.storyPath}: The specified story path does not exist.`);
        }

        const dirs = new SpecialPaths(this.storyPath);
        const config = await ConfigAccessor.loadConfigFile(dirs.abcConfig, dirs.builtResourcesPath);

        await this.testStory(this.locale, dirs, config);
    }

    private testStory(locale: string, dirs: SpecialPaths, config: ConfigAccessor ) {
        const bakedFilePath: string = path.resolve(dirs.bakedPath, locale, config.getValue("abc-baked-filename", undefined, locale));

        const extensionLoaderModule = require(dirs.extensionLoaderPath);

        const customExtensions = new extensionLoaderModule.ExtensionLoader({
            locale,
            configAccessor: config
        });

        const customStoryExtensions = customExtensions.getExtensions();

        //const abcDebugger = new ABCDebugger(FileUtils.loadJson(bakedFilePath), customStoryExtensions, bakedFilePath);
        //abcDebugger.run(undefined, console);
    }
}
