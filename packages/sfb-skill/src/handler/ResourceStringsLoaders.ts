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

import { LanguageStrings } from '@alexa-games/sfb-f';
import { readUtf8FileExcludingBomSync } from '@alexa-games/sfb-util';
import { ConfigAccessor } from '../configAccessor';

import * as fs from 'fs';
import * as path from 'path';

export const LANGUAGE_STRING_FILENAME = 'languageStrings.json';

export class ResourceStringsLoaders {
    /**
     * Loads language string file if available.
     * @param contentSource Path where story ABC files source is located.
     */
    public static loadLanguageStrings(contentSource: string): LanguageStrings {
        let languageStringPath = path.join(contentSource, LANGUAGE_STRING_FILENAME);

        if (fs.existsSync(languageStringPath)) {
            const data = readUtf8FileExcludingBomSync(languageStringPath);
            return JSON.parse(data) as LanguageStrings;
        }

        return {};
    }

    /**
     * Loads snippet file for the given locale.
     * @param configAccessor Configuration accessor.
     * @param locale Current locale.
     */
    public static loadSnippets(configAccessor: ConfigAccessor, locale: string): { [key: string]: string } | undefined {
        const snippetMapFilePath = configAccessor.getSnippetMapFilePath(locale);

        if (!fs.existsSync(snippetMapFilePath)) {
            return undefined;
        } else {
            const data = readUtf8FileExcludingBomSync(snippetMapFilePath);
            return JSON.parse(data) as { [key: string]: string };
        }
    }
}