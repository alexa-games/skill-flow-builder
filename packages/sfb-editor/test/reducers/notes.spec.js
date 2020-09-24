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

import simulator from '../../app/reducers/notes';

import { NOTES_UPDATE } from '../../app/actions/notes';

describe('Notes Reducer', () => {
  const initialState = {
    source: ''
  };

  it('should return the initial state', () => {
    expect(simulator(undefined, {})).toEqual(
      initialState
    );
  });

  it('updates notes', () => {
    const payload = 'dummy notes payload';

    const expectedState = {
      ...initialState,
      source: payload
    };

    const state = simulator(undefined, {
      type: NOTES_UPDATE,
      payload
    });

    expect(state).toEqual(expectedState);
  });
});
