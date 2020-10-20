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

import { ManifestUtils } from '../lib/manifestUtils';
import { ConsoleStdOutput } from '../lib/consoleStdOutput';
import { SinonStub, stub } from 'sinon';

import { strict as assert } from 'assert';
import { ConsoleLogger } from '../lib/consoleLogger';

const TestManifest = {
    dependencies: {
        '@alexa-games/sfb-f': 'file:../sfb-f',
        '@alexa-games/sfb-skill': 'file:../sfb-skill',
        'norm': '^1.0.0'
    }
};

describe('ManifestUtils', () => {
    let getPackageVersionFromNpmStub: SinonStub<[string, any], Promise<string>> | undefined;
    let readRawPackageVersionStub: SinonStub<[], any>;

    beforeEach(() => {
        readRawPackageVersionStub = stub(ManifestUtils, 'readRawPackageVersion').callsFake(
            () => {
                return '0.5.0-alpha.3'
            });
    });

    afterEach(() => {
        if (getPackageVersionFromNpmStub) {
            getPackageVersionFromNpmStub.restore();
            getPackageVersionFromNpmStub = undefined;
        }
        readRawPackageVersionStub.restore();
    });

    it('repairPackageManifest', async () => {
        const testManifest = JSON.parse(JSON.stringify(TestManifest));

        await ManifestUtils.repairPackageManifest(testManifest);

        assert.equal(testManifest.dependencies['@alexa-games/sfb-f'], '^0.0.0', 'Should match last version.');
        assert.equal(testManifest.dependencies['@alexa-games/sfb-skill'], '^0.0.0', 'Should match last version.');
        assert.equal(testManifest.dependencies['norm'], '^1.0.0', 'Should be unchanged.');
    });

    it('repairPackageManifest ver 1', async () => {
        readRawPackageVersionStub.restore();
        readRawPackageVersionStub = stub(ManifestUtils, 'readRawPackageVersion').callsFake(
            () => {
                return '1.1.4'
            });

        const testManifest = JSON.parse(JSON.stringify(TestManifest));

        await ManifestUtils.repairPackageManifest(testManifest);

        assert.equal(testManifest.dependencies['@alexa-games/sfb-f'], '^1.0.0', 'Should match last version.');
        assert.equal(testManifest.dependencies['@alexa-games/sfb-skill'], '^1.0.0', 'Should match last version.');
        assert.equal(testManifest.dependencies['norm'], '^1.0.0', 'Should be unchanged.');
    });

    it('Multiple package versions', async () => {
        getPackageVersionFromNpmStub = stub(ManifestUtils, 'getPackageVersionsFromNpm').callsFake(async (packageName, stdOutput) => {
            return "sfb-f@0.1.0 '0.1.0'\nsfb-f@0.1.1 '0.1.1'\nsfb-f@0.2.0 '0.2.0'\nsfb-f@0.2.1 '0.2.1'\n" +
                "sfb-f@0.3.0 '0.3.0'\nsfb-f@0.4.0 '0.4.0'\nsfb-f@0.5.0 '0.5.0'\nsfb-f@0.5.1 '0.5.1'";
        })

        const version = await ManifestUtils.getLatestsMajorVersionFromNpm(
            {
                name: '@alexa-games/any-thing',
                version: '0.1.0'
            },
            new ConsoleStdOutput());

        assert.equal(version, '0.5.1', 'Should match last version.');
    });

    it('Single package version', async () => {
        getPackageVersionFromNpmStub = stub(ManifestUtils, 'getPackageVersionsFromNpm').callsFake(async (packageName, stdOutput) => {
            return "0.5.0-test.3";
        });

        const version = await ManifestUtils.getLatestsMajorVersionFromNpm(
            {
                name: '@alexa-games/any-thing',
                version: '0.1.0'
            },
            new ConsoleStdOutput());


        assert.equal(version, '0.5.0-test.3', 'Should match only version.');
    });

    it('Story package compatible', async () => {

        // This should be ok since the sfb-f version range is anything higher than 1.1.0 (but less than 2.0.0)
        ManifestUtils.checkDeploymentPackageVersionWithTooling(
            {
                dependencies: {
                    '@alexa-games/sfb-f': '^1.1.0'
                }
            },
            {
                name: '@alexa-games/sfb-cli',
                version: '1.2.3'
            },
            new ConsoleLogger());
    });

    it('Story package newer', async () => {

        // This should throw an error since the sfb-f version range is anything higher than 1.3.0 (but less than 2.0.0)
        try {
            ManifestUtils.checkDeploymentPackageVersionWithTooling(
                {
                    dependencies: {
                        '@alexa-games/sfb-f': '^1.3.0'
                    }
                },
                {
                    name: '@alexa-games/sfb-cli',
                    version: '1.2.3'
                },
                new ConsoleLogger());
            assert(false, 'Should have thrown by now.')
        } catch (e) {
            assert(e.message && e.message.indexOf('is not compatible') > 0, 'Should report not compatible.');
        }
    });

    it('Story wrong major version', async () => {

        // This should throw an error since the sfb-f version range is anything higher than 2.0.0 (but less than 3.0.0)
        try {
            ManifestUtils.checkDeploymentPackageVersionWithTooling(
                {
                    dependencies: {
                        '@alexa-games/sfb-f': '^2.0.0'
                    }
                },
                {
                    name: '@alexa-games/sfb-cli',
                    version: '1.2.3'
                },
                new ConsoleLogger());
            assert(false, 'Should have thrown by now.')
        } catch (e) {
            assert(e.message && e.message.indexOf('is not compatible') > 0, 'Should report not compatible.');
        }
    });

    it('Story coerced version compatible', async () => {
        // This should be ok since the sfb-f version range is anything higher than 1.1.0 (but less than 2.0.0)
        ManifestUtils.checkDeploymentPackageVersionWithTooling(
            {
                dependencies: {
                    '@alexa-games/sfb-f': '^1.1.0'
                }
            },
            {
                name: '@alexa-games/sfb-cli',
                version: '1.2.3-nightly.1234567' // This should be coerced into version 1.2.3
            },
            new ConsoleLogger());
    });

    it('Story coerced version newer', async () => {
        // This should throw an error since the sfb-f version range is anything higher than 1.3.0 (but less than 2.0.0)
        try {
            ManifestUtils.checkDeploymentPackageVersionWithTooling(
                {
                    dependencies: {
                        '@alexa-games/sfb-f': '^1.3.0'
                    }
                },
                {
                    name: '@alexa-games/sfb-cli',
                    version: '1.2.3-nightly.1234567' // This should be coerced into version 1.2.3
                },
                new ConsoleLogger());
            assert(false, 'Should have thrown by now.')
        } catch (e) {
            assert(e.message && e.message.indexOf('is not compatible') > 0, 'Should report not compatible.');
        }
    });

    it('Story coerced wrong major version', async () => {
        // This should throw an error since the sfb-f version range is anything higher than 2.0.0 (but less than 3.0.0)
        try {
            ManifestUtils.checkDeploymentPackageVersionWithTooling(
                {
                    dependencies: {
                        '@alexa-games/sfb-f': '^2.0.0'
                    }
                },
                {
                    name: '@alexa-games/sfb-cli',
                    version: '1.2.3-nightly.1234567' // This should be coerced into version 1.2.3
                },
                new ConsoleLogger());
            assert(false, 'Should have thrown by now.')
        } catch (e) {
            assert(e.message && e.message.indexOf('is not compatible') > 0, 'Should report not compatible.');
        }
    });
});

