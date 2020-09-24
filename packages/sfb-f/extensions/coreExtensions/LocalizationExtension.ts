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

import { Scene, InstructionType } from '../../story/storyMetadata';
import { ImporterExtension } from '../SFBExtension';
import { SourceContentHelper } from '../../importPlugins/sourceContentHelper';
import { StoryMetadataHelper } from '../../importPlugins/storyMetadataHelper';
import { LanguageStrings } from './LanguageStrings';

import { createHash } from 'crypto';

/**
 * Creates a string ID for each chunk of localizable strings, and replaces them.
 */
export class LocalizationExtension implements ImporterExtension {
    public constructor(private locale: string, private languageString: LanguageStrings, private overwrite: boolean = false, private srcLocale: string = "en-US") {
    }

    async extendSourceContent(sourceHelper: SourceContentHelper): Promise<void> {
    }

    async extendImportedContent(metadataHelper: StoryMetadataHelper): Promise<void> {
        const originScenes: Scene[] = metadataHelper.getAllScenes();

        let srcLocaleStrings: {[key: string]: any} = {};
        let resultingStrings: {[key: string]: any} = {};

        for (let scene of originScenes) {
            for (let content of scene.contents) {
                // check narration strings
                if (content.narration && content.narration.trim().length > 0) {
                    const narration: string = content.narration.trim();
                    const stringId: string = `${scene.id}.narration`;

                    this.updateLanguageString(stringId, narration, srcLocaleStrings, resultingStrings);

                    // replace with localized string
                    content.narration = resultingStrings[stringId];
                }

                // check for utterance strings
                if (content.sceneDirections && content.sceneDirections.length > 0) {
                    for (let direction of content.sceneDirections) {
                        if (direction.directionType === InstructionType.CHOICE) {
                            const utterances = direction.parameters.utterances;
                            const replacingUtterances: string[] = [];

                            for (let utterance of utterances) {
                                const stringId: string = `utterance-${utterance}`;
                                
                                this.updateLanguageString(stringId, utterance, srcLocaleStrings, resultingStrings);
        
                                // replace with localized string
                                replacingUtterances.push(resultingStrings[stringId]);
                            }

                            direction.parameters.utterances = replacingUtterances;
                        } if (direction.directionType === InstructionType.REPROMPT || direction.directionType === InstructionType.RECAP) {
                            const message: string = direction.parameters.message.trim();
                            const stringId: string = `${scene.id}.${direction.directionType}`;

                            this.updateLanguageString(stringId, message, srcLocaleStrings, resultingStrings);

                            // replace with localized string
                            direction.parameters.message = resultingStrings[stringId];
                        }
                    }
                }                  
            }
        }

        if (!this.languageString[this.locale]) {
            this.languageString[this.locale] = {
                translation: {}
            }
        }

        this.languageString[this.locale].translation = resultingStrings;
        
        metadataHelper.setAllScenes(originScenes);
    }

    public getLocalizedStringsObject(): LanguageStrings {
        return this.languageString;
    }

    private updateLanguageString(stringId: string, stringValue: string,
        sourceLanguages: {[key: string]: any}, currentLanguages: {[key: string]: any}) {

        const stringHash: string = createHash('md5').update(stringValue.replace(/[\s]+/g, " ")).digest('hex');
        const existingSourceString: string | undefined = this.languageString[this.srcLocale] && this.languageString[this.srcLocale].translation?
            this.languageString[this.srcLocale].translation[stringId]
            :undefined;

        const languageStringHash: string | undefined = existingSourceString? createHash('md5').update(existingSourceString.replace(/[\s]+/g, " ")).digest('hex'): undefined;

        if (languageStringHash && languageStringHash !== stringHash) {
            // Source content changed since last languageString freeze.
            if (this.overwrite) {
                sourceLanguages[stringId] = stringValue;
            } else {
                sourceLanguages[stringId] = existingSourceString;
            }
        } else if (!languageStringHash) {
            // New string id for Source content added
            sourceLanguages[stringId] = stringValue;
        } else {
            sourceLanguages[stringId] = existingSourceString;
        }

        if (this.locale != this.srcLocale && this.languageString[this.locale] && this.languageString[this.locale].translation[stringId]) {
            // non-source locale strings should not be updated since we don't know if the translation has already occured on the file.
            currentLanguages[stringId] = this.languageString[this.locale].translation[stringId];
        }

        if (!currentLanguages[stringId]) {
            currentLanguages[stringId] = sourceLanguages[stringId];
        }
    }
}
