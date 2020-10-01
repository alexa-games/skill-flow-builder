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
import { FilePath } from './filePath';
import { StdOutput } from './stdOutput';
import { promisify } from 'util';
import fs from 'fs';
import crypto from 'crypto';
import { readUtf8FileExcludingBom, readUtf8FileExcludingBomSync } from '@alexa-games/sfb-util';

const pathModule = require('path');

const chmodAsync = promisify(fs.chmod);
const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
const copyFileAsync = promisify(fs.copyFile);
const statAsync = promisify(fs.stat);
const renameAsync = promisify(fs.rename);

export interface CopyOptions {
    /**
     * Sets the +w bit for the current user on the destination file. On Windows, this turns off the
     * Read-Only flag.
     */
    makeDestinationWritable?: boolean;
}

export class FileUtils {

    public static async replaceInFile(file: string, searchFor: string | RegExp, replaceWith: string) {   
        const data = await readFileAsync(file, 'utf8');

        const result = data.replace(searchFor, replaceWith);

        await writeFileAsync(file, result, 'utf8');
    }

    public static async deleteDir(dirPath: string, stdOutput: StdOutput) {
        dirPath = FileUtils.fixpath(dirPath);
        
        if (fs.existsSync(dirPath)) {
            if (Utilities.isWin32) {
                await Utilities.runCommandAsync(
                    'rmdir',
                    [ '/s', '/q', `"${dirPath}"` ],
                    stdOutput,
                    {shell: true});
            } else {
                await Utilities.runCommandAsync(
                    'rm',
                    [ '-rf', `"${dirPath}"` ],
                    stdOutput,
                    {shell: true});
            }
        }
    }

    public static async moveFile(srcPath: string, dstPath: string, stdOutput: StdOutput) {
        srcPath = FileUtils.fixpath(srcPath);
        dstPath = FileUtils.fixpath(dstPath);
        
        if (fs.existsSync(srcPath)) {
            if (Utilities.isWin32) {
                await Utilities.runCommandAsync(
                    'move',
                    [srcPath, dstPath],
                    stdOutput,
                    {shell: true});
            } else {
                await Utilities.runCommandAsync(
                    'mv',
                    [srcPath, dstPath],
                    stdOutput,
                    {shell: true});
            }
        }
    }

    public static deleteFile(filePath: string) {
        filePath = FileUtils.fixpath(filePath);
        
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }

    public static async renameFileIfExists(oldPath: string, newPath: string) {
        if (fs.existsSync(oldPath)) {
            await renameAsync(oldPath, newPath);
        }
    }

    public static makeDir(dirPath: string) { 
        dirPath = FileUtils.fixpath(dirPath);
        const path = new FilePath(dirPath);

        let started = false;

        for (let i = 1; i <= path.length; i++) {
            const partialPath = path.getPartialPath(i);
            if (started || !fs.existsSync(partialPath)) {
                started = true;
                fs.mkdirSync(partialPath);
            }
        }
    }
    
    public static fixpath(path: string): string {
        // Ensure the path is a resolved and valid path.
        return pathModule.resolve(path);
    }

    public static isValidFileName(name: string) {
        return name === pathModule.basename(name);
    }

    /**
     * Converts a given fullPath to a path relative to basePath if possible, otherwise
     * fullPath is returned.
     * @param basePath Base path to use when converting fullPath relative path
     * @param fullPath Path to convert to a path relative to base path
     */
    public static getRelativePath(basePath: string, fullPath: string): string {

        const basePathr = FileUtils.fixpath(basePath);
        const fullPathr = FileUtils.fixpath(fullPath);
        
        let relativePath = fullPathr;

        if (basePathr.length + 1 < fullPathr.length) {
            const targetBasePath = fullPathr.substring(0, basePathr.length);
            if (targetBasePath === basePathr) {
                relativePath = fullPathr.substring(basePathr.length + 1);
            }
        }
        
        return relativePath;
    }

