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

import {PollyRequestItem, PollyOutFormat, PollyUtil} from './../pollyUtil';
import {S3AudioAccessor} from './../audioAccessor/s3AudioAccessor';
import {AudioFileAccessor} from './../audioAccessor/audioFileAccessor';
import {S3, Polly, SharedIniFileCredentials, config} from 'aws-sdk';
import { strict as assert } from 'assert';
import * as fs from 'fs';
import * as path from 'path';

describe("Polly utility integration test", function () {
    before(async () => {
        const workingDir = path.resolve(".", ".out");
        if (!fs.existsSync(workingDir)) {
            fs.mkdirSync(workingDir);
        }
    });

    it("synthesize polly and download file with AWS Profile Name.", async function () {
        PollyUtil.configurePolly({
            awsProfileName: "default",
            awsRegion: "us-east-1"
        });

        const outDir = path.resolve('.', '.out');
        const testFileName = 'synthesize_test.mp3';

        const audioFileAccessor = new S3AudioAccessor({
            bucketName: "sfb-example/tempPolly",
            s3DomainName: "s3.amazonaws.com",
            audioWorkingDir: outDir
        });

        const util = new PollyUtil(audioFileAccessor);

        await util.synthesize({
            delayMs: 0,
            engine: "standard",
            name: "Joanna",
            pitch: "+0%",
            rate: "100%",
            text: "<speak>hello this is a test synthesize.</speak>",
            volume: "1.0"
        }, outDir, testFileName);

        const resultPath = path.resolve(outDir, testFileName);
        assert.equal(fs.existsSync(resultPath), true, `Generated test file '${resultPath}' not found.`);
    });

    it("synthesize polly and download file with pitch & rate change.", async function () {
        PollyUtil.configurePolly({
            awsProfileName: "default",
            awsRegion: "us-east-1"
        });

        const outDir = path.resolve('.', '.out');
        const testFileName = 'synthesize_test_pitched.mp3';

        const audioFileAccessor = new S3AudioAccessor({
            bucketName: "sfb-example/tempPolly",
            s3DomainName: "s3.amazonaws.com",
            audioWorkingDir: outDir
        });

        const util = new PollyUtil(audioFileAccessor);

        await util.synthesize({
            delayMs: 0,
            engine: "standard",
            name: "Joanna",
            pitch: "+10%",
            rate: "120%",
            text: "<speak>hello this is a test synthesize.</speak>",
            volume: "1.0"
        }, outDir, testFileName);

        const resultPath = path.resolve(outDir, testFileName);
        assert.equal(fs.existsSync(resultPath), true, `Generated test file '${resultPath}' not found.`);
    });

    it("synthesize without <speak> tag.", async function () {
        PollyUtil.configurePolly({
            awsProfileName: "default",
            awsRegion: "us-east-1"
        });

        const outDir = path.resolve('.', '.out');
        const testFileName = 'synthesize_no_speak.mp3';

        const audioFileAccessor = new S3AudioAccessor({
            bucketName: "sfb-example/tempPolly",
            s3DomainName: "s3.amazonaws.com",
            audioWorkingDir: outDir
        });

        const util = new PollyUtil(audioFileAccessor);

        await util.synthesize({
            delayMs: 0,
            engine: "standard",
            name: "Joanna",
            pitch: "+0%",
            rate: "100%",
            text: "hello this is a test synthesize.",
            volume: "-6dB"
        }, outDir, testFileName);

        const resultPath = path.resolve(outDir, testFileName);
        assert.equal(fs.existsSync(resultPath), true, `Generated test file '${resultPath}' not found.`);
    });

    it("estimate non audio tag duration.", async function () {
        PollyUtil.configurePolly({
            awsRegion: "us-east-1",
            awsProfileName: "default"
        });

        const outDir = path.resolve('.', '.out');
        const testFileName = 'synthesize_test.mp3';

        const audioFileAccessor = new S3AudioAccessor({
            bucketName: "sfb-example/tempPolly",
            s3DomainName: "s3.amazonaws.com",
            audioWorkingDir: outDir
        });

        const util = new PollyUtil(audioFileAccessor);

        await util.estimateSSMLDuration("This is my SSML text here. <audio src='https://sfb-framework.s3.amazonaws.com/examples/sounds/Trumpet_1.mp3' /> Yay!", outDir);
    });

    it("estimate non audio tag duration invalid ssml request.", async function () {
        PollyUtil.configurePolly({
            awsRegion: "us-east-1",
            awsProfileName: "default"
        });

        const outDir = path.resolve('.', '.out');
        const testFileName = 'synthesize_test.mp3';

        const audioFileAccessor = new S3AudioAccessor({
            bucketName: "sfb-example/tempPolly",
            s3DomainName: "s3.amazonaws.com",
            audioWorkingDir: outDir
        });

        const util = new PollyUtil(audioFileAccessor);

        try {
            await util.estimateSSMLDuration("<spebroken>This is my SSML text here. <audio src='https://sfb-framework.s3.amazonaws.com/examples/sounds/Trumpet_1.mp3' /> Yay!", outDir);
        } catch(err) {
            assertIncludes(err.message, "Invalid SSML request");
        }
    });

    function assertIncludes(line : string, includes : string) {
        assert.ok(line.includes(includes), "Line: " + line + " must include " + includes);
    }

});