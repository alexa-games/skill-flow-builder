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

import build from '../../app/reducers/build';

import {
  START_BUILD_ACTION,
  END_BUILD_ACTION,
  LOG_TO_BUILD_OUTPUT,
  CLEAR_BUILD_OUTPUT,
  OPEN_BUILD_OUTPUT,
  CLOSE_BUILD_OUTPUT
} from '../../app/actions/build';

describe('Build Reducers', () => {
  const initialState = {
    isPerformingBuildAction: false,
    buildOutput: '',
    isBuildOutputOpen: false
  };

  it('should return the initial state', () => {
    expect(build(undefined, {})).toEqual(
      initialState
    );
  });

  it('starts build action', () => {
    const expectedState = {
      ...initialState,
      isPerformingBuildAction: true
    };

    const state = build(undefined, {
      type: START_BUILD_ACTION
    });

    expect(state).toEqual(expectedState);
  });

  it('ends build action', () => {
    const expectedState = {
      ...initialState,
      isPerformingBuildAction: false
    };

    const state = build(undefined, {
      type: END_BUILD_ACTION
    });

    expect(state).toEqual(expectedState);
  });

  it('log to build output', () => {
    const expectedState = {
      ...initialState,
      buildOutput: 'one two three four'
    };

    const state = build({
      ...initialState,
      buildOutput: 'one two '
    }, {
      type: LOG_TO_BUILD_OUTPUT,
      message: 'three four'
    });

    expect(state).toEqual(expectedState);
  });

  it('clears build output', () => {
    const expectedState = {
      ...initialState,
      buildOutput: ''
    };

    const state = build({
      ...initialState,
      buildOutput: 'one two three four'
    }, {
      type: CLEAR_BUILD_OUTPUT
    });

    expect(state).toEqual(expectedState);
  });

  it('opens build output', () => {
    const expectedState = {
      ...initialState,
      isBuildOutputOpen: true
    };

    const state = build(undefined, {
      type: OPEN_BUILD_OUTPUT
    });

    expect(state).toEqual(expectedState);
  });

  it('closes build output', () => {
    const expectedState = {
      ...initialState,
      isBuildOutputOpen: false
    };

    const state = build(undefined, {
      type: CLOSE_BUILD_OUTPUT
    });

    expect(state).toEqual(expectedState);
  });
});
