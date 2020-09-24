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

import simulator from '../../app/reducers/images';

import {
  IMAGES_APPEND,
  IMAGES_UPDATE,
  IMAGES_REMOVE,
  IMAGES_REPLACE
} from '../../app/actions/images';

describe('Image Reducers', () => {
  const initialState = {
    files: []
  };
  it('should return the initial state', () => {
    expect(simulator(undefined, {})).toEqual(
      initialState
    );
  });

  it('image appends', () => {
    const firstExpectedState = {
      ...initialState,
      files: ['one']
    };
    
    const secondExpectedState = {
      ...initialState,
      files: ['one', 'two', 'three']
    };

    const firstState = simulator(undefined, {
      type: IMAGES_APPEND,
      payload: ['one']
    });

    expect(firstState).toEqual(firstExpectedState);

    const secondState = simulator(firstState, {
      type: IMAGES_APPEND,
      payload: ['two', 'three']
    });

    expect(secondState).toEqual(secondExpectedState);
  });

  it('image updates', () => {
    const dummyId = 'dummy payload id';

    const expectedState = {
      ...initialState,
      files: [{
        id: dummyId,
        fileName: 'dummy new name'
      }, {
        id: 'random payload id',
        fileName: 'random dummy name'
      }]
    };

    const state = simulator({
      ...initialState,
      files: [
        {id: dummyId, fileName: 'dummy old name'},
        {id: 'random payload id', fileName: 'random dummy name'}
      ]
    }, {
      type: IMAGES_UPDATE,
      payload: {
        id: dummyId,
        fileName: 'dummy new name'
      },
    });

    expect(state).toEqual(expectedState);
  });

  it('image removes', () => {
    const dummyFilterId = 'dummy payload id to remove';
    const dummyId = 'dummy payload id to keep';

    const expectedState = {
      ...initialState,
      files: [{
        id: dummyId,
        fileName: 'dummy name three'
      }]
    };

    const state = simulator({
      ...initialState,
      files: [
        {id: dummyFilterId, fileName: 'dummy name one'},
        {id: dummyFilterId, fileName: 'dummy name two'},
        {id: dummyId, fileName: 'dummy name three'}
      ]
    }, {
      type: IMAGES_REMOVE,
      payload: {
        id: dummyFilterId
      },
    });

    expect(state).toEqual(expectedState);
  });

  it('image replaces', () => {
    const dummyId = 'dummy payload id';

    const expectedState = {
      ...initialState,
      files: [{
        id: dummyId,
        fileName: 'dummy name four'
      }]
    };

    const state = simulator({
      ...initialState,
      files: [
        {id: dummyId, fileName: 'dummy name one'},
        {id: dummyId, fileName: 'dummy name two'},
        {id: dummyId, fileName: 'dummy name three'}
      ]
    }, {
      type: IMAGES_REPLACE,
      payload: [{
        id: dummyId,
        fileName: 'dummy name four'
      }],
    });

    expect(state).toEqual(expectedState);
  });

});
