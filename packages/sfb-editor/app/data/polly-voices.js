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

export const pollyVoices = [
  { name: 'Ivy', locale: 'English, US (en-US)' },
  { name: 'Joanna', locale: 'English, US (en-US)'},
  { name: 'Kendra', locale: 'English, US (en-US)' },
  { name: 'Kimberly', locale: 'English, US (en-US)' },
  { name: 'Salli', locale: 'English, US (en-US)' },
  { name: 'Joey', locale: 'English, US (en-US)' },
  { name: 'Justin', locale: 'English, US (en-US)' },
  { name: 'Matthew', locale: 'English, US (en-US)' },
  { name: 'Geraint', locale: 'English, Welsh (en-GB-WLS)' },
  { name: 'Nicole', locale: 'English, Australian (en-AU)' },
  { name: 'Russell', locale: 'English, Australian (en-AU)' },
  { name: 'Amy', locale: 'English, British (en-GB)' },
  { name: 'Emma', locale: 'English, British (en-GB)' },
  { name: 'Brian', locale: 'English, British (en-GB)' },
  { name: 'Aditi', locale: 'English, Indian (en-IN)' },
  { name: 'Raveena', locale: 'English, Indian (en-IN)' },
  { name: 'Zeina', locale: 'Arabic (arb)' },
  { name: 'Zhiyu', locale: 'Chinese, Mandarin (cmn-CN)' },
  { name: 'Naja', locale: 'Danish (da-DK)' },
  { name: 'Mads', locale: 'Danish (da-DK)' },
  { name: 'Lotte', locale: 'Dutch (nl-NL)' },
  { name: 'Ruben', locale: 'Dutch (nl-NL)' },
  { name: 'Celine', locale: 'French (fr-FR)' },
  { name: 'Lea', locale: 'French (fr-FR)' },
  { name: 'Mathieu', locale: 'French (fr-FR)' },
  { name: 'Chantal', locale: 'French, Canadian (fr-CA)' },
  { name: 'Marlene', locale: 'German (de-DE)' },
  { name: 'Vicki', locale: 'German (de-DE)' },
  { name: 'Hans', locale: 'German (de-DE)' },
  { name: 'Dora', locale: 'Icelandic (is-IS)' },
  { name: 'Karl', locale: 'Icelandic (is-IS)' },
  { name: 'Carla', locale: 'Italian (it-IT)' },
  { name: 'Bianca', locale: 'Italian (it-IT)' },
  { name: 'Giorgio', locale: 'Italian (it-IT)' },
  { name: 'Mizuki', locale: 'Japanese (ja-JP)' },
  { name: 'Takumi', locale: 'Japanese (ja-JP)' },
  { name: 'Seoyeon', locale: 'Korean (ko-KR)' },
  { name: 'Liv', locale: 'Norwegian (nb-NO)' },
  { name: 'Ewa', locale: 'Polish (pl-PL)' },
  { name: 'Maja', locale: 'Polish (pl-PL)' },
  { name: 'Jacek', locale: 'Polish (pl-PL)' },
  { name: 'Jan', locale: 'Polish (pl-PL)' },
  { name: 'Vitoria', locale: 'Portuguese, Brazilian (pt-BR)' },
  { name: 'Ricardo', locale: 'Portuguese, Brazilian (pt-BR)' },
  { name: 'Ines', locale: 'Portuguese, European (pt-PT)' },
  { name: 'Cristiano', locale: 'Portuguese, European (pt-PT)' },
  { name: 'Carmen', locale: 'Romanian (ro-RO)' },
  { name: 'Tatyana', locale: 'Russian (ru-RU)' },
  { name: 'Maxim', locale: 'Russian (ru-RU)' },
  { name: 'Conchita', locale: 'Spanish, European (es-ES)' },
  { name: 'Lucia', locale: 'Spanish, European (es-ES)' },
  { name: 'Enrique', locale: 'Spanish, European (es-ES)' },
  { name: 'Mia', locale: 'Spanish, Mexican (es-MX)' },
  { name: 'Penelope', locale: 'Spanish, US (es-US)' },
  { name: 'Miguel', locale: 'Spanish, US (es-US)' },
  { name: 'Astrid', locale: 'Swedish (sv-SE)' },
  { name: 'Filiz', locale: 'Turkish (tr-TR)' },
  { name: 'Gwyneth', locale: 'Welsh (cy-GB)' }
];

export const pollyVoicesDefaultLocale = {
  'en-us': { name: 'Joanna' },
  'en-gb': { name: 'Amy' },
  'en-au': { name: 'Nicole' },
  'en-in': { name: 'Raveena' },
  'arb': { name: 'Zeina' },
  'cmn-cn': { name: 'Zhiyu' },
  'da-dk': { name: 'Naja' },
  'nl-nl': { name: 'Lotte' },
  'fr-fr': { name: 'Celine' },
  'fr-ca': { name: 'Chantal' },
  'de-de': { name: 'Marlene' },
  'is-is': { name: 'Dora' },
  'it-it': { name: 'Bianca' },
  'ja-jp': { name: 'Mizuki' },
  'ko-kr': { name: 'Seoyeon' },
  'nb-no': { name: 'Liv' },
  'pl-pl': { name: 'Jan' },
  'pt-br': { name: 'Vitoria' },
  'pt-pt': { name: 'Ines' },
  'ro-ro': { name: 'Carmen' },
  'ru-ru': { name: 'Tatyana' },
  'es-es': { name: 'Conchita' },
  'es-mx': { name: 'Mia' },
  'es-us': { name: 'Penelope' },
  'sv-se': { name: 'Astrid' },
  'tr-tr': { name: 'Filiz' },
  'cy-gb': { name: 'Gwyneth' }
};

// If locale not given or does not have entry, return undefined
export function getDefaultPollyVoiceForLocale(locale) {
  if(locale) {
    const defaultVoiceEntry = pollyVoicesDefaultLocale[locale.toLowerCase()];

    return defaultVoiceEntry ? defaultVoiceEntry.name : undefined;
  }
  return undefined;
}

