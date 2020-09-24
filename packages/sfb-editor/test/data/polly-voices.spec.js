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

import { getDefaultPollyVoiceForLocale } from '../../app/data/polly-voices';

describe('Polly Voices', () => {
  it('Get default voice for locale', () => {
    const defaultPollyVoice = getDefaultPollyVoiceForLocale('en-US');

    expect(defaultPollyVoice).toEqual('Joanna');
  });

  it('Get default voice for locale lowercase', () => {
    const defaultPollyVoice = getDefaultPollyVoiceForLocale('en-us');

    expect(defaultPollyVoice).toEqual('Joanna');
  });

  it('Get default voice for invalid locale', () => {
    const defaultPollyVoice = getDefaultPollyVoiceForLocale('invalid');

    expect(defaultPollyVoice).toBe(undefined);
  });

  it('Get default voice for undefined', () => {
    const defaultPollyVoice = getDefaultPollyVoiceForLocale();

    expect(defaultPollyVoice).toBe(undefined);
  });
});
