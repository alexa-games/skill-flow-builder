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
import { StringDecoder } from 'string_decoder';
import semver from 'semver';
import pathModule from 'path';
import { FileUtils } from './fileUtils';
import { Utilities } from './utilities';
import { StdOutput } from './stdOutput';
import { RuntimeDependencyVersion } from './runtimeDependencyVersion';

export interface PackageMetadata {
    name: string;
    version: string;
}

export class ManifestUtils {

    /**
     * Pulls the package version from the currently running script. Will not throw an exception
     * but will return 'unknown' if there are any errors.
     * @param logger Logger for recording errors.
     */
    public static readPackageVersion(logger: Logger): string {
        try {
            return ManifestUtils.readRawPackageVersion();
        } catch (e) {
            logger.error(e);
            return 'unknown';
        }
    }

    /**
     * Returns the package version of the currently running script. May throw if there are any 
     * errors.
     */
    public static readRawPackageVersion(): string {
        const data = ManifestUtils.readRawPackageNameVersion();
        return data.version;
    }

    /**
     * Returns the package of the currently running script. May throw if there are any 
     * errors.
     */
    public static readRawPackageNameVersion(): PackageMetadata {
        const packagePath = pathModule.join(__dirname, '..', '..', 'package.json');
        const data = FileUtils.loadJson(packagePath);
        return {
            version: data.version,
            name: data.name
        };
    }
    
    /**
     * Converts any dependencies using file:.. references to use compatible versions from
     * the NPM repository.
     * @param manifest Manifest to modify, typically loaded from a package.json file.
     */
    public static async repairPackageManifest(manifest: any) {
        const currentVersion = ManifestUtils.readRawPackageVersion();
        const dependencyVersion = RuntimeDependencyVersion.getDependencyRangeFromToolingVersion(currentVersion);

        const token = 'file:../';

        for (let dep of Object.keys(manifest.dependencies)) {
            const value = manifest.dependencies[dep];

            if (value && value.startsWith(token)) {
                manifest.dependencies[dep] = dependencyVersion;
            }
        }
    }

    /**
     * Returns the latest major version of the supplied package by name/version.
     * @param nameVersion A name/version tuple
     * @param stdOutput Output for reporting errors 
     */
    public static async getLatestsMajorVersionFromNpm(
        nameVersion: PackageMetadata,
        stdOutput: StdOutput) {

        const version = semver.parse(nameVersion.version);
        if (!version) {
            throw new Error(`Unable to parse version '${nameVersion.version}'.`);
        }

        // e.g. @alexa-games/sfb-f@1.*
        const packageRange = `${nameVersion.name}@${version.major}.*`;
        return await ManifestUtils.getLatestPackageVersionFromNpm(packageRange, stdOutput);
    }

    /**
     * Queries NPM (online) for package versions.
     * @param packageRange Package name or a string like pkg-name@1.2.* to get all versions starting with 1.2.
     * @param stdOutput Output for reporting errors.
     */
    public static async getLatestPackageVersionFromNpm(packageRange: string, stdOutput: StdOutput) {

        // Query all versions that are the same as our current tooling major version.
        const livePkgVersion = await ManifestUtils.getPackageVersionsFromNpm(packageRange, stdOutput);

        // If the regex does not match, we will assume we got back a single version
        // and so initialize pkgVersion equal to the single version
        let pkgVersion = livePkgVersion;

        const versionRegex = /\s+'(.*)'/gm;

        // Loop through all matching values, keeping only the final one which will
        // be the most recent version.
        let match = versionRegex.exec(livePkgVersion);
        while (match && match.length > 1) {
            pkgVersion = match[1];
            match = versionRegex.exec(livePkgVersion);
        }

        return pkgVersion;
    }

    public static async getPackageVersionsFromNpm(packageRange: string, stdOutput: StdOutput) {
        let result = '';
        const decoder = new StringDecoder('utf8');
        const outputCapture = {
            stdOut: function(chunk: Buffer | string | any) {
                if (typeof chunk === 'string') {
                    result += chunk;
                } else {
                    result += decoder.write(chunk);
                }
            },
            stdErr: function(chunk: Buffer | string | any) {
                stdOutput.stdErr(chunk);
            }
        }

        await Utilities.runCommandAsync('npm', ['view', packageRange, 'version'],
            outputCapture, { shell: true });

        return result.trim();
    }

    /**
     * Checks that the tooling it compatible with the story package.json file.
     * @param manifest Package.json file loaded from the story's code folder.
     * @param toolingMetadata Name and version of the currently running tooling.
     */
    public static checkDeploymentPackageVersionWithTooling(manifest: any, toolingMetadata: PackageMetadata, logger: Logger) {
        const frameworkName = '@alexa-games/sfb-f';
        const versionRangeExpression = manifest.dependencies[frameworkName];

        if (!versionRangeExpression) {
            throw new Error(`Cannot find required dependency ${frameworkName}.`);
        }

        const versionRange = semver.validRange(versionRangeExpression);
        if (!versionRange) {
            logger.warning(`Found invalid version range expression ${versionRangeExpression} for ${frameworkName}.`);
            return;
        }

        if (!semver.satisfies(toolingMetadata.version, versionRange)) {
            throw new Error(`Skill Flow Builder version ${toolingMetadata.version} is not compatible ` + 
            `because story's package.json specifies ${versionRangeExpression} for ${frameworkName}.`);
        }
    }

}