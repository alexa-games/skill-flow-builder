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

const fs = require('fs')
const path = require('path')

import { FileUtils } from './fileUtils';
import { SpecialPaths } from './specialPaths';
import { ConfigAccessor } from '@alexa-games/sfb-skill';
import { Command } from './command';
import { Logger } from './logger';

/**
 * Run this after import to copy files out to the baked folder for easy reference.
 * (Optional)
 * Reads: Output path
 * Writes: Baked path
 * Depends on: ImportCommand
 */
export class BakeCommand implements Command {

    constructor(
        private readonly storyPath: string,
        private readonly logger: Logger) {
    }

    public async run() {
        const dirs = new SpecialPaths(this.storyPath);
        const config = await ConfigAccessor.loadConfigFile(dirs.abcConfig, dirs.builtResourcesPath);

        this.logger.status('Copying baked output to the baked folder for your reference...');
        
        for (let locale of config.publishLocales) {
            await this.copyContent(locale, dirs, config);
        }

        // Do a bake for the apl-templates files, which may have a subdirectory of additional content
        // files to bake into the main file
        this.logger.status('Checking for apl-template files to bake...');
        for (let locale of config.publishLocales) {
            const aplTemplatesFilePath = config.getAplTemplatesFilePath(locale);
            await this.bakeAPLFiles(aplTemplatesFilePath, aplTemplatesFilePath);
        }

        this.logger.success('Baked output copied.');
    }
    
    private async copyContent(locale: string, dirs: SpecialPaths, config: ConfigAccessor) {
        const localeBuildOutputPath = dirs.getLocaleBuiltResourcesPath(locale);

        const voiceOverFileName = config.getValue("abc-recording-script-filename", undefined, locale);
        const bakedStoryName = config.getValue("abc-baked-filename", undefined, locale);

        await FileUtils.recursiveCopy(`${localeBuildOutputPath}/${bakedStoryName}`, `${dirs.bakedPath}/${locale}`);
                
        if (fs.existsSync(FileUtils.fixpath(`${localeBuildOutputPath}/${voiceOverFileName}`))) {
            await FileUtils.recursiveCopy(`${localeBuildOutputPath}/${voiceOverFileName}`, `${dirs.bakedPath}/${locale}`);
        }
    }

    // Check and see if there is an "apl-templates" subdirectory to combine into the apl-templates file.
    // This let's users keep APL files by name in a sub-directory then refer to them later by that file name.
    // Makes for much easier integration with the APL Designer website, which works on one APL file at a time.
    async bakeAPLFiles(aplTemplatesFilePath: string, outputAPLFilePath: string) {

        if(aplTemplatesFilePath) {

            const dirNamePath = path.dirname(aplTemplatesFilePath);

            if(dirNamePath) {

                const aplDirName = path.resolve(path.join(dirNamePath, "apl-templates"));

                if(fs.existsSync(aplDirName)) {

                    // Now list all files in this directory
                    const fileList = readdirRecursiveSync(aplDirName);

                    if(fileList.length > 0) {

                        // Now load the source APL file, and combine all the additional files into it
                        let sourceAPLJSON : any = {};

                        if(fs.existsSync(aplTemplatesFilePath)) {
                            try {
                                sourceAPLJSON = JSON.parse(fs.readFileSync(aplTemplatesFilePath));
                            } catch (e) {
                                this.logger.warning(e);
                                throw new Error(`Unable to JSON parse APL file ${aplTemplatesFilePath}`);
                            }
                        }

                        for(const filename of fileList) {

                            const aplFile = path.join(aplDirName, filename);

                            try {
                                const fileAPLJson = JSON.parse(fs.readFileSync( aplFile ));

                                let keyName = path.join(path.dirname(filename), path.basename(filename, ".json"));

                                // Turn slashes in the filename into "."'s
                                keyName = keyName.replace("\\", ".").replace("/", ".");
    
                                sourceAPLJSON[keyName] = fileAPLJson;    
                            } catch (e) {
                                this.logger.warning(e);
                                throw new Error(`Unable to JSON parse APL file ${aplFile}`);
                            }
                        }

                        // Now write out the combined file
                        fs.writeFileSync(outputAPLFilePath, JSON.stringify(sourceAPLJSON, undefined, 2));
                    }
                }
            }
        }
    }
}


// return all the files in the given folder path recursively, with their path
// that remains after the initial folderPath is removed
function readdirRecursiveSync(folderPath : string) {
    
    const returnedFileList : string[]= [];
  
    readdirRecursiveSyncHelper(
        folderPath,
        path.resolve(folderPath),
        returnedFileList
        );

    return returnedFileList;
}
  
// helper function for above recursive promisified function above
function readdirRecursiveSyncHelper(
    originalFolderPath : string,
    folderPath : string,
    returnedFileList : string[]
  ) {
    const files = fs.readdirSync(folderPath);
  
    files.forEach((filename : string) => {
      const stats = fs.statSync(path.resolve(folderPath, filename));
  
      if (stats.isDirectory()) {
        readdirRecursiveSyncHelper(
          originalFolderPath,
          path.resolve(folderPath, filename),
          returnedFileList
        );
      } else {
        const relativePath = path.relative(
          originalFolderPath,
          path.resolve(folderPath, filename)
        );
        returnedFileList.push(relativePath);
      }
    });
}