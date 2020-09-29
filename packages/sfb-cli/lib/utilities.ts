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

import { spawn } from 'child_process';
import { FileUtils } from './fileUtils';
import { Logger } from './logger';
import { StdOutput } from './stdOutput';
import {
    SpecialPaths,
    ConfigPaths,
    SKILL_MANIFEST_FILE,
    ASK_RESOURCES_FILE,
    STORED_ASK_CONFIG_FILE,
    ASK_CONFIG_FILE,
    ASK_STATES_FILE,
    CLOUDFORMATION_TEMPLATE,
} from './specialPaths';
import * as fs from 'fs';
import * as pathModule from 'path';
import * as readline from 'readline';
import * as semver from 'semver';

export class Utilities {

    public static async promptAndWaitForAnswer() {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        for await (const line of rl) {
            return line.trim();
        }
    }

    public static async createYesNoPrompt(): Promise<boolean | null> {
        const answer = await Utilities.promptAndWaitForAnswer();
        if (answer == null) {
            return null;
        }
        if (['y', 'yes'].includes(answer.toLowerCase())) {
            return true;
        }
        if (['n', 'no'].includes(answer.toLowerCase())) {
            return false;
        }
        return await Utilities.createYesNoPrompt();
    }

    /**
     * Run an ASK CLI command. If the supported version is not installed,
     * install it for one-time use using NPX, and then run the command.
     */
    public static async runAskCommandInDirectoryAsync(
        params: string[],
        directory: string,
        stdOutput: StdOutput,
        options: any,
        interactiveInput?: string[],
    ) {
        if (await Utilities.isSupportedAskVersion(directory, stdOutput)) {
            return await Utilities.runCommandInDirectoryAsync(
                'ask',
                params,
                directory,
                stdOutput,
                options,
                interactiveInput,
            );
        }

        return await Utilities.runCommandInDirectoryAsync(
            Utilities.npxBin,
            ['ask-cli@^2.x.x', ...params],
            directory,
            stdOutput,
            options,
            interactiveInput,
        );
    }

    /**
     * @return {true} if supported version of ASK CLI is installed
     * @return {false} if a different version is intalled
     * @return {null} if ASK CLI is not installed
     */
    private static async isSupportedAskVersion(directory: string, stdOutput: StdOutput) {
        let version;
        try {
            version = (await Utilities.runCommandInDirectoryAsync(
                'ask',
                ['--version'],
                directory,
                stdOutput,
                {shell: true},
            ))[0];
        } catch (error) {
            return null;
        }

        return semver.satisfies(version, '2.x.x');
    }

    public static async runCommandInDirectoryAsync(
        command: string,
        params: string[],
        directory: string,
        stdOutput: StdOutput,
        options: any,
        interactiveInput?: string[]) {

        return await this.runCommandAsyncInternal({
            command,
            params,
            directory,
            stdOutput,
            options,
            interactiveInput,
        });
    }

    public static async runCommandAsync(
        command: string,
        params: string[],
        stdOutput: StdOutput,
        options: any,
        interactiveInput?: string[]) {

        return await this.runCommandAsyncInternal({
            command,
            params,
            stdOutput,
            options,
            interactiveInput,
        });
    }

    public static async wrap<T>(
        verbose: boolean,
        f: () => Promise<T>,
        logger: Logger) {
        try {
            await f();
        } catch (e) {
            if (verbose || !('message' in e)) {
                logger.failure(`${JSON.stringify(e)}`);
                const error = e as Error;
                if (error && error.stack) {
                    logger.error(error.stack);
                }
            } else {
                logger.failure(e.message);
            }
        }
    }

    public static get isWin32() {
        return process.platform === "win32";
    }

    public static get npmBin() {
        return 'npm';
    }

    public static get yarnBin() {
        return 'yarn';
    }

    public static get npxBin() {
        return 'npx';
    }

    public static get awsBin() {
        return 'aws';
    }

    public static get eol() {
        return this.isWin32 ? "\r\n" : "\n";
    }

    private static runCommandAsyncInternal(
        {
            command,
            params,
            directory = undefined,
            stdOutput,
            options = {},
            interactiveInput = [],
        } :
        {
            command: string,
            params: string[],
            directory?: string,
            stdOutput: StdOutput,
            options?: any,
            interactiveInput?: string[],
        }): Promise<string[]> {

        return new Promise<string[]>((resolve, reject) => {
            let error: Error | undefined = undefined;
            const spawnOptions: any = Object.assign({}, options);

            if (directory) {
                if (!fs.existsSync(directory)) {
                    reject(new Error(`Directory ${directory} not found.`));
                }

                spawnOptions.cwd = directory;
            }

            const child = spawn(command, params, spawnOptions);

            child.on('error', (err: Error) => {
                error = err;
            });
            const inputList: string[] = [...interactiveInput];
            const allData : string[] = [];
            child.stdout.on('data', async (data) => {
                allData.push(data.toString());
                if (inputList.length) {
                    // If the interactive prompting command decides to flush the
                    // input at the next command, we need to wait before
                    // answering the prompt again.
                    await new Promise((resolve) => setTimeout(resolve, 1000));

                    const input = inputList.shift();
                    if (!input) {
                        child.stdin.write('\n');
                        return;
                    }
                    child.stdin.write(`${input}\n`);
                    return;
                }
                allData.push(data.toString());
                stdOutput.stdOut(data);
            });

            child.stderr.on('data', (data) => {
                stdOutput.stdErr(data);
            });

            child.on('close', (code) => {
                if (error) {
                    reject(error);
                } else {
                    if (code !== 0) {
                        reject(new Error(`${command} ${params.join(' ')} non-zero return code: ${code}`));
                    } else {
                        resolve(allData);
                    }
                }
            });
        });
    }

