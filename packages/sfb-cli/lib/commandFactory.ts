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

import { Command } from './command';
import { ConsoleLogger } from './consoleLogger';
import { ConsoleStdOutput } from './consoleStdOutput';
import { BakeCommand } from './bakeCommand';
import { DeployCommand } from './deployCommand';
import { DeployMetadataCommand } from './deployMetadataCommand';
import { UploadZipLambdaCommand } from './uploadZipLambdaCommand';
import { ImportCommand } from './importCommand';
import { Logger } from './logger';
import { NewProjectCommand } from './newProjectCommand';
import { SimulateCommand } from './simulateCommand';
import { TestCommand } from './testCommand';
import { StageCommand } from './stageCommand';
import { CleanCommand } from './cleanCommand';
import { StdOutput } from './stdOutput';
import { UploadResourcesCommand } from './uploadResourcesCommand';
import { VscodeExtensionCommand } from './vscodeExtensionCommand';
import { StageLayerCommand } from './stageLayerCommand';
import { DeployLayerCommand } from './deployLayerCommand';

export interface DeployMetadataOptions {
    skillStage: string;
}

export interface BuildOptions {
    enforceLatest: boolean;
}

export interface NewProjectOptions {
    template: string;
}

export interface SimulateOptions {
    locale: string;
    quiet: boolean;
}

export interface StageOptions {
    deployer: string;
}

export interface TestOptions {
    locale: string;
}

export class CommandFactory {

    private readonly logger: Logger;
    private readonly stdOutput: StdOutput;

    constructor(
        logger?: Logger,
        stdOutput?: StdOutput) {

        this.logger = logger ? logger : new ConsoleLogger();
        this.stdOutput = stdOutput ? stdOutput : new ConsoleStdOutput();
    }

    public buildBakeCommand(storyPath: string): Command {
        return new BakeCommand(storyPath, this.logger);
    }

    public buildDeployCommand(storyPath: string): Command {
        return new DeployCommand(storyPath, this.logger, this.stdOutput);
    }

    public buildDeployMetadataCommand(storyPath: string, options: DeployMetadataOptions): Command {
        return new DeployMetadataCommand(storyPath, options.skillStage, this.logger, this.stdOutput);
    }

    public buildUploadZipLambda(storyPath: string, locale: string): Command {
        return new UploadZipLambdaCommand(storyPath, this.logger, locale, this.stdOutput);
    }

    public buildImportCommand(storyPath: string, options: BuildOptions): Command {
        return new ImportCommand(storyPath, options.enforceLatest, this.logger, this.stdOutput);
    }

    public buildNewProjectCommand(storyPath: string, options: NewProjectOptions): Command {
        return new NewProjectCommand(storyPath, options.template, this.logger, this.stdOutput);
    }

    public buildSimulateCommand(storyPath: string, options: SimulateOptions): Command {
        return new SimulateCommand(storyPath, options.locale, options.quiet, this.logger);
    }

    public buildTestCommand(storyPath: string, options: TestOptions): Command {
        return new TestCommand(storyPath, options.locale, this.logger);
    }

    public buildStageCommand(storyPath: string, options: StageOptions): Command {
        return new StageCommand(storyPath, options.deployer, this.logger, this.stdOutput);
    }

    public buildCleanCommand(storyPath: string): Command {
        return new CleanCommand(storyPath, this.logger, this.stdOutput);
    }

    public buildUploadResourcesCommand(storyPath: string): Command {
        return new UploadResourcesCommand(storyPath, this.logger, this.stdOutput);
    }

    public buildVscodeExtensionCommand(): Command {
        return new VscodeExtensionCommand(this.logger, this.stdOutput);
    }

    public buildStageLayerCommand(storyPath: string): Command {
        return new StageLayerCommand(storyPath, this.logger, this.stdOutput);
    }

    public buildDeployLayerCommand(storyPath: string): Command {
        return new DeployLayerCommand(storyPath, this.logger, this.stdOutput);
    }
}
