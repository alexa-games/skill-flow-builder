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

import semver from 'semver';

/**
 * The major version for all modules on SFB will match, however the minor versions can vary. 
 * The package.json files used by the runtime environment specify a version range for sfb-f and sfb-skill.
 * Normally, we will specify a range of x.0.0 to the highest available (x.x.x). However, we can
 * envision some cases where we want to indicate minor version higher than 0.  For example, if 
 * we have introduced some new functionality in version 1.5.0, we want to ensure that 1.5.0 is the 
 * lowest version of sfb-f and sfb-skill.  This class implements that logic. 
 */
export class RuntimeDependencyVersion {
    private static readonly MinorVersionMap = {
        '0': 0,
        '1': 0,
        '2': 0
    };
    
    public static getDependencyRangeFromToolingVersion(toolingVersionExpression: string) {
        const toolingVersion = semver.parse(toolingVersionExpression);
        if (!toolingVersion) {
            throw new Error(`Unable to parse version ${toolingVersionExpression}.`);
        }

        let minorVersion = (RuntimeDependencyVersion.MinorVersionMap as any)[toolingVersion.major.toString()];
        if (!minorVersion) {
            // If we go beyond the map, default to 0.
            minorVersion = '0';
        }

        return `^${toolingVersion.major}.${minorVersion}.0`;
    }
}