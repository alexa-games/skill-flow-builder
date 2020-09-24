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

import { SFBContentTester } from "./SFBContentTester";
import {StoryMetadata} from '../story/storyMetadata';
import { SFBImporter } from "../importer/importer";
import { ImportErrorLine } from '../importer/importerEntity';

import {
    loadAllContent,
    loadTestResource,
    POSITIVE_TEST_STORY_DIRECTORY,
    GLOBAL_TEST_STORY_DIRECTORY,
    loadTestStory,
    loadTestResourceAsObject,
    NEGATIVE_TEST_STORY_DIRECTORY_MISSING_START
} from "./utilities/storyUtilities";
import { POSITIVE_TEST_STORY_LIST } from "./utilities/testStoryLists";
import { GLOBAL_TEST_STORY_LIST } from "./utilities/testStoryLists";

import {
    SnippetExtension, GlobalDirectionsExtension, VoiceOverExtension
} from '../extensions/SFBExtension';
import { crashOnUnhandledRejections } from '@alexa-games/sfb-util';
import { strict as assert, AssertionError } from 'assert';

const ffmpeg = { // FFMPEG Stub for Testing
    path: "",
};
crashOnUnhandledRejections();

const DEFAULT_IMPORT_PLUGIN_NAME: string = "default";

describe("Scene Transition Baseline", function () {
    let contentTester: SFBContentTester;

    before(async function () {
        let importer = new SFBImporter(undefined, undefined, [
            new GlobalDirectionsExtension([]),
            new SnippetExtension({}),
            new VoiceOverExtension("{{file_name}}")
        ]);
        let importedStory: StoryMetadata = await importer.importABCStory(
            DEFAULT_IMPORT_PLUGIN_NAME,
            "",
            "test",
            "test",
            true,
            {
                customSlots: loadTestResourceAsObject(POSITIVE_TEST_STORY_DIRECTORY, "SlotTypes.json"),
                content: loadTestStory(POSITIVE_TEST_STORY_DIRECTORY, "IntegrationTestStory.abc")
            }
        );
        contentTester = new SFBContentTester(importedStory, [
            new GlobalDirectionsExtension([]),
            new SnippetExtension({}),
            new VoiceOverExtension("{{file_name}}")
        ], ffmpeg.path);
    });

    beforeEach(function (done) {
        contentTester.resetTest();
        done();
    });

    it("Auto Scene Transition", async function () {
        await contentTester.givenStartInvoked();

        contentTester.assertSceneID("somewhere");
        contentTester.assertAttributeEquals("someVar", 5);
    });
});


describe("APL Test", function () {
    let contentTester: SFBContentTester;

    before(async function () {
        let ispFile = "ProductISPs.json";

        let importer = new SFBImporter(undefined, undefined, [
            new GlobalDirectionsExtension([]),
            new SnippetExtension({}),
            new VoiceOverExtension("{{file_name}}")
        ]);

        let importedStory: StoryMetadata = await importer.importABCStory(
            DEFAULT_IMPORT_PLUGIN_NAME,
            "",
            "snippets test",
            "snippets test",
            true,
            {
                customSlots: loadTestResourceAsObject(POSITIVE_TEST_STORY_DIRECTORY, "SlotTypes.json"),
                contents: loadAllContent(POSITIVE_TEST_STORY_DIRECTORY, POSITIVE_TEST_STORY_LIST)
            }
        );

        contentTester = new SFBContentTester(importedStory, [
            new GlobalDirectionsExtension([]),
            new SnippetExtension({}),
            new VoiceOverExtension("{{file_name}}")
        ], ffmpeg.path);
    });

    beforeEach(function (done) {
        contentTester.resetTest();
        done();
    });

    it("APL scenes", async function () {
        await contentTester.givenStartInvoked();
        await contentTester.givenUserInput({ value: "APL" });
        await contentTester.assertSceneID("apl");
        await contentTester.assertSpeech("APL test. You should see a blank background with text. The title should read, This is the title. The subtitle should read, This is the subtitle. Say, more, to move on.");
        await contentTester.assertPrettySpeech("APL test. You should see a blank background with text. The title should read, This is the title. The subtitle should read, This is the subtitle. Say, more, to move on.");
        await contentTester.givenUserInput({ value: "more" });
        await contentTester.assertSceneID("moreapl");
        await contentTester.givenUserInput({ value: "more" });
        await contentTester.assertSceneID("evenmoreapl");
        await contentTester.givenUserInput({ value: "more" });
    });
});

describe("Skill Flow Builder Test", function () {
    let contentTester: SFBContentTester;

    before(async function () {
        let importer = new SFBImporter(undefined, undefined, [
            new GlobalDirectionsExtension([]),
            new SnippetExtension({}),
            new VoiceOverExtension("{{file_name}}")
        ]);
        let importedStory: StoryMetadata = await importer.importABCStory(
            DEFAULT_IMPORT_PLUGIN_NAME,
            "",
            "content engine test",
            "content engine test",
            true,
            {
                customSlots: loadTestResourceAsObject(POSITIVE_TEST_STORY_DIRECTORY, "SlotTypes.json"),
                contents: loadAllContent(POSITIVE_TEST_STORY_DIRECTORY, POSITIVE_TEST_STORY_LIST)
            }
        );
        contentTester = new SFBContentTester(importedStory, [
            new GlobalDirectionsExtension([]),
            new SnippetExtension({}),
            new VoiceOverExtension("{{file_name}}")
        ], ffmpeg.path);

    });

    beforeEach(function (done) {
        contentTester.resetTest();
        done();
    });

    it("audio source tag", async function () {
        await contentTester.givenStartInvoked();

        await contentTester.givenUserInput({ value: "audio source tag" });

        await contentTester.assertSpeech(
            "playing audio now: <audio src='https://sfb-framework.s3.amazonaws.com/examples/sounds/Trumpet_1.mp3' />  Playing same tag, but with a snippet. <trumpets> Thanks for testing. Bye."
        );

        await contentTester.assertPrettySpeech(
            "playing audio now: <audio src='https://sfb-framework.s3.amazonaws.com/examples/sounds/Trumpet_1.mp3' />  Playing same tag, but with a snippet. <trumpets> Thanks for testing. Bye."
        );

        await contentTester.assertPrettySpeechSSML(
            "playing audio now: <audio src='https://sfb-framework.s3.amazonaws.com/examples/sounds/Trumpet_1.mp3' />  Playing same tag, but with a snippet. <trumpets> Thanks for testing. Bye."
        );

        await contentTester.assertSpeechSSMLPerScene(
            "playing audio now: <audio src='https://sfb-framework.s3.amazonaws.com/examples/sounds/Trumpet_1.mp3' />  Playing same tag, but with a snippet. <trumpets> Thanks for testing. Bye."
        );
    });

    it("background music");
    // , async function () {
    //     await contentTester.givenStartInvoked();
    //     await contentTester.givenUserInput({ value: "background music" });
    //     await contentTester.assertSpeech(
    //         "Testing global S3 bgm. Say next to test non-global.");
    //     await contentTester.givenUserInput({ value: "next" });
    //     await contentTester.assertSpeech("This is a non-global s3 bucket bgm. Say end to end.");
    //     await contentTester.givenUserInput({ value: "end" });
    // });

    it("say statement", async function () {
        await contentTester.givenStartInvoked();

        await contentTester.assertSpeech(
            "Please select a test."
        );
    });

    it("then hear block", async function () {
        await contentTester.givenStartInvoked();
        await contentTester.assertSpeech(
            "Please select a test."
        );

        await contentTester.givenUserInput({ value: "golden" });
        await contentTester.assertSpeech(
            "This is the new file for json baked story verification. Say next to move on."
        );
    });

    it("conditional/if test", async function() {
        await contentTester.givenStartInvoked();
        await contentTester.givenUserInput({ value: "conditional test" });

        await contentTester.assertSceneID("simple truthy condition test");
        await contentTester.givenUserInput({ value: "next" });
        await contentTester.assertSceneID("conditional test pass", 'truthy fail');
        await contentTester.givenUserInput({ value: "next" });

        await contentTester.assertSceneID("simple falsy condition test");
        await contentTester.givenUserInput({ value: "next" });
        await contentTester.assertSceneID("conditional test pass", 'falsy fail');
        await contentTester.givenUserInput({ value: "next" });

        await contentTester.assertSceneID("empty conditional block test");
        await contentTester.givenUserInput({ value: "next" });
        await contentTester.assertSceneID("conditional test pass", 'empty block fail');
    });

    it("bookmarks", async function () {
        await contentTester.givenStartInvoked();
        await contentTester.givenUserInput({ value: "bookmarks" });

        // normal functionality
        await contentTester.assertSpeech(
            "Welcome to the bookmark test. Say END at any time to quit testing. Say SAVE MY PLACE to bookmark this scene. Say CONTINUE to move on to the next scene without setting a bookmark."
        );
        await contentTester.givenUserInput({ value: "save my place" });
        await contentTester.assertSpeech(
            "This is Scene 2. Say SAVE MY PLACE to bookmark this scene. Say CONTINUE to move on to the next scene without setting a bookmark. say BOOKMARK to go to the scene you have bookmarked."
        );
        await contentTester.givenUserInput({ value: "bookmark" });
        await contentTester.assertSpeech(
            "Welcome to the bookmark test. Say END at any time to quit testing. Say SAVE MY PLACE to bookmark this scene. Say CONTINUE to move on to the next scene without setting a bookmark."
        );

        // bookmarks update
        await contentTester.givenUserInput({ value: "save my place" });
        await contentTester.assertSpeech(
            "This is Scene 2. Say SAVE MY PLACE to bookmark this scene. Say CONTINUE to move on to the next scene without setting a bookmark. say BOOKMARK to go to the scene you have bookmarked."
        );
        await contentTester.givenUserInput({ value: "save my place" });
        await contentTester.assertSpeech(
            "This is scene 3. Say SAVE MY PLACE to bookmark this scene. Say CONTINUE to move on to the next scene without setting a bookmark. say BOOKMARK to go to the scene you have bookmarked."
        );
        await contentTester.givenUserInput({ value: "bookmark" });
        await contentTester.assertSpeech(
            "This is Scene 2. Say SAVE MY PLACE to bookmark this scene. Say CONTINUE to move on to the next scene without setting a bookmark. say BOOKMARK to go to the scene you have bookmarked."
        );
    });

    it("built in slots");
    // , async function () {
    //     await contentTester.givenStartInvoked();
    //     await contentTester.givenUserInput({ value: "built in slots" });

    //     await contentTester.assertSpeech(
    //         "Welcome to the built in slots test. What's your first name?"
    //     );
    //     await contentTester.givenUserInput({ value: "Tester"});
    //     await contentTester.assertSpeech(
    //         "Hi Tester! Now give me a number!"
    //     );
    //     await contentTester.givenUserInput({ value: "5"});
    //     await contentTester.assertSpeech(
    //         "Tester, your number is 5! Thanks for testing. Bye."
    //     );
    // });

    it("custom slots");
    // , async function () {
    //     await contentTester.givenStartInvoked();
    //     await contentTester.givenUserInput({ value: "custom slots" });

    //     await contentTester.assertSpeech(
    //         "Custom slot test. Say apple, pear, or, orange."
    //     );
    //     await contentTester.givenUserInput({ value: "apple" });
    //     await contentTester.assertSpeech(
    //         "Success! That word is a value in our Custom Fruit Type slot. Do you want to try again?"
    //     );
    // });

    it("clear", async function () {
        await contentTester.givenStartInvoked();
        await contentTester.givenUserInput({ value: "clear" });
        await contentTester.assertSpeech(
            "Clear one variable test. The current variable has a value of 1. Say Clear."
        );
        await contentTester.givenUserInput({ value: "clear" });
        await contentTester.assertSpeech(
            "The current variable has a value of false. Thanks for testing. Bye."
        );
    });

    it("clear all", async function () {
        await contentTester.givenStartInvoked();

        await contentTester.givenUserInput({ value: "Clear All Variables" });

        await contentTester.assertSpeech("Clear all test. Value of T1 is 1. Value of T2 is 2. Value of T-string is fubar. Say clear to clear everything.");

        await contentTester.givenUserInput({ value: "clear" });

        await contentTester.assertSpeech(
            "T1 is false. T2 is false. T-string is false. All the values should be false! Thanks for testing. Bye."
        );
    });

    it("ending", async function () {
        await contentTester.givenStartInvoked();
        await contentTester.givenUserInput({ value: "ending" });
        await contentTester.assertSpeech(
            "Welcome to the end test. The skill should end after I say bye. Bye!"
        );
        await contentTester.assertSceneID(
            "start"
        );
    });

    it("flag", async function () {
        await contentTester.givenStartInvoked();

        await contentTester.givenUserInput({ value: "flags" });
        await contentTester.assertSceneID(
            "flag"
        );
        await contentTester.givenUserInput({ value: "flag" });
        await contentTester.assertSpeech(
            "Success! Hesitated is now true. Do you want to try again?"
        );
        await contentTester.givenUserInput({ value: "yes" });
        await contentTester.assertSpeech(
            "Welcome to the flag test. Our variable is called HESITATED and is currently set to true. Do you want to flag or unflag it?"
        );
        await contentTester.givenUserInput({ value: "unflag" });
        await contentTester.assertSpeech(
            "Success! Hesitated is now false. Do you want to try again?"
        );
        await contentTester.givenUserInput({ value: "no" });
        await contentTester.assertSpeech(
            "Thanks for testing. Bye."
        );
    });

    it("go back test", async function () {
        await contentTester.givenStartInvoked();
        await contentTester.givenUserInput({ value: "go back test" });

        await contentTester.assertSpeech(
            "Welcome to the go back test. Tracked variable is at false. Going to the next scene! Say CONTINUE to start."
        );
        await contentTester.givenUserInput({ value: "continue" });

        await contentTester.assertSpeech(
            "Welcome to scene two! Tracked variable is at 1. Say increase to go to the next scene and increase runCount."
        );
        await contentTester.givenUserInput({ value: "increase" });
        await contentTester.assertSpeech(
            "Welcome to scene three! Tracked variable is at 2. Say go back to return to the last scene. Say end to exit the test."
        );
        await contentTester.givenUserInput({ value: "go back" });

        await contentTester.assertSpeech(
            "Welcome to scene two! Tracked variable is at 2. Say increase to go to the next scene and increase runCount."
        );
    });

    it("unflag", async function () {
        await contentTester.givenStartInvoked();

        await contentTester.givenUserInput({ value: "flags" });
        await contentTester.assertSceneID(
            "flag"
        );
        await contentTester.givenUserInput({ value: "unflag" });
        await contentTester.assertSpeech(
            "Success! Hesitated is now false. Do you want to try again?"
        );
        await contentTester.givenUserInput({ value: "no" });
    });

    it("hear otherwise", async function () {
        await contentTester.givenStartInvoked();
        await contentTester.givenUserInput({ value: "hear otherwise" });
        await contentTester.assertSceneID("otherwise");
        await contentTester.givenUserInput({ value: "blah" });
        await contentTester.assertSpeech(
            "You said something other than test. Pass! Thanks for testing. Bye."
        );
    });

    it("if operator - a", async function () {
        await contentTester.givenStartInvoked();
        await contentTester.givenUserInput({ value: "if operators" });

        await contentTester.assertSpeech(
            "If operators. Say a, b, c, d, e, or f."
        );

        await contentTester.givenUserInput({ value: "a" });

        await contentTester.assertSpeech(
            "If operator test, A. The flag is set to true. Pass! Unflagging the variable now. If operator test, A. The flag is set to false. Pass! Thanks for testing. Bye."
        );
    });

    it("if operator - b", async function () {
        await contentTester.givenStartInvoked();
        await contentTester.givenUserInput({ value: "if operators" });

        await contentTester.assertSpeech(
            "If operators. Say a, b, c, d, e, or f."
        );

        await contentTester.givenUserInput({ value: "b" });

        await contentTester.assertSpeech(
            "If operator test, B. If variable 1 equals 0, and variable 2 equals 100, our test will pass. Pass! Variable one is 0. Variable two is 100. Lets increase each variable by one and do it again. If operator test, B. If variable 1 equals 0, and variable 2 equals 100, our test will pass. Pass! Variable one is 1. Variable two is 101. Thanks for testing. Bye."
        );
    });

    it("if operator - c", async function () {
        await contentTester.givenStartInvoked();
        await contentTester.givenUserInput({ value: "if operators" });

        await contentTester.assertSpeech(
            "If operators. Say a, b, c, d, e, or f."
        );

        await contentTester.givenUserInput({ value: "c" });

        await contentTester.assertSpeech(
            "If operator test, C. If our variable is greater than zero, this will fail. Our variable is 0. PASS! Thanks for testing. Bye."
        );
    });

    // check nested ifs
    it("if operator - d", async function () {
        await contentTester.givenStartInvoked();
        await contentTester.givenUserInput({ value: "if operators" });

        await contentTester.assertSpeech(
            "If operators. Say a, b, c, d, e, or f."
        );

        await contentTester.givenUserInput({ value: "d" });

        await contentTester.assertSpeech(
            "If operator test, D. Nested if statement. Passed 2 nested if statements. PASS! Thanks for testing. Bye."
        );
    });

    // check not operator
    it("if operator - e", async function () {
        await contentTester.givenStartInvoked();
        await contentTester.givenUserInput({ value: "if operators" });

        await contentTester.assertSpeech(
            "If operators. Say a, b, c, d, e, or f."
        );

        await contentTester.givenUserInput({ value: "e" });

        await contentTester.assertSpeech(
            "If operator test, E. If not test. If not operator works. Pass! Thanks for testing. Bye."
        );
    });

    // check true operator
    it("if operator - f", async function () {
        await contentTester.givenStartInvoked();
        await contentTester.givenUserInput({ value: "if operators" });

        await contentTester.assertSpeech(
            "If operators. Say a, b, c, d, e, or f."
        );

        await contentTester.givenUserInput({ value: "f" });

        await contentTester.assertSpeech(
            "If operator test, F. If true. True was checked first. True equals true. Who knew? Pass! Thanks for testing. Bye."
        );
    });

    // check false operator
    it("if operator - g", async function () {
        await contentTester.givenStartInvoked();
        await contentTester.givenUserInput({ value: "if operators" });

        await contentTester.assertSpeech(
            "If operators. Say a, b, c, d, e, or f."
        );

        await contentTester.givenUserInput({ value: "g" });

        await contentTester.assertSpeech(
            "If operator test, G. If false. False was checked first. False equals false. Who knew? Pass! Thanks for testing. Bye."
        );
    });

    it("immediate goto", async function () {
        await contentTester.givenStartInvoked();
        await contentTester.givenUserInput({ value: "immediate go to" });
        await contentTester.assertSpeech(
            "Immediate go-to test. Going to the next scene now without input. Hi. This is the next scene. Success! Thanks for testing. Bye."
        );
    });

    // To do: Add more cases for different increments/decrements.
    it("increase", async function () {
        await contentTester.givenStartInvoked();

        await contentTester.givenUserInput({ value: "increase decrease" });
        await contentTester.assertSpeech(
            "Increase and decrease test. You currently have false bottles. Lets give you some bottles! You now have 1 bottles. Say Increase, Decrease, or End."
        );

        // 1, then increase by 1 = 2
        await contentTester.givenUserInput({ value: "increase" });
        await contentTester.givenUserInput({ value: "one" });
        await contentTester.assertSpeech(
            "You now have 2 bottles. Say Increase, Decrease, or End."
        );

        // 2, then increase by = 4
        await contentTester.givenUserInput({ value: "increase" });
        await contentTester.givenUserInput({ value: "two" });
        await contentTester.assertSpeech(
            "You now have 4 bottles. Say Increase, Decrease, or End."
        );

        // 4, then increase by 5 = 9
        await contentTester.givenUserInput({ value: "increase" });
        await contentTester.givenUserInput({ value: "five" });
        await contentTester.assertSpeech(
            "You now have 9 bottles. Say Increase, Decrease, or End."
        );

        // increase by random
        await contentTester.givenUserInput({ value: "increase" });
        await contentTester.givenUserInput({ value: "random" });
        let beerBottles = await contentTester.getAttributeValue("beerBottles");
        await contentTester.assertSpeech(
            "You now have " + beerBottles + " bottles. Say Increase, Decrease, or End."
        );
        await contentTester.givenUserInput({ value: "end" });
        await contentTester.assertSpeech(
            "Thanks for testing. Bye."
        );
    });

    it("modulus by five", async function () {
        await contentTester.givenStartInvoked();

        await contentTester.givenUserInput({ value: "modulus" });
        await contentTester.assertSpeech(
            "Modulus test. You currently have false bottles. Lets give you some bottles! You now have 3 bottles. Mod by five, or Mod by three, or Mod by two."
        );

        // 1, then increase by 1 = 2
        await contentTester.givenUserInput({ value: "mod by five" });
        await contentTester.assertSpeech(
            "You now have 3 bottles. Mod by five, or Mod by three, or Mod by two."
        );
    });

    it("modulus by three", async function () {
        await contentTester.givenStartInvoked();

        await contentTester.givenUserInput({ value: "modulus" });
        await contentTester.assertSpeech(
            "Modulus test. You currently have false bottles. Lets give you some bottles! You now have 3 bottles. Mod by five, or Mod by three, or Mod by two."
        );

        // 1, then increase by 1 = 2
        await contentTester.givenUserInput({ value: "mod by three" });
        await contentTester.assertSpeech(
            "You now have 0 bottles. Mod by five, or Mod by three, or Mod by two."
        );
    });

    it("modulus by two", async function () {
        await contentTester.givenStartInvoked();

        await contentTester.givenUserInput({ value: "modulus" });
        await contentTester.assertSpeech(
            "Modulus test. You currently have false bottles. Lets give you some bottles! You now have 3 bottles. Mod by five, or Mod by three, or Mod by two."
        );

        // 1, then increase by 1 = 2
        await contentTester.givenUserInput({ value: "mod by two" });
        await contentTester.assertSpeech(
            "You now have 1 bottles. Mod by five, or Mod by three, or Mod by two."
        );
    });

    it("infinite loop");
    // , async function () {
    //     await contentTester.givenStartInvoked();
    //     await contentTester.givenUserInput({ value: "infinite" });

    //     let rollResult = await contentTester.getAttributeValue("rollResult");
    //     await contentTester.assertSpeech(
    //         "Welcome to the Infinite loop test. This will break your skill. Let's roll a die! You rolled a " + rollResult + ". Lets do it all again! Forever!"
    //     );

    //     let i = 0;
    //     while (i < 1000) {
    //         await contentTester.assertSceneID(
    //             "infinite roll test"
    //         );
    //         i++;
    //     }
    // });

    // To do: Add more cases for different increments/decrements.
    it("decrease", async function () {
        await contentTester.givenStartInvoked();

        await contentTester.givenUserInput({ value: "increase decrease" });
        await contentTester.assertSpeech(
            "Increase and decrease test. You currently have false bottles. Lets give you some bottles! You now have 1 bottles. Say Increase, Decrease, or End."
        );

        // 1, then decrease by 1 = 0
        await contentTester.givenUserInput({ value: "decrease" });
        await contentTester.givenUserInput({ value: "one" });
        await contentTester.assertSpeech(
            "You now have 0 bottles. Say Increase, Decrease, or End."
        );

        // 0, then decrease by 2 = -2
        await contentTester.givenUserInput({ value: "decrease" });
        await contentTester.givenUserInput({ value: "two" });
        await contentTester.assertSpeech(
            "You now have -2 bottles. Say Increase, Decrease, or End."
        );

        // -2, then decrease by 5 = -7
        await contentTester.givenUserInput({ value: "decrease" });
        await contentTester.givenUserInput({ value: "five" });
        await contentTester.assertSpeech(
            "You now have -7 bottles. Say Increase, Decrease, or End."
        );

        // decrease by random
        await contentTester.givenUserInput({ value: "decrease" });
        await contentTester.givenUserInput({ value: "random" });
        let beerBottles = await contentTester.getAttributeValue("beerBottles");
        await contentTester.assertSpeech(
            "You now have " + beerBottles + " bottles. Say Increase, Decrease, or End."
        );
        await contentTester.givenUserInput({ value: "end" });
        await contentTester.assertSpeech(
            "Thanks for testing. Bye."
        );
    });

    it("golden", async function () {
        await contentTester.givenStartInvoked();

        await contentTester.givenUserInput({ value: "golden" });
        await contentTester.assertSceneID(
            "golden"
        );
        await contentTester.givenUserInput({ value: "next" });
        await contentTester.assertSpeech(
            "Yay that worked, I suppose? Thanks for testing. Bye."
        );
    });

    // Pause (in-skill, manual-only!)
    it("go to return with variables", async function () {
        await contentTester.givenStartInvoked();
        // chocolate
        await contentTester.givenUserInput({ value: "Go To Return With Variables" });
        await contentTester.assertSpeech(
            "Welcome to the multiple go to hears test. We're about to go into a scene with a handful of hear statements, then return back to here! Say one of these words: Chocolate, Purple, Oranges, or, Macho Man."
        );
        await contentTester.givenUserInput({ value: "chocolate" });
        await contentTester.assertSpeech(
            "You chose chocolate, which got you 1 points! Try again?"
        );
        await contentTester.givenUserInput({ value: "yes" });
        // purple
        await contentTester.assertSpeech(
            "Welcome to the multiple go to hears test. We're about to go into a scene with a handful of hear statements, then return back to here! Say one of these words: Chocolate, Purple, Oranges, or, Macho Man."
        );
        await contentTester.givenUserInput({ value: "purple" });
        await contentTester.assertSpeech(
            "You chose purple, which got you 2 points! Try again?"
        );
        await contentTester.givenUserInput({ value: "yes" });
        // oranges
        await contentTester.assertSpeech(
            "Welcome to the multiple go to hears test. We're about to go into a scene with a handful of hear statements, then return back to here! Say one of these words: Chocolate, Purple, Oranges, or, Macho Man."
        );
        await contentTester.givenUserInput({ value: "oranges" });
        await contentTester.assertSpeech(
            "You chose oranges, which got you 3 points! Try again?"
        );
        await contentTester.givenUserInput({ value: "yes" });
        // macho man
        await contentTester.assertSpeech(
            "Welcome to the multiple go to hears test. We're about to go into a scene with a handful of hear statements, then return back to here! Say one of these words: Chocolate, Purple, Oranges, or, Macho Man."
        );
        await contentTester.givenUserInput({ value: "macho man" });
        await contentTester.assertSpeech(
            "You chose macho man, which got you 4 points! Try again?"
        );
        await contentTester.givenUserInput({ value: "no" });
        await contentTester.assertSpeech(
            "Thanks for testing. Bye."
        );
    });

    it("multiple voice tags", async function () {
        await contentTester.givenStartInvoked();
        await contentTester.givenUserInput({ value: "multiple voice tags" });

        await contentTester.assertSpeech(
            "Audio source test. <audio src='https://sfb-framework.s3.amazonaws.com/examples/sounds/Trumpet_1.mp3' />  Here's a conversation between a few friends. <amazon:effect name='whispered'>I want to tell you a secret.</amazon:effect> <voice name='Brian'>Okay, I'm listening.</voice><voice name='Kendra'><lang xml:lang='en-US'>Americans say, advertisement, and barbecue.</lang> <lang xml:lang='en-GB'>British people say, advertisement, and barbecue. How do you say it?</lang></voice><voice name='Brian'><lang xml:lang='en-GB'>I say advertisement, and, barbecue.</lang> <lang xml:lang='en-US'>But I can also say it your way. Advertisement, barbecue. See?</lang></voice><voice name='Justin'>Do you say, <phoneme alphabet='ipa' ph='pɪˈkɑːn'>pecan</phoneme>, or, <phoneme alphabet='ipa' ph='ˈpi.kæn'>pecan</phoneme>?</voice><voice name='Ivy'> I want to <w role=amazon:VBD>read</w> a new book, but I've already <w role='amazon:VB'>read</w> everything in the library! That didn't sound right, lets try that again. I want to <w role='amazon:VB'>read</w> a new book, but I've already <w role='amazon:VBD'>read</w> everything in the library! Much better! </voice> Thanks for testing. Bye."
        );
    });

    it("Pause and resume - pause handled as utterance", async function () {
        await contentTester.givenStartInvoked();
        await contentTester.givenUserInput({ value: "pause test" });
        await contentTester.assertSpeech(
            "Welcome to the pause and resume test. Say continue to drink a health potion!"
        );
        await contentTester.givenUserInput({ 
            intent: "AMAZON.ResumeIntent"
        });
        await contentTester.assertSpeech(
            "You have 10 hit points! Say pause to pause the game! Say end to end the test. Or say drink to drink another health potion!"
        );
        await contentTester.givenPauseInvoked();

        await contentTester.assertSpeech(
            "You made it to the pause scene! The skill will end, but when you relaunch it you should automatically start at the resume scene!"
        );

        await contentTester.givenResumeInvoked();
        // verify variables are saved through pause/restart
        await contentTester.assertSpeech(
            "Resuming from where you left off last. You have 10 hit points! Say pause to pause the game! Say end to end the test. Or say drink to drink another health potion!"
        );
        await contentTester.givenUserInput({ value: "drink" });
        await contentTester.assertSpeech(
            "You have 20 hit points! Say pause to pause the game! Say end to end the test. Or say drink to drink another health potion!"
        );
        await contentTester.givenPauseInvoked();
        await contentTester.givenResumeInvoked();
        // verify updated variable persists correctly
        await contentTester.assertSpeech(
            "Resuming from where you left off last. You have 20 hit points! Say pause to pause the game! Say end to end the test. Or say drink to drink another health potion!"
        );
    });

    it("Pause and resume - default pause handling", async function () {
        await contentTester.givenStartInvoked();
        await contentTester.givenUserInput({ value: "default pause test" });
        await contentTester.assertSpeech(
            "Welcome to the pause and resume test. Say continue to drink a health potion!"
        );
        await contentTester.givenUserInput({ 
            intent: "AMAZON.ResumeIntent"
        });
        await contentTester.assertSpeech(
            "You have 10 hit points! Say pause to pause the game! Say end to end the test. Or say drink to drink another health potion!"
        );
        await contentTester.givenPauseInvoked();

        await contentTester.assertSpeech(
            "You made it to the pause scene! The skill will end, but when you relaunch it you should automatically start at the resume scene!"
        );
        await contentTester.givenResumeInvoked();
        // verify variables are saved through pause/restart
        await contentTester.assertSpeech(
            "Resuming from where you left off last. You have 10 hit points! Say pause to pause the game! Say end to end the test. Or say drink to drink another health potion!"
        );
        await contentTester.givenUserInput({ value: "drink" });
        await contentTester.assertSpeech(
            "You have 20 hit points! Say pause to pause the game! Say end to end the test. Or say drink to drink another health potion!"
        );
        await contentTester.givenPauseInvoked();
        await contentTester.givenResumeInvoked();
        // verify updated variable persists correctly
        await contentTester.assertSpeech(
            "Resuming from where you left off last. You have 20 hit points! Say pause to pause the game! Say end to end the test. Or say drink to drink another health potion!"
        );
    });

    it("repeat", async function () {
        await contentTester.givenStartInvoked(); // Waits for @start scene.
        await contentTester.givenUserInput({ value: "repeat test" }); // Waits for customer to say "repeat test".
        let currentSpeech: string = await contentTester.getSpeech(); // Gets the current *say contents of the scene we're in now, "@repeat test".
        await contentTester.givenUserInput({ value: "hear this again" }); // Waits for customer to say "hear this again".

        await contentTester.assertSceneID( // Waits for the scene, @repeat test, to be active.
            "repeat test"
        );
        await contentTester.assertSpeech( // Waits for the *say to be spoken.
            currentSpeech
        );

        await contentTester.givenUserInput({ value: "move on" });
        currentSpeech = await contentTester.getSpeech(); // Now reset currentSpeech to be the content of the *say block in the new scene we're in now, @repeat scene two.
        await contentTester.assertSceneID(
            "repeat scene two"
        );
        await contentTester.assertSpeech(
            currentSpeech
        );

        await contentTester.givenUserInput({ value: "hear this again" });

        await contentTester.assertSceneID(
            "repeat scene two"
        );
        await contentTester.assertSpeech(
            currentSpeech
        );

        await contentTester.givenUserInput({ value: "move on" });
        await contentTester.assertSceneID(
            "repeat scene three"
        );
        await contentTester.givenUserInput({ value: "hodor" }); // triggers the recap say statement
        await contentTester.assertSpeech(
            "Recap statement. This should play if the user says something unexpected like HODOR! Say REPEAT to repeat this statement. Say END to quit. Say RETRY to retry."
        );
        currentSpeech = await contentTester.getSpeech(); // sets speach to the recap statement

        await contentTester.givenUserInput({ value: "repeat" });
        await contentTester.assertSpeech(
            currentSpeech
        );
    });

    it("reprompt", async function () {
        await contentTester.givenStartInvoked();

        await contentTester.givenUserInput({ value: "reprompt test" });

        await contentTester.assertReprompt(
            "This is the reprompt line. Say end to quit."
        );
    });

    // Perhaps to be updated with exact numbers expected instead of current values?
    it("restart", async function () {
        await contentTester.givenStartInvoked();
        await contentTester.givenUserInput({ value: "restart test" });
        await contentTester.assertSpeech(
            "Welcome to the restart test! You've run this test false times. Say restart to return to the start scene. Or say end to quit the skill."
        );
        await contentTester.givenUserInput({ value: "restart" });
        await contentTester.assertSceneID("start");
        await contentTester.assertSpeech("Please select a test.");
        await contentTester.givenUserInput({ value: "restart test" });
        await contentTester.assertSpeech(
            "Welcome to the restart test! You've run this test 1 times. Say restart to return to the start scene. Or say end to quit the skill."
        );
    });

    it("Trigger >>RESTART immediately from a scene", async function () {
        await contentTester.givenStartInvoked();
        await contentTester.givenUserInput({ value: "restart test" });
        await contentTester.assertSpeech(
            "Welcome to the restart test! You've run this test false times. Say restart to return to the start scene. Or say end to quit the skill."
        );
        await contentTester.givenUserInput({ value: "immediate trigger scene " });
        await contentTester.assertSceneID("start");
        await contentTester.assertSpeech("Please select a test.");
        await contentTester.givenUserInput({ value: "restart test" });
        await contentTester.assertSpeech(
            "Welcome to the restart test! You've run this test 1 times. Say restart to return to the start scene. Or say end to quit the skill."
        );
    });

    it("dice rolls - common", async function () {
        await contentTester.givenStartInvoked();

        await contentTester.givenUserInput({ value: "roll test" });
        await contentTester.assertSpeech(
            "Which roll type do you want to test? Common or uncommon?"
        );
        await contentTester.givenUserInput({ value: "common" });

        let d4 = await contentTester.getAttributeValue("rr1d4");
        let d6 = await contentTester.getAttributeValue("rr1d6");
        let d8 = await contentTester.getAttributeValue("rr1d8");
        let d10 = await contentTester.getAttributeValue("rr1d10");
        let d12 = await contentTester.getAttributeValue("rr1d12");
        let d20 = await contentTester.getAttributeValue("rr1d20");
        let d100 = await contentTester.getAttributeValue("rr1d100");

        await contentTester.assertSpeech(
            "Generating common rolls. Results. 1D4 rolled " + d4 + ". 1D6 rolled " + d6 + ". 1D8 rolled " + d8 + ". 1D10 rolled " + d10 + ". 1D12 rolled " + d12 + ". 1D20 rolled " + d20 + ". 1D100 rolled " + d100 + ". Do you want to roll again?"
        );

        // ensure rolls update/override previous rolls
        await contentTester.givenUserInput({ value: "yes" });

        d4 = await contentTester.getAttributeValue("rr1d4");
        d6 = await contentTester.getAttributeValue("rr1d6");
        d8 = await contentTester.getAttributeValue("rr1d8");
        d10 = await contentTester.getAttributeValue("rr1d10");
        d12 = await contentTester.getAttributeValue("rr1d12");
        d20 = await contentTester.getAttributeValue("rr1d20");
        d100 = await contentTester.getAttributeValue("rr1d100");

        await contentTester.assertSpeech(
            "Generating common rolls. Results. 1D4 rolled " + d4 + ". 1D6 rolled " + d6 + ". 1D8 rolled " + d8 + ". 1D10 rolled " + d10 + ". 1D12 rolled " + d12 + ". 1D20 rolled " + d20 + ". 1D100 rolled " + d100 + ". Do you want to roll again?"
        );
    });

    it("dice rolls - uncommon", async function () {
        await contentTester.givenStartInvoked();

        await contentTester.givenUserInput({ value: "roll test" });
        await contentTester.assertSpeech(
            "Which roll type do you want to test? Common or uncommon?"
        );
        await contentTester.givenUserInput({ value: "uncommon" });

        let firstRoll = await contentTester.getAttributeValue("2d4r");
        let secondRoll = await contentTester.getAttributeValue("3d6r");
        let thirdRoll = await contentTester.getAttributeValue("twtNeg");
        let fourthRoll = await contentTester.getAttributeValue("1d101r");
        let fifthRoll = await contentTester.getAttributeValue("1d2r");
        let sixthRoll = await contentTester.getAttributeValue("5d10r");
        let seventhRoll = await contentTester.getAttributeValue("9999r");
        let eighthRoll = await contentTester.getAttributeValue("powers");
        let ninthRoll = await contentTester.getAttributeValue("negRoll");
        let tenthRoll = await contentTester.getAttributeValue("1d18r");
        let eleventhRoll = await contentTester.getAttributeValue("varRoll");

        await contentTester.assertSpeech(
            "Generating uncommon rolls. 2d4 is " + firstRoll + ". 3d6 is " + secondRoll + ". 1d20 is " + thirdRoll + ". 1d101 is " + fourthRoll + ". 1d2 is " + fifthRoll + ". 5d10 is " + sixthRoll + ". 1d999 is " + seventhRoll + ". 1d10 to the 24th power is " + eighthRoll + ". negative 1d20 is " + ninthRoll + ". 1d18 is " + tenthRoll + ". 3d blart plus mallcop is " + eleventhRoll + ". Do you want to roll again?"
        );
        await contentTester.givenUserInput({ value: "yes" });

        firstRoll = await contentTester.getAttributeValue("2d4r");
        secondRoll = await contentTester.getAttributeValue("3d6r");
        thirdRoll = await contentTester.getAttributeValue("twtNeg");
        fourthRoll = await contentTester.getAttributeValue("1d101r");
        fifthRoll = await contentTester.getAttributeValue("1d2r");
        sixthRoll = await contentTester.getAttributeValue("5d10r");
        seventhRoll = await contentTester.getAttributeValue("9999r");
        eighthRoll = await contentTester.getAttributeValue("powers");
        ninthRoll = await contentTester.getAttributeValue("negRoll");
        tenthRoll = await contentTester.getAttributeValue("1d18r");
        eleventhRoll = await contentTester.getAttributeValue("varRoll");

        await contentTester.assertSpeech(
            "Generating uncommon rolls. 2d4 is " + firstRoll + ". 3d6 is " + secondRoll + ". 1d20 is " + thirdRoll + ". 1d101 is " + fourthRoll + ". 1d2 is " + fifthRoll + ". 5d10 is " + sixthRoll + ". 1d999 is " + seventhRoll + ". 1d10 to the 24th power is " + eighthRoll + ". negative 1d20 is " + ninthRoll + ". 1d18 is " + tenthRoll + ". 3d blart plus mallcop is " + eleventhRoll + ". Do you want to roll again?"
        );

    });

    it("save go to return", async function () {
        await contentTester.givenStartInvoked();
        await contentTester.givenUserInput({ value: "save go to return" });
        await contentTester.assertSpeech(
            "Welcome to the go to and return test. Say continue to go to the next scene."
        );
        await contentTester.givenUserInput({ value: "continue" });
        await contentTester.assertSpeech(
            "Now you're in a new scene. Returning to the first scene's then block. That worked. Lets try this again. Say continue!"
        );
        await contentTester.givenUserInput({ value: "continue" });
        await contentTester.assertSpeech(
            "Successfully navigated to a new scene, but we're not going back just yet. Say continue to move to the next scene."
        );
        await contentTester.givenUserInput({ value: "continue" });
        await contentTester.assertSpeech(
            "This is the last scene. Say return to go back to the scene that lead us down this path."
        );
        await contentTester.givenUserInput({ value: "return" });
        await contentTester.assertSpeech(
            "That worked. Test complete! Thanks for testing. Bye."
        );
    });

    // Testing ->*recap. Added 5-17. -Matt
    it("say other statement", async function () {
        await contentTester.givenStartInvoked();
        await contentTester.givenUserInput({ value: "say other statement" });

        await contentTester.assertSceneID("say other statement");
        await contentTester.givenUserInput({ value: "HODOR" });
        await contentTester.assertSpeech(
            "THIS IS A RECAP OF THE FIRST SCENE. Say continue."
        );
        await contentTester.givenUserInput({ value: "continue" });

        await contentTester.assertSceneID("sos scene two");
        await contentTester.givenUserInput({ value: "recap" });
        await contentTester.assertSpeech(
            "THIS IS A RECAP OF THE FIRST SCENE. Say continue."
        );
        await contentTester.givenUserInput({ value: "continue" });
        await contentTester.assertSceneID("sos scene two");
        await contentTester.givenUserInput({ value: "continue" });

        await contentTester.assertSceneID("sos scene three");
        await contentTester.givenUserInput({ value: "recap" });
        await contentTester.assertSpeech(
            "THIS IS THE RECAP FOR THE THIRD SCENE. Say reprompt to hear this scene's reprompt statement."
        );
        await contentTester.givenUserInput({ value: "reprompt" });
        await contentTester.assertSpeech(
            "THIS IS THE REPROMPT FOR THE THIRD SCENE. Say end to end."
        );
    });

    it("symbols", async function () {
        await contentTester.givenStartInvoked();

        await contentTester.givenUserInput({ value: "symbols" });

        await contentTester.assertSpeech(
            "Hello, here are some common symbols developers might use in their say statements. Exclamation mark ! " +
            "Exclamation mark. Next! The at symbol would be here, but it causes the skill to crash, so I removed it. " +
            "Next! Pound sign # pound sign. Next! Dollar sign $ dollar sign. $5 bill ya'll. Next! Euro sign € euro " +
            "sign. €5 bill, ya'll. Next! Percent symbol % perscent symbol. Next! Carat thingy ^ carat thingy. Next! " +
            "The ampersand symbol would be here, but it causes the skill to crash, so I removed it. Next! Asterisk * " +
            "asterisk. Next! Braces ( ) braces. Next! Brackets [ ] brackets. Next! Back slash \\ back slash. Next! " +
            "Forward slash / forward slash. Next! Line thing | line thing. Next! Thanks for testing. Bye."
        );
    });

    // Snippets -> see Snippet Test below.

    it("this or that", async function () {
        await contentTester.givenStartInvoked();

        await contentTester.givenUserInput({ value: "this or that" });

        await contentTester.assertSpeechOneOf(
            ["Option one. Say again or end.",
                "Option two. Say again or end.",
                "Option three. Say again or end."]
        );
    });

    // SSML tags -> see SSML tags below.

    // javascript strVal will be set to undefined, but SFB sets it to false.
    it("string value", async function () {
        await contentTester.givenStartInvoked();

        await contentTester.givenUserInput({ value: "string value" });
        await contentTester.assertSpeech(
            "String value test. Current value is, false. Changing the value. The new value is, I have value now. Thanks for testing. Bye."
        );
    });

    it("time", async function () {
        await contentTester.givenStartInvoked(); // Waits for @start scene to be active.
        await contentTester.givenUserInput({ value: "time" });

        let timeStamp = await contentTester.getAttributeValue("timeStamp");

        await contentTester.assertSpeech(
            "Welcome to the timestamp test. The current time in epoch milliseconds is " + timeStamp + ". Say move on to get the next timestamp."
        );
        await contentTester.givenUserInput({ value: "move on" });

        timeStamp = await contentTester.getAttributeValue("timeStamp");
        await contentTester.assertSpeech(
            "Your second timestamp was " + timeStamp + ". Thanks for testing. Bye."
        );
    });

    it("true false", async function () {
        await contentTester.givenStartInvoked();
        await contentTester.givenUserInput({ value: "true false" });

        await contentTester.assertSpeech(
            "Welcome to the true and false test. Our boolean is currently set to false. Do you want to check for true, or false?"
        );
        await contentTester.givenUserInput({ value: "true" });

        await contentTester.assertSpeech(
            "Checking if the boolean is true first, with only one if block. Pass! Now we'll check for false first. Pass! Now checking if we can use just the boolean by itself in an if block. Pass! Now checking if it works in a nested if block. Test passed! Do you want to try again?"
        );
        await contentTester.givenUserInput({ value: "yes" });

        await contentTester.assertSpeech(
            "Welcome to the true and false test. Our boolean is currently set to true. Do you want to check for true, or false?"
        );
        await contentTester.givenUserInput({ value: "false" });

        await contentTester.assertSpeech(
            "Checking if the boolean is false first, with only one if block. Pass! Now we'll check for true first. Pass! Now checking if we can use just the boolean by itself in an if block. Pass! Now checking if it works in a nested if block. Test passed! Do you want to try again?"
        );
    });

    it("variable state name", async function () {
        await contentTester.givenStartInvoked();
        await contentTester.givenUserInput({ value: "variable state name" });
        await contentTester.assertSceneID(
            "variable state name"
        );
        await contentTester.givenUserInput({ value: "continue" });
        await contentTester.assertSpeech(
            "You are now at the variable state name scene. Success! Thanks for testing. Bye."
        );
    });

    it("variable speech", async function () {
        await contentTester.givenStartInvoked();
        await contentTester.givenUserInput({ value: "variable speech" });
        await contentTester.assertSceneID(
            "variable speech"
        );
        await contentTester.givenUserInput({ value: "continue" });
        await contentTester.assertSpeech(
            "say <voice name=\'Emma\'> <prosody pitch=\'+40%\' rate=\'95%\'>some thing to say</prosody> </voice>  reprompt message"
        );
        await contentTester.assertReprompt(
            "reprompt <voice name=\'Emma\'> <prosody pitch=\'+40%\' rate=\'95%\'>some thing to say</prosody> </voice>  reprompt message"
        );

        await contentTester.givenUserInput({ value: "continue" });
        await contentTester.assertSpeech(
            "say <voice name=\'Emma\'> <prosody pitch=\'+40%\' rate=\'95%\'>some thing to say</prosody> </voice>  reprompt message"
        );
        await contentTester.assertReprompt(
            "reprompt <voice name=\'Emma\'> <prosody pitch=\'+40%\' rate=\'95%\'>some thing to say</prosody> </voice>  reprompt message"
        );
    });

    it("verify string single quote", async function () {
        await contentTester.givenStartInvoked();
        await contentTester.givenUserInput({ value: "verify string single quote" });

        await contentTester.assertSpeech(
            "This is the single quote string test. I'm setting a variable to a word. Here's the word. warrior. I should have said, warrior. Thanks for testing. Bye."
        );
    });

    it("custom slot variable - empty slot input", async function () {
        await contentTester.givenStartInvoked();
        await contentTester.givenUserInput({ value: "verify slot variable" });
        await contentTester.assertSceneID("verify slot variable");

        // empty slot test
        await contentTester.givenUserInput({ 
            value: "testing the slot"
        });
        await contentTester.assertSceneID("slot variable empty");
    });

    it("custom slot variable - slot filled input", async function() {
        await contentTester.givenStartInvoked();
        await contentTester.givenUserInput({ value: "verify slot variable" });
        await contentTester.assertSceneID("verify slot variable");

        // slot filled with value "apple"
        await contentTester.givenUserInput({ 
            slots: [
                {
                    name: "testSlot",
                    value: "apple"
                }
            ],
            value: "testing the slot apple"
        });
        await contentTester.assertSceneID("verify slot after capture");
        await contentTester.assertSpeech("captured value is apple.");
    });

    it("custom slot variable - slot variable is not replaced untill filled by input", async function () {
        await contentTester.givenStartInvoked();
        await contentTester.givenAttribute("testSlot", "apple");

        await contentTester.givenUserInput({ value: "verify slot variable" });
        await contentTester.assertSceneID("verify slot variable");

        // the assigned value of the variable is not modified before new slot is captured.
        await contentTester.assertAttributeEquals("testSlot", "apple");

        // newly captured empty slot is assigned over previously captured value.
        await contentTester.givenUserInput({ 
            value: "testing the slot"
        });
        await contentTester.assertSceneID("slot variable empty");
        await contentTester.assertAttributeUndefined("testSlot");
    });

    it ("custom slot variable - unexpected slot filled", async function () {
        await contentTester.givenStartInvoked();
        await contentTester.givenUserInput({ value: "verify slot variable" });
        await contentTester.assertSceneID("verify slot variable");

        // try to input with non-expected slot name
        await contentTester.givenUserInput({ 
            slots: [
                {
                    name: "testSlot2",
                    value: "apple"
                }
            ],
            value: "apple"
        });
        await contentTester.assertSceneID("verify slot variable");
        await contentTester.assertAttributeUndefined("testSlot2");        
    });

    it ("custom slot variable - filling one slot does not replace the other slot", async function () {
        await contentTester.givenStartInvoked();
        await contentTester.givenUserInput({ value: "verify slot variable" });
        await contentTester.assertSceneID("verify slot variable");

        // slotting another does not replace the previous slot value.
        await contentTester.givenAttribute("testSlot", "apple");

        await contentTester.givenUserInput({ 
            slots: [
                {
                    name: "testSlotAnother",
                    value: "apple"
                }
            ],
            value: "another slot apple"
        });
        await contentTester.assertSceneID("verify slot after capture");
        await contentTester.assertAttributeEquals("testSlot", "apple");
        await contentTester.assertAttributeEquals("testSlotAnother", "apple");
    });
});

describe("Snippet Test", function () {
    let contentTester: SFBContentTester;

    before(async function () {
        let snippetFile = JSON.parse(loadTestResource(POSITIVE_TEST_STORY_DIRECTORY, "Snippets.json"));
        let importer = new SFBImporter(undefined, undefined, [
            new GlobalDirectionsExtension([]),
            new SnippetExtension(snippetFile),
            new VoiceOverExtension("{{file_name}}")
        ]);
        let importedStory: StoryMetadata = await importer.importABCStory(
            DEFAULT_IMPORT_PLUGIN_NAME,
            "",
            "snippets test",
            "snippets test",
            true,
            {
                customSlots: loadTestResourceAsObject(POSITIVE_TEST_STORY_DIRECTORY, "SlotTypes.json"),
                contents: loadAllContent(POSITIVE_TEST_STORY_DIRECTORY, POSITIVE_TEST_STORY_LIST)
            }
        );
        contentTester = new SFBContentTester(importedStory, [
            new GlobalDirectionsExtension([]),
            new SnippetExtension(snippetFile),
            new VoiceOverExtension("{{file_name}}")
        ], ffmpeg.path);
    });

    beforeEach(function (done) {
        contentTester.resetTest();
        done();
    });

    it("Snippets test", async function () {
        await contentTester.givenStartInvoked();

        await contentTester.givenUserInput({ value: "snippets" });

        await contentTester.assertSpeech(
            "Welcome to the snippet test. Here's some snippets. Here's a trumpet snippet. <audio src='https://sfb-framework.s3.amazonaws.com/examples/sounds/Trumpet_1.mp3' /> Here's an ocean wave. <audio src='https://sfb-framework.s3.amazonaws.com/examples/sounds/ocean_wave.mp3' /> Here's a short pause <break time='500ms'/> Was that short? Here's a long pause. <break time='2s'/> Was that long?<voice name='Justin'>Hi, my name is Justin.</voice><voice name='Matthew'><prosody rate='slow' pitch='low' volume='soft'>Hi, I'm an old man now.</prosody></voice> Here's a blank snippet. Did it break? Thanks for testing. Bye."
        );
    });
});

