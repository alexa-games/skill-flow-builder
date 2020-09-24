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

import * as fs from 'fs';
import * as path from 'path';
import { readUtf8FileExcludingBomSync } from '@alexa-games/sfb-util';

export class UserAgentHelper {
    static readonly packageInfo = JSON.parse(readUtf8FileExcludingBomSync(path.resolve(__dirname, "..", "package.json")));

    static createCustomUserAgent() {
        return `ag-sfb/${UserAgentHelper.packageInfo.version} Node/${process.version}`;
    }
}