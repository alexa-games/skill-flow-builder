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

import {
    SFBContentTester, 
    StoryMetadata,
    SFBImporter,
    GlobalDirectionsExtension
} from "@alexa-games/sfb-f";
import { readUtf8FileExcludingBomSync } from '@alexa-games/sfb-util';
import { AlexaExtension } from '@alexa-games/sfb-skill';
import * as path from "path";

const DEFAULT_IMPORT_PLUGIN_NAME: string = "default";

const SAMPLE_STORY_DIRECTORY = "./samples/example_story/content";

const FFMPEG_PATH = "./ffmpeg"

import { crashOnUnhandledRejections } from '@alexa-games/sfb-util';

crashOnUnhandledRejections();

export function loadTestStory(storyFileDirectory: string, fileName: string): string {
    const fullPath = path.resolve(path.join(storyFileDirectory, fileName));

    return readUtf8FileExcludingBomSync(fullPath);
}

describe("My Sample Story Tests", function () {
    let contentTester: SFBContentTester;
    before(async function () {
        let importer = new SFBImporter(undefined, undefined, [new GlobalDirectionsExtension([])]);
        let importedStory: StoryMetadata = await importer.importABCStory(
            DEFAULT_IMPORT_PLUGIN_NAME,
            "",
            "sample story test",
            "sample story test",
            true,
            {
                customSlots: {},
                content: loadTestStory(SAMPLE_STORY_DIRECTORY, "story.abc")
            }
        );
        contentTester = new SFBContentTester(importedStory, [new AlexaExtension()], FFMPEG_PATH);
    });

    beforeEach(function (done) {
        contentTester.resetTest();
        done();
    });

    it("No Hike", async function () {

        await contentTester.givenStartInvoked();
        
        await contentTester.assertSpeech(
            "Good morning! You roll over in bed and look outside. It looks like a beautiful day. Would you like to go on a hike?"
        );

        await contentTester.givenUserInput({ value: "No" });

        await contentTester.assertSceneID("hesitate");
        
        await contentTester.assertSpeech(
            "You spend the morning inside doing chores and playing video games. Late morning, you look outside and notice that the day is just getting nicer and nicer. It occurs to you that you still have time to fit in a hike. Do you reconsider and go on a hike?"
        );

        await contentTester.givenUserInput({ value: "No" });

        await contentTester.assertSceneID("end");
        
        await contentTester.assertSpeech(
            "You continue to do chores and play video games and the day passes you by. You go to sleep feeling cranky. What a waste of a beautiful day. The end. Thanks for playing. Would you like to start over or take a break?"
        );
    });

    it("Beautiful Hike", async function () {

        await contentTester.givenStartInvoked();

        await contentTester.assertSpeech(
            "Good morning! You roll over in bed and look outside. It looks like a beautiful day. Would you like to go on a hike?"
        );

        await contentTester.givenUserInput({ value: "Yes" });

        await contentTester.assertSceneID("water");
        await contentTester.assertSpeech(
            "Yay, you are so excited. You start to get ready for your adventure. You pick a beautiful nearby alpine lake as your hiking destination and get out your daypack. You toss your fully charge smartphone, first aide kit, small multitool, a big bag of granola, and a lightweight rain jacket into your pack. You throw on some comfy hiking clothes and lace up your hiking shoes. Almost ready! How many bottles of water would you like to take with you?"
        );

        await contentTester.givenUserInput({
            value: "3",
            slots: [
                {
                    name: "bottles",
                    value: "3"
                }
            ]
        });

        await contentTester.assertSceneID("rest");
        await contentTester.assertSpeech(
            "You fill up 3 water bottles and grab your gear. On the car ride out to the trailhead you listen to your favorite album of woodland sounds. You are so amped for a hike. You pull up to the trailhead and park. You start hiking up towards the alpine lake and after a short while you are feeling the effort in your legs and lungs. It feels good and you keep trekking through the trees, stopping occasionally for water or a quick bite of granola. Your mind begins to clear and you feel at one with nature. At about an hour in, the vegitation around you becomes shorter and more sparse and the trail connects with a stream that runs along your left. Then you see it, a little patch of blue expanse up ahead. Your legs are pretty tired, but you quicken your pace. The blue grows as you approach. Then, all of a sudden, the lake is right in front of you, surrounded on 3 sides by rocky peaks. You take a seat on a large rock at the edge of the lake and relax with some water and granola. The sun feels great and your legs thank you for the chance to rest. You look to you right and notice that the trail continues. From where you sit, you can see it traversing back and forth up the right most peak. It must be an incredible view from up there. Would you like to continue on to the peak or call it a day and head down?"
        );

        await contentTester.givenUserInput({ value: "continue on to the peak" });

        await contentTester.assertSceneID("end");
        await contentTester.assertSpeech(
            "You get up from the rock and start up the winding trail. Your legs ache but soon loosen up. You are high up enough that there isn't much tree coverage and the sun is beating down on you. You stop for more granola and water frequently. Good thing you brought enough water. It is a grueling climb, much harder than your thought it would be when looking up from the lake. Eventually you start to get closer to the peak and your adrenalin starts to kick in. The air is great up here. Then you take your final step and you are standing on top of the peak and can see forever in all directions. You take a moment to soak it in and take some photos. It's quiet peaceful up there. Eventually, you decide to head down. It's a long trip down and your legs are shot but it was totally worth it. Finally, you make it to the parking lots and flop into your car. You are beat and ready for a burger. What a great day! The end. Thanks for playing. Would you like to start over or take a break?"
        );
    });

    it("Incorrect Bottles of Water", async function () {

        await contentTester.givenStartInvoked();

        await contentTester.assertSpeech(
            "Good morning! You roll over in bed and look outside. It looks like a beautiful day. Would you like to go on a hike?"
        );

        await contentTester.givenUserInput({ value: "Yes" });

        await contentTester.assertSceneID("water");
        await contentTester.assertSpeech(
            "Yay, you are so excited. You start to get ready for your adventure. You pick a beautiful nearby alpine lake as your hiking destination and get out your daypack. You toss your fully charge smartphone, first aide kit, small multitool, a big bag of granola, and a lightweight rain jacket into your pack. You throw on some comfy hiking clothes and lace up your hiking shoes. Almost ready! How many bottles of water would you like to take with you?"
        );

        await contentTester.givenUserInput({
            value: "0",
            slots: [
                {
                    name: "bottles",
                    value: "0"
                }
            ]
        });

        await contentTester.assertSceneID("water");
        await contentTester.assertSpeech(
            "You need at least some water. How many bottles of water would you like to take with you?"
        );

        await contentTester.givenUserInput({
            value: "5",
            slots: [
                {
                    name: "bottles",
                    value: "5"
                }
            ]
        });

        await contentTester.assertSceneID("water");
        await contentTester.assertSpeech(
            "You only have 4 bottles to use at home. How many bottles of water would you like to take with you?"
        );

    });

    it("Hesitate going on hike", async function () {

        await contentTester.givenStartInvoked();

        await contentTester.assertSpeech(
            "Good morning! You roll over in bed and look outside. It looks like a beautiful day. Would you like to go on a hike?"
        );

        await contentTester.givenUserInput({ value: "No" });

        await contentTester.assertSceneID("hesitate");
        await contentTester.assertSpeech(
            "You spend the morning inside doing chores and playing video games. Late morning, you look outside and notice that the day is just getting nicer and nicer. It occurs to you that you still have time to fit in a hike. Do you reconsider and go on a hike?"
        );

        await contentTester.givenUserInput({ value: "Yes" });

        await contentTester.assertSceneID("water");
        await contentTester.assertSpeech(
            "Yay, you are so excited. You start to get ready for your adventure. You pick a beautiful nearby alpine lake as your hiking destination and get out your daypack. You toss your fully charge smartphone, first aide kit, small multitool, a big bag of granola, and a lightweight rain jacket into your pack. You throw on some comfy hiking clothes and lace up your hiking shoes. Almost ready! How many bottles of water would you like to take with you?"
        );

        await contentTester.givenUserInput({
            value: "2",
            slots: [
                {
                    name: "bottles",
                    value: "2"
                }
            ]
        });

        await contentTester.assertSceneID("rest");
        await contentTester.assertSpeech(
            "You fill up 2 water bottles and grab your gear. On the car ride out to the trailhead you listen to your favorite album of woodland sounds. You are so amped for a hike. You pull up to the trailhead and the parking lot is completely full. You drive around for a few minutes until you see a couple who are back from their hike and tossing their gear into the trunk of their car. You pull up and wait while they pack up. Eventually, they drive away and you grab their parking spot. You start hiking up towards the alpine lake and after a short while you are feeling the effort in your legs and lungs. It feels good and you keep trekking through the trees, stopping occasionally for water or a quick bite of granola. Your mind begins to clear and you feel at one with nature. At about an hour in, the vegitation around you becomes shorter and more sparse and the trail connects with a stream that runs along your left. Then you see it, a little patch of blue expanse up ahead. Your legs are pretty tired, but you quicken your pace. The blue grows as you approach. Then, all of a sudden, the lake is right in front of you, surrounded on 3 sides by rocky peaks. You take a seat on a large rock at the edge of the lake and relax with some water and granola. The sun feels great and your legs thank you for the chance to rest. You look to you right and notice that the trail continues. From where you sit, you can see it traversing back and forth up the right most peak. It must be an incredible view from up there. Would you like to continue on to the peak or call it a day and head down?"
        );

        await contentTester.givenUserInput({ value: "continue on to the peak" });

        await contentTester.assertSceneID("end");
        await contentTester.assertSpeech(
            "You get up from the rock and start up the winding trail. Your legs ache but soon loosen up. You are high up enough that there isn't much tree coverage and the sun is beating down on you. You stop for more granola and water frequently. Good thing you brought enough water. It is a grueling climb, much harder than your thought it would be when looking up from the lake. Eventually you start to get closer to the peak and your adrenalin starts to kick in. The air is great up here. Then you take your final step and you are standing on top of the peak and can see forever in all directions. You take a moment to soak it in and take some photos. It's quiet peaceful up there. Eventually, you decide to head down. It's a long trip down and your legs are shot but it was totally worth it. Finally, you make it to the parking lots and flop into your car. You are beat and ready for a burger. What a great day! The end. Thanks for playing. Would you like to start over or take a break?"
        );

    });

    it("Hesitate going on hike", async function () {

        await contentTester.givenStartInvoked();

        await contentTester.assertSpeech(
            "Good morning! You roll over in bed and look outside. It looks like a beautiful day. Would you like to go on a hike?"
        );

        await contentTester.givenUserInput({ value: "No" });

        await contentTester.assertSceneID("hesitate");
        await contentTester.assertSpeech(
            "You spend the morning inside doing chores and playing video games. Late morning, you look outside and notice that the day is just getting nicer and nicer. It occurs to you that you still have time to fit in a hike. Do you reconsider and go on a hike?"
        );

        await contentTester.givenUserInput({ value: "Yes" });

        await contentTester.assertSceneID("water");
        await contentTester.assertSpeech(
            "Yay, you are so excited. You start to get ready for your adventure. You pick a beautiful nearby alpine lake as your hiking destination and get out your daypack. You toss your fully charge smartphone, first aide kit, small multitool, a big bag of granola, and a lightweight rain jacket into your pack. You throw on some comfy hiking clothes and lace up your hiking shoes. Almost ready! How many bottles of water would you like to take with you?"
        );

        await contentTester.givenUserInput({
            value: "2",
            slots: [
                {
                    name: "bottles",
                    value: "2"
                }
            ]
        });

        await contentTester.assertSceneID("rest");
        await contentTester.assertSpeech(
            "You fill up 2 water bottles and grab your gear. On the car ride out to the trailhead you listen to your favorite album of woodland sounds. You are so amped for a hike. You pull up to the trailhead and the parking lot is completely full. You drive around for a few minutes until you see a couple who are back from their hike and tossing their gear into the trunk of their car. You pull up and wait while they pack up. Eventually, they drive away and you grab their parking spot. You start hiking up towards the alpine lake and after a short while you are feeling the effort in your legs and lungs. It feels good and you keep trekking through the trees, stopping occasionally for water or a quick bite of granola. Your mind begins to clear and you feel at one with nature. At about an hour in, the vegitation around you becomes shorter and more sparse and the trail connects with a stream that runs along your left. Then you see it, a little patch of blue expanse up ahead. Your legs are pretty tired, but you quicken your pace. The blue grows as you approach. Then, all of a sudden, the lake is right in front of you, surrounded on 3 sides by rocky peaks. You take a seat on a large rock at the edge of the lake and relax with some water and granola. The sun feels great and your legs thank you for the chance to rest. You look to you right and notice that the trail continues. From where you sit, you can see it traversing back and forth up the right most peak. It must be an incredible view from up there. Would you like to continue on to the peak or call it a day and head down?"
        );

        await contentTester.givenUserInput({ value: "head home" });

        await contentTester.assertSceneID("end");
        await contentTester.assertSpeech(
            "You rest a little longer at the lake and then head down the trail. To get to the parking lot faster than your thought you would and head to get a burger. The end. Thanks for playing. Would you like to start over or take a break?"
        );

    });

    it("Not enough water to continue", async function () {

        await contentTester.givenStartInvoked();

        await contentTester.assertSpeech(
            "Good morning! You roll over in bed and look outside. It looks like a beautiful day. Would you like to go on a hike?"
        );

        await contentTester.givenUserInput({ value: "No" });

        await contentTester.assertSceneID("hesitate");
        await contentTester.assertSpeech(
            "You spend the morning inside doing chores and playing video games. Late morning, you look outside and notice that the day is just getting nicer and nicer. It occurs to you that you still have time to fit in a hike. Do you reconsider and go on a hike?"
        );

        await contentTester.givenUserInput({ value: "Yes" });

        await contentTester.assertSceneID("water");
        await contentTester.assertSpeech(
            "Yay, you are so excited. You start to get ready for your adventure. You pick a beautiful nearby alpine lake as your hiking destination and get out your daypack. You toss your fully charge smartphone, first aide kit, small multitool, a big bag of granola, and a lightweight rain jacket into your pack. You throw on some comfy hiking clothes and lace up your hiking shoes. Almost ready! How many bottles of water would you like to take with you?"
        );

        await contentTester.givenUserInput({
            value: "1",
            slots: [
                {
                    name: "bottles",
                    value: "1"
                }
            ]
        });

        await contentTester.assertSceneID("rest");
        await contentTester.assertSpeech(
            "You fill up 1 water bottles and grab your gear. On the car ride out to the trailhead you listen to your favorite album of woodland sounds. You are so amped for a hike. You pull up to the trailhead and the parking lot is completely full. You drive around for a few minutes until you see a couple who are back from their hike and tossing their gear into the trunk of their car. You pull up and wait while they pack up. Eventually, they drive away and you grab their parking spot. You start hiking up towards the alpine lake and after a short while you are feeling the effort in your legs and lungs. It feels good and you keep trekking through the trees, stopping occasionally for water or a quick bite of granola. Your mind begins to clear and you feel at one with nature. At about an hour in, the vegitation around you becomes shorter and more sparse and the trail connects with a stream that runs along your left. Then you see it, a little patch of blue expanse up ahead. Your legs are pretty tired, but you quicken your pace. The blue grows as you approach. Then, all of a sudden, the lake is right in front of you, surrounded on 3 sides by rocky peaks. You take a seat on a large rock at the edge of the lake and relax with some water and granola. The sun feels great and your legs thank you for the chance to rest. You look to you right and notice that the trail continues. From where you sit, you can see it traversing back and forth up the right most peak. It must be an incredible view from up there. Would you like to continue on to the peak or call it a day and head down?"
        );

        await contentTester.givenUserInput({ value: "continue on to the peak" });

        await contentTester.assertSceneID("end");
        await contentTester.assertSpeech(
            "You get up from the rock and start up the winding trail. Your legs ache but soon loosen up. You are high up enough that there isn't much tree coverage and the sun is beating down on you. About half way up, you stop to drink some water and notice that there is not much left in your bottle. You drink the last bit and wish you had brought more water with you. It's still a pretty long way up to the top and the trail is completely exposed to the sun and wind. Just looking at the rest of the trail remaining makes your throat dry. You take stock of your situation and decide that you'd better call it a day. You head back to the lake and then down to the parking lot. You are parched and sad that you didn't make it to the top but glad that you didn't risk it. You hop in your car and head out to get a burger on your way back home. The end. Thanks for playing. Would you like to start over or take a break?"
        );

    });

    it("Pause", async function () {

        await contentTester.givenStartInvoked();

        await contentTester.assertSpeech(
            "Good morning! You roll over in bed and look outside. It looks like a beautiful day. Would you like to go on a hike?"
        );

        await contentTester.givenUserInput({ value: "No" });

        await contentTester.assertSceneID("hesitate");
        await contentTester.assertSpeech(
            "You spend the morning inside doing chores and playing video games. Late morning, you look outside and notice that the day is just getting nicer and nicer. It occurs to you that you still have time to fit in a hike. Do you reconsider and go on a hike?"
        );

        await contentTester.givenPauseInvoked();

        await contentTester.assertSceneID("hesitate");
        await contentTester.assertSpeech("Thanks for playing. ");


    });

    it("Resume Restart", async function () {

        await contentTester.givenStartInvoked();

        await contentTester.assertSpeech(
            "Good morning! You roll over in bed and look outside. It looks like a beautiful day. Would you like to go on a hike?"
        );

        await contentTester.givenUserInput({ value: "No" });

        await contentTester.assertSceneID("hesitate");
        await contentTester.assertSpeech(
            "You spend the morning inside doing chores and playing video games. Late morning, you look outside and notice that the day is just getting nicer and nicer. It occurs to you that you still have time to fit in a hike. Do you reconsider and go on a hike?"
        );

        await contentTester.givenPauseInvoked();

        await contentTester.assertSceneID("hesitate");
        await contentTester.assertSpeech("Thanks for playing. ");

        await contentTester.givenResumeInvoked();

        await contentTester.assertSceneID("resume");
        await contentTester.assertSpeech(
            "Welcome back to your hiking story. Would you like to pick up where you last left off?"
        );

        await contentTester.givenUserInput({ value: "No" });

        await contentTester.assertSceneID("start");
        await contentTester.assertSpeech(
            "Good morning! You roll over in bed and look outside. It looks like a beautiful day. Would you like to go on a hike?"
        );

    });

    it("Resume Continue", async function () {

        await contentTester.givenStartInvoked();

        await contentTester.assertSpeech(
            "Good morning! You roll over in bed and look outside. It looks like a beautiful day. Would you like to go on a hike?"
        );

        await contentTester.givenUserInput({ value: "No" });

        await contentTester.assertSceneID("hesitate");
        await contentTester.assertSpeech(
            "You spend the morning inside doing chores and playing video games. Late morning, you look outside and notice that the day is just getting nicer and nicer. It occurs to you that you still have time to fit in a hike. Do you reconsider and go on a hike?"
        );

        await contentTester.givenPauseInvoked();

        await contentTester.assertSceneID("hesitate");
        await contentTester.assertSpeech("Thanks for playing. ");

        await contentTester.givenResumeInvoked();

        await contentTester.assertSceneID("resume");
        await contentTester.assertSpeech(
            "Welcome back to your hiking story. Would you like to pick up where you last left off?"
        );

        await contentTester.givenUserInput({ value: "Yes" });

        await contentTester.assertSceneID("hesitate");
        await contentTester.assertSpeech(
            "You spend the morning inside doing chores and playing video games. Late morning, you look outside and notice that the day is just getting nicer and nicer. It occurs to you that you still have time to fit in a hike. Do you reconsider and go on a hike?"
        );


    });

    it("Help", async function () {

        await contentTester.givenStartInvoked();

        await contentTester.assertSpeech(
            "Good morning! You roll over in bed and look outside. It looks like a beautiful day. Would you like to go on a hike?"
        );

        await contentTester.givenUserInput({ value: "help" });

        await contentTester.assertSceneID("start");
        await contentTester.assertSpeech(
            "Here's the help menu. Make choices to navigate the story or you can tell me to start over or stop. Picking up where you left off. Good morning! You roll over in bed and look outside. It looks like a beautiful day. Would you like to go on a hike?"
        );


    });

    it("Otherwise *", async function () {

        await contentTester.givenStartInvoked();

        await contentTester.assertSpeech(
            "Good morning! You roll over in bed and look outside. It looks like a beautiful day. Would you like to go on a hike?"
        );

        await contentTester.givenUserInput({ value: "foo" });

        await contentTester.assertSceneID("start");
        await contentTester.assertSpeech(
            "Here's the help menu. Make choices to navigate the story or you can tell me to start over or stop. Picking up where you left off. Good morning! You roll over in bed and look outside. It looks like a beautiful day. Would you like to go on a hike?"
        );
    });
});
