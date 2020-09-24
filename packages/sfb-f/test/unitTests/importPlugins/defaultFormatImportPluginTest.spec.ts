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

import * as defaultPlugin from '../../../importPlugins/DefaultFormatImportPlugin';
import { StoryMetadata, InstructionType } from './../../../story/storyMetadata';
import { strict as assert } from 'assert';
import { StoryMetadataHelper } from '../../../importPlugins/storyMetadataHelper';

describe("ABC Format Import Test", function () {
    it("*say only", async function () {
        const testString: string = `
        @start
        *say
            this is a say
        `
        const plugin = new defaultPlugin.DefaultFormatImportPlugin();

        const importResult = await plugin.importData([
                {
                    id: "start.abc",
                    text: testString
                }
            ],
            {ignoreSyntaxError: false}
        );

        const storyMetadataHelper = new StoryMetadataHelper({
            pluginName: "default",
            scenes: importResult.importedScenes,
            storyID: "test story",
            storyTitle: "test story"
        });

        assert.ok(importResult.errors == undefined || importResult.errors.length === 0);
        assert.equal(storyMetadataHelper.getAllScenes().length, 1);
        assert.equal(storyMetadataHelper.getSceneNarration('start').trim(), "this is a say");
    });

    it("*say and *then", async function () {
        const testString: string = `
        @start
        *say
            this is a say
        *then
            -> somewhere

        @somewhere
        *then
            >> END
        `
        const plugin = new defaultPlugin.DefaultFormatImportPlugin();

        const importResult = await plugin.importData([
                {
                    id: "start.abc",
                    text: testString
                }
            ],
            {ignoreSyntaxError: false}
        );

        const storyMetadataHelper = new StoryMetadataHelper({
            pluginName: "default",
            scenes: importResult.importedScenes,
            storyID: "test story",
            storyTitle: "test story"
        });

        assert.ok(importResult.errors == undefined || importResult.errors.length === 0);
        assert.equal(storyMetadataHelper.getAllScenes().length, 2);
        assert.equal(storyMetadataHelper.getSceneNarration('start').trim(), "this is a say");
        assert.equal(storyMetadataHelper.getSceneInstructions('start').length, 1);
    });

    it("*then only", async function () {
        const testString: string = `
        @start
        *then
            -> somewhere

        @somewhere
        *then
            >> END
        `
        const plugin = new defaultPlugin.DefaultFormatImportPlugin();

        const importResult = await plugin.importData([
                {
                    id: "start.abc",
                    text: testString
                }
            ],
            {ignoreSyntaxError: false}
        );

        const storyMetadataHelper = new StoryMetadataHelper({
            pluginName: "default",
            scenes: importResult.importedScenes,
            storyID: "test story",
            storyTitle: "test story"
        });

        assert.ok(importResult.errors == undefined || importResult.errors.length === 0);
        assert.equal(storyMetadataHelper.getAllScenes().length, 2);
        try {
            storyMetadataHelper.getSceneNarration('start')
        } catch(err) {
            assert.ok(true);
        }
        assert.equal(storyMetadataHelper.getSceneInstructions('start').length, 1);
    });

    it("*then with empty lines", async function () {
        const testString: string = `
        @start
        *then


            -> somewhere


        @somewhere
        *then

            >> END
        `
        const plugin = new defaultPlugin.DefaultFormatImportPlugin();

        const importResult = await plugin.importData([
                {
                    id: "start.abc",
                    text: testString
                }
            ],
            {ignoreSyntaxError: false}
        );

        const storyMetadataHelper = new StoryMetadataHelper({
            pluginName: "default",
            scenes: importResult.importedScenes,
            storyID: "test story",
            storyTitle: "test story"
        });

        assert.ok(importResult.errors == undefined || importResult.errors.length === 0);
        assert.equal(storyMetadataHelper.getAllScenes().length, 2);
        try {
            storyMetadataHelper.getSceneNarration('start')
        } catch(err) {
            assert.ok(true);
        }
        assert.equal(storyMetadataHelper.getSceneInstructions('start').length, 1);
    });

    it("syntax error line number test", async function () {
        const testStrings: string[] = [
        `
        @start
        *say
            this is a say
            normal
        *then
            flag
        `,
        `
        @start

        *say
            this is a say
        *then
            flag
        `,
        `
        @start
        *say
            this is a say
        *then
            flag correctly
            flag
        `
        ];

        for (let testString of testStrings) {
            const plugin = new defaultPlugin.DefaultFormatImportPlugin();

            const importResult = await plugin.importData([
                    {
                        id: "start.abc",
                        text: testString
                    }
                ],
                {ignoreSyntaxError: false}
            );
    
            if (importResult.errors) {
                assert.ok(importResult.errors.length === 1);
                assert.equal(importResult.errors[0].lineNumber, 7);
            } else {
                assert.fail();
            }
        }
    });

    it("-> go to not existing scene", async function () {
        const testString: string = `
        @start
        *say
            this is a say
        *then
            -> bad
        `
        const plugin = new defaultPlugin.DefaultFormatImportPlugin();

        const importResult = await plugin.importData([
                {
                    id: "start.abc",
                    text: testString
                }
            ],
            {ignoreSyntaxError: false}
        );

        if (importResult.errors) {
            assert.ok(importResult.errors.length === 1);
            assert.equal(importResult.errors[0].lineNumber, 6);
        } else {
            assert.fail();
        }
    });
    
    it("-> go to syntax error", async function () {
        const testString: string = `
        @start
        *say
            this is a say
        *then
            ->
        `
        const plugin = new defaultPlugin.DefaultFormatImportPlugin();

        const importResult = await plugin.importData([
                {
                    id: "start.abc",
                    text: testString
                }
            ],
            {ignoreSyntaxError: false}
        );

        if (importResult.errors) {
            assert.ok(importResult.errors.length === 1);
            assert.equal(importResult.errors[0].lineNumber, 6);
        } else {
            assert.fail();
        }
    });

    it("flag syntax error", async function () {
        const testString: string = `
        @start
        *say
            this is a say
        *then
            flag
        `
        const plugin = new defaultPlugin.DefaultFormatImportPlugin();

        const importResult = await plugin.importData([
                {
                    id: "start.abc",
                    text: testString
                }
            ],
            {ignoreSyntaxError: false}
        );

        if (importResult.errors) {
            assert.ok(importResult.errors.length === 1);
            assert.equal(importResult.errors[0].lineNumber, 6);
        } else {
            assert.fail();
        }
    });

    it("increase syntax error", async function () {
        const testString: string = `
        @start
        *say
            this is a say
        *then
            increase
        `
        const plugin = new defaultPlugin.DefaultFormatImportPlugin();

        const importResult = await plugin.importData([
                {
                    id: "start.abc",
                    text: testString
                }
            ],
            {ignoreSyntaxError: false}
        );

        if (importResult.errors) {
            assert.ok(importResult.errors.length === 1);
            assert.equal(importResult.errors[0].lineNumber, 6);
        } else {
            assert.fail();
        }
    });

    it("decrease syntax error", async function () {
        const testString: string = `
        @start
        *say
            this is a say
        *then
            decrease
        `
        const plugin = new defaultPlugin.DefaultFormatImportPlugin();

        const importResult = await plugin.importData([
                {
                    id: "start.abc",
                    text: testString
                }
            ],
            {ignoreSyntaxError: false}
        );

        if (importResult.errors) {
            assert.ok(importResult.errors.length === 1);
            assert.equal(importResult.errors[0].lineNumber, 6);
        } else {
            assert.fail();
        }
    });

    it("unflag syntax error", async function () {
        const testString: string = `
        @start
        *say
            this is a say
        *then
            unflag
        `
        const plugin = new defaultPlugin.DefaultFormatImportPlugin();

        const importResult = await plugin.importData([
                {
                    id: "start.abc",
                    text: testString
                }
            ],
            {ignoreSyntaxError: false}
        );

        if (importResult.errors) {
            assert.ok(importResult.errors.length === 1);
            assert.equal(importResult.errors[0].lineNumber, 6);
        } else {
            assert.fail();
        }
    });

    it("reduce syntax error", async function () {
        const testString: string = `
        @start
        *say
            this is a say
        *then
            reduce
        `
        const plugin = new defaultPlugin.DefaultFormatImportPlugin();

        const importResult = await plugin.importData([
                {
                    id: "start.abc",
                    text: testString
                }
            ],
            {ignoreSyntaxError: false}
        );

        if (importResult.errors) {
            assert.ok(importResult.errors.length === 1);
            assert.equal(importResult.errors[0].lineNumber, 6);
        } else {
            assert.fail();
        }
    });

    it("set syntax error", async function () {
        const testString: string = `
        @start
        *say
            this is a say
        *then
            set
        `
        const plugin = new defaultPlugin.DefaultFormatImportPlugin();

        const importResult = await plugin.importData([
                {
                    id: "start.abc",
                    text: testString
                }
            ],
            {ignoreSyntaxError: false}
        );

        if (importResult.errors) {
            assert.ok(importResult.errors.length === 1);
            assert.equal(importResult.errors[0].lineNumber, 6);
        } else {
            assert.fail();
        }
    });

    it("slot syntax error", async function () {
        const testString: string = `
        @start
        *say
            this is a say
        *then
            slot
        `
        const plugin = new defaultPlugin.DefaultFormatImportPlugin();

        const importResult = await plugin.importData([
                {
                    id: "start.abc",
                    text: testString
                }
            ],
            {ignoreSyntaxError: false}
        );

        if (importResult.errors) {
            assert.ok(importResult.errors.length === 1);
            assert.equal(importResult.errors[0].lineNumber, 6);
        } else {
            assert.fail();
        }
    });

    it("remove syntax error", async function () {
        const testString: string = `
        @start
        *say
            this is a say
        *then
            remove
        `
        const plugin = new defaultPlugin.DefaultFormatImportPlugin();

        const importResult = await plugin.importData([
                {
                    id: "start.abc",
                    text: testString
                }
            ],
            {ignoreSyntaxError: false}
        );

        if (importResult.errors) {
            assert.ok(importResult.errors.length === 1);
            assert.equal(importResult.errors[0].lineNumber, 6);
        } else {
            assert.fail();
        }
    });

    it("put syntax error", async function () {
        const testString: string = `
        @start
        *say
            this is a say
        *then
            put
        `
        const plugin = new defaultPlugin.DefaultFormatImportPlugin();

        const importResult = await plugin.importData([
                {
                    id: "start.abc",
                    text: testString
                }
            ],
            {ignoreSyntaxError: false}
        );

        if (importResult.errors) {
            assert.ok(importResult.errors.length === 1);
            assert.equal(importResult.errors[0].lineNumber, 6);
        } else {
            assert.fail();
        }
    });

    it("dequeue syntax error", async function () {
        const testString: string = `
        @start
        *say
            this is a say
        *then
            dequeue
        `
        const plugin = new defaultPlugin.DefaultFormatImportPlugin();

        const importResult = await plugin.importData([
                {
                    id: "start.abc",
                    text: testString
                }
            ],
            {ignoreSyntaxError: false}
        );

        if (importResult.errors) {
            assert.ok(importResult.errors.length === 1);
            assert.equal(importResult.errors[0].lineNumber, 6);
        } else {
            assert.fail();
        }
    });

    it("pop syntax error", async function () {
        const testString: string = `
        @start
        *say
            this is a say
        *then
            pop
        `
        const plugin = new defaultPlugin.DefaultFormatImportPlugin();

        const importResult = await plugin.importData([
                {
                    id: "start.abc",
                    text: testString
                }
            ],
            {ignoreSyntaxError: false}
        );

        if (importResult.errors) {
            assert.ok(importResult.errors.length === 1);
            assert.equal(importResult.errors[0].lineNumber, 6);
        } else {
            assert.fail();
        }
    });

    it("stack syntax error", async function () {
        const testString: string = `
        @start
        *say
            this is a say
        *then
            stack
        `
        const plugin = new defaultPlugin.DefaultFormatImportPlugin();

        const importResult = await plugin.importData([
                {
                    id: "start.abc",
                    text: testString
                }
            ],
            {ignoreSyntaxError: false}
        );

        if (importResult.errors) {
            assert.ok(importResult.errors.length === 1);
            assert.equal(importResult.errors[0].lineNumber, 6);
        } else {
            assert.fail();
        }
    });

    it("clear syntax error", async function () {
        const testString: string = `
        @start
        *say
            this is a say
        *then
            clear
        `
        const plugin = new defaultPlugin.DefaultFormatImportPlugin();

        const importResult = await plugin.importData([
                {
                    id: "start.abc",
                    text: testString
                }
            ],
            {ignoreSyntaxError: false}
        );

        if (importResult.errors) {
            assert.ok(importResult.errors.length === 1);
            assert.equal(importResult.errors[0].lineNumber, 6);
        } else {
            assert.fail();
        }
    });

    it("bgm syntax error", async function () {
        const testString: string = `
        @start
        *say
            this is a say
        *then
            clear
        `
        const plugin = new defaultPlugin.DefaultFormatImportPlugin();

        const importResult = await plugin.importData([
                {
                    id: "start.abc",
                    text: testString
                }
            ],
            {ignoreSyntaxError: false}
        );

        if (importResult.errors) {
            assert.ok(importResult.errors.length === 1);
            assert.equal(importResult.errors[0].lineNumber, 6);
        } else {
            assert.fail();
        }
    });

    it("bgm syntax error", async function () {
        const testString: string = `
        @start
        *say
            this is a say
        *then
            bgm
        `
        const plugin = new defaultPlugin.DefaultFormatImportPlugin();

        const importResult = await plugin.importData([
                {
                    id: "start.abc",
                    text: testString
                }
            ],
            {ignoreSyntaxError: false}
        );

        if (importResult.errors) {
            assert.ok(importResult.errors.length === 1);
            assert.equal(importResult.errors[0].lineNumber, 6);
        } else {
            assert.fail();
        }
    });

    it("<-> syntax error", async function () {
        const testString: string = `
        @start
        *say
            this is a say
        *then
            <->
        `
        const plugin = new defaultPlugin.DefaultFormatImportPlugin();

        const importResult = await plugin.importData([
                {
                    id: "start.abc",
                    text: testString
                }
            ],
            {ignoreSyntaxError: false}
        );

        if (importResult.errors) {
            assert.ok(importResult.errors.length === 1);
            assert.equal(importResult.errors[0].lineNumber, 6);
        } else {
            assert.fail();
        }
    });

    it("<-> non existing scene error", async function () {
        const testString: string = `
        @start
        *say
            this is a say
        *then
            -> bad
        `
        const plugin = new defaultPlugin.DefaultFormatImportPlugin();

        const importResult = await plugin.importData([
                {
                    id: "start.abc",
                    text: testString
                }
            ],
            {ignoreSyntaxError: false}
        );

        if (importResult.errors) {
            assert.ok(importResult.errors.length === 1);
            assert.equal(importResult.errors[0].lineNumber, 6);
        } else {
            assert.fail();
        }
    });

    it("'if' missing opening bracket", async function () {
        const testString: string = `
        @start
        *say
            this is a say
        *then
            if something
                -> start
        `
        const plugin = new defaultPlugin.DefaultFormatImportPlugin();

        const importResult = await plugin.importData([
                {
                    id: "start.abc",
                    text: testString
                }
            ],
            {ignoreSyntaxError: false}
        );

        if (importResult.errors) {
            assert.ok(importResult.errors.length === 1);
            assert.equal(importResult.errors[0].lineNumber, 6);
            assert.equal(importResult.errors[0].errorMessage, "Missing '{': if block must start with 'if [utterances] {'");
        } else {
            assert.fail();
        }
    });

    it("'if' missing closing bracket", async function () {
        const testString: string = `
        @start
        *say
            this is a say
        *then
            if something {
                -> start
        `
        const plugin = new defaultPlugin.DefaultFormatImportPlugin();

        const importResult = await plugin.importData([
                {
                    id: "start.abc",
                    text: testString
                }
            ],
            {ignoreSyntaxError: false}
        );

        if (importResult.errors) {
            assert.ok(importResult.errors.length === 1);
            assert.equal(importResult.errors[0].lineNumber, 6);
            assert.equal(importResult.errors[0].errorMessage, "Missing '}'");
        } else {
            assert.fail();
        }
    });

    it("if missing conditions", async function () {
        const testString: string = `
        @start
        *say
            this is a say
        *then
            if {
                -> start
            }
        `
        const plugin = new defaultPlugin.DefaultFormatImportPlugin();

        const importResult = await plugin.importData([
                {
                    id: "start.abc",
                    text: testString
                }
            ],
            {ignoreSyntaxError: false}
        );

        if (importResult.errors) {
            assert.ok(importResult.errors.length === 1);
            assert.equal(importResult.errors[0].lineNumber, 6);
        } else {
            assert.fail();
        }
    });

    it("if bad conditions", async function () {
        const testString: string = `
        @start
        *say
            this is a say
        *then
            if variable >> variable2 {
                -> start
            }
        `
        const plugin = new defaultPlugin.DefaultFormatImportPlugin();

        const importResult = await plugin.importData([
                {
                    id: "start.abc",
                    text: testString
                }
            ],
            {ignoreSyntaxError: false}
        );

        if (importResult.errors) {
            assert.equal(importResult.errors.length, 1);
            assert.equal(importResult.errors[0].lineNumber, 6);
        } else {
            assert.fail();
        }
    });

    it("multiply syntax error", async function () {
        const testString: string = `
        @start
        *say
            this is a say
        *then
            multiply
        `
        const plugin = new defaultPlugin.DefaultFormatImportPlugin();

        const importResult = await plugin.importData([
                {
                    id: "start.abc",
                    text: testString
                }
            ],
            {ignoreSyntaxError: false}
        );

        if (importResult.errors) {
            assert.ok(importResult.errors.length === 1);
            assert.equal(importResult.errors[0].lineNumber, 6);
        } else {
            assert.fail();
        }
    });

    it("divide syntax error", async function () {
        const testString: string = `
        @start
        *say
            this is a say
        *then
            divide
        `
        const plugin = new defaultPlugin.DefaultFormatImportPlugin();

        const importResult = await plugin.importData([
                {
                    id: "start.abc",
                    text: testString
                }
            ],
            {ignoreSyntaxError: false}
        );

        if (importResult.errors) {
            assert.ok(importResult.errors.length === 1);
            assert.equal(importResult.errors[0].lineNumber, 6);
        } else {
            assert.fail();
        }
    });

    it("roll syntax error", async function () {
        const testString: string = `
        @start
        *say
            this is a say
        *then
            roll
        `
        const plugin = new defaultPlugin.DefaultFormatImportPlugin();

        const importResult = await plugin.importData([
                {
                    id: "start.abc",
                    text: testString
                }
            ],
            {ignoreSyntaxError: false}
        );

        if (importResult.errors) {
            assert.ok(importResult.errors.length === 1);
            assert.equal(importResult.errors[0].lineNumber, 6);
        } else {
            assert.fail();
        }
    });

    it("->: valid syntax variations", async function () {
        const testCases: string[] = [
        `
        @start
            *then
-> start
        `,
        `
        @start
            *then
                -> start
        `,
        `
        @start
            *then
                ->start
        `,
        `
        @start
            *then
->start
        `,
        `
        @start
            *then
->          start
        `,
        `
        @start
            *then
         ->          start

        `,
        ]

        for (let testString of testCases) {
            const plugin = new defaultPlugin.DefaultFormatImportPlugin();

            const importResult = await plugin.importData([
                    {
                        id: "start.abc",
                        text: testString
                    }
                ],
                {ignoreSyntaxError: false}
            );
    
            if (importResult.errors && importResult.errors.length > 0) {
                assert.fail(`Failed to pass syntax:\n${testString}`);
            } else {
                const startDirections = importResult.importedScenes[0].contents[0].sceneDirections;

                if (startDirections) {
                    assert.equal(startDirections[0].parameters.target, "start", `Failed to pass syntax:\n${testString}`);
                }
            }
        }
    });

    it("<->: valid syntax variations", async function () {
        const testCases: string[] = [
            `
        @start
            *then
<-> start
        `,
        `
        @start
            *then
                <-> start
        `,
        `
        @start
            *then
                <->start
        `,
        `
        @start
            *then
<->start
        `,
        `
        @start
            *then
<->          start
        `,
        `
        @start
            *then
         <->          start

        `,
        ]

        for (let testString of testCases) {
            const plugin = new defaultPlugin.DefaultFormatImportPlugin();

            const importResult = await plugin.importData([
                    {
                        id: "start.abc",
                        text: testString
                    }
                ],
                {ignoreSyntaxError: false}
            );
    
            if (importResult.errors && importResult.errors.length > 0) {
                assert.fail(`Failed to pass syntax:\n${testString}`);
            } else {
                const startDirections = importResult.importedScenes[0].contents[0].sceneDirections;

                if (startDirections) {
                    assert.equal(startDirections[0].parameters.target, "start", `Failed to pass syntax:\n${testString}`);
                }
            }
        }
    });

    it(">>RETURN: valid syntax variations", async function () {
        const testCases: string[] = [
            `
        @start
            *then
>> return
        `,
        `
        @start
            *then
                >> return
        `,
        `
        @start
            *then
                >>return
        `,
        `
        @start
            *then
>>return
        `,
        `
        @start
            *then
>>          return
        `,
        `
        @start
            *then
         >>          return

        `,
        ]

        for (let testString of testCases) {
            const plugin = new defaultPlugin.DefaultFormatImportPlugin();

            const importResult = await plugin.importData([
                    {
                        id: "start.abc",
                        text: testString
                    }
                ],
                {ignoreSyntaxError: false}
            );
    
            if (importResult.errors && importResult.errors.length > 0) {
                assert.fail(`Failed to pass syntax:\n${testString}`);
            } else {
                const startDirections = importResult.importedScenes[0].contents[0].sceneDirections;

                if (startDirections) {
                    assert.equal(startDirections[0].directionType, InstructionType.RETURN, `Failed to pass syntax:\n${testString}`);
                }
            }
        }
    });

    it(">>RESTART: valid syntax variations", async function () {
        const testCases: string[] = [
            `
        @start
            *then
>> restart
        `,
        `
        @start
            *then
                >> restart
        `,
        `
        @start
            *then
                >>restart
        `,
        `
        @start
            *then
>>restart
        `,
        `
        @start
            *then
>>          restart
        `,
        `
        @start
            *then
         >>          restart

        `,
        ]

        for (let testString of testCases) {
            const plugin = new defaultPlugin.DefaultFormatImportPlugin();

            const importResult = await plugin.importData([
                    {
                        id: "start.abc",
                        text: testString
                    }
                ],
                {ignoreSyntaxError: false}
            );
    
            if (importResult.errors && importResult.errors.length > 0) {
                assert.fail(`Failed to pass syntax:\n${testString}`);
            } else {
                const startDirections = importResult.importedScenes[0].contents[0].sceneDirections;

                if (startDirections) {
                    assert.equal(startDirections[0].directionType, InstructionType.RESTART, `Failed to pass syntax:\n${testString}`);
                }
            }
        }
    });

    it(">>RESUME: valid syntax variations", async function () {
        const testCases: string[] = [
            `
        @start
            *then
>> RESUME
        `,
        `
        @start
            *then
                >> RESUME
        `,
        `
        @start
            *then
                >>RESUME
        `,
        `
        @start
            *then
>>RESUME
        `,
        `
        @start
            *then
>>          RESUME
        `,
        `
        @start
            *then
         >>          RESUME

        `,
        ]

        for (let testString of testCases) {
            const plugin = new defaultPlugin.DefaultFormatImportPlugin();

            const importResult = await plugin.importData([
                    {
                        id: "start.abc",
                        text: testString
                    }
                ],
                {ignoreSyntaxError: false}
            );
    
            if (importResult.errors && importResult.errors.length > 0) {
                assert.fail(`Failed to pass syntax:\n${testString}`);
            } else {
                const startDirections = importResult.importedScenes[0].contents[0].sceneDirections;

                if (startDirections) {
                    assert.equal(startDirections[0].directionType, InstructionType.GO_TO, `Failed to pass syntax:\n${testString}`);
                    assert.equal(startDirections[0].parameters.target, "{resume}", `Failed to pass syntax:\n${testString}`);

                }
            }
        }
    });

    it(">>REPEAT: valid syntax variations", async function () {
        const testCases: string[] = [
            `
        @start
            *then
>> REPEAT
        `,
        `
        @start
            *then
                >> REPEAT
        `,
        `
        @start
            *then
                >>REPEAT
        `,
        `
        @start
            *then
>>REPEAT
        `,
        `
        @start
            *then
>>          REPEAT
        `,
        `
        @start
            *then
         >>          REPEAT

        `,
        ]

        for (let testString of testCases) {
            const plugin = new defaultPlugin.DefaultFormatImportPlugin();

            const importResult = await plugin.importData([
                    {
                        id: "start.abc",
                        text: testString
                    }
                ],
                {ignoreSyntaxError: false}
            );
    
            if (importResult.errors && importResult.errors.length > 0) {
                assert.fail(`Failed to pass syntax:\n${testString}`);
            } else {
                const startDirections = importResult.importedScenes[0].contents[0].sceneDirections;

                if (startDirections) {
                    assert.equal(startDirections[0].directionType, InstructionType.REPEAT, `Failed to pass syntax:\n${testString}`);
                }
            }
        }
    });

    it(">>REPROMPT: valid syntax variations", async function () {
        const testCases: string[] = [
            `
        @start
            *then
>> REPROMPT
        `,
        `
        @start
            *then
                >> REPROMPT
        `,
        `
        @start
            *then
                >>REPROMPT
        `,
        `
        @start
            *then
>>REPROMPT
        `,
        `
        @start
            *then
>>          REPROMPT
        `,
        `
        @start
            *then
         >>          REPROMPT

        `,
        ]

        for (let testString of testCases) {
            const plugin = new defaultPlugin.DefaultFormatImportPlugin();

            const importResult = await plugin.importData([
                    {
                        id: "start.abc",
                        text: testString
                    }
                ],
                {ignoreSyntaxError: false}
            );
    
            if (importResult.errors && importResult.errors.length > 0) {
                assert.fail(`Failed to pass syntax:\n${testString}`);
            } else {
                const startDirections = importResult.importedScenes[0].contents[0].sceneDirections;

                if (startDirections) {
                    assert.equal(startDirections[0].directionType, InstructionType.REPEAT_REPROMPT, `Failed to pass syntax:\n${testString}`);
                }
            }
        }
    });

    it(">>BACK: valid syntax variations", async function () {
        const testCases: string[] = [
            `
        @start
            *then
>> BACK
        `,
        `
        @start
            *then
                >> BACK
        `,
        `
        @start
            *then
                >>BACK
        `,
        `
        @start
            *then
>>BACK
        `,
        `
        @start
            *then
>>          BACK
        `,
        `
        @start
            *then
         >>          BACK

        `,
        ]

        for (let testString of testCases) {
            const plugin = new defaultPlugin.DefaultFormatImportPlugin();

            const importResult = await plugin.importData([
                    {
                        id: "start.abc",
                        text: testString
                    }
                ],
                {ignoreSyntaxError: false}
            );
    
            if (importResult.errors && importResult.errors.length > 0) {
                assert.fail(`Failed to pass syntax:\n${testString}`);
            } else {
                const startDirections = importResult.importedScenes[0].contents[0].sceneDirections;

                if (startDirections) {
                    assert.equal(startDirections[0].directionType, InstructionType.BACK, `Failed to pass syntax:\n${testString}`);
                    assert.equal(startDirections[0].parameters.count, 1, `Failed to pass syntax:\n${testString}`);
                }
            }
        }
    });

    it(">>BACK [int]: valid syntax variations", async function () {
        const testCases: string[] = [
            `
        @start
            *then
                >>BACK 3
        `,
        `
        @start
            *then
                >>BACK  3
        `,
        `
        @start
            *then
                >>BACK                  3
        `,
        ]

        for (let testString of testCases) {
            const plugin = new defaultPlugin.DefaultFormatImportPlugin();

            const importResult = await plugin.importData([
                    {
                        id: "start.abc",
                        text: testString
                    }
                ],
                {ignoreSyntaxError: false}
            );
    
            if (importResult.errors && importResult.errors.length > 0) {
                assert.fail(`Failed to pass syntax:\n${testString}\nwith: ${JSON.stringify(importResult.errors,null,4)}`);
            } else {
                const startDirections = importResult.importedScenes[0].contents[0].sceneDirections;

                if (startDirections) {
                    assert.equal(startDirections[0].directionType, InstructionType.BACK, `Failed to pass syntax:\n${testString}`);
                    assert.equal(startDirections[0].parameters.count, 3, `Failed to pass syntax:\n${testString}`);

                }
            }
        }
    });

    it(">>PAUSE: valid syntax variations", async function () {
        const testCases: string[] = [
            `
        @start
            *then
>> PAUSE
        `,
        `
        @start
            *then
                >> PAUSE
        `,
        `
        @start
            *then
                >>PAUSE
        `,
        `
        @start
            *then
>>PAUSE
        `,
        `
        @start
            *then
>>          PAUSE
        `,
        `
        @start
            *then
         >>          PAUSE

        `,
        ]

        for (let testString of testCases) {
            const plugin = new defaultPlugin.DefaultFormatImportPlugin();

            const importResult = await plugin.importData([
                    {
                        id: "start.abc",
                        text: testString
                    }
                ],
                {ignoreSyntaxError: false}
            );
    
            if (importResult.errors && importResult.errors.length > 0) {
                assert.fail(`Failed to pass syntax:\n${testString}\nwith: ${JSON.stringify(importResult.errors,null,4)}`);
            } else {
                const startDirections = importResult.importedScenes[0].contents[0].sceneDirections;

                if (startDirections) {
                    assert.equal(startDirections[0].directionType, InstructionType.PAUSE, `Failed to pass syntax:\n${testString}`);
                }
            }
        }
    });

    it(">>END: valid syntax variations", async function () {
        const testCases: string[] = [
            `
        @start
            *then
>> END
        `,
        `
        @start
            *then
                >> END
        `,
        `
        @start
            *then
                >>END
        `,
        `
        @start
            *then
>>END
        `,
        `
        @start
            *then
>>          END
        `,
        `
        @start
            *then
         >>          END

        `,
        ]

        for (let testString of testCases) {
            const plugin = new defaultPlugin.DefaultFormatImportPlugin();

            const importResult = await plugin.importData([
                    {
                        id: "start.abc",
                        text: testString
                    }
                ],
                {ignoreSyntaxError: false}
            );
    
            if (importResult.errors && importResult.errors.length > 0) {
                assert.fail(`Failed to pass syntax:\n${testString}\nwith: ${JSON.stringify(importResult.errors,null,4)}`);
            } else {
                const startDirections = importResult.importedScenes[0].contents[0].sceneDirections;

                if (startDirections) {
                    assert.equal(startDirections[0].directionType, InstructionType.END, `Failed to pass syntax:\n${testString}`);
                }
            }
        }
    });

    it("bgm: valid syntax variations", async function () {
        const testCases: string[] = [
            `
        @start
            *then
bgm some.url.com
        `,
        `
        @start
            *then
                bgm some.url.com
        `,
        `
        @start
            *then
bgm          some.url.com
        `,
        `
        @start
            *then
         bgm          some.url.com

        `,
        `
        @start
            *then
bgm 'some.url.com'
        `,
        `
        @start
            *then
                bgm 'some.url.com'
        `,
        `
        @start
            *then
bgm          'some.url.com'
        `,
        `
        @start
            *then
         bgm          'some.url.com'

        `,
        ]

        for (let testString of testCases) {
            const plugin = new defaultPlugin.DefaultFormatImportPlugin();

            const importResult = await plugin.importData([
                    {
                        id: "start.abc",
                        text: testString
                    }
                ],
                {ignoreSyntaxError: false}
            );
    
            if (importResult.errors && importResult.errors.length > 0) {
                assert.fail(`Failed to pass syntax:\n${testString}\nwith: ${JSON.stringify(importResult.errors,null,4)}`);
            } else {
                const startDirections = importResult.importedScenes[0].contents[0].sceneDirections;

                if (startDirections) {
                    assert.equal(startDirections[0].directionType, InstructionType.BGM, `Failed to pass syntax:\n${testString}`);
                    assert.equal(startDirections[0].parameters.audioURL, 'some.url.com', `Failed to pass syntax:\n${testString}`);
                }
            }
        }
    });

    it("clear: valid syntax variations", async function () {
        const testCases: string[] = [
            `
        @start
            *then
clear variable
        `,
        `
        @start
            *then
                clear variable
        `,
        `
        @start
            *then
clear          variable
        `,
        `
        @start
            *then
         clear          variable

        `
        ]

        for (let testString of testCases) {
            const plugin = new defaultPlugin.DefaultFormatImportPlugin();

            const importResult = await plugin.importData([
                    {
                        id: "start.abc",
                        text: testString
                    }
                ],
                {ignoreSyntaxError: false}
            );
    
            if (importResult.errors && importResult.errors.length > 0) {
                assert.fail(`Failed to pass syntax:\n${testString}\nwith: ${JSON.stringify(importResult.errors,null,4)}`);
            } else {
                const startDirections = importResult.importedScenes[0].contents[0].sceneDirections;

                if (startDirections) {
                    assert.equal(startDirections[0].directionType, InstructionType.CLEAR, `Failed to pass syntax:\n${testString}`);
                    assert.equal(startDirections[0].parameters.variableName, 'variable', `Failed to pass syntax:\n${testString}`);
                }
            }
        }
    });

    it("unflag: valid syntax variations", async function () {
        const testCases: string[] = [
            `
        @start
            *then
unflag variable
        `,
        `
        @start
            *then
                unflag variable
        `,
        `
        @start
            *then
unflag          variable
        `,
        `
        @start
            *then
         unflag          variable

        `
        ]

        for (let testString of testCases) {
            const plugin = new defaultPlugin.DefaultFormatImportPlugin();

            const importResult = await plugin.importData([
                    {
                        id: "start.abc",
                        text: testString
                    }
                ],
                {ignoreSyntaxError: false}
            );
    
            if (importResult.errors && importResult.errors.length > 0) {
                assert.fail(`Failed to pass syntax:\n${testString}\nwith: ${JSON.stringify(importResult.errors,null,4)}`);
            } else {
                const startDirections = importResult.importedScenes[0].contents[0].sceneDirections;

                if (startDirections) {
                    assert.equal(startDirections[0].directionType, InstructionType.UNFLAG, `Failed to pass syntax:\n${testString}`);
                    assert.equal(startDirections[0].parameters.variableName, 'variable', `Failed to pass syntax:\n${testString}`);
                }
            }
        }
    });

    it("flag: valid syntax variations", async function () {
        const testCases: string[] = [
            `
        @start
            *then
flag variable
        `,
        `
        @start
            *then
                flag variable
        `,
        `
        @start
            *then
flag          variable
        `,
        `
        @start
            *then
         flag          variable

        `
        ]

        for (let testString of testCases) {
            const plugin = new defaultPlugin.DefaultFormatImportPlugin();

            const importResult = await plugin.importData([
                    {
                        id: "start.abc",
                        text: testString
                    }
                ],
                {ignoreSyntaxError: false}
            );
    
            if (importResult.errors && importResult.errors.length > 0) {
                assert.fail(`Failed to pass syntax:\n${testString}\nwith: ${JSON.stringify(importResult.errors,null,4)}`);
            } else {
                const startDirections = importResult.importedScenes[0].contents[0].sceneDirections;

                if (startDirections) {
                    assert.equal(startDirections[0].directionType, InstructionType.FLAG, `Failed to pass syntax:\n${testString}`);
                    assert.equal(startDirections[0].parameters.variableName, 'variable', `Failed to pass syntax:\n${testString}`);
                }
            }
        }
    });

    it("slot as 'string': valid syntax variations", async function () {
        const testCases: string[] = [
            `
        @start
            *then
slot variable as 'slottype'
        `,
        `
        @start
            *then
                slot variable   as   'slottype'
        `,
        `
        @start
            *then
slot          variable as 'slottype'
        `,
        `
        @start
            *then
         slot          variable  as         'slottype'

        `
        ]

        for (let testString of testCases) {
            const plugin = new defaultPlugin.DefaultFormatImportPlugin();

            const importResult = await plugin.importData([
                    {
                        id: "start.abc",
                        text: testString
                    }
                ],
                {ignoreSyntaxError: false}
            );
    
            if (importResult.errors && importResult.errors.length > 0) {
                assert.fail(`Failed to pass syntax:\n${testString}\nwith: ${JSON.stringify(importResult.errors,null,4)}`);
            } else {
                const startDirections = importResult.importedScenes[0].contents[0].sceneDirections;

                if (startDirections) {
                    assert.equal(startDirections[0].directionType, InstructionType.SLOT, `Failed to pass syntax:\n${testString}`);
                    assert.equal(startDirections[0].parameters.variableName, 'variable', `Failed to pass syntax:\n${testString}`);
                    assert.equal(startDirections[0].parameters.variableType, 'slottype', `Failed to pass syntax:\n${testString}`);
                }
            }
        }
    });

    it("slot as variable: valid syntax variations", async function () {
        const testCases: string[] = [
            `
        @start
            *then
slot variable as othervar
        `,
        `
        @start
            *then
                slot variable   as   othervar
        `,
        `
        @start
            *then
slot          variable as othervar
        `,
        `
        @start
            *then
         slot          variable  as         othervar

        `
        ]

        for (let testString of testCases) {
            const plugin = new defaultPlugin.DefaultFormatImportPlugin();

            const importResult = await plugin.importData([
                    {
                        id: "start.abc",
                        text: testString
                    }
                ],
                {ignoreSyntaxError: false}
            );
    
            if (importResult.errors && importResult.errors.length > 0) {
                assert.fail(`Failed to pass syntax:\n${testString}\nwith: ${JSON.stringify(importResult.errors,null,4)}`);
            } else {
                const startDirections = importResult.importedScenes[0].contents[0].sceneDirections;

                if (startDirections) {
                    assert.equal(startDirections[0].directionType, InstructionType.SLOT, `Failed to pass syntax:\n${testString}`);
                    assert.equal(startDirections[0].parameters.variableName, 'variable', `Failed to pass syntax:\n${testString}`);
                    assert.equal(startDirections[0].parameters.variableType, '{othervar}', `Failed to pass syntax:\n${testString}`);
                }
            }
        }
    });

    it("set as 'string': valid syntax variations", async function () {
        const testCases: string[] = [
            `
        @start
            *then
set variable as 'string'
        `,
        `
        @start
            *then
                set variable   as   'string'
        `,
        `
        @start
            *then
set          variable as 'string'
        `,
        `
        @start
            *then
         set          variable  as         'string'

        `
        ]

        for (let testString of testCases) {
            const plugin = new defaultPlugin.DefaultFormatImportPlugin();

            const importResult = await plugin.importData([
                    {
                        id: "start.abc",
                        text: testString
                    }
                ],
                {ignoreSyntaxError: false}
            );
    
            if (importResult.errors && importResult.errors.length > 0) {
                assert.fail(`Failed to pass syntax:\n${testString}\nwith: ${JSON.stringify(importResult.errors,null,4)}`);
            } else {
                const startDirections = importResult.importedScenes[0].contents[0].sceneDirections;

                if (startDirections) {
                    assert.equal(startDirections[0].directionType, InstructionType.SET, `Failed to pass syntax:\n${testString}`);
                    assert.equal(startDirections[0].parameters.variableName, 'variable', `Failed to pass syntax:\n${testString}`);
                    assert.equal(startDirections[0].parameters.variableValue, 'string', `Failed to pass syntax:\n${testString}`);
                }
            }
        }
    });

    it("set as number: valid syntax variations", async function () {
        const testCases: string[] = [
            `
        @start
            *then
set variable as 32
        `,
        `
        @start
            *then
                set variable   as   32
        `,
        `
        @start
            *then
set          variable as 32
        `,
        `
        @start
            *then
         set          variable  as         32

        `
        ]

        for (let testString of testCases) {
            const plugin = new defaultPlugin.DefaultFormatImportPlugin();

            const importResult = await plugin.importData([
                    {
                        id: "start.abc",
                        text: testString
                    }
                ],
                {ignoreSyntaxError: false}
            );
    
            if (importResult.errors && importResult.errors.length > 0) {
                assert.fail(`Failed to pass syntax:\n${testString}\nwith: ${JSON.stringify(importResult.errors,null,4)}`);
            } else {
                const startDirections = importResult.importedScenes[0].contents[0].sceneDirections;

                if (startDirections) {
                    assert.equal(startDirections[0].directionType, InstructionType.SET, `Failed to pass syntax:\n${testString}`);
                    assert.equal(startDirections[0].parameters.variableName, 'variable', `Failed to pass syntax:\n${testString}`);
                    assert.equal(startDirections[0].parameters.variableValue, '32', `Failed to pass syntax:\n${testString}`);
                }
            }
        }
    });

    it("set as variable: valid syntax variations", async function () {
        const testCases: string[] = [
            `
        @start
            *then
set variable as othervar
        `,
        `
        @start
            *then
                set variable   as   othervar
        `,
        `
        @start
            *then
set          variable as othervar
        `,
        `
        @start
            *then
         set          variable  as         othervar

        `
        ]

        for (let testString of testCases) {
            const plugin = new defaultPlugin.DefaultFormatImportPlugin();

            const importResult = await plugin.importData([
                    {
                        id: "start.abc",
                        text: testString
                    }
                ],
                {ignoreSyntaxError: false}
            );
    
            if (importResult.errors && importResult.errors.length > 0) {
                assert.fail(`Failed to pass syntax:\n${testString}\nwith: ${JSON.stringify(importResult.errors,null,4)}`);
            } else {
                const startDirections = importResult.importedScenes[0].contents[0].sceneDirections;

                if (startDirections) {
                    assert.equal(startDirections[0].directionType, InstructionType.SET, `Failed to pass syntax:\n${testString}`);
                    assert.equal(startDirections[0].parameters.variableName, 'variable', `Failed to pass syntax:\n${testString}`);
                    assert.equal(startDirections[0].parameters.variableValue, '{othervar}', `Failed to pass syntax:\n${testString}`);
                }
            }
        }
    });

    it("increase by number: valid syntax variations", async function () {
        const testCases: string[] = [
            `
        @start
            *then
increase variable by 32
        `,
        `
        @start
            *then
                increase variable   by   32
        `,
        `
        @start
            *then
increase          variable by 32
        `,
        `
        @start
            *then
         increase          variable  by         32

        `
        ]

        for (let testString of testCases) {
            const plugin = new defaultPlugin.DefaultFormatImportPlugin();

            const importResult = await plugin.importData([
                    {
                        id: "start.abc",
                        text: testString
                    }
                ],
                {ignoreSyntaxError: false}
            );
    
            if (importResult.errors && importResult.errors.length > 0) {
                assert.fail(`Failed to pass syntax:\n${testString}\nwith: ${JSON.stringify(importResult.errors,null,4)}`);
            } else {
                const startDirections = importResult.importedScenes[0].contents[0].sceneDirections;

                if (startDirections) {
                    assert.equal(startDirections[0].directionType, InstructionType.INCREASE, `Failed to pass syntax:\n${testString}`);
                    assert.equal(startDirections[0].parameters.variableName, 'variable', `Failed to pass syntax:\n${testString}`);
                    assert.equal(startDirections[0].parameters.variableValue, '32', `Failed to pass syntax:\n${testString}`);
                }
            }
        }
    });

    it("increase by variable: valid syntax variations", async function () {
        const testCases: string[] = [
            `
        @start
            *then
increase variable by othervar
        `,
        `
        @start
            *then
                increase variable   by   othervar
        `,
        `
        @start
            *then
increase          variable by othervar
        `,
        `
        @start
            *then
         increase          variable  by         othervar

        `
        ]

        for (let testString of testCases) {
            const plugin = new defaultPlugin.DefaultFormatImportPlugin();

            const importResult = await plugin.importData([
                    {
                        id: "start.abc",
                        text: testString
                    }
                ],
                {ignoreSyntaxError: false}
            );
    
            if (importResult.errors && importResult.errors.length > 0) {
                assert.fail(`Failed to pass syntax:\n${testString}\nwith: ${JSON.stringify(importResult.errors,null,4)}`);
            } else {
                const startDirections = importResult.importedScenes[0].contents[0].sceneDirections;

                if (startDirections) {
                    assert.equal(startDirections[0].directionType, InstructionType.INCREASE, `Failed to pass syntax:\n${testString}`);
                    assert.equal(startDirections[0].parameters.variableName, 'variable', `Failed to pass syntax:\n${testString}`);
                    assert.equal(startDirections[0].parameters.variableValue, '{othervar}', `Failed to pass syntax:\n${testString}`);
                }
            }
        }
    });

    it("decrease by number: valid syntax variations", async function () {
        const testCases: string[] = [
            `
        @start
            *then
decrease variable by 32
        `,
        `
        @start
            *then
                decrease variable   by   32
        `,
        `
        @start
            *then
decrease          variable by 32
        `,
        `
        @start
            *then
         decrease          variable  by         32

        `
        ]

        for (let testString of testCases) {
            const plugin = new defaultPlugin.DefaultFormatImportPlugin();

            const importResult = await plugin.importData([
                    {
                        id: "start.abc",
                        text: testString
                    }
                ],
                {ignoreSyntaxError: false}
            );
    
            if (importResult.errors && importResult.errors.length > 0) {
                assert.fail(`Failed to pass syntax:\n${testString}\nwith: ${JSON.stringify(importResult.errors,null,4)}`);
            } else {
                const startDirections = importResult.importedScenes[0].contents[0].sceneDirections;

                if (startDirections) {
                    assert.equal(startDirections[0].directionType, InstructionType.REDUCE, `Failed to pass syntax:\n${testString}`);
                    assert.equal(startDirections[0].parameters.variableName, 'variable', `Failed to pass syntax:\n${testString}`);
                    assert.equal(startDirections[0].parameters.variableValue, '32', `Failed to pass syntax:\n${testString}`);
                }
            }
        }
    });

    it("decrease by variable: valid syntax variations", async function () {
        const testCases: string[] = [
            `
        @start
            *then
decrease variable by othervar
        `,
        `
        @start
            *then
                decrease variable   by   othervar
        `,
        `
        @start
            *then
decrease          variable by othervar
        `,
        `
        @start
            *then
         decrease          variable  by         othervar

        `
        ]

        for (let testString of testCases) {
            const plugin = new defaultPlugin.DefaultFormatImportPlugin();

            const importResult = await plugin.importData([
                    {
                        id: "start.abc",
                        text: testString
                    }
                ],
                {ignoreSyntaxError: false}
            );
    
            if (importResult.errors && importResult.errors.length > 0) {
                assert.fail(`Failed to pass syntax:\n${testString}\nwith: ${JSON.stringify(importResult.errors,null,4)}`);
            } else {
                const startDirections = importResult.importedScenes[0].contents[0].sceneDirections;

                if (startDirections) {
                    assert.equal(startDirections[0].directionType, InstructionType.REDUCE, `Failed to pass syntax:\n${testString}`);
                    assert.equal(startDirections[0].parameters.variableName, 'variable', `Failed to pass syntax:\n${testString}`);
                    assert.equal(startDirections[0].parameters.variableValue, '{othervar}', `Failed to pass syntax:\n${testString}`);
                }
            }
        }
    });

    it("multiply by number: valid syntax variations", async function () {
        const testCases: string[] = [
            `
        @start
            *then
multiply variable by 32
        `,
        `
        @start
            *then
                multiply variable   by   32
        `,
        `
        @start
            *then
multiply          variable by 32
        `,
        `
        @start
            *then
         multiply          variable  by         32

        `
        ]

        for (let testString of testCases) {
            const plugin = new defaultPlugin.DefaultFormatImportPlugin();

            const importResult = await plugin.importData([
                    {
                        id: "start.abc",
                        text: testString
                    }
                ],
                {ignoreSyntaxError: false}
            );
    
            if (importResult.errors && importResult.errors.length > 0) {
                assert.fail(`Failed to pass syntax:\n${testString}\nwith: ${JSON.stringify(importResult.errors,null,4)}`);
            } else {
                const startDirections = importResult.importedScenes[0].contents[0].sceneDirections;

                if (startDirections) {
                    assert.equal(startDirections[0].directionType, InstructionType.MULTIPLY, `Failed to pass syntax:\n${testString}`);
                    assert.equal(startDirections[0].parameters.variableName, 'variable', `Failed to pass syntax:\n${testString}`);
                    assert.equal(startDirections[0].parameters.variableValue, '32', `Failed to pass syntax:\n${testString}`);
                }
            }
        }
    });

    it("multiply by variable: valid syntax variations", async function () {
        const testCases: string[] = [
            `
        @start
            *then
multiply variable by othervar
        `,
        `
        @start
            *then
                multiply variable   by   othervar
        `,
        `
        @start
            *then
multiply          variable by othervar
        `,
        `
        @start
            *then
         multiply          variable  by         othervar

        `
        ]

        for (let testString of testCases) {
            const plugin = new defaultPlugin.DefaultFormatImportPlugin();

            const importResult = await plugin.importData([
                    {
                        id: "start.abc",
                        text: testString
                    }
                ],
                {ignoreSyntaxError: false}
            );
    
            if (importResult.errors && importResult.errors.length > 0) {
                assert.fail(`Failed to pass syntax:\n${testString}\nwith: ${JSON.stringify(importResult.errors,null,4)}`);
            } else {
                const startDirections = importResult.importedScenes[0].contents[0].sceneDirections;

                if (startDirections) {
                    assert.equal(startDirections[0].directionType, InstructionType.MULTIPLY, `Failed to pass syntax:\n${testString}`);
                    assert.equal(startDirections[0].parameters.variableName, 'variable', `Failed to pass syntax:\n${testString}`);
                    assert.equal(startDirections[0].parameters.variableValue, '{othervar}', `Failed to pass syntax:\n${testString}`);
                }
            }
        }
    });

    it("divide by number: valid syntax variations", async function () {
        const testCases: string[] = [
            `
        @start
            *then
divide variable by 32
        `,
        `
        @start
            *then
                divide variable   by   32
        `,
        `
        @start
            *then
divide          variable by 32
        `,
        `
        @start
            *then
         divide          variable  by         32

        `
        ]

        for (let testString of testCases) {
            const plugin = new defaultPlugin.DefaultFormatImportPlugin();

            const importResult = await plugin.importData([
                    {
                        id: "start.abc",
                        text: testString
                    }
                ],
                {ignoreSyntaxError: false}
            );
    
            if (importResult.errors && importResult.errors.length > 0) {
                assert.fail(`Failed to pass syntax:\n${testString}\nwith: ${JSON.stringify(importResult.errors,null,4)}`);
            } else {
                const startDirections = importResult.importedScenes[0].contents[0].sceneDirections;

                if (startDirections) {
                    assert.equal(startDirections[0].directionType, InstructionType.DIVIDE, `Failed to pass syntax:\n${testString}`);
                    assert.equal(startDirections[0].parameters.variableName, 'variable', `Failed to pass syntax:\n${testString}`);
                    assert.equal(startDirections[0].parameters.variableValue, '32', `Failed to pass syntax:\n${testString}`);
                }
            }
        }
    });

    it("divide by variable: valid syntax variations", async function () {
        const testCases: string[] = [
            `
        @start
            *then
divide variable by othervar
        `,
        `
        @start
            *then
                divide variable   by   othervar
        `,
        `
        @start
            *then
divide          variable by othervar
        `,
        `
        @start
            *then
         divide          variable  by         othervar

        `
        ]

        for (let testString of testCases) {
            const plugin = new defaultPlugin.DefaultFormatImportPlugin();

            const importResult = await plugin.importData([
                    {
                        id: "start.abc",
                        text: testString
                    }
                ],
                {ignoreSyntaxError: false}
            );
    
            if (importResult.errors && importResult.errors.length > 0) {
                assert.fail(`Failed to pass syntax:\n${testString}\nwith: ${JSON.stringify(importResult.errors,null,4)}`);
            } else {
                const startDirections = importResult.importedScenes[0].contents[0].sceneDirections;

                if (startDirections) {
                    assert.equal(startDirections[0].directionType, InstructionType.DIVIDE, `Failed to pass syntax:\n${testString}`);
                    assert.equal(startDirections[0].parameters.variableName, 'variable', `Failed to pass syntax:\n${testString}`);
                    assert.equal(startDirections[0].parameters.variableValue, '{othervar}', `Failed to pass syntax:\n${testString}`);
                }
            }
        }
    });

    it("modulus by number: valid syntax variations", async function () {
        const testCases: string[] = [
            `
        @start
            *then
mod variable by 32
        `,
        `
        @start
            *then
                mod variable   by   32
        `,
        `
        @start
            *then
mod          variable by 32
        `,
        `
        @start
            *then
         mod          variable  by         32

        `
        ]

        for (let testString of testCases) {
            const plugin = new defaultPlugin.DefaultFormatImportPlugin();

            const importResult = await plugin.importData([
                    {
                        id: "start.abc",
                        text: testString
                    }
                ],
                {ignoreSyntaxError: false}
            );
    
            if (importResult.errors && importResult.errors.length > 0) {
                assert.fail(`Failed to pass syntax:\n${testString}\nwith: ${JSON.stringify(importResult.errors,null,4)}`);
            } else {
                const startDirections = importResult.importedScenes[0].contents[0].sceneDirections;

                if (startDirections) {
                    assert.equal(startDirections[0].directionType, InstructionType.MODULUS, `Failed to pass syntax:\n${testString}`);
                    assert.equal(startDirections[0].parameters.variableName, 'variable', `Failed to pass syntax:\n${testString}`);
                    assert.equal(startDirections[0].parameters.variableValue, '32', `Failed to pass syntax:\n${testString}`);
                }
            }
        }
    });

    it("modulus by variable: valid syntax variations", async function () {
        const testCases: string[] = [
            `
        @start
            *then
mod variable by othervar
        `,
        `
        @start
            *then
                mod variable   by   othervar
        `,
        `
        @start
            *then
mod          variable by othervar
        `,
        `
        @start
            *then
         mod          variable  by         othervar

        `
        ]

        for (let testString of testCases) {
            const plugin = new defaultPlugin.DefaultFormatImportPlugin();

            const importResult = await plugin.importData([
                    {
                        id: "start.abc",
                        text: testString
                    }
                ],
                {ignoreSyntaxError: false}
            );
    
            if (importResult.errors && importResult.errors.length > 0) {
                assert.fail(`Failed to pass syntax:\n${testString}\nwith: ${JSON.stringify(importResult.errors,null,4)}`);
            } else {
                const startDirections = importResult.importedScenes[0].contents[0].sceneDirections;

                if (startDirections) {
                    assert.equal(startDirections[0].directionType, InstructionType.MODULUS, `Failed to pass syntax:\n${testString}`);
                    assert.equal(startDirections[0].parameters.variableName, 'variable', `Failed to pass syntax:\n${testString}`);
                    assert.equal(startDirections[0].parameters.variableValue, '{othervar}', `Failed to pass syntax:\n${testString}`);
                }
            }
        }
    });

    it("custom with variable parameter: valid syntax variations", async function () {
        const testCases: string[] = [
            `
        @start
            *then
custom param=othervar
        `,
        `
        @start
            *then
                custom param   =   othervar
        `,
        `
        @start
            *then
custom          param = othervar
        `,
        `
        @start
            *then
         custom          param  =         othervar

        `,
        `
        @start
            *then
custom param='{othervar}'
        `,
        `
        @start
            *then
                custom param   =   '{othervar}'
        `,
        `
        @start
            *then
custom          param = '{othervar}'
        `,
        `
        @start
            *then
         custom          param  =         '{othervar}'

        `
        ]

        for (let testString of testCases) {
            const plugin = new defaultPlugin.DefaultFormatImportPlugin();

            const importResult = await plugin.importData([
                    {
                        id: "start.abc",
                        text: testString
                    }
                ],
                {ignoreSyntaxError: false}
            );
    
            if (importResult.errors && importResult.errors.length > 0) {
                assert.fail(`Failed to pass syntax:\n${testString}\nwith: ${JSON.stringify(importResult.errors,null,4)}`);
            } else {
                const startDirections = importResult.importedScenes[0].contents[0].sceneDirections;

                if (startDirections) {
                    assert.equal(startDirections[0].directionType, InstructionType.CUSTOM, `Failed to pass syntax:\n${testString}`);
                    assert.equal(startDirections[0].parameters.customName, 'custom', `Failed to pass syntax:\n${testString}`);
                    assert.equal(startDirections[0].parameters.param, '{othervar}', `Failed to pass syntax:\n${testString}`);
                }
            }
        }
    });

    it("custom without parameters: valid syntax variations", async function () {
        const testCases: string[] = [
            `
        @start
            *then
    custom
        `,
        `
        @start
            *then
                custom
        `,
        `
        @start
            *then
    custom  
        `,
        `
        @start
            *then
         custom          
    
        `
        ]
    
        for (let testString of testCases) {
            const plugin = new defaultPlugin.DefaultFormatImportPlugin();
    
            const importResult = await plugin.importData([
                    {
                        id: "start.abc",
                        text: testString
                    }
                ],
                {ignoreSyntaxError: false}
            );
    
            if (importResult.errors && importResult.errors.length > 0) {
                assert.fail(`Failed to pass syntax:\n${testString}\nwith: ${JSON.stringify(importResult.errors,null,4)}`);
            } else {
                const startDirections = importResult.importedScenes[0].contents[0].sceneDirections;
    
                if (startDirections) {
                    assert.equal(startDirections[0].directionType, InstructionType.CUSTOM, `Failed to pass syntax:\n${testString}`);
                    assert.equal(startDirections[0].parameters.customName, 'custom', `Failed to pass syntax:\n${testString}`);
                }
            }
        }
    });
});

describe("ABC Format Import Plugin Commands Test", function () {
    it("Delete Node Command Base", async function () {
        const deleteNodeCommand = new defaultPlugin.DeleteNodeCommand({
            sceneId: "second scene"
        });
        
        const result = deleteNodeCommand.apply(STANDARD_IMPORTED_STORY, {});

        assert.ok(result.match('@start') !== null);
        assert.ok(result.match('@second scene') == null);
    });

    it("New Node Command Base", async function () {
        const newNodeCommand = new defaultPlugin.NewNodeCommand({
            sceneId: "fourth scene",
            parentSceneId: "third scene"
        });
        
        const result = newNodeCommand.apply(STANDARD_IMPORTED_STORY, {});
        assert.ok(result.match('@start') !== null);
        assert.ok(result.match('@second scene') !== null);
        assert.ok(result.match('@fourth scene') !== null);
    });

    it("Remove References to Node Command Base", async function () {
        const removeRefCommand = new defaultPlugin.RemoveReferencesToNodeCommand({
            sceneId: "third scene",
        });
        
        const result = removeRefCommand.apply(STANDARD_IMPORTED_STORY, {});
        assert.ok(result.match('@start') !== null);
        assert.ok(result.match('@second scene') !== null);
        assert.ok(result.match('@third scene') !== null);
        assert.ok(result.match('-> third scene') === null);

    });

    it("Rename Node Command Base", async function () {
        const renameCommand = new defaultPlugin.RenameNodeCommand({
            sceneId: "fourth scene",
            originalSceneId: "third scene"
        });
        
        const result = renameCommand.apply(STANDARD_IMPORTED_STORY, {});
        assert.ok(result.match('@start') !== null);
        assert.ok(result.match('@second scene') !== null);
        assert.ok(result.match('@third scene') === null);
        assert.ok(result.match('@fourth scene') !== null);
    });

    it("Update Command Base", async function () {
        const updateCommand = new defaultPlugin.UpdateCommand({
            sceneId: "third scene"
        });
        
        const result = updateCommand.apply(STANDARD_IMPORTED_STORY, {});
        assert.ok(result.match('@start') !== null);
        assert.ok(result.match('@second scene') !== null);
        assert.ok(result.match('@third scene') !== null);
    });

    it("Update Go To Command Base", async function () {
        const updateGotoCommand = new defaultPlugin.UpdateGotoCommand({
            sceneId: "second scene",
            originalGoto: "third scene",
            goto: "start",
            action: InstructionType.GO_TO
        });
        
        const result = updateGotoCommand.apply(STANDARD_IMPORTED_STORY, {});

        assert.ok(result.match('@start') !== null);
        assert.ok(result.match('@second scene') !== null);
        assert.ok(result.match('@third scene') !== null);
        assert.ok(result.match('-> third scene') === null);
        assert.ok(result.match('-> start') !== null);
    });

    it("Update Hear Command Base", async function () {
        const updateHearCommand = new defaultPlugin.UpdateHearCommand({
            sceneId: "second scene",
            originalHear: "yes",
            hear: "no",
            goto: "start",
            action: InstructionType.GO_TO
        });
        
        const result = updateHearCommand.apply(STANDARD_IMPORTED_STORY, {});

        assert.ok(result.match('@start') !== null);
        assert.ok(result.match('@second scene') !== null);
        assert.ok(result.match('@third scene') !== null);
        assert.ok(result.match('-> third scene') === null);
        assert.ok(result.match('-> start') !== null);
        assert.ok(result.match('hear no {') !== null);
    });

    it("Update Hear Command With Original Goto", async function () {
        const updateHearCommand = new defaultPlugin.UpdateHearCommand({
            sceneId: "second scene",
            originalHear: "yes",
            originalGoto: "third scene",
            hear: "no",
            goto: "start",
            action: InstructionType.GO_TO
        });
        
        const result = updateHearCommand.apply(STANDARD_IMPORTED_STORY, {});

        assert.ok(result.match('@start') !== null);
        assert.ok(result.match('@second scene') !== null);
        assert.ok(result.match('@third scene') !== null);
        assert.ok(result.match('-> third scene') === null);
        assert.ok(result.match('-> start') !== null);
        assert.ok(result.match('hear no {') !== null);
    });

    // Negative test case, actually will add a new utterance because original goto does not match
    it("Update Hear Command With Non Matching Original Goto", async function () {
        const updateHearCommand = new defaultPlugin.UpdateHearCommand({
            sceneId: "second scene",
            originalHear: "yes",
            originalGoto: "fourth scene",
            hear: "no",
            goto: "start",
            action: InstructionType.GO_TO
        });
        
        const result = updateHearCommand.apply(STANDARD_IMPORTED_STORY, {});

        assert.ok(result.match('@start') !== null);
        assert.ok(result.match('@second scene') !== null);
        assert.ok(result.match('@third scene') !== null);
        assert.ok(result.match('-> third scene') !== null);
        assert.ok(result.match('-> start') !== null);
        assert.ok(result.match('hear no {') !== null);
    });

    // Only one of the hear's should update
    it("Update Hear Command With Two Hears that are the Same but Different goto targets", async function () {
        const updateHearCommand = new defaultPlugin.UpdateHearCommand({
            sceneId: "fifth scene",
            originalHear: "something",
            originalGoto: "seventh scene",
            hear: "updated something",
            goto: "fourth scene",
            action: InstructionType.GO_TO
        });
        
        const result = updateHearCommand.apply(STANDARD_IMPORTED_STORY, {});

        assert.ok(result.match('@start') !== null);
        assert.ok(result.match('@second scene') !== null);
        assert.ok(result.match('@third scene') !== null);
        assert.ok(result.match('-> sixth scene') !== null);
        assert.ok(result.match('-> seventh scene') === null);
        assert.ok(result.match('-> fourth scene') !== null);
        assert.ok(result.match('hear something {') !== null);
        assert.ok(result.match('hear updated something {') !== null);
    });

    it("Update Recap Command Base", async function () {
        const updateRecapCommand = new defaultPlugin.UpdateRecapCommand({
            sceneId: "second scene"
        });
        updateRecapCommand.setRecap("this is a recap");
        const result = updateRecapCommand.apply(STANDARD_IMPORTED_STORY, {});

        assert.ok(result.match('@start') !== null);
        assert.ok(result.match('@second scene') !== null);
        assert.ok(result.match('@third scene') !== null);
        assert.ok(result.match('\\*recap') !== null);
        assert.ok(result.match('this is a recap') !== null);
    });

    it("Update References Command Base", async function () {
        const updateReferencesCommand = new defaultPlugin.UpdateReferencesToNodeCommand({
            sceneId: "fourth scene",
            originalSceneId: "third scene"
        });
        const result = updateReferencesCommand.apply(STANDARD_IMPORTED_STORY, {});

        assert.ok(result.match('@start') !== null);
        assert.ok(result.match('@second scene') !== null);
        assert.ok(result.match('@third scene') !== null);
        assert.ok(result.match('-> third scene') === null);
        assert.ok(result.match('-> fourth scene') !== null);
    });

    it("Update Reprompt Command Base", async function () {
        const updateRepromptCommand = new defaultPlugin.UpdateRepromptCommand({
            sceneId: "third scene",
        });
        updateRepromptCommand.setReprompt("test reprompt");
        const result = updateRepromptCommand.apply(STANDARD_IMPORTED_STORY, {});

        assert.ok(result.match('@start') !== null);
        assert.ok(result.match('@second scene') !== null);
        assert.ok(result.match('@third scene') !== null);
        assert.ok(result.match('\\*reprompt') !== null);
        assert.ok(result.match('test reprompt') !== null);
    });

    it("Update Reprompt Command Base", async function () {
        const updateSayCommand = new defaultPlugin.UpdateSayCommand({
            sceneId: "third scene",
        });
        updateSayCommand.setSay("updated say");
        const result = updateSayCommand.apply(STANDARD_IMPORTED_STORY, {});

        assert.ok(result.match('@start') !== null);
        assert.ok(result.match('@second scene') !== null);
        assert.ok(result.match('@third scene') !== null);
        assert.ok(result.match('third say') === null);
        assert.ok(result.match('updated say') !== null);
    });
});

const STANDARD_IMPORTED_STORY: string = `
@start
    *say
        something
    *then
        hear yes {
            -> second scene
        }
@second scene
    *say
        second say
    *then
        hear yes {
            -> third scene
        }

@third scene
    *say
        third say

@fifth scene
    *say
        fifth say
    *then
        hear something {
            -> sixth scene
        }
        hear something {
            -> seventh scene
        }
    `;