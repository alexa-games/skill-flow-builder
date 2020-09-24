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

const fs = require('fs');
const chalk = require('chalk');
const spawn = require('child_process').spawnSync;
const program = require('commander');


program
    .version('1.0')
    .option('-v, --verbose', 'Verbose mode')
    .option('-c, --clean', 'Clean before building.')
    .option('--coverage', 'Run code coverage report.')
    .option('-s, --skip-build', 'Skips the build step.')
    .option('--skip-editor', 'Skips building the editor.')
    .option('--skip-tests', 'Skips running tests.')
    .parse(process.argv);

// Dependency ordered list of modules
files = [
    'sfb-util',
    'sfb-polly',
    'sfb-f',
    'sfb-test',
    'sfb-skill',
    'sfb-vscode-extension',
    'sfb-story-debugger',
    'sfb-cli'
];

if (!program.skipEditor) {
    files = files.concat('sfb-editor');
}

if (program.clean) {
    repeatCommandPerDirectory(files, program.verbose,
        'npm run clean && npx rimraf node_modules',
        'Cleaning...', 'Clean finished', 'Clean failed.')
}

if (program.coverage) {
    if (!program.skipBuild) {
        process.exitCode = repeatCommandPerDirectory(files, false,
            'npx yarn install && npm run compile',
            'Building before running Coverage Report...', 'Building before running Coverage Report finished', 'Building before running Coverage Report failed.');
    }

    // Running build first, then coverages all together so they appear next to each other in verbose output mode
    process.exitCode = repeatCommandPerDirectory(files, true,
        'npm run coverage',
        'Building Coverage Report...', 'Build and Coverage Report finished', 'Build and Coverage Report failed.');

} else if (!program.skipBuild) {
    const cmd = `npx yarn install && npm run compile${program.skipTests ? '' : ' && npm run test'} && npx rimraf node_modules && npx rimraf yarn.lock`;
    process.exitCode = repeatCommandPerDirectory(files, program.verbose,
        cmd, 'Building...', 'Build finished', 'Build failed.')
}


function repeatCommandPerDirectory(directoryList, verbose, command, startingMessage, successMessage, failedMessage) {

    const failureList = []

    const spawnOutput = verbose ? 'inherit' : null;

    const totalStartTime = Date.now();

    directoryList.forEach(file => {
        const stat = fs.lstatSync(file);
        if (stat.isDirectory()) {
            console.log(`  ${file}: ${startingMessage}...`)
            const startTime = Date.now();
            const code = spawn(`cd ${file} && ${command}`, {
                stdio: spawnOutput,
                shell: true
            });

            let duration = Date.now() - startTime;

            if (code.status != 0) {
                console.log(chalk.red('✘ ') + `${file}: ` + chalk.red(failedMessage));
                failureList.push(file);
            } else {
                console.log(chalk.green('✔ ') + `${file}: ` + chalk.green(successMessage) + ` in ${duration} ms.`);
            }
        }
    });

    const totalDuration = Date.now() - totalStartTime;
    console.log(`Finished in ${totalDuration} ms.`);

    if (failureList.length > 0) {
        console.error(chalk.red('There were failures: ' + failureList))
        return 1;
    }

    return 0;
}
