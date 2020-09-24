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

import { LocalizationExtension } from './../../../extensions/coreExtensions/LocalizationExtension';
import { StoryMetadata, InstructionType } from './../../../story/storyMetadata';
import { StoryMetadataHelper } from '../../../importPlugins/storyMetadataHelper';
import { strict as assert } from 'assert';
import { SourceContentHelper } from '../../../importPlugins/sourceContentHelper';

interface LanguageStrings {
    [locale: string]: {
        translation: {
            [key: string]: string
        }
    } 
}
describe("Localization Extension Test", function () {
    it("Source Locale Generation Only", async function () {
        const testingLocale: string = "en-US";
        const storyHelper = new StoryMetadataHelper(TEST_STORY);

        const localizationExtension = new LocalizationExtension(testingLocale,{},undefined,"en-US");
        await localizationExtension.extendImportedContent(storyHelper);
        const languageStrings: LanguageStrings = localizationExtension.getLocalizedStringsObject();
        
        const resultingStartNarration = languageStrings[testingLocale].translation['start.narration'];
        const expectedStartNarration = new StoryMetadataHelper(TEST_STORY).getSceneByID('start').contents[0].narration;
        const resultingStartNarrationOnImportedStory = storyHelper.getSceneNarration("start");

        assert.equal(resultingStartNarrationOnImportedStory, expectedStartNarration);
        assert.equal(resultingStartNarration, expectedStartNarration);

        // utterance translation check
        assert.equal(languageStrings[testingLocale].translation['utterance-restart'], "restart");
        assert.equal(languageStrings[testingLocale].translation['utterance-start over'], "start over");
    });

    it("Undefined source locale resolves to en-US", async function () {
        const testingLocale: string = "en-US";
        const storyHelper = new StoryMetadataHelper(TEST_STORY);

        const localizationExtension = new LocalizationExtension(testingLocale,{},undefined,undefined);
        await localizationExtension.extendImportedContent(storyHelper);
        const languageStrings: LanguageStrings = localizationExtension.getLocalizedStringsObject();
        
        const resultingStartNarration = languageStrings[testingLocale].translation['start.narration'];
        const expectedStartNarration = new StoryMetadataHelper(TEST_STORY).getSceneByID('start').contents[0].narration;
        const resultingStartNarrationOnImportedStory = storyHelper.getSceneNarration("start");

        assert.equal(resultingStartNarrationOnImportedStory, expectedStartNarration);
        assert.equal(resultingStartNarration, expectedStartNarration);

        // utterance translation check
        assert.equal(languageStrings[testingLocale].translation['utterance-restart'], "restart");
        assert.equal(languageStrings[testingLocale].translation['utterance-start over'], "start over");
    });

    it ("None Source Locale Generation Only", async function () {
        const testingLocale: string = "en-GB";
        const storyHelper = new StoryMetadataHelper(TEST_STORY);

        const localizationExtension = new LocalizationExtension(testingLocale,{},undefined, "en-US");
        await localizationExtension.extendImportedContent(storyHelper);
        const languageStrings = localizationExtension.getLocalizedStringsObject();

        const resultingStartNarration = languageStrings[testingLocale].translation['start.narration'];
        const expectedStartNarration = new StoryMetadataHelper(TEST_STORY).getSceneByID('start').contents[0].narration;
        const resultingStartNarrationOnImportedStory = storyHelper.getSceneNarration("start");

        assert.equal(resultingStartNarrationOnImportedStory, expectedStartNarration);
        assert.equal(resultingStartNarration, expectedStartNarration);

        // utterance translation check
        assert.equal(languageStrings[testingLocale].translation['utterance-restart'], "restart");
        assert.equal(languageStrings[testingLocale].translation['utterance-start over'], "start over");

    });

    it ("Duplicate Source String When Generating None Source Locale String For the First Time", async function () {
        const sourceLocale: string = "en-US";
        const testingLocale: string = "en-GB";
        const storyHelper = new StoryMetadataHelper(TEST_STORY);

        const localizationExtension = new LocalizationExtension(sourceLocale,{},undefined,sourceLocale);
        await localizationExtension.extendImportedContent(new StoryMetadataHelper(TEST_STORY));
        const languageStrings = localizationExtension.getLocalizedStringsObject();
        
        const noneSrcExtension = new LocalizationExtension(testingLocale, languageStrings, undefined, sourceLocale);
        await noneSrcExtension.extendImportedContent(storyHelper);
        
        // en-US (source locale)
        const resultingSourceStartNarration = languageStrings[sourceLocale].translation['start.narration'];
        const expectedSourceStartNarration = new StoryMetadataHelper(TEST_STORY).getSceneByID('start').contents[0].narration;

        assert.equal(resultingSourceStartNarration, expectedSourceStartNarration);
        assert.equal(languageStrings[sourceLocale].translation['utterance-restart'], "restart");
        assert.equal(languageStrings[sourceLocale].translation['utterance-start over'], "start over");

        // en-GB (second locale)
        const resultingStartNarration = languageStrings[testingLocale].translation['start.narration'];
        const expectedStartNarration = new StoryMetadataHelper(TEST_STORY).getSceneByID('start').contents[0].narration;
        const resultingStartNarrationOnImportedStory = storyHelper.getSceneNarration("start");

        assert.equal(resultingStartNarrationOnImportedStory, expectedStartNarration);
        assert.equal(resultingStartNarration, expectedStartNarration);
        assert.equal(languageStrings[testingLocale].translation['utterance-restart'], "restart");
        assert.equal(languageStrings[testingLocale].translation['utterance-start over'], "start over");
    });

    it ("Translation for None Source Locale is Not Overwritten On Overwrite == true", async function () {
        const testingLocale: string = "en-GB";
        const translation: string = "Translated Text";
        const storyHelper = new StoryMetadataHelper(TEST_STORY);

        const localizationExtension = new LocalizationExtension(testingLocale,{},undefined, "en-US");
        await localizationExtension.extendImportedContent(new StoryMetadataHelper(TEST_STORY));
        const firstlanguageStrings = localizationExtension.getLocalizedStringsObject();

        firstlanguageStrings[testingLocale].translation['start.narration'] = translation;
        
        const secondLocalizationExtension = new LocalizationExtension(testingLocale, firstlanguageStrings, true, "en-US");
        await secondLocalizationExtension.extendImportedContent(storyHelper);

        const languageStrings = secondLocalizationExtension.getLocalizedStringsObject();

        const resultingStartNarration = languageStrings[testingLocale].translation['start.narration'];
        const expectedStartNarration = new StoryMetadataHelper(TEST_STORY).getSceneByID('start').contents[0].narration;
        const resultingStartNarrationOnImportedStory = storyHelper.getSceneNarration("start");

        assert.notEqual(resultingStartNarrationOnImportedStory, expectedStartNarration);
        assert.notEqual(resultingStartNarration, expectedStartNarration);
        assert.equal(resultingStartNarration, translation);
        assert.equal(languageStrings[testingLocale].translation['utterance-restart'], "restart");
        assert.equal(languageStrings[testingLocale].translation['utterance-start over'], "start over");
    });

    it ("Translation for None Source Locale is Not Overwritten On Overwrite == false", async function () {
        const testingLocale: string = "en-GB";
        const translation: string = "Translated Text";
        const storyHelper = new StoryMetadataHelper(TEST_STORY);

        const localizationExtension = new LocalizationExtension(testingLocale,{},undefined, "en-US");
        await localizationExtension.extendImportedContent(new StoryMetadataHelper(TEST_STORY));
        const firstLanguageStrings = localizationExtension.getLocalizedStringsObject();

        firstLanguageStrings[testingLocale].translation['start.narration'] = translation;
        
        const secondLocalizationExtension = new LocalizationExtension(testingLocale, firstLanguageStrings, false, "en-US");
        await secondLocalizationExtension.extendImportedContent(storyHelper);

        const languageStrings = secondLocalizationExtension.getLocalizedStringsObject();

        const resultingStartNarration = languageStrings[testingLocale].translation['start.narration'];
        const expectedStartNarration = new StoryMetadataHelper(TEST_STORY).getSceneByID('start').contents[0].narration;
        const resultingStartNarrationOnImportedStory = storyHelper.getSceneNarration("start");

        assert.notEqual(resultingStartNarrationOnImportedStory, expectedStartNarration);
        assert.notEqual(resultingStartNarration, expectedStartNarration);
        assert.equal(resultingStartNarration, translation);
        assert.equal(languageStrings[testingLocale].translation['utterance-restart'], "restart");
        assert.equal(languageStrings[testingLocale].translation['utterance-start over'], "start over");
    })

    it ("Translation for None Source Locale Is Not Overwritten On Overwrite == undefined", async function () {
        const testingLocale: string = "en-GB";
        const translation: string = "Translated Text";
        const storyHelper = new StoryMetadataHelper(TEST_STORY);

        const localizationExtension = new LocalizationExtension(testingLocale,{},undefined, "en-US");
        await localizationExtension.extendImportedContent(new StoryMetadataHelper(TEST_STORY));
        const firstLanguageStrings = localizationExtension.getLocalizedStringsObject();

        firstLanguageStrings[testingLocale].translation['start.narration'] = translation;
        
        const secondLocalizationExtension = new LocalizationExtension(testingLocale, firstLanguageStrings, undefined, "en-US");
        await secondLocalizationExtension.extendImportedContent(storyHelper);

        const languageStrings = secondLocalizationExtension.getLocalizedStringsObject();

        const resultingStartNarration = languageStrings[testingLocale].translation['start.narration'];
        const expectedStartNarration = new StoryMetadataHelper(TEST_STORY).getSceneByID('start').contents[0].narration;
        const resultingStartNarrationOnImportedStory = storyHelper.getSceneNarration("start");

        assert.notEqual(resultingStartNarrationOnImportedStory, expectedStartNarration);
        assert.notEqual(resultingStartNarration, expectedStartNarration);
        assert.equal(resultingStartNarrationOnImportedStory, translation);
        assert.equal(resultingStartNarration, translation);
        assert.equal(languageStrings[testingLocale].translation['utterance-restart'], "restart");
        assert.equal(languageStrings[testingLocale].translation['utterance-start over'], "start over");
    });

    it ("Edits on languageString for SOURCE is Overwritten when Overwrite == true", async function () {
        const testingLocale: string = "en-US";
        const translation: string = "Translated Text";
        const storyHelper = new StoryMetadataHelper(TEST_STORY);

        const localizationExtension = new LocalizationExtension(testingLocale,{},undefined, "en-US");
        await localizationExtension.extendImportedContent(new StoryMetadataHelper(TEST_STORY));
        const firstLanguageStrings = localizationExtension.getLocalizedStringsObject();

        firstLanguageStrings[testingLocale].translation['start.narration'] = translation;
        
        const secondLocalizationExtension = new LocalizationExtension(testingLocale, firstLanguageStrings, true, "en-US");
        await secondLocalizationExtension.extendImportedContent(storyHelper);

        const languageStrings = secondLocalizationExtension.getLocalizedStringsObject();

        const resultingStartNarration = languageStrings[testingLocale].translation['start.narration'];
        const expectedStartNarration = new StoryMetadataHelper(TEST_STORY).getSceneByID('start').contents[0].narration;
        const resultingStartNarrationOnImportedStory = storyHelper.getSceneNarration("start");

        assert.equal(resultingStartNarrationOnImportedStory, expectedStartNarration);
        assert.equal(resultingStartNarration, expectedStartNarration);
        assert.notEqual(resultingStartNarrationOnImportedStory, translation);
        assert.notEqual(resultingStartNarration, translation);
        assert.equal(languageStrings[testingLocale].translation['utterance-restart'], "restart");
        assert.equal(languageStrings[testingLocale].translation['utterance-start over'], "start over");
    });

    it ("Edits on languageString for SOURCE is Not Overwritten by the Source Content When Overwrite == false", async function () {
        const testingLocale: string = "en-US";
        const translation: string = "Translated Text";
        const storyHelper = new StoryMetadataHelper(TEST_STORY);

        const localizationExtension = new LocalizationExtension(testingLocale,{},undefined, "en-US");
        await localizationExtension.extendImportedContent(new StoryMetadataHelper(TEST_STORY));
        const firstLanguageStrings = localizationExtension.getLocalizedStringsObject();

        firstLanguageStrings[testingLocale].translation['start.narration'] = translation;
        
        const secondLocalizationExtension = new LocalizationExtension(testingLocale, firstLanguageStrings, false, "en-US");
        await secondLocalizationExtension.extendImportedContent(storyHelper);

        const languageStrings = secondLocalizationExtension.getLocalizedStringsObject();

        const resultingStartNarration = languageStrings[testingLocale].translation['start.narration'];
        const expectedStartNarration = new StoryMetadataHelper(TEST_STORY).getSceneByID('start').contents[0].narration;
        const resultingStartNarrationOnImportedStory = storyHelper.getSceneNarration("start");

        assert.notEqual(resultingStartNarrationOnImportedStory, expectedStartNarration);
        assert.notEqual(resultingStartNarration, expectedStartNarration);
        assert.equal(resultingStartNarrationOnImportedStory, translation);
        assert.equal(resultingStartNarration, translation);
        assert.equal(languageStrings[testingLocale].translation['utterance-restart'], "restart");
        assert.equal(languageStrings[testingLocale].translation['utterance-start over'], "start over");
    })

    it ("Edits on languageString for SOURCE is Not Overwritten by the Source Content When Overwrite == undefined", async function () {
        const testingLocale: string = "en-US";
        const translation: string = "Translated Text";
        const storyHelper = new StoryMetadataHelper(TEST_STORY);

        const localizationExtension = new LocalizationExtension(testingLocale,{},undefined, "en-US");
        await localizationExtension.extendImportedContent(new StoryMetadataHelper(TEST_STORY));
        const firstLanguageStrings = localizationExtension.getLocalizedStringsObject();

        firstLanguageStrings[testingLocale].translation['start.narration'] = translation;

        const secondLocalizationExtension = new LocalizationExtension(testingLocale, firstLanguageStrings, undefined, "en-US");
        await secondLocalizationExtension.extendImportedContent(storyHelper);

        const languageStrings = secondLocalizationExtension.getLocalizedStringsObject();

        const resultingStartNarration = languageStrings[testingLocale].translation['start.narration'];
        const expectedStartNarration = new StoryMetadataHelper(TEST_STORY).getSceneByID('start').contents[0].narration;
        const resultingStartNarrationOnImportedStory = storyHelper.getSceneNarration("start");

        assert.notEqual(resultingStartNarrationOnImportedStory, expectedStartNarration);
        assert.notEqual(resultingStartNarration, expectedStartNarration);
        assert.equal(resultingStartNarrationOnImportedStory, translation);
        assert.equal(resultingStartNarration, translation);
        assert.equal(languageStrings[testingLocale].translation['utterance-restart'], "restart");
        assert.equal(languageStrings[testingLocale].translation['utterance-start over'], "start over");
    });


    it ("A key on languageString deleted by mistake gets repopulated", async function () {
        const testingLocale: string = "en-US";
        const storyHelper = new StoryMetadataHelper(TEST_STORY);

        const localizationExtension = new LocalizationExtension(testingLocale,{},undefined, "en-US");
        await localizationExtension.extendImportedContent(new StoryMetadataHelper(TEST_STORY));
        const firstLanguageStrings = localizationExtension.getLocalizedStringsObject();

        delete firstLanguageStrings[testingLocale].translation['start.narration'];

        const secondLocalizationExtension = new LocalizationExtension(testingLocale, firstLanguageStrings, undefined, "en-US");
        await secondLocalizationExtension.extendImportedContent(storyHelper);

        const languageStrings = secondLocalizationExtension.getLocalizedStringsObject();

        const resultingStartNarration = languageStrings[testingLocale].translation['start.narration'];
        const expectedStartNarration = new StoryMetadataHelper(TEST_STORY).getSceneByID('start').contents[0].narration;
        const resultingStartNarrationOnImportedStory = storyHelper.getSceneNarration("start");

        assert.equal(resultingStartNarrationOnImportedStory, expectedStartNarration);
        assert.equal(resultingStartNarration, expectedStartNarration);
        assert.equal(languageStrings[testingLocale].translation['utterance-restart'], "restart");
        assert.equal(languageStrings[testingLocale].translation['utterance-start over'], "start over");
    });

    it ("Source String Delete => Correlating String ID deleted in languageStrings for all locales, when Overwrite == true", async function () {
        const sourceLocale: string = "en-US";
        const testingLocales: string[] = [
            "en-US",
            "en-GB"
        ]

        let languageString: any = {};
        // first run; string generation
        for (let locale of testingLocales) {
            const storyHelper = new StoryMetadataHelper(TEST_STORY);

            const localizationExtension = new LocalizationExtension(locale,languageString,true,sourceLocale);
            await localizationExtension.extendImportedContent(storyHelper);

            languageString = localizationExtension.getLocalizedStringsObject();
        }

        // re-run with deleted scene
        for (let locale of testingLocales) {
            const storyHelper = new StoryMetadataHelper(DELETED_STORY);

            const localizationExtension = new LocalizationExtension(locale,languageString,true,sourceLocale);
            await localizationExtension.extendImportedContent(storyHelper);

            languageString = localizationExtension.getLocalizedStringsObject();
        }

        // assert in all locales
        for (let locale of testingLocales) {
            const untouchedString = languageString[locale].translation['start.narration'];
            const deletedString = languageString[locale].translation['start.something else'];

            assert.notEqual(untouchedString, undefined);
            assert.equal(deletedString, undefined);
        }
    });

    it ("Source String Delete => Correlating String ID deleted in languageStrings for all locales, when Overwrite == false", async function () {
        const sourceLocale: string = "en-US";
        const testingLocales: string[] = [
            "en-US",
            "en-GB"
        ]

        let languageString: any = {};
        // first run; string generation
        for (let locale of testingLocales) {
            const storyHelper = new StoryMetadataHelper(TEST_STORY);

            const localizationExtension = new LocalizationExtension(locale,languageString,false,sourceLocale);
            await localizationExtension.extendImportedContent(storyHelper);

            languageString = localizationExtension.getLocalizedStringsObject();
        }

        // re-run with deleted scene
        for (let locale of testingLocales) {
            const storyHelper = new StoryMetadataHelper(DELETED_STORY);

            const localizationExtension = new LocalizationExtension(locale,languageString,false,sourceLocale);
            await localizationExtension.extendImportedContent(storyHelper);

            languageString = localizationExtension.getLocalizedStringsObject();
        }

        // assert in all locales
        for (let locale of testingLocales) {
            const untouchedString = languageString[locale].translation['start.narration'];
            const deletedString = languageString[locale].translation['start.something else'];

            assert.notEqual(untouchedString, undefined);
            assert.equal(deletedString, undefined);
        }
    });

    it ("Source String Delete => Correlating String ID deleted in languageStrings for all locales, when Overwrite == undefined", async function () {
        const sourceLocale: string = "en-US";
        const testingLocales: string[] = [
            "en-US",
            "en-GB"
        ]

        let languageString: any = {};
        // first run; string generation
        for (let locale of testingLocales) {
            const storyHelper = new StoryMetadataHelper(TEST_STORY);

            const localizationExtension = new LocalizationExtension(locale,languageString,undefined,sourceLocale);
            await localizationExtension.extendImportedContent(storyHelper);

            languageString = localizationExtension.getLocalizedStringsObject();
        }

        // re-run with deleted scene
        for (let locale of testingLocales) {
            const storyHelper = new StoryMetadataHelper(DELETED_STORY);

            const localizationExtension = new LocalizationExtension(locale,languageString,undefined,sourceLocale);
            await localizationExtension.extendImportedContent(storyHelper);

            languageString = localizationExtension.getLocalizedStringsObject();
        }

        // assert in all locales
        for (let locale of testingLocales) {
            const untouchedString = languageString[locale].translation['start.narration'];
            const deletedString = languageString[locale].translation['start.something else'];

            assert.notEqual(untouchedString, undefined);
            assert.equal(deletedString, undefined);
        }
    });

    it ("Source String Added => Correlating String ID added in languageStrings for all locales, when Overwrite == true", async function () {
        const sourceLocale: string = "en-US";
        const testingLocales: string[] = [
            "en-US",
            "en-GB"
        ]

        let languageString: any = {};
        // first run; string generation
        for (let locale of testingLocales) {
            const storyHelper = new StoryMetadataHelper(TEST_STORY);

            const localizationExtension = new LocalizationExtension(locale,languageString,true,sourceLocale);
            await localizationExtension.extendImportedContent(storyHelper);

            languageString = localizationExtension.getLocalizedStringsObject();
        }

        // re-run with deleted scene
        for (let locale of testingLocales) {
            const storyHelper = new StoryMetadataHelper(ADDED_STORY);

            const localizationExtension = new LocalizationExtension(locale,languageString,true,sourceLocale);
            await localizationExtension.extendImportedContent(storyHelper);

            languageString = localizationExtension.getLocalizedStringsObject();
        }

        // assert in all locales
        for (let locale of testingLocales) {
            const untouchedString = languageString[locale].translation['start.narration'];
            const addedString = languageString[locale].translation['added scene.narration'];

            assert.notEqual(untouchedString, undefined);
            assert.notEqual(addedString, undefined);
        }
    });

    it ("Source String Added => Correlating String ID added in languageStrings for all locales, when Overwrite == false", async function () {
        const sourceLocale: string = "en-US";
        const testingLocales: string[] = [
            "en-US",
            "en-GB"
        ]

        let languageString: any = {};
        // first run; string generation
        for (let locale of testingLocales) {
            const storyHelper = new StoryMetadataHelper(TEST_STORY);

            const localizationExtension = new LocalizationExtension(locale,languageString,false,sourceLocale);
            await localizationExtension.extendImportedContent(storyHelper);

            languageString = localizationExtension.getLocalizedStringsObject();
        }

        // re-run with deleted scene
        for (let locale of testingLocales) {
            const storyHelper = new StoryMetadataHelper(ADDED_STORY);

            const localizationExtension = new LocalizationExtension(locale,languageString,false,sourceLocale);
            await localizationExtension.extendImportedContent(storyHelper);

            languageString = localizationExtension.getLocalizedStringsObject();
        }

        // assert in all locales
        for (let locale of testingLocales) {
            const untouchedString = languageString[locale].translation['start.narration'];
            const addedString = languageString[locale].translation['added scene.narration'];

            assert.notEqual(untouchedString, undefined);
            assert.notEqual(addedString, undefined);
        }
    });

    it ("Source String Added => Correlating String ID added in languageStrings for all locales, when Overwrite == undefined", async function () {
        const sourceLocale: string = "en-US";
        const testingLocales: string[] = [
            "en-US",
            "en-GB"
        ]

        let languageString: any = {};
        // first run; string generation
        for (let locale of testingLocales) {
            const storyHelper = new StoryMetadataHelper(TEST_STORY);

            const localizationExtension = new LocalizationExtension(locale,languageString,undefined,sourceLocale);
            await localizationExtension.extendImportedContent(storyHelper);

            languageString = localizationExtension.getLocalizedStringsObject();
        }

        // re-run with deleted scene
        for (let locale of testingLocales) {
            const storyHelper = new StoryMetadataHelper(ADDED_STORY);

            const localizationExtension = new LocalizationExtension(locale,languageString,undefined,sourceLocale);
            await localizationExtension.extendImportedContent(storyHelper);

            languageString = localizationExtension.getLocalizedStringsObject();
        }

        // assert in all locales
        for (let locale of testingLocales) {
            const untouchedString = languageString[locale].translation['start.narration'];
            const addedString = languageString[locale].translation['added scene.narration'];

            assert.notEqual(untouchedString, undefined);
            assert.notEqual(addedString, undefined);
        }
    });


    it ("Edit in SOURCE updates source locale language string when Overwrite == true", async function () {
        const testingLocale: string = "en-US";

        const localizationExtension = new LocalizationExtension(testingLocale,{},undefined, "en-US");
        await localizationExtension.extendImportedContent(new StoryMetadataHelper(TEST_STORY));
        const firstLanguageStrings = localizationExtension.getLocalizedStringsObject();
        
        const storyHelper = new StoryMetadataHelper(CHANGED_STORY);
        const secondLocalizationExtension = new LocalizationExtension(testingLocale, firstLanguageStrings, true, "en-US");
        await secondLocalizationExtension.extendImportedContent(storyHelper);

        const languageStrings = secondLocalizationExtension.getLocalizedStringsObject();

        const resultingStartNarration = languageStrings[testingLocale].translation['start.narration'];
        const originalNarration = new StoryMetadataHelper(TEST_STORY).getSceneByID('start').contents[0].narration;
        const changedNarration = new StoryMetadataHelper(CHANGED_STORY).getSceneByID('start').contents[0].narration;
        const resultingStartNarrationOnImportedStory = storyHelper.getSceneNarration("start");

        assert.equal(resultingStartNarrationOnImportedStory, changedNarration);
        assert.equal(resultingStartNarration, changedNarration);
        assert.notEqual(resultingStartNarrationOnImportedStory, originalNarration);
        assert.notEqual(resultingStartNarration, originalNarration);
        assert.equal(languageStrings[testingLocale].translation['utterance-restart'], "restart");
        assert.equal(languageStrings[testingLocale].translation['utterance-start over'], "start over");
    });

    it ("Edit in SOURCE does NOT update source locale language string when Overwrite == false", async function () {
        const testingLocale: string = "en-US";

        const localizationExtension = new LocalizationExtension(testingLocale,{},undefined, "en-US");
        await localizationExtension.extendImportedContent(new StoryMetadataHelper(TEST_STORY));
        const firstLanguageStrings = localizationExtension.getLocalizedStringsObject();
        
        const storyHelper = new StoryMetadataHelper(CHANGED_STORY);
        const secondLocalizationExtension = new LocalizationExtension(testingLocale, firstLanguageStrings, false, "en-US");
        await secondLocalizationExtension.extendImportedContent(storyHelper);

        const languageStrings = secondLocalizationExtension.getLocalizedStringsObject();

        const resultingStartNarration = languageStrings[testingLocale].translation['start.narration'];
        const originalNarration = new StoryMetadataHelper(TEST_STORY).getSceneByID('start').contents[0].narration;
        const changedNarration = new StoryMetadataHelper(CHANGED_STORY).getSceneByID('start').contents[0].narration;
        const resultingStartNarrationOnImportedStory = storyHelper.getSceneNarration("start");

        assert.equal(resultingStartNarrationOnImportedStory, originalNarration);
        assert.equal(resultingStartNarration, originalNarration);
        assert.notEqual(resultingStartNarrationOnImportedStory, changedNarration);
        assert.notEqual(resultingStartNarration, changedNarration);
        assert.equal(languageStrings[testingLocale].translation['utterance-restart'], "restart");
        assert.equal(languageStrings[testingLocale].translation['utterance-start over'], "start over");
    });

    it ("Edit in SOURCE does NOT update source locale language string when Overwrite == undefined", async function () {
        const testingLocale: string = "en-US";

        const localizationExtension = new LocalizationExtension(testingLocale,{},undefined, "en-US");
        await localizationExtension.extendImportedContent(new StoryMetadataHelper(TEST_STORY));
        const firstLanguageStrings = localizationExtension.getLocalizedStringsObject();
        
        const storyHelper = new StoryMetadataHelper(CHANGED_STORY);
        const secondLocalizationExtension = new LocalizationExtension(testingLocale, firstLanguageStrings, undefined, "en-US");
        await secondLocalizationExtension.extendImportedContent(storyHelper);

        const languageStrings = secondLocalizationExtension.getLocalizedStringsObject();

        const resultingStartNarration = languageStrings[testingLocale].translation['start.narration'];
        const originalNarration = new StoryMetadataHelper(TEST_STORY).getSceneByID('start').contents[0].narration;
        const changedNarration = new StoryMetadataHelper(CHANGED_STORY).getSceneByID('start').contents[0].narration;
        const resultingStartNarrationOnImportedStory = storyHelper.getSceneNarration("start");

        assert.equal(resultingStartNarrationOnImportedStory, originalNarration);
        assert.equal(resultingStartNarration, originalNarration);
        assert.notEqual(resultingStartNarrationOnImportedStory, changedNarration);
        assert.notEqual(resultingStartNarration, changedNarration);
        assert.equal(languageStrings[testingLocale].translation['utterance-restart'], "restart");
        assert.equal(languageStrings[testingLocale].translation['utterance-start over'], "start over");
    });

    it ("Unused extension method 'extendSourceContent' does not throw when called", async function () {
        const testingLocale: string = "en-GB";

        const localizationExtension = new LocalizationExtension(testingLocale,{},undefined, "en-US");
        await localizationExtension.extendSourceContent(new SourceContentHelper([
            {
                id: "test.abc",
                text: "@start"
            }
        ]))
    });
});