    /**
     * Copy all metadata files used by ASK CLI from the SFB metadata directory
     * into the build artifact directory used by ASK CLI to deploy.
     *
     * The SFB metadata directory is only generated on first successful build.
     * Some files are generated on first successful deploy.
     */
    public static async restoreAskMetadata(dirs: SpecialPaths, configPaths: ConfigPaths) {
        // skill.json
        await Utilities.copyIfPresent(
            pathModule.join(dirs.metaDataStoragePath, SKILL_MANIFEST_FILE),
            SpecialPaths.getStagedSkillManifestFilePath(configPaths),
        );

        // skill-stack.yaml (used for ASK CLI v2)
        await Utilities.copyIfPresent(
            pathModule.join(dirs.metaDataStoragePath, CLOUDFORMATION_TEMPLATE),
            pathModule.join(configPaths.cloudFormationDeployerPath, CLOUDFORMATION_TEMPLATE),
        );

        // ask-states.json (used for ASK CLI v2)
        await Utilities.copyIfPresent(
            pathModule.join(dirs.metaDataStoragePath, ASK_STATES_FILE),
            pathModule.join(configPaths.askConfigPath, ASK_STATES_FILE),
        );

        // ask-resources.json (used for ASK CLI v2)
        if (await Utilities.copyIfPresent(
            pathModule.join(dirs.metaDataStoragePath, ASK_RESOURCES_FILE),
            pathModule.join(configPaths.askSkillFullPath, ASK_RESOURCES_FILE),
        )) {
            return;
        };

        // ask_config (used for ASK CLI v1)
        await Utilities.copyIfPresent(
            pathModule.join(dirs.metaDataStoragePath, STORED_ASK_CONFIG_FILE),
            pathModule.join(configPaths.askConfigPath, ASK_CONFIG_FILE),
        );
    }

    /**
     * After ASK CLI deploys the skill from the SFB build artifacts,
     * it creates or modifies some files into the build artifact directory.
     * This method copies these files into the SFB project metadata directory,
     * so that they could be referenced in the next deployment.
     */
    public static async preserveAskMetadata(dirs: SpecialPaths, configPaths: ConfigPaths, logger: Logger) {
        // skill.json
        logger.status(`Storing away ${SKILL_MANIFEST_FILE} for next deployment...`);
        await Utilities.copyIfPresent(
            SpecialPaths.getStagedSkillManifestFilePath(configPaths),
            pathModule.join(dirs.metaDataStoragePath, SKILL_MANIFEST_FILE),
        );

        // Note that we don't preserve the CloudFormation file,
        // since deployments do not ever modify that file

        // ask-states.json (used for ASK CLI v2)
        logger.status(`Storing away ${ASK_STATES_FILE} for next deployment...`);
        await Utilities.copyIfPresent(
            pathModule.join(configPaths.askConfigPath, ASK_STATES_FILE),
            pathModule.join(dirs.metaDataStoragePath, ASK_STATES_FILE),
        );

        // ask-resources.json (used for ASK CLI v2)
        logger.status(`Storing away ${ASK_RESOURCES_FILE} for next deployment...`);
        if (await Utilities.copyIfPresent(
            pathModule.join(configPaths.askSkillFullPath, ASK_RESOURCES_FILE),
            pathModule.join(dirs.metaDataStoragePath, ASK_RESOURCES_FILE),
        )) {
            return;
        }

        // ask_config (used for ASK CLI v1)
        logger.status('Storing away .ask/config for next deployment...');
        await Utilities.copyIfPresent(
            pathModule.join(configPaths.askConfigPath, ASK_CONFIG_FILE),
            pathModule.join(dirs.metaDataStoragePath, STORED_ASK_CONFIG_FILE),
        );
    }

    public static async copyIfPresent(sourceFile: string, destinationFile: string) {
        if (!fs.existsSync(sourceFile)) {
            return false;
        }

        FileUtils.makeDir(pathModule.dirname(destinationFile));
        await FileUtils.copyFile(sourceFile, destinationFile);
        return true;
    }

    public static async zipDirectory(dirPath: string, dirName: string, zipName: string, stdOutput: StdOutput) {
        dirPath = FileUtils.fixpath(dirPath);

        if (Utilities.isWin32) {
            await Utilities.runCommandInDirectoryAsync(
                "7z",
                [ 'a', '-r', zipName, dirName],
                dirPath,
                stdOutput,
                {shell: true});
        } else {
            await Utilities.runCommandInDirectoryAsync(
                "zip",
                [ '-rg', '-D', '-X', zipName, dirName],
                dirPath,
                stdOutput,
                {shell: true});
        }

    }

}
