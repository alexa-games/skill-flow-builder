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

import simulator from '../../app/reducers/simulator';

import {
  SIMULATOR_UPDATE_RESPONSE,
  SIMULATOR_START,
  SET_IS_POLLY_PREVIEW,
  SET_POLLY_PREVIEW_ACCESS_TOKEN_INFO,
  SIMULATOR_RESUME,
  SIMULATOR_SEND,
  SIMULATOR_EXIT
} from '../../app/actions/simulator';

import { MockStorage } from '../mocks/mockStorage';

describe('Simulator Reducers', () => {
  let storage;

  beforeEach(() => {
    storage = new MockStorage();
    storage.setupSpies();
  });

  const initialState = {
    response: null,
    isRunning: false,
    showSpinner: false,
    isPollyPreview: true,
    pollyPreviewAccessTokenInfo: { accessToken: "", timestamp: 0 }
  };

  it('should return the initial state', () => {
    expect(simulator(undefined, {})).toEqual(
      initialState
    );
  });

  it('set polly preview', async () => {
    const payload = 'dummy payload';

    const expectedState = {
      ...initialState,
      isPollyPreview: payload
    };

    const state = simulator(undefined, {
      type: SET_IS_POLLY_PREVIEW,
      payload
    });

    expect(Storage.prototype.setItem).toHaveBeenCalledWith('simulator.isPollyPreview', payload);
    expect(storage.getItem('simulator.isPollyPreview')).toEqual(payload);
    expect(state).toEqual(expectedState);
  });

  it('set polly preview access token', async () => {
    const payload = { accessToken: "dummy token", timestamp: 0 };

    const expectedState = {
      ...initialState,
      pollyPreviewAccessTokenInfo: payload
    };

    const state = simulator(undefined, {
      type: SET_POLLY_PREVIEW_ACCESS_TOKEN_INFO,
      payload
    });

    expect(Storage.prototype.setItem).toHaveBeenCalledWith('simulator.pollyPreviewAccessTokenInfo', JSON.stringify(payload));
    expect(storage.getItem('simulator.pollyPreviewAccessTokenInfo')).toEqual(JSON.stringify(payload));
    expect(state).toEqual(expectedState);
  });


  it('updates simulator response', async () => {
    const payload = 'dummy payload';

    const expectedState = {
      ...initialState,
      showSpinner: false,
      response: payload
    };

    const state = simulator(undefined, {
      type: SIMULATOR_UPDATE_RESPONSE,
      payload
    });

    expect(state).toEqual(expectedState);
  });

  it('starts simulator', async () => {
    const expectedState = {
      ...initialState,
      isRunning: true,
      showSpinner: true,
      response: null
    };

    const state = simulator(undefined, {
      type: SIMULATOR_START
    });

    expect(state).toEqual(expectedState);
  });

  it('resumes simulator', async () => {
    const expectedState = {
      ...initialState,
      isRunning: true,
      showSpinner: true,
      response: null
    };

    const state = simulator(undefined, {
      type: SIMULATOR_RESUME
    });

    expect(state).toEqual(expectedState);
  });

  it('send simulator command', async () => {
    const expectedState = {
      ...initialState,
      showSpinner: true
    };

    const state = simulator(undefined, {
      type: SIMULATOR_SEND
    });

    expect(state).toEqual(expectedState);
  });

  it('exit simulator', async () => {
    const expectedState = {
      ...initialState,
      isRunning: false,
      showSpinner: false
    };

    const state = simulator(undefined, {
      type: SIMULATOR_EXIT
    });

    expect(state).toEqual(expectedState);
  });
});
