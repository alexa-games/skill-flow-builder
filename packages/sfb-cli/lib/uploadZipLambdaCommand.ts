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


const pathModule = require('path');
const fs = require('fs');

import { FileUtils } from './fileUtils';
import { Utilities } from './utilities';
import { SpecialPaths, ASK_STATES_FILE } from './specialPaths';
import { ConfigAccessor } from '@alexa-games/sfb-skill';
import { Logger } from './logger';
import { StdOutput } from './stdOutput';
import { Command } from './command';

/**
 * Run this to zip the contents of your skill and then upload to S3, then invokes copy from S3 to Lambda.
 * Useful when default Lambda update-function command is slow for your connection or when it exceeds its command line file limit.
 */
export class UploadZipLambdaCommand implements Command {

    constructor(
        private readonly storyPath: string,
        private readonly logger: Logger,
        private readonly locale: string,
        private readonly stdOutput: StdOutput) {
    }

    public async run() {
        this.logger.status("Zipping and Uploading Lambda...");

        let startTime = Date.now();

        const dirs = new SpecialPaths(this.storyPath);

        const config = await ConfigAccessor.loadConfigFile(dirs.abcConfig, dirs.builtResourcesPath);

        const configDirs = dirs.getConfigDirectories(config);

        const askProfileName = config.getValue("ask-profile-name");

        const lambdaCodeDeployPath = SpecialPaths.getLambdaCodeDeployPath(configDirs);


        const askStatesFilePath = pathModule.join(configDirs.askConfigPath, ASK_STATES_FILE);

        let lambdaFunctionArn;
        const askStates = FileUtils.loadJson(askStatesFilePath);
        if (!askStates.profiles[askProfileName]) {
            throw new Error(`ASK profile '${askProfileName} missing from ${askStatesFilePath}`);
        }
        const askProfile = askStates.profiles[askProfileName];
        if (!askProfile.skillInfrastructure || !askProfile.skillInfrastructure['@ask-cli/lambda-deployer']) {
            throw new Error('deploy-via-zip is only supported for skills deployed with lambda-deployer');
        }
        const skillInfrastructure = askProfile.skillInfrastructure['@ask-cli/lambda-deployer'];
        if (!skillInfrastructure.deployState
            || !skillInfrastructure.deployState.default
            || !skillInfrastructure.deployState.default.lambda
            || !skillInfrastructure.deployState.default.lambda.arn) {
                throw new Error(`skillInfrastructure is missing lambda ARN information in ${askStatesFilePath}`);
        }
        lambdaFunctionArn = skillInfrastructure.deployState.default.lambda.arn;

        await Utilities.runCommandInDirectoryAsync(
            Utilities.npxBin,
            [ 'rimraf', 'index.zip' ],
            dirs.storyPath,
            this.stdOutput,
            {shell: true});

            if(Utilities.isWin32) {
                await Utilities.runCommandInDirectoryAsync(
                    "7z",
                    [ 'a', '-r', 'index.zip', lambdaCodeDeployPath + "\\*" ],
                    dirs.storyPath,
                    this.stdOutput,
                    {shell: true});
            } else {
                await Utilities.runCommandInDirectoryAsync(
                    "zip",
                    [ '-rg', 'index.zip', lambdaCodeDeployPath],
                    dirs.storyPath,
                    this.stdOutput,
                    {shell: true});
            }

        const s3BucketName = config.getS3BucketName(this.locale);
        const skillDirectoryName = configDirs.askSkillDirectoryName;

        await Utilities.runCommandInDirectoryAsync(
            Utilities.npxBin,
            [ 'aws', 's3', 'cp', './index.zip', `s3://${s3BucketName}/lambda-zips/${skillDirectoryName}/`, '--profile', askProfileName ],
            dirs.storyPath,
            this.stdOutput,
            {shell: true});

        let region = config.getValue("aws-region");
        if(!region) {
            region = "us-east-1";
            this.logger.status(`Defaulting to S3 AWS Region ${region} because 'aws-region' config not set in your abcConfig.json file.`);
        }

        await Utilities.runCommandInDirectoryAsync(
            Utilities.npxBin,
            [ 'aws', 'lambda', 'update-function-code', "--function-name", lambdaFunctionArn, "--region", region, "--s3-bucket", s3BucketName, "--s3-key", `lambda-zips/${skillDirectoryName}/index.zip`, '--profile', askProfileName ],
            dirs.storyPath,
            this.stdOutput,
            {shell: true});


        let duration = Date.now() - startTime;

        this.logger.success(`Zip and Upload finished in ${duration} ms.`);
    }

}
