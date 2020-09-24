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
import {S3AudioAccessor, s3FileStatusStaticCache, S3FileStatus} from './../audioAccessor/s3AudioAccessor';
import {AudioFileAccessor} from './../audioAccessor/audioFileAccessor';
import {S3, Polly, SharedIniFileCredentials, config} from 'aws-sdk';
import { strict as assert } from 'assert';
import * as fs from 'fs';
import * as path from 'path';

describe("S3 Audio Accessor integration test", function () {
    before(async () => {
        const workingDir = path.resolve(".", ".out");
        if (!fs.existsSync(workingDir)) {
            fs.mkdirSync(workingDir);
        }
    });

    it("test custom s3 client.", async function () {
        const outDir = path.resolve('.', '.out');
        const testFileName = 'synthesize_test.mp3';

        const audioFileAccessor = new S3AudioAccessor({
            bucketName: "sfb-example/tempPolly",
            s3DomainName: "s3.amazonaws.com",
            audioWorkingDir: outDir,
            s3Client: new S3()
        });

        assert.ok(audioFileAccessor);
    });

    it("test upload audio.", async function () {
        const outDir = path.resolve('.', '.out');
        const testFileName = 'synthesize_test.mp3';

        const audioFileAccessor = new S3AudioAccessor({
            bucketName: "sfb-example/tempPolly",
            s3DomainName: "s3.amazonaws.com",
            audioWorkingDir: outDir
        });

        const output = await audioFileAccessor.uploadAudio(testFileName, outDir);
        assert.equal(output, "https://s3.amazonaws.com/sfb-example/tempPolly/pollyCache/" + testFileName);

        // Make sure it is in the s3 file status cache
        assert(s3FileStatusStaticCache[`sfb-example/tempPolly:${S3AudioAccessor.CACHE_DIR_NAME}/${testFileName}`] === S3FileStatus.Exists);        
    });

    it("test upload audio invalid filename.", async function () {
        const outDir = path.resolve('.', '.out');
        const testFileName = 'synthesize_test_invalid.mp3';

        const audioFileAccessor = new S3AudioAccessor({
            bucketName: "sfb-example/tempPolly",
            s3DomainName: "s3.amazonaws.com",
            audioWorkingDir: outDir
        });

        try {
            const output = await audioFileAccessor.uploadAudio(testFileName, outDir)
        } catch (err) {
            assertIncludes(err, "");            

            // Make sure not in the S3 file status cache on error
            assert(!s3FileStatusStaticCache[`sfb-example/tempPolly:${S3AudioAccessor.CACHE_DIR_NAME}/${testFileName}`]);
        }
    });

    it("test download audio.", async function () {
        const outDir = path.resolve('.', '.out');
        const testFileName = 'synthesize_test.mp3';

        const audioFileAccessor = new S3AudioAccessor({
            bucketName: "sfb-example/tempPolly",
            s3DomainName: "s3.amazonaws.com",
            audioWorkingDir: outDir
        });

        await audioFileAccessor.downloadAudio('https://sfb-framework.s3.amazonaws.com/examples/sounds/Trumpet_1.mp3', outDir);
        const resultPath = path.resolve(outDir, "Trumpet_1.mp3");
        assert.equal(fs.existsSync(resultPath), true, `Generated test file '${resultPath}' not found.`);
    });

    it("test download audio invalid url.", async function () {
        const outDir = path.resolve('.', '.out');

        const audioFileAccessor = new S3AudioAccessor({
            bucketName: "sfb-example/tempPolly",
            s3DomainName: "s3.amazonaws.com",
            audioWorkingDir: outDir
        });

        try {
            await audioFileAccessor.downloadAudio('htinvalidtps://s3.amazonaws.com/sfb-framework/examples/sounds/Trumpet_1_invalid_url.mp3', outDir);
        } catch (err) {
            assertIncludes(err, "invalid");

            // Make sure not in the S3 file status cache on error
            assert(!s3FileStatusStaticCache[`sfb-example/tempPolly:${S3AudioAccessor.CACHE_DIR_NAME}/Trumpet_1_invalid_url.mp3`]);
        }

    });

    it("test audio exists.", async function () {
        const outDir = path.resolve('.', '.out');
        const testFileName = 'synthesize_test.mp3';

        const audioFileAccessor = new S3AudioAccessor({
            bucketName: "sfb-example/tempPolly",
            s3DomainName: "s3.amazonaws.com",
            audioWorkingDir: outDir
        });

        const exists = await audioFileAccessor.exists(testFileName);
        assert.ok(exists);

        // Make sure it exists if the file status cache
        assert(s3FileStatusStaticCache[`sfb-example/tempPolly:${S3AudioAccessor.CACHE_DIR_NAME}/${testFileName}`] === S3FileStatus.Exists);

        // Make sure cached calls return same status
        const exists2 = await audioFileAccessor.exists(testFileName);
        assert.ok(exists2);
    });

    it("test audio file that does not exist.", async function () {
        const outDir = path.resolve('.', '.out');
        const testFileName = 'file_that_does_not_exist.mp3';

        const audioFileAccessor = new S3AudioAccessor({
            bucketName: "sfb-example/tempPolly",
            s3DomainName: "s3.amazonaws.com",
            audioWorkingDir: outDir
        });

        const exists = await audioFileAccessor.exists(testFileName);
        assert.ok(!exists);

        // Make sure it does not exists if the file status cache
        assert(s3FileStatusStaticCache[`sfb-example/tempPolly:${S3AudioAccessor.CACHE_DIR_NAME}/${testFileName}`] === S3FileStatus.NotExists);

        // Make sure cached calls return same status
        const exists2 = await audioFileAccessor.exists(testFileName);
        assert.ok(!exists2);
    });

    function assertIncludes(line : string, includes : string) {
        assert.ok(line.includes(includes), "Line: " + line + " must include " + includes);
    }

});