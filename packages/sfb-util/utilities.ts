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

// Alexa-Util Module. Useful Alexa functions for any Alexa Games skill. Put those things in here please if they don't fit in any other module.

import * as fs from 'fs';

export function escapeRegExp(str: string) {
	return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

export function readUtf8FileExcludingBom(path: fs.PathLike | number): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        fs.readFile(
            path,
            { encoding: 'utf8' },
            (err: any, data: string) => {
                if (err) {
                    reject(err);
                } else {
                    const content = stripBom(data);
                    resolve(content);
                }
            });
        });
}

export function readUtf8FileExcludingBomSync(path: fs.PathLike | number): string {
    const data = fs.readFileSync(path, { encoding: 'utf8' });
    return stripBom(data);
}

function stripBom(content: string): string {
    if (content.charCodeAt(0) === 0xFEFF) {
        return content.slice(1);
    } else {
        return content;
    }
}

export function sanitizeCommandLineParameter(parameterValue: string | number): string {
    if (parameterValue === null || parameterValue === undefined) {
        throw new Error('parameterValue must have a value');
    }
    return parameterValue.toString().replace(/[\\"'${}\r\n]/g, '');
}