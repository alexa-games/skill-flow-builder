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

import simulator from '../../app/reducers/slot-types';

import {
  SLOT_TYPES_APPEND,
  SLOT_TYPES_UPDATE,
  SLOT_TYPES_REMOVE,
  SLOT_TYPES_REPLACE,
  SLOT_TYPES_RESET
} from '../../app/actions/slot-types';

describe('Slot Types Reducer', () => {
  const initialState = {
    types: []
  };

  it('should return the initial state', () => {
    expect(simulator(undefined, {})).toEqual(
      initialState
    );
  });

  it('appends slot types', () => {
    const firstExpectedState = {
      ...initialState,
      types: ['one']
    };

    const secondExpectedState = {
      ...initialState,
      types: ['one', 'two', 'three']
    };

    const firstState = simulator(undefined, {
      type: SLOT_TYPES_APPEND,
      payload: ['one']
    });

    expect(firstState).toEqual(firstExpectedState);
  
    const secondState = simulator(firstState, {
      type: SLOT_TYPES_APPEND,
      payload: ['two', 'three']
    });

    expect(secondState).toEqual(secondExpectedState);
  });

  it('updates slot types', () => {
    const dummyName = 'dummy payload name';
    
    const expectedState = {
      ...initialState,
      types: [{
        name: dummyName,
        type: 'dummy new type'
      }, {
        name: 'random payload name', 
        type: 'random dummy type'
      }]
    };

    const state = simulator({
      ...initialState,
      types: [
        {name: dummyName, type: 'dummy old type'},
        {name: 'random payload name', type: 'random dummy type'}
      ]
    }, {
      type: SLOT_TYPES_UPDATE,
      payload: {
        name: dummyName,
        type: 'dummy new type'
      },
    });

    expect(state).toEqual(expectedState);
  });

  it('removes slot types', () => {
    const dummyFilterName = 'dummy payload name to remove';
    const dummyName = 'dummy payload name to keep';

    const expectedState = {
      ...initialState,
      types: [{
        name: dummyName,
        type: 'dummy type three'
      }]
    };

    const state = simulator({
      ...initialState,
      types: [
        {name: dummyFilterName, type: 'dummy type one'},
        {name: dummyFilterName, type: 'dummy type two'},
        {name: dummyName, type: 'dummy type three'}
      ]
    }, {
      type: SLOT_TYPES_REMOVE,
      payload: {
        name: dummyFilterName
      },
    });

    expect(state).toEqual(expectedState);
  });

  it('replaces slot types', () => {
    const dummyName = 'dummy payload name';

    const expectedState = {
      ...initialState,
      types: [{
        name: dummyName,
        type: 'dummy type four'
      }]
    };

    const state = simulator({
      ...initialState,
      types: [
        {name: dummyName, type: 'dummy type one'},
        {name: dummyName, type: 'dummy type two'},
        {name: dummyName, type: 'dummy type three'}
      ]
    }, {
      type: SLOT_TYPES_REPLACE,
      payload: [{
        name: dummyName,
        type: 'dummy type four'
      }],
    });

    expect(state).toEqual(expectedState);
  });

  it('resets slot types', () => {
    const dummyName = 'dummy payload name';
    
    const expectedState = {
      ...initialState,
      types: []
    };

    const state = simulator({
      ...initialState,
      types: [
        {name: dummyName, type: 'dummy type one'},
        {name: dummyName, type: 'dummy type two'},
        {name: dummyName, type: 'dummy type three'}
      ]
    }, {
      type: SLOT_TYPES_RESET
    });

    expect(state).toEqual(expectedState);
  });
});
