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

import path from 'path';
import { remote } from 'electron';

export const TMP_FOLDER_PATH = path.resolve(remote.app.getPath('temp'), 'SFB');
export const TMP_PROJECT_FILE_PATH = path.resolve(
  TMP_FOLDER_PATH,
  'backup.abc'
);
export const TMP_SLOTS_FILE_PATH = path.resolve(
  TMP_FOLDER_PATH,
  'SlotTypes.json'
);
export const TMP_NOTES_FILE_PATH = path.resolve(TMP_FOLDER_PATH, 'NOTES.md');
export const TMP_LANGUAGE_STRINGS_FILE_PATH = path.resolve(
  TMP_FOLDER_PATH,
  'languageStrings.json'
);

export const DEFAULT_LOCALE = 'en-US';

export const LOCALE_LIST = [
  'en-US',
  'en-AU',
  'en-CA',
  'en-GB',
  'en-IN',
  'de-DE',
  'es-ES',
  'es-MX',
  'es-US',
  'fr-CA',
  'fr-FR',
  'it-IT',
  'ja-JP',
  'pt-BR'
];

export const EDITOR_FFMPEG_LOCATION_PROPERTY = 'ffmpeg-location-for-editor';
