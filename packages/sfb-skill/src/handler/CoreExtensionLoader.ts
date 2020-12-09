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

import { SFBExtension, LanguageStrings, ImporterExtension } from '@alexa-games/sfb-f';
import { ConfigAccessor } from '../configAccessor';
import { ResourceStringsLoaders } from './ResourceStringsLoaders';
import { HandlerInput } from 'ask-sdk-core';

import * as fs from 'fs';

export interface CoreExtensionLoaderParams {
    /**
     * Source code path where story.abc file is located.
     */
    contentSource: string;

    /**
     * Provide strings rather than loading from the file system.
     */
    languageStrings?: LanguageStrings;

    /**
     * Provide snippets rather than loading from the file system.
     */
    snippets?: { [key: string]: string };
}

/**
 * Core Extensions are Importer Extensions Only (to be renamed)
 */
export class CoreExtensionLoader {
    voiceOverExtension: SFBExtension.VoiceOverExtension;
    globalSceneExtension: SFBExtension.GlobalDirectionsExtension;
    snippetExtension: SFBExtension.SnippetExtension | undefined;
    localizationExtension: SFBExtension.LocalizationExtension;

    constructor(locale: string, configAccessor: ConfigAccessor, param: CoreExtensionLoaderParams) {
        const s3ResourcesUri = configAccessor.getS3ResourcesUri(locale);
        const s3BucketName = configAccessor.getS3BucketName(locale);
        const s3DomainName = configAccessor.getS3DomainName(locale);

        this.voiceOverExtension = new SFBExtension.VoiceOverExtension(`https://${s3BucketName}.${s3DomainName}/vo/{{file_name}}`);

        let globalSceneExceptions: string[] = []; // list of scene names which should not have the global scene applied.

        this.globalSceneExtension = new SFBExtension.GlobalDirectionsExtension(globalSceneExceptions);

        this.localizationExtension = CoreExtensionLoader.createLocalizationExtension(
            configAccessor,
            locale,
            param.contentSource,
            param.languageStrings)

        this.snippetExtension = CoreExtensionLoader.createSnippetExtension(
            configAccessor,
            s3ResourcesUri,
            locale,
            param.snippets);
    }

    private static createLocalizationExtension(
        configAccessor: ConfigAccessor,
        locale: string,
        contentSource: string,
        languageStrings?: LanguageStrings
    ): SFBExtension.LocalizationExtension {

        if (!languageStrings) {
            languageStrings = ResourceStringsLoaders.loadLanguageStrings(contentSource);
        }

        return new SFBExtension.LocalizationExtension(
            locale,
            languageStrings!,
            configAccessor.shouldOverwriteWithSource(locale));
    }

    private static createSnippetExtension(
        configAccessor: ConfigAccessor,
        s3ResourcesUri: string,
        locale: string,
        snippetMap?: { [key: string]: string }): SFBExtension.SnippetExtension | undefined {

        if (!snippetMap) {
            snippetMap = ResourceStringsLoaders.loadSnippets(configAccessor, locale);
            if (!snippetMap) {
                console.warn(`[WARN] Snippet config '${configAccessor.getSnippetMapFilePath(locale)}' cannot be found.`);
            }
        }

        if (snippetMap) {
            return new SFBExtension.SnippetExtension(snippetMap, s3ResourcesUri);
        }

        return undefined;
    }

    public getImportExtensions(): ImporterExtension[] {
        let importExtensions: ImporterExtension[] = [
            this.localizationExtension,
            this.voiceOverExtension,
            this.globalSceneExtension
        ];

        if (this.snippetExtension) {
            importExtensions.push(this.snippetExtension)
        }

        return importExtensions;
    }
}