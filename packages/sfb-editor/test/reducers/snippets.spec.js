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

import simulator from '../../app/reducers/snippets';

import {
  SNIPPETS_APPEND,
  SNIPPETS_UPDATE,
  SNIPPETS_REMOVE,
  SNIPPETS_REPLACE,
  SNIPPETS_SET_ERROR
} from '../../app/actions/snippets';

describe('Snippets Reducer', () => {
  const initialState = {
    snippets: [],
    hasError: false,
    errorMessage: ''
  };

  it('should return the initial state', () => {
    expect(simulator(undefined, {})).toEqual(
      initialState
    );
  });

  it('appends snippets', () => {
    const firstExpectedState = {
      ...initialState,
      snippets: ['one']
    };

    const secondExpectedState = {
      ...initialState,
      snippets: ['one', 'two', 'three']
    };

    const firstState = simulator(undefined, {
      type: SNIPPETS_APPEND,
      payload: ['one']
    });

    expect(firstState).toEqual(firstExpectedState);

    const secondState = simulator(firstState, {
      type: SNIPPETS_APPEND,
      payload: ['two', 'three']
    });

    expect(secondState).toEqual(secondExpectedState);
  });

  it('updates snippets', () => {
    const dummyShort = 'dummy short';

    const expectedState = {
      ...initialState,
      snippets: [{
        short: dummyShort,
        message: 'dummy new message'
      }, {
        short: 'random short',
        message: 'random dummy message'
      }]
    };

    const state = simulator({
      ...initialState,
      snippets: [
        { short: dummyShort, message: 'random old dummy message' },
        { short: 'random short', message: 'random dummy message' }
      ]
    }, {
      type: SNIPPETS_UPDATE,
      payload: {
        short: dummyShort,
        message: 'dummy new message'
      },
    });

    expect(state).toEqual(expectedState);
  });

  it('removes snippets', () => {
    const dummyFilterShort = 'dummy short to remove';
    const dummyShort = 'dummy short to keep';

    const expectedState = {
      ...initialState,
      snippets: [{
        short: dummyShort,
        message: 'dummy message three'
      }]
    };

    const state = simulator({
      ...initialState,
      snippets: [
        { short: dummyFilterShort, message: 'dummy message one' },
        { short: dummyFilterShort, message: 'dummy message two' },
        { short: dummyShort, message: 'dummy message three' }
      ]
    }, {
      type: SNIPPETS_REMOVE,
      payload: {
        short: dummyFilterShort
      },
    });

    expect(state).toEqual(expectedState);
  });

  it('replaces snippets', () => {
    const dummyShort = 'dummy short';

    const expectedState = {
      ...initialState,
      snippets: [{
        short: dummyShort,
        message: 'dummy message four'
      }]
    };

    const state = simulator({
      ...initialState,
      snippets: [
        { short: dummyShort, message: 'dummy message one' },
        { short: dummyShort, message: 'dummy message two' },
        { short: dummyShort, message: 'dummy message three' }
      ]
    }, {
      type: SNIPPETS_REPLACE,
      payload: [{
        short: dummyShort,
        message: 'dummy message four'
      }],
    });

    expect(state).toEqual(expectedState);
  });

  it('sets error with a string', () => {
    const dummyError = 'dummy error message';

    const expectedState = {
      ...initialState,
      hasError: true,
      errorMessage: dummyError
    };

    const state = simulator(undefined, {
      type: SNIPPETS_SET_ERROR,
      payload: dummyError
    });

    expect(state).toEqual(expectedState);
  });

  it('sets error with non string', () => {
    const expectedState = {
      ...initialState,
      hasError: false,
      errorMessage: ''
    };

    const state = simulator(undefined, {
      type: SNIPPETS_SET_ERROR,
      payload: undefined
    });

    expect(state).toEqual(expectedState);
  });
});