describe("ISP Test", function () {
    let contentTester: SFBContentTester;

    before(async function () {
        let ispFile: string = "ProductISPs.json";

        let importer = new SFBImporter(undefined, undefined, [
            new GlobalDirectionsExtension([]),
            new SnippetExtension({}),
            new VoiceOverExtension("{{file_name}}")
        ]);
        let importedStory: StoryMetadata = await importer.importABCStory(
            DEFAULT_IMPORT_PLUGIN_NAME,
            "",
            "snippets test",
            "snippets test",
            true,
            {
                customSlots: loadTestResourceAsObject(POSITIVE_TEST_STORY_DIRECTORY, "SlotTypes.json"),
                contents: loadAllContent(POSITIVE_TEST_STORY_DIRECTORY, POSITIVE_TEST_STORY_LIST)
            }
        );
        contentTester = new SFBContentTester(importedStory, [
            new GlobalDirectionsExtension([]),
            new SnippetExtension({}),
            new VoiceOverExtension("{{file_name}}")
        ], ffmpeg.path);
    });

    beforeEach(function (done) {
        contentTester.resetTest();
        done();
    });

    it("Sample Product Bought");
    // , async function () {
    //     await contentTester.givenStartInvoked();

    //     await contentTester.givenUserInput({ value: "monetization" });
    //     await contentTester.assertSpeech(
    //         "This is the start scene. Moving to purchase scene now. Say purchase OTP."
    //     );

    //     await contentTester.givenUserInput({ value: "Connections.Response.ACCEPTED" });
    //     await contentTester.assertSpeech(
    //         "You bought it. Yay! This is the last scene."
    //     );
    // });

    it("Sample Product Declined");
    // , async function () {
    //     await contentTester.givenStartInvoked();

    //     await contentTester.givenUserInput({ value: "monetization" });
    //     await contentTester.assertSpeech(
    //         "This is the start scene. Moving to purchase scene now. Say purchase OTP."
    //     );

    //     await contentTester.givenUserInput({ value: "Connections.Response.DECLINED" });
    //     await contentTester.assertSpeech(
    //         "You declined it. This is the last scene."
    //     );
    // });

    it("Sample Product Already Purchased");
    // , async function () {
    //     await contentTester.givenStartInvoked();

    //     await contentTester.givenUserInput({ value: "monetization" });
    //     await contentTester.assertSpeech(
    //         "This is the start scene. Moving to purchase scene now. Say purchase OTP."
    //     );

    //     await contentTester.givenUserInput({ value: "Connections.Response.ALREADY_PURCHASED" });
    //     await contentTester.assertSpeech(
    //         "You already purchased it. This is the last scene."
    //     );
    // });

    it("Sample Product Error");
    // , async function () {
    //     await contentTester.givenStartInvoked();

    //     await contentTester.givenUserInput({ value: "monetization" });
    //     await contentTester.assertSpeech(
    //         "This is the start scene. Moving to purchase scene now. Say purchase OTP."
    //     );

    //     await contentTester.givenUserInput({ value: "Connections.Response.ERROR" });
    //     await contentTester.assertSpeech(
    //         "Error. This is the last scene."
    //     );
    // });
});

describe("Global Test Cases", function () {
    let contentTester: SFBContentTester;

    before(async function () {
        let ispFile = "ProductISPs.json";

        let importer = new SFBImporter(undefined, undefined, [
            new GlobalDirectionsExtension([]),
            new SnippetExtension({}),
            new VoiceOverExtension("{{file_name}}")
        ]);

        let importedStory: StoryMetadata = await importer.importABCStory(
            DEFAULT_IMPORT_PLUGIN_NAME,
            "",
            "global test cases",
            "global test cases",
            true,
            {
                customSlots: loadTestResourceAsObject(GLOBAL_TEST_STORY_DIRECTORY, "SlotTypes.json"),
                contents: loadAllContent(GLOBAL_TEST_STORY_DIRECTORY, GLOBAL_TEST_STORY_LIST)
            }
        );

        contentTester = new SFBContentTester(importedStory, [
            new GlobalDirectionsExtension([]),
            new SnippetExtension({}),
            new VoiceOverExtension("{{file_name}}")
        ], ffmpeg.path);
    });

    beforeEach(function (done) {
        contentTester.resetTest();
        done();
    });

    it("global append/prepend - say, apl", async function () {
        await contentTester.givenStartInvoked();
        await contentTester.assertSpeech(
            "Beginning of PREPENDED statements: <prosody volume='x-loud'>This is my normal voice in a Louder volume.</prosody> <prosody rate='x-slow'>This is my normal voice speaking quite slowly.</prosody> <prosody pitch='x-high'> This is my normal voice with a higher pitch.</prosody> <prosody pitch='low'>This is my normal voice with a lower pitch.</prosody> <amazon:effect name='whispered'>Here's a whisper effect.</amazon:effect> <emphasis level='reduced'>Here's a reduced emphasis effect.</emphasis> <emphasis level='reduced'>This is a moderate emphasis effect.</emphasis> <emphasis level='strong'>Here's a strong emphasis effect.</emphasis> <lang xml:'fr-FR'>I am trying to speak in French!</lang> <speak> Alexa's voice. <voice name='Ivy'> Ivy's voice.</voice><voice name='Kendra'> Now I'm speaking in Kendra's voice.</voice>  </speak> <p>Paragraph tag, there should be a pause after this is spoken.</p> <p>This is the next paragraph.</p> Phoneme tag. You say, <phoneme alphabet='ipa' ph='pɪˈkɑːn'>pecan</phoneme>. I say, <phoneme alphabet='ipa' ph='ˈpi.kæn'>pecan</phoneme>. <s>This is a sentence with no punctuation</s> <s>There should be a short pause before this second sentence</s> This sentence ends with a period and should have the same pause. Cool. I'm going to spell out the word characters. <say-as interpret-as='characters'>Characters</say-as>. No sub tag. <sub alias='if you hear this then alias works'> sub tag.</sub> No w tag. This is the present tense verb, <w role='amazon:VB'>read</w>, and past tense, <w role='amazon:VBD'>read</w> Here's a trumpet. <audio src='https://sfb-framework.s3.amazonaws.com/examples/sounds/Trumpet_1.mp3' />  Here's a wave. <ocean wave> End of PREPENDED statements! WELCOME TO THE GLOBAL TEST CASE STORY. SAY DEMO STORY TO PLAY THE DEMO STORY. OR SAY SECRET SCENE TO GET TO THE SECRET SCENE. OR SAY SOMETHING UNEXPECTED, LIKE HODOR. Beginning of APPENDED statements: <prosody volume='x-loud'>This is my normal voice in a Louder volume.</prosody> <prosody rate='x-slow'>This is my normal voice speaking quite slowly.</prosody> <prosody pitch='x-high'> This is my normal voice with a higher pitch.</prosody> <prosody pitch='low'>This is my normal voice with a lower pitch.</prosody> <amazon:effect name='whispered'>Here's a whisper effect.</amazon:effect> <emphasis level='reduced'>Here's a reduced emphasis effect.</emphasis> <emphasis level='reduced'>This is a moderate emphasis effect.</emphasis> <emphasis level='strong'>Here's a strong emphasis effect.</emphasis> <lang xml:'fr-FR'>I am trying to speak in French!</lang> <speak> Alexa's voice. <voice name='Ivy'> Ivy's voice.</voice><voice name='Kendra'> Now I'm speaking in Kendra's voice.</voice>  </speak> <p>Paragraph tag, there should be a pause after this is spoken.</p> <p>This is the next paragraph.</p> Phoneme tag. You say, <phoneme alphabet='ipa' ph='pɪˈkɑːn'>pecan</phoneme>. I say, <phoneme alphabet='ipa' ph='ˈpi.kæn'>pecan</phoneme>. <s>This is a sentence with no punctuation</s> <s>There should be a short pause before this second sentence</s> This sentence ends with a period and should have the same pause. Cool. I'm going to spell out the word characters. <say-as interpret-as='characters'>Characters</say-as>. No sub tag. <sub alias='if you hear this then alias works'> sub tag.</sub> No w tag. This is the present tense verb, <w role='amazon:VB'>read</w>, and past tense, <w role='amazon:VBD'>read</w> Here's a trumpet. <audio src='https://sfb-framework.s3.amazonaws.com/examples/sounds/Trumpet_1.mp3' />  Here's a wave. <ocean wave> End of APPENDED statements!"
        );
    });

    it("global append - hear statement", async function () {
        await contentTester.givenStartInvoked();
        await contentTester.assertSpeech(
            "Beginning of PREPENDED statements: <prosody volume='x-loud'>This is my normal voice in a Louder volume.</prosody> <prosody rate='x-slow'>This is my normal voice speaking quite slowly.</prosody> <prosody pitch='x-high'> This is my normal voice with a higher pitch.</prosody> <prosody pitch='low'>This is my normal voice with a lower pitch.</prosody> <amazon:effect name='whispered'>Here's a whisper effect.</amazon:effect> <emphasis level='reduced'>Here's a reduced emphasis effect.</emphasis> <emphasis level='reduced'>This is a moderate emphasis effect.</emphasis> <emphasis level='strong'>Here's a strong emphasis effect.</emphasis> <lang xml:'fr-FR'>I am trying to speak in French!</lang> <speak> Alexa's voice. <voice name='Ivy'> Ivy's voice.</voice><voice name='Kendra'> Now I'm speaking in Kendra's voice.</voice>  </speak> <p>Paragraph tag, there should be a pause after this is spoken.</p> <p>This is the next paragraph.</p> Phoneme tag. You say, <phoneme alphabet='ipa' ph='pɪˈkɑːn'>pecan</phoneme>. I say, <phoneme alphabet='ipa' ph='ˈpi.kæn'>pecan</phoneme>. <s>This is a sentence with no punctuation</s> <s>There should be a short pause before this second sentence</s> This sentence ends with a period and should have the same pause. Cool. I'm going to spell out the word characters. <say-as interpret-as='characters'>Characters</say-as>. No sub tag. <sub alias='if you hear this then alias works'> sub tag.</sub> No w tag. This is the present tense verb, <w role='amazon:VB'>read</w>, and past tense, <w role='amazon:VBD'>read</w> Here's a trumpet. <audio src='https://sfb-framework.s3.amazonaws.com/examples/sounds/Trumpet_1.mp3' />  Here's a wave. <ocean wave> End of PREPENDED statements! WELCOME TO THE GLOBAL TEST CASE STORY. SAY DEMO STORY TO PLAY THE DEMO STORY. OR SAY SECRET SCENE TO GET TO THE SECRET SCENE. OR SAY SOMETHING UNEXPECTED, LIKE HODOR. Beginning of APPENDED statements: <prosody volume='x-loud'>This is my normal voice in a Louder volume.</prosody> <prosody rate='x-slow'>This is my normal voice speaking quite slowly.</prosody> <prosody pitch='x-high'> This is my normal voice with a higher pitch.</prosody> <prosody pitch='low'>This is my normal voice with a lower pitch.</prosody> <amazon:effect name='whispered'>Here's a whisper effect.</amazon:effect> <emphasis level='reduced'>Here's a reduced emphasis effect.</emphasis> <emphasis level='reduced'>This is a moderate emphasis effect.</emphasis> <emphasis level='strong'>Here's a strong emphasis effect.</emphasis> <lang xml:'fr-FR'>I am trying to speak in French!</lang> <speak> Alexa's voice. <voice name='Ivy'> Ivy's voice.</voice><voice name='Kendra'> Now I'm speaking in Kendra's voice.</voice>  </speak> <p>Paragraph tag, there should be a pause after this is spoken.</p> <p>This is the next paragraph.</p> Phoneme tag. You say, <phoneme alphabet='ipa' ph='pɪˈkɑːn'>pecan</phoneme>. I say, <phoneme alphabet='ipa' ph='ˈpi.kæn'>pecan</phoneme>. <s>This is a sentence with no punctuation</s> <s>There should be a short pause before this second sentence</s> This sentence ends with a period and should have the same pause. Cool. I'm going to spell out the word characters. <say-as interpret-as='characters'>Characters</say-as>. No sub tag. <sub alias='if you hear this then alias works'> sub tag.</sub> No w tag. This is the present tense verb, <w role='amazon:VB'>read</w>, and past tense, <w role='amazon:VBD'>read</w> Here's a trumpet. <audio src='https://sfb-framework.s3.amazonaws.com/examples/sounds/Trumpet_1.mp3' />  Here's a wave. <ocean wave> End of APPENDED statements!"
        );

        await contentTester.givenUserInput({ value: "secret scene" });
        await contentTester.assertSpeech(
            "Beginning of PREPENDED statements: <prosody volume='x-loud'>This is my normal voice in a Louder volume.</prosody> <prosody rate='x-slow'>This is my normal voice speaking quite slowly.</prosody> <prosody pitch='x-high'> This is my normal voice with a higher pitch.</prosody> <prosody pitch='low'>This is my normal voice with a lower pitch.</prosody> <amazon:effect name='whispered'>Here's a whisper effect.</amazon:effect> <emphasis level='reduced'>Here's a reduced emphasis effect.</emphasis> <emphasis level='reduced'>This is a moderate emphasis effect.</emphasis> <emphasis level='strong'>Here's a strong emphasis effect.</emphasis> <lang xml:'fr-FR'>I am trying to speak in French!</lang> <speak> Alexa's voice. <voice name='Ivy'> Ivy's voice.</voice><voice name='Kendra'> Now I'm speaking in Kendra's voice.</voice>  </speak> <p>Paragraph tag, there should be a pause after this is spoken.</p> <p>This is the next paragraph.</p> Phoneme tag. You say, <phoneme alphabet='ipa' ph='pɪˈkɑːn'>pecan</phoneme>. I say, <phoneme alphabet='ipa' ph='ˈpi.kæn'>pecan</phoneme>. <s>This is a sentence with no punctuation</s> <s>There should be a short pause before this second sentence</s> This sentence ends with a period and should have the same pause. Cool. I'm going to spell out the word characters. <say-as interpret-as='characters'>Characters</say-as>. No sub tag. <sub alias='if you hear this then alias works'> sub tag.</sub> No w tag. This is the present tense verb, <w role='amazon:VB'>read</w>, and past tense, <w role='amazon:VBD'>read</w> Here's a trumpet. <audio src='https://sfb-framework.s3.amazonaws.com/examples/sounds/Trumpet_1.mp3' />  Here's a wave. <ocean wave> End of PREPENDED statements! WELCOME TO THE SECRET SCENE. YOU GOT HERE BY USING THE GLOBALLY APPENDED HEAR STATEMENT. BYE! Beginning of APPENDED statements: <prosody volume='x-loud'>This is my normal voice in a Louder volume.</prosody> <prosody rate='x-slow'>This is my normal voice speaking quite slowly.</prosody> <prosody pitch='x-high'> This is my normal voice with a higher pitch.</prosody> <prosody pitch='low'>This is my normal voice with a lower pitch.</prosody> <amazon:effect name='whispered'>Here's a whisper effect.</amazon:effect> <emphasis level='reduced'>Here's a reduced emphasis effect.</emphasis> <emphasis level='reduced'>This is a moderate emphasis effect.</emphasis> <emphasis level='strong'>Here's a strong emphasis effect.</emphasis> <lang xml:'fr-FR'>I am trying to speak in French!</lang> <speak> Alexa's voice. <voice name='Ivy'> Ivy's voice.</voice><voice name='Kendra'> Now I'm speaking in Kendra's voice.</voice>  </speak> <p>Paragraph tag, there should be a pause after this is spoken.</p> <p>This is the next paragraph.</p> Phoneme tag. You say, <phoneme alphabet='ipa' ph='pɪˈkɑːn'>pecan</phoneme>. I say, <phoneme alphabet='ipa' ph='ˈpi.kæn'>pecan</phoneme>. <s>This is a sentence with no punctuation</s> <s>There should be a short pause before this second sentence</s> This sentence ends with a period and should have the same pause. Cool. I'm going to spell out the word characters. <say-as interpret-as='characters'>Characters</say-as>. No sub tag. <sub alias='if you hear this then alias works'> sub tag.</sub> No w tag. This is the present tense verb, <w role='amazon:VB'>read</w>, and past tense, <w role='amazon:VBD'>read</w> Here's a trumpet. <audio src='https://sfb-framework.s3.amazonaws.com/examples/sounds/Trumpet_1.mp3' />  Here's a wave. <ocean wave> End of APPENDED statements!"
        );
    });

    it("global prepend - hear otherwise", async function () {
        await contentTester.givenStartInvoked();
        await contentTester.assertSpeech(
            "Beginning of PREPENDED statements: <prosody volume='x-loud'>This is my normal voice in a Louder volume.</prosody> <prosody rate='x-slow'>This is my normal voice speaking quite slowly.</prosody> <prosody pitch='x-high'> This is my normal voice with a higher pitch.</prosody> <prosody pitch='low'>This is my normal voice with a lower pitch.</prosody> <amazon:effect name='whispered'>Here's a whisper effect.</amazon:effect> <emphasis level='reduced'>Here's a reduced emphasis effect.</emphasis> <emphasis level='reduced'>This is a moderate emphasis effect.</emphasis> <emphasis level='strong'>Here's a strong emphasis effect.</emphasis> <lang xml:'fr-FR'>I am trying to speak in French!</lang> <speak> Alexa's voice. <voice name='Ivy'> Ivy's voice.</voice><voice name='Kendra'> Now I'm speaking in Kendra's voice.</voice>  </speak> <p>Paragraph tag, there should be a pause after this is spoken.</p> <p>This is the next paragraph.</p> Phoneme tag. You say, <phoneme alphabet='ipa' ph='pɪˈkɑːn'>pecan</phoneme>. I say, <phoneme alphabet='ipa' ph='ˈpi.kæn'>pecan</phoneme>. <s>This is a sentence with no punctuation</s> <s>There should be a short pause before this second sentence</s> This sentence ends with a period and should have the same pause. Cool. I'm going to spell out the word characters. <say-as interpret-as='characters'>Characters</say-as>. No sub tag. <sub alias='if you hear this then alias works'> sub tag.</sub> No w tag. This is the present tense verb, <w role='amazon:VB'>read</w>, and past tense, <w role='amazon:VBD'>read</w> Here's a trumpet. <audio src='https://sfb-framework.s3.amazonaws.com/examples/sounds/Trumpet_1.mp3' />  Here's a wave. <ocean wave> End of PREPENDED statements! WELCOME TO THE GLOBAL TEST CASE STORY. SAY DEMO STORY TO PLAY THE DEMO STORY. OR SAY SECRET SCENE TO GET TO THE SECRET SCENE. OR SAY SOMETHING UNEXPECTED, LIKE HODOR. Beginning of APPENDED statements: <prosody volume='x-loud'>This is my normal voice in a Louder volume.</prosody> <prosody rate='x-slow'>This is my normal voice speaking quite slowly.</prosody> <prosody pitch='x-high'> This is my normal voice with a higher pitch.</prosody> <prosody pitch='low'>This is my normal voice with a lower pitch.</prosody> <amazon:effect name='whispered'>Here's a whisper effect.</amazon:effect> <emphasis level='reduced'>Here's a reduced emphasis effect.</emphasis> <emphasis level='reduced'>This is a moderate emphasis effect.</emphasis> <emphasis level='strong'>Here's a strong emphasis effect.</emphasis> <lang xml:'fr-FR'>I am trying to speak in French!</lang> <speak> Alexa's voice. <voice name='Ivy'> Ivy's voice.</voice><voice name='Kendra'> Now I'm speaking in Kendra's voice.</voice>  </speak> <p>Paragraph tag, there should be a pause after this is spoken.</p> <p>This is the next paragraph.</p> Phoneme tag. You say, <phoneme alphabet='ipa' ph='pɪˈkɑːn'>pecan</phoneme>. I say, <phoneme alphabet='ipa' ph='ˈpi.kæn'>pecan</phoneme>. <s>This is a sentence with no punctuation</s> <s>There should be a short pause before this second sentence</s> This sentence ends with a period and should have the same pause. Cool. I'm going to spell out the word characters. <say-as interpret-as='characters'>Characters</say-as>. No sub tag. <sub alias='if you hear this then alias works'> sub tag.</sub> No w tag. This is the present tense verb, <w role='amazon:VB'>read</w>, and past tense, <w role='amazon:VBD'>read</w> Here's a trumpet. <audio src='https://sfb-framework.s3.amazonaws.com/examples/sounds/Trumpet_1.mp3' />  Here's a wave. <ocean wave> End of APPENDED statements!"
        );
        await contentTester.givenUserInput({ value: "cheese" });
        await contentTester.assertSpeech(
            "Beginning of PREPENDED statements: <prosody volume='x-loud'>This is my normal voice in a Louder volume.</prosody> <prosody rate='x-slow'>This is my normal voice speaking quite slowly.</prosody> <prosody pitch='x-high'> This is my normal voice with a higher pitch.</prosody> <prosody pitch='low'>This is my normal voice with a lower pitch.</prosody> <amazon:effect name='whispered'>Here's a whisper effect.</amazon:effect> <emphasis level='reduced'>Here's a reduced emphasis effect.</emphasis> <emphasis level='reduced'>This is a moderate emphasis effect.</emphasis> <emphasis level='strong'>Here's a strong emphasis effect.</emphasis> <lang xml:'fr-FR'>I am trying to speak in French!</lang> <speak> Alexa's voice. <voice name='Ivy'> Ivy's voice.</voice><voice name='Kendra'> Now I'm speaking in Kendra's voice.</voice>  </speak> <p>Paragraph tag, there should be a pause after this is spoken.</p> <p>This is the next paragraph.</p> Phoneme tag. You say, <phoneme alphabet='ipa' ph='pɪˈkɑːn'>pecan</phoneme>. I say, <phoneme alphabet='ipa' ph='ˈpi.kæn'>pecan</phoneme>. <s>This is a sentence with no punctuation</s> <s>There should be a short pause before this second sentence</s> This sentence ends with a period and should have the same pause. Cool. I'm going to spell out the word characters. <say-as interpret-as='characters'>Characters</say-as>. No sub tag. <sub alias='if you hear this then alias works'> sub tag.</sub> No w tag. This is the present tense verb, <w role='amazon:VB'>read</w>, and past tense, <w role='amazon:VBD'>read</w> Here's a trumpet. <audio src='https://sfb-framework.s3.amazonaws.com/examples/sounds/Trumpet_1.mp3' />  Here's a wave. <ocean wave> End of PREPENDED statements! YOU SAID SOMETHING THAT WASN'T EXPECTED USING THE GLOBALLY APPENDED OTHERWISE STATEMENT! GOOD JOB. BYE. Beginning of APPENDED statements: <prosody volume='x-loud'>This is my normal voice in a Louder volume.</prosody> <prosody rate='x-slow'>This is my normal voice speaking quite slowly.</prosody> <prosody pitch='x-high'> This is my normal voice with a higher pitch.</prosody> <prosody pitch='low'>This is my normal voice with a lower pitch.</prosody> <amazon:effect name='whispered'>Here's a whisper effect.</amazon:effect> <emphasis level='reduced'>Here's a reduced emphasis effect.</emphasis> <emphasis level='reduced'>This is a moderate emphasis effect.</emphasis> <emphasis level='strong'>Here's a strong emphasis effect.</emphasis> <lang xml:'fr-FR'>I am trying to speak in French!</lang> <speak> Alexa's voice. <voice name='Ivy'> Ivy's voice.</voice><voice name='Kendra'> Now I'm speaking in Kendra's voice.</voice>  </speak> <p>Paragraph tag, there should be a pause after this is spoken.</p> <p>This is the next paragraph.</p> Phoneme tag. You say, <phoneme alphabet='ipa' ph='pɪˈkɑːn'>pecan</phoneme>. I say, <phoneme alphabet='ipa' ph='ˈpi.kæn'>pecan</phoneme>. <s>This is a sentence with no punctuation</s> <s>There should be a short pause before this second sentence</s> This sentence ends with a period and should have the same pause. Cool. I'm going to spell out the word characters. <say-as interpret-as='characters'>Characters</say-as>. No sub tag. <sub alias='if you hear this then alias works'> sub tag.</sub> No w tag. This is the present tense verb, <w role='amazon:VB'>read</w>, and past tense, <w role='amazon:VBD'>read</w> Here's a trumpet. <audio src='https://sfb-framework.s3.amazonaws.com/examples/sounds/Trumpet_1.mp3' />  Here's a wave. <ocean wave> End of APPENDED statements!"
        );
    });
});

describe("Negative Test", function () {
    let contentTester: SFBContentTester;

    it("Missing Scene", async function () {
        try {
            let importer = new SFBImporter(undefined, undefined, [
                new GlobalDirectionsExtension([]),
                new SnippetExtension({}),
                new VoiceOverExtension("{{file_name}}")
            ]);
            let importedStory: StoryMetadata = await importer.importABCStory(
                DEFAULT_IMPORT_PLUGIN_NAME,
                "",
                "missing start test",
                "missing start test",
                true,
                {
                    customSlots: loadTestResourceAsObject(NEGATIVE_TEST_STORY_DIRECTORY_MISSING_START, "SlotTypes.json"),
                    content: loadTestStory(NEGATIVE_TEST_STORY_DIRECTORY_MISSING_START, "missing_start.abc")
                }
            );
            contentTester = new SFBContentTester(importedStory, [
                new GlobalDirectionsExtension([]),
                new SnippetExtension({}),
                new VoiceOverExtension("{{file_name}}")
            ], ffmpeg.path);

            assert.fail();
        } catch (e) {
            const missingSceneError: ImportErrorLine = {
                lineNumber: 0,
                errorName: 'MissingScene',
                errorMessage: "Cannot find the required scene 'start'."
            };

            assert(!(e instanceof AssertionError), "Compile Succeeded with invalid syntax");
            assert.deepEqual(e.errorItems[0], missingSceneError);
        }
    });
});