    /**
     * Copies all files from source to destination.  Use when copy() won't work.
     * @param src Source path
     * @param dst Destination
     * @param options Options that impact the copy operation
     */
    public static async recursiveCopy(src: string, dst: string, options?: CopyOptions): Promise<void> {
        // Convert \\ to / so we can handle windows paths.
        const srcPath = src.replace(/\\/g,'/').split('/');

        let sourceTargetName = srcPath[srcPath.length - 1];
        
        if (sourceTargetName.length == 0) {
            sourceTargetName = '*';
        }
        
        const sourceTargetRegex = new RegExp(`^${sourceTargetName.replace("*", "[\\s\\S]*")}$`, 'g');
        
        let parentPath = '';

        if (srcPath && srcPath.length > 0 && srcPath[0].trim().length === 0) {
            parentPath = "/";
        }

        if (srcPath.length > 1) {
            parentPath += srcPath.slice(0, srcPath.length - 1).reduce((prev, current, index) => {
                if (prev) {
                    return prev + "/" + current;
                } else {
                    if (!Utilities.isWin32 && current.trim().length == 0) {
                        return "/";
                    } else {
                        return current;
                    }
                }
            });
        }
        
        // Convert / back to \\ for Windows
        if (Utilities.isWin32) {
            parentPath = parentPath.replace(/\//g,'\\');
        }
        const files = fs.readdirSync(parentPath);

        if (!files) {
            return;
        }

        FileUtils.makeDir(dst);

        const copyPromises: Promise<void>[] = [];
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file.match(sourceTargetRegex)){
                const sourceFilePath = pathModule.join(parentPath, file);
                const destFilePath = pathModule.join(dst, file);

                const sourceStat = fs.statSync(sourceFilePath);

                if (sourceStat.isDirectory()) {
                    copyPromises.push(FileUtils.recursiveCopy(pathModule.join(sourceFilePath, '*'), destFilePath, options));
                } else if (!fs.existsSync(destFilePath) || 
                            sourceStat.mtimeMs > fs.statSync(destFilePath).mtimeMs) {
                    copyPromises.push(FileUtils.copyFile(sourceFilePath, destFilePath, options));
                }
            }
        }
        
        await Promise.all(copyPromises);
    }

    public static async copyFile(src: string, dst: string, options?: CopyOptions): Promise<void> {
        
        await copyFileAsync(src, dst);

        if (options && options.makeDestinationWritable) {
            const stat = await statAsync(dst);
            await chmodAsync(dst, stat.mode | 0o600);
        }
    }

    public static writeGitIgnore(path: string) {
        fs.writeFileSync(pathModule.join(path, '.gitignore'),
`dist
.deploy
node_modules
`
        )
    }

    public static async filterFile(fileName: string, eliminate: RegExp): Promise<void> {
        const data = await readUtf8FileExcludingBom(fileName);

        let result = '';

        for (let line of data.split('\n')) {
            if (!line.match(eliminate)) {
                result += line + '\n';
            }
        }
        
        await writeFileAsync(fileName, result, 'utf8');
    }

    /**
     * Reads and parses a JSON file. Use this instead of require for JSON files.
     * @param filePath Path to JSON file to read.
     */
    public static loadJson(filePath: string): any {
        const data = readUtf8FileExcludingBomSync(filePath);

        return JSON.parse(data);
    }

    /**
     * Returns a base64 encoded string of the sha256 hash of a file.
     * @param dirRootPath Path to directory of file to read
     * @param fileName Name of the file to read
     */
    public static createFileHash(dirRootPath: string, fileName: string): Promise<string> {
        const filePath = pathModule.join(dirRootPath, fileName);
    
        return new Promise((resolve, reject) => {
            const shasum = crypto.createHash('sha256');
            fs.createReadStream(filePath)
            .on('data', (chunk: Buffer) => {
              shasum.update(chunk);
            })
            .on('end', () => {
                resolve(shasum.digest('base64'));
            })
            .on('error', (err) =>  {
              reject(err);
            });
        });
    }

}