const TEST_STORY: StoryMetadata = {
    pluginName: "something",
    scenes: [
        {
            contents: [
                {
                    narration: "testing narration",
                    sceneDirections: [
                        {
                            directionType: InstructionType.REPROMPT,
                            parameters: {
                                message: "this is a reprompt"
                            }
                        },
                        {
                            directionType: InstructionType.REPROMPT,
                            parameters: {
                                message: "this is a recap"
                            }
                        },
                        {
                            directionType: InstructionType.CHOICE,
                            parameters: {
                                "utterances": [
                                    "restart",
                                    "start over"
                                ],
                                "saveToHistory": "true",
                                "directions": [
                                    {
                                        "directionType": "bookmark",
                                        "parameters": {
                                            "variableName": "bookmark"
                                        },
                                    },
                                    {
                                        "directionType": "go to",
                                        "parameters": {
                                            "target": "restart confirm",
                                            "targetSceneProperty": "narration"
                                        },
                                    }
                                ]
                            }
                        }
                    ]
                },
                
            ],
            id: "start"
        },
        {
            contents: [
                {
                    narration: "testing narration",
                    sceneDirections: [
                        {
                            directionType: InstructionType.CHOICE,
                            parameters: {
                                "utterances": [
                                    "restart",
                                    "start over"
                                ],
                                "saveToHistory": "true",
                                "directions": [
                                    {
                                        "directionType": "bookmark",
                                        "parameters": {
                                            "variableName": "bookmark"
                                        },
                                    },
                                    {
                                        "directionType": "go to",
                                        "parameters": {
                                            "target": "restart confirm",
                                            "targetSceneProperty": "narration"
                                        },
                                    }
                                ]
                            }
                        }
                    ]
                },
                
            ],
            id: "something else"
        }
    ],
    storyID: "something",
    storyTitle: "something"
}

const CHANGED_STORY: StoryMetadata = {
    pluginName: "something",
    scenes: [
        {
            contents: [
                {
                    narration: "Changed Narration",
                    sceneDirections: [
                        {
                            directionType: InstructionType.REPROMPT,
                            parameters: {
                                message: "this is a reprompt"
                            }
                        },
                        {
                            directionType: InstructionType.REPROMPT,
                            parameters: {
                                message: "this is a recap"
                            }
                        },
                        {
                            directionType: InstructionType.CHOICE,
                            parameters: {
                                "utterances": [
                                    "restart",
                                    "start over"
                                ],
                                "saveToHistory": "true",
                                "directions": [
                                    {
                                        "directionType": "bookmark",
                                        "parameters": {
                                            "variableName": "bookmark"
                                        },
                                    },
                                    {
                                        "directionType": "go to",
                                        "parameters": {
                                            "target": "restart confirm",
                                            "targetSceneProperty": "narration"
                                        },
                                    }
                                ]
                            }
                        }
                    ]
                },
                
            ],
            id: "start"
        }
    ],
    storyID: "something",
    storyTitle: "something"
}

const DELETED_STORY: StoryMetadata = {
    pluginName: "something",
    scenes: [
        {
            contents: [
                {
                    narration: "testing narration",
                    sceneDirections: [
                        {
                            directionType: InstructionType.REPROMPT,
                            parameters: {
                                message: "this is a reprompt"
                            }
                        },
                        {
                            directionType: InstructionType.REPROMPT,
                            parameters: {
                                message: "this is a recap"
                            }
                        },
                        {
                            directionType: InstructionType.CHOICE,
                            parameters: {
                                "utterances": [
                                    "restart",
                                    "start over"
                                ],
                                "saveToHistory": "true",
                                "directions": [
                                    {
                                        "directionType": "bookmark",
                                        "parameters": {
                                            "variableName": "bookmark"
                                        },
                                    },
                                    {
                                        "directionType": "go to",
                                        "parameters": {
                                            "target": "restart confirm",
                                            "targetSceneProperty": "narration"
                                        },
                                    }
                                ]
                            }
                        }
                    ]
                },
                
            ],
            id: "start"
        }
    ],
    storyID: "something",
    storyTitle: "something"
}

