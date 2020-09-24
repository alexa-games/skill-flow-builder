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

import simulator from '../../app/reducers/languageStrings';

import { LANGUAGE_STRINGS_UPDATE } from '../../app/actions/languageStrings';


describe('Language Strings Reducer', () => {
  const initialState = {
    langObj: {}
  };

  it('should return the initial state', () => {
    expect(simulator(undefined, {})).toEqual(
      initialState
    );
  });

  it('updates language strings with an object', () => {
    const dummyLanguageObject = {
      'dummy locale': 'dummy value'
    };
    const expectedState = {
      ...initialState,
      langObj: dummyLanguageObject
    };

    const state = simulator(undefined, {
      type: LANGUAGE_STRINGS_UPDATE,
      payload: dummyLanguageObject
    });

    expect(state).toEqual(expectedState);
  }); 

  it('updates language strings with a string', () => {
    const dummyLanguageString = `{
      "dummy locale string": "dummy value string"
    }`;

    const expectedState = {
      ...initialState,
      langObj: JSON.parse(dummyLanguageString)
    };

    const state = simulator(undefined, {
      type: LANGUAGE_STRINGS_UPDATE,
      payload: dummyLanguageString
    });

    expect(state).toEqual(expectedState);
  });
});
