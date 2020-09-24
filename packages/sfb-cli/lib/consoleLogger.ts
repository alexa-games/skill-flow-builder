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

import { Logger } from './logger';
import chalk from 'chalk';

export class ConsoleLogger implements Logger {
    private silent: boolean;

    public constructor(silent = false) {
        this.silent = silent;
    }

    public success(message: string) {
        if (this.silent) {
            return;
        }
        console.log(chalk.green(`✔ ${message}`));
    }

    public status(message: string) {
        if (this.silent) {
            return;
        }
        console.log(`  ${message}`);
    }

    public warning(message: string) {
        if (this.silent) {
            return;
        }
        console.warn(chalk.yellow(`  ${message}`));
    }

    public failure(message: string) {
        if (this.silent) {
            return;
        }
        console.log(chalk.red.bgWhite(`✘ ${message}`));
    }

    public error(message: string) {
        if (this.silent) {
            return;
        }
        console.log(chalk.red.bgWhite(`  ${message}`));
    }
}
