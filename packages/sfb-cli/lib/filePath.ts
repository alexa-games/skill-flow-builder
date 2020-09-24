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

import { Utilities } from './utilities';

const pathModule = require('path');


export class FilePath {
    /**
     * Resolved path
     */
    public readonly path: string;

    /**
     * This will be either / or C:\ (where C is the actual driver letter)
     */
    public readonly pathRoot: string;

    /**
     * This will be / or \ depending on the OS
     */
    public readonly delimiter: string;

    /**
     * The path split into individual directory names.
     */
    public readonly pathParts: string[];

    /**
     * Number of parts in the path.
     */
    public get length() {
        return this.pathParts.length;
    }

    private static readonly rootRegEx = /^([A-Z]:\\)/;

    constructor(path: string) {
        this.path = pathModule.resolve(path);

        this.delimiter = Utilities.isWin32 ? '\\' : '/';

        this.pathRoot = this.delimiter;

        const result = this.path.match(FilePath.rootRegEx);
        if (result && result.length > 0) {
            this.pathRoot = result[0];
        }

        if (!this.path.startsWith(this.pathRoot)) {
            throw new Error('Expected resolved path to start with ' + this.pathRoot);
        }

        const pathToSplit = path.substr(this.pathRoot.length);

        this.pathParts = pathToSplit.split(this.delimiter);
    }

    public getPartialPath(length: number) {
        if (length > this.pathParts.length) {
            throw new Error('Parameter length must not exceed length.');
        }

        if (length < 0) {
            throw new Error('Parameter length be at least 0.');
        }

        let result = this.pathRoot;
        for (let i = 0; i < length; i++) {
            if (i > 0) {
                result += this.delimiter;
            }

            result += this.pathParts[i];
        }

        return result;
    }
}
