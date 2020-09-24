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

import cmd from 'commander';
import path from 'path';
import fs from 'fs';
import { SpecialPaths } from '../../lib/specialPaths';
import { ConfigAccessor, ResourceStringsLoaders } from '@alexa-games/sfb-skill';
import { localize } from 'pseudo-localization';
import { SegmentType, SegmenterBuilder } from '@alexa-games/sfb-f';
import { FileUtils } from '../../lib/fileUtils';

import { crashOnUnhandledRejections, readUtf8FileExcludingBom } from '@alexa-games/sfb-util';

crashOnUnhandledRejections();


cmd
    .usage('[options] <story path>')
    .option('-t, --target-locale <locale>', "Locale to receive pseudo localized strings.")
    .option('-s, --source-locale <locale>', "Locale to provide original strings. Default en-US.", 'en-US');
cmd
    .parse(process.argv);


if (process.argv.length === 2 || cmd.args.length < 1) {
    cmd.help();
    process.exitCode = 1;
} else {
    run(cmd.args[0], cmd)
    .then(() => {})
    .catch((e) => {
        console.error(e);
        process.exitCode = 1;
    });
}

async function run(story: string, options: any) {
    if (!options.targetLocale) {
        console.error('Please specify a target local using the -t option.');
        process.exitCode = 1;
        return;
    }

    await translateLanguageStringsToPseudo(story, options.sourceLocale, options.targetLocale);
    await createPseudoResources(story, options.sourceLocale, options.targetLocale);
    await updateProjectConfig(story, options.sourceLocale, options.targetLocale);
}

async function translateLanguageStringsToPseudo(story: string, locale: string, targetLocale: string) {
    console.log(`story=${story}`);
    console.log(`targetLocale=${targetLocale}`);
    console.log(`locale=${locale}`);

    const dirs = new SpecialPaths(story);

    const languageString = ResourceStringsLoaders.loadLanguageStrings(dirs.contentPath);

    if (!languageString) {
        throw new Error('No language strings found ');
    }

    const sourceStrings = languageString[locale];
    const pseudoStrings = pseudoTranslate(sourceStrings.translation);

    languageString[targetLocale] = { translation: pseudoStrings };

    const languageStringsFile = path.join(dirs.contentPath, 'languageStrings.json');
    fs.writeFileSync(languageStringsFile, JSON.stringify(languageString, null, 4));

    console.log(`Updated ${languageStringsFile}`);
}

async function createPseudoResources(story: string, locale: string, targetLocale: string) {
    const dirs = new SpecialPaths(story);

    await FileUtils.recursiveCopy(
        path.join(dirs.getResourcePath(locale),'*'),
        dirs.getResourcePath(targetLocale));

    const config = await ConfigAccessor.loadConfigFile(dirs.abcConfig, dirs.contentPath);

    const snippets = ResourceStringsLoaders.loadSnippets(config, locale);
    if (!snippets) {
        throw new Error('No snippets found.');
    }

    const pseudoSnippets = pseudoTranslate(snippets);

    const snippetMapFilePath = config.getSnippetMapFilePath(targetLocale);
    fs.writeFileSync(snippetMapFilePath, JSON.stringify(pseudoSnippets, null, 4));

    console.log(`Created ${targetLocale} resources.`);
}

async function updateProjectConfig(story: string, locale: string, targetLocale: string) {
    const dirs = new SpecialPaths(story);

    const configData = FileUtils.loadJson(dirs.abcConfig);
    const config = new ConfigAccessor(configData, dirs.contentPath);

    let configChanged = false;

    if (!config.publishLocales) {

    }
    const index = config.publishLocales.findIndex((item) => { return item.toLowerCase() === targetLocale.toLowerCase(); });
    if (index < 0) {
        // Didn't find 
        config.publishLocales.push(targetLocale);
        //config.setValue('publish-locales', config.publishLocales);

        configChanged = true;
    }

    const InvocationNameKey = 'skill-invocation-name';
    const localizedInvocationName = config.getValue(InvocationNameKey, undefined, targetLocale);
    const sourceInvocationName = config.getValue(InvocationNameKey, undefined, locale);
    
    if (!localizedInvocationName || localizedInvocationName === sourceInvocationName) { 
        
        config.setValue(InvocationNameKey, localize(sourceInvocationName), undefined, targetLocale);
        configChanged = true;
    }

    if (configChanged) {
        fs.writeFileSync(dirs.abcConfig, JSON.stringify(configData, null, 4), { encoding: 'utf8' });
    }
}

function pseudoTranslate(source: {[key: string]: string }) {
    const result: {[key: string]: string } = {};

    // console.log(JSON.stringify(source));

    for (let key in source) {
        let value = source[key];

        value = value ? localizeOutputString(value) : value;

        result[key] = value;
    }

    return result;
}

/**
 * Localizes a string, but leaves things in {braces} alone.
 * @param value String to pseudo localize
 */
function localizeOutputString(value: string) {
    let result = '';
    const segmenter = SegmenterBuilder.getAllSegmenter();

    for (let token of segmenter.parse(value)) {
        if (token.type === SegmentType.PlainText) {
            result += localize(token.original);
        } else {
            result += token.original;
        }
    }
    return result;
}
