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

const cmd = require('commander');
 
import { CommandFactory } from './commandFactory';
import { ConsoleLogger } from './consoleLogger';
import { ConsoleStdOutput } from './consoleStdOutput';
import { Utilities } from './utilities';
import { crashOnUnhandledRejections } from '@alexa-games/sfb-util';
import { ManifestUtils } from './manifestUtils';

crashOnUnhandledRejections();

const consoleLogger = new ConsoleLogger();
const consoleStdOutput = new ConsoleStdOutput();
const commandFactory = new CommandFactory(consoleLogger, consoleStdOutput);


cmd
    .version(ManifestUtils.readPackageVersion(consoleLogger));

cmd
    .option('-v, --verbose', 'Increase verbose output.')

cmd
    .command('new <story>')
    .option('-t, --template [templateName]', "Template name to use for new skill. Options are 'example_story', 'tutorial', 'adventure', and 'quiz'.")
    .description('story - Path to new story. Create a new story project from a template.')
    .action(async (name: string, options: any) => {
        await Utilities.wrap(cmd.verbose, () => {
            const template = options.template || "example_story";

            return commandFactory.buildNewProjectCommand(name, { template }).run();
        },
        consoleLogger);
    });

cmd
    .command('deploy <story>')
    .description('story - Path to story. Build and deploy a story to developer portal and AWS lambda.')
    .option('-o, --override', 'Override version check.')
    .option('-s, --stage [stageName]', 'Stage to deploy (i.e. dev, test, beta, prod)')
    .option('-l, --locale [localeName]', 'Locale to deploy (i.e. en-us, en-gb, fr-fr, etc.) when using different lambdas for each locale')
    .option('-d, --deployer [deployerName]', 'ASK deployer to use (cfn or lambda). Cannot be changed after deploying your skill. Default is cfn')
    .action(async (name: string, options: any) => {
        await Utilities.wrap(cmd.verbose, async () => {
            const enforceLatest = !options.override;

            if(options.stage) {
                process.env["stage"] = options.stage;
            }
            if(options.locale) {
                process.env["locale"] = options.locale;
            }

            await commandFactory.buildImportCommand(name, { enforceLatest }).run();
            await commandFactory.buildBakeCommand(name).run();
            await commandFactory.buildStageCommand(name, { deployer: options.deployer }).run();
            await commandFactory.buildStageLayerCommand(name).run();
            await commandFactory.buildDeployCommand(name).run();
            await commandFactory.buildDeployLayerCommand(name).run();
        },
        consoleLogger);
    });

cmd
    .command('deploy-metadata <story>')
    .description('story - Path to story. Build and deploy updated metadata (skill manifest and voice model) but do not deploy lambda. Useful when lambda code is large or when uploading lambda through an S3 linked zip file.')
    .option('-o, --override', 'Override version check.')
    .option('-s, --stage [stageName]', 'Stage to deploy (i.e. dev, test, beta, prod)')
    .option('-g, --skill-stage [stageName]', 'The stage of a skill (development, certified, live). Defaults to development, required for ASK 2.x')
    .option('-l, --locale [localeName]', 'Locale to deploy (i.e. en-us, en-gb, fr-fr, etc.) when using different lambdas for each locale')
    .option('-d, --deployer [deployerName]', 'ASK deployer to use (cfn or lambda). Cannot be changed after deploying your skill. Default is cfn')
    .action(async (name: string, options: any) => {
        await Utilities.wrap(cmd.verbose, async () => {
            const enforceLatest = !options.override;

            if(options.stage) {
                process.env["stage"] = options.stage;
            }
            if(options.locale) {
                process.env["locale"] = options.locale;
            }

            if(!options.skillStage) {
                options.skillStage = 'development';
            }

            await commandFactory.buildImportCommand(name, { enforceLatest }).run();
            await commandFactory.buildBakeCommand(name).run();
            await commandFactory.buildStageCommand(name, { deployer: options.deployer }).run();
            await commandFactory.buildDeployMetadataCommand(name, { skillStage: options.skillStage }).run();
        },
        consoleLogger);
    });

cmd
    .command('deploy-via-zip <story>')
    .description('story - Path to story. Build and deploy skill using a zip file transfer to S3/Lambda. Needed when on slow remote connections (because uploading to s3 is faster than aws update-function command) or when exceeding the command line 69905067 byte limit.')
    .option('-o, --override', 'Override version check.')
    .option('-s, --stage [stageName]', 'Stage to deploy (i.e. dev, test, beta, prod)')
    .option('-g, --skill-stage [stageName]', 'The stage of a skill (development, certified, live). Defaults to development, required for ASK 2.x')
    .option('-l, --locale [localeName]', 'Locale to deploy (i.e. en-us, en-gb, fr-fr, etc.) when using different lambdas for each locale')
    .option('-d, --deployer [deployerName]', 'ASK deployer to use (cfn or lambda). Cannot be changed after deploying your skill. Default is cfn')
    .action(async (name: string, options: any) => {
        await Utilities.wrap(cmd.verbose, async () => {
            const enforceLatest = !options.override;

            if(options.stage) {
                process.env["stage"] = options.stage;
            }
            if(options.locale) {
                process.env["locale"] = options.locale;
            }

            if(!options.skillStage) {
                options.skillStage = 'development';
            }

            await commandFactory.buildImportCommand(name, { enforceLatest }).run();
            await commandFactory.buildBakeCommand(name).run();
            await commandFactory.buildStageCommand(name, { deployer: options.deployer }).run();
            await commandFactory.buildDeployMetadataCommand(name, { skillStage: options.skillStage }).run();
            await commandFactory.buildUploadZipLambda(name, options.locale).run();
        },
        consoleLogger);
    });

cmd
    .command('build <story>')
    .description('story - Path to story. Build a story without deploying.')
    .option('-o, --override', 'Override version check.')
    .option('-s, --stage [stageName]', 'Stage to deploy (i.e. dev, test, beta, prod)')
    .option('-l, --locale [localeName]', 'Locale to deploy (i.e. en-us, en-gb, fr-fr, etc.) when using different lambdas for each locale')
    .option('-d, --deployer [deployerName]', 'ASK deployer to use (cfn or lambda). Cannot be changed after deploying your skill. Default is cfn')
    .action(async (name: string, options: any) => {
        await Utilities.wrap(cmd.verbose, async () => {
            const enforceLatest = !options.override;

            if(options.stage) {
                process.env["stage"] = options.stage;
            }
            if(options.locale) {
                process.env["locale"] = options.locale;
            }

            await commandFactory.buildImportCommand(name, { enforceLatest }).run();
            await commandFactory.buildBakeCommand(name).run();
            await commandFactory.buildStageCommand(name, { deployer: options.deployer }).run();
        },
        consoleLogger);
    });

cmd
    .command('simulate <story>')
    .option('-l, --locale [locale]', 'Set Locale to Simulate')
    .option('-o, --override', 'Override version check')
    .option('-q, --quiet', 'Quiet mode')
    .description('story - Path to story. Simulate a story.')
    .action(async (name: string, options: any) => {
        await Utilities.wrap(cmd.verbose, async () => {
            const locale = options.locale || "en-US";
            const quiet = !!options.quiet;
            const enforceLatest = !options.override;

            await commandFactory.buildImportCommand(name, { enforceLatest }).run();
            await commandFactory.buildBakeCommand(name).run();
            await commandFactory.buildSimulateCommand(name, { locale, quiet }).run();
        },
        consoleLogger);
    });

/*
cmd
    .command('test <story>')
    .option('-l, --locale [locale]', 'Set Locale to Simulate')
    .option('-o, --override', 'Override version check')
    .description('story - Path to story. Simulate a story.')
    .action(async (name: string, options: any) => {
        await Utilities.wrap(cmd.verbose, async () => {
            const locale = options.locale || "en-US";
            const enforceLatest = !options.override;

            await commandFactory.buildImportCommand(name, { enforceLatest }).run();
            await commandFactory.buildBakeCommand(name).run();
            await commandFactory.buildTestCommand(name, { locale }).run();
        },
        consoleLogger);
    });
*/
cmd
    .command('clean <story>')
    .description('story - Clean out the .deploy, code .dist folder, and any extra node_modules folders for the given story. Run clean when initially creating a new stage/locale to force the creation of a new skill id.')
    .action(async (name: string, options: any) => {
        await Utilities.wrap(cmd.verbose, async () => {
            await commandFactory.buildCleanCommand(name).run();
        },
        consoleLogger);
    });

cmd
    .command('upload <story>')
    .description('story - Path to story. Upload public resources to S3.')
    .action(async (name: string, options: any) => {
        await Utilities.wrap(cmd.verbose, async () => {
            await commandFactory.buildUploadResourcesCommand(name).run();
        },
        consoleLogger);
    });


cmd
    .command('vscode')
    .description('Install vscode extension for SFB editor support.')
    .action(async () => {
        await Utilities.wrap(cmd.verbose, async () => {
            await commandFactory.buildVscodeExtensionCommand().run();
        },
        consoleLogger);
    });

// error on unknown commands
cmd.on('command:*', function () {
    console.error('Invalid command: %s\nSee --help for a list of available commands.', cmd.args.join(' '));
    process.exit(1);
});

cmd
    .parse(process.argv);

if (process.argv.length === 2) {
    cmd.help();
}