const ADDED_STORY: StoryMetadata = {
    pluginName: "something",
    scenes: [
        {
            contents: [
                {
                    narration: "testing narration",
                    sceneDirections: [
                        {
                            directionType: InstructionType.REPROMPT,
                            parameters: {
                                message: "this is a reprompt"
                            }
                        },
                        {
                            directionType: InstructionType.REPROMPT,
                            parameters: {
                                message: "this is a recap"
                            }
                        },
                        {
                            directionType: InstructionType.CHOICE,
                            parameters: {
                                "utterances": [
                                    "restart",
                                    "start over"
                                ],
                                "saveToHistory": "true",
                                "directions": [
                                    {
                                        "directionType": "bookmark",
                                        "parameters": {
                                            "variableName": "bookmark"
                                        },
                                    },
                                    {
                                        "directionType": "go to",
                                        "parameters": {
                                            "target": "restart confirm",
                                            "targetSceneProperty": "narration"
                                        },
                                    }
                                ]
                            }
                        }
                    ]
                },
                
            ],
            id: "start"
        },
        {
            contents: [
                {
                    narration: "testing narration",
                    sceneDirections: [
                        {
                            directionType: InstructionType.CHOICE,
                            parameters: {
                                "utterances": [
                                    "restart",
                                    "start over"
                                ],
                                "saveToHistory": "true",
                                "directions": [
                                    {
                                        "directionType": "bookmark",
                                        "parameters": {
                                            "variableName": "bookmark"
                                        },
                                    },
                                    {
                                        "directionType": "go to",
                                        "parameters": {
                                            "target": "restart confirm",
                                            "targetSceneProperty": "narration"
                                        },
                                    }
                                ]
                            }
                        }
                    ]
                },
                
            ],
            id: "something else"
        },
        {
            contents: [
                {
                    narration: "testing narration",
                    sceneDirections: [
                        {
                            directionType: InstructionType.CHOICE,
                            parameters: {
                                "utterances": [
                                    "restart",
                                    "start over"
                                ],
                                "saveToHistory": "true",
                                "directions": [
                                    {
                                        "directionType": "bookmark",
                                        "parameters": {
                                            "variableName": "bookmark"
                                        },
                                    },
                                    {
                                        "directionType": "go to",
                                        "parameters": {
                                            "target": "restart confirm",
                                            "targetSceneProperty": "narration"
                                        },
                                    }
                                ]
                            }
                        }
                    ]
                },
                
            ],
            id: "added scene"
        }
    ],
    storyID: "something",
    storyTitle: "something"
}