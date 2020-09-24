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

import { SourceContentHelper } from './../../../importPlugins/sourceContentHelper';
import { strict as assert } from 'assert';

describe("Source Content Helper Test", function () {
    it("add new content", async function () {
        const contentHelper = new SourceContentHelper([
            {
                id: "test.abc",
                text: 
                `@start
                *say
                hello`
            }
        ]);

        contentHelper.addSourceContent("newFile.abc", `some other content`);
        assert.equal(contentHelper.getSourceContent("newFile.abc").text, `some other content`);
    });

    it("get all contents", async function () {
        const contentHelper = new SourceContentHelper([
            {
                id: "test.abc",
                text: 
                `@start
                *say
                hello`
            },
            {
                id: "more.abc",
                text: 
                `@start
                *say
                hello`
            }
        ]);

        assert.equal(contentHelper.getAllSourceContents().length, 2);
    });

    it("get one surce content item", async function () {
        const contentHelper = new SourceContentHelper([
            {
                id: "test.abc",
                text: 
                `@start
                *say
                hello`
            }
        ]);


        assert.ok(contentHelper.getSourceContent("test.abc"));
        assert.equal(contentHelper.getSourceContent("test.abc").id, "test.abc");
        assert.ok(contentHelper.getSourceContent("test.abc").text);
    });

    it("replace source contents", async function () {
        const contentHelper = new SourceContentHelper([
            {
                id: "test.abc",
                text: 
                `@start
                *say
                hello`
            }
        ]);


        contentHelper.setAllSourceContents([{
            id: "new.abc",
            text: 
            `new message`
        }]);

        try {
            contentHelper.getSourceContent("test.abc");
            assert.fail();
        } catch (err) {
            assert.ok(true);
        }

        try {
            contentHelper.getSourceContent("new.abc");
            assert.ok(true);
        } catch (err) {
            assert.fail();
        }
    });

    it("replace one source content item", async function () {
        const contentHelper = new SourceContentHelper([
            {
                id: "test.abc",
                text: 
                `@start
                *say
                hello`
            }
        ]);


        contentHelper.setSourceContent("test.abc", "new content");

        const newContent = contentHelper.getSourceContent("test.abc");
        assert.equal(newContent.text, "new content");
    });
});
