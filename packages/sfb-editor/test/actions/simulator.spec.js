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

import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import * as simulator from '../../app/actions/simulator';

const middlewares = [thunk];
const mockStore = configureStore(middlewares);
// Mocking the methods used for fle system
jest.mock('../../app/utils-renderer', () => ({
  sendSimulatorCommand: () => 'command'
}));

describe('Simulator Actions', () => {
  it('updates simulator response', async () => {
    const store = mockStore({
      project: {
        location: '~/test/'
      }
    });
    const expectedActions = [
      {
        type: 'SIMULATOR_UPDATE_RESPONSE',
        payload: 'simulator payload'
      }
    ];

    await store.dispatch(
      simulator.updateSimulatorResponse('simulator payload')
    );
    const actions = store.getActions();
    expect(actions).toEqual(expectedActions);
  });

  it('starts simulator', async () => {
    const store = mockStore({
      project: {
        location: '~/test/'
      }
    });
    const expectedActions = [
      {
        payload: "start",
        type: "SET_SELECTED_SCENE_ID"
      },
      {
        type: 'SIMULATOR_START'
      }
    ];

    await store.dispatch(simulator.startSimulator());
    const actions = store.getActions();
    expect(actions).toEqual(expectedActions);
  });

  it('resumes simulator', async () => {
    const store = mockStore({
      project: {
        location: '~/test/'
      }
    });
    const expectedActions = [
      {
        type: 'SIMULATOR_RESUME'
      }
    ];

    await store.dispatch(simulator.resumeSimulator());
    const actions = store.getActions();
    expect(actions).toEqual(expectedActions);
  });

  it('resumes simulator from start', async () => {
    const store = mockStore({
      project: {
        location: '~/test/'
      }
    });
    const expectedActions = [
      {
        type: 'SIMULATOR_RESUME'
      }
    ];

    await store.dispatch(simulator.resumeSimulatorFromStart());
    const actions = store.getActions();
    expect(actions).toEqual(expectedActions);
  });

  it('send simulator command', async () => {
    const store = mockStore({
      project: {
        location: '~/test/'
      }
    });
    const expectedActions = [
      {
        type: 'SIMULATOR_SEND',
        payload: 'simulator payload'
      }
    ];

    await store.dispatch(simulator.sendSimulatorCommand('simulator payload'));
    const actions = store.getActions();
    expect(actions).toEqual(expectedActions);
  });

  it('exit simulator', async () => {
    const store = mockStore({
      project: {
        location: '~/test/'
      }
    });
    const expectedActions = [
      {
        type: 'SIMULATOR_EXIT'
      }
    ];

    await store.dispatch(simulator.exitSimulator());
    const actions = store.getActions();
    expect(actions).toEqual(expectedActions);
  });

  it('enable polly preview', async () => {
    const store = mockStore({
      project: {
        location: '~/test/'
      }
    });
    const expectedActions = [
      {
        type: 'SET_IS_POLLY_PREVIEW',
        payload: true
      }
    ];

    await store.dispatch(simulator.setIsPollyPreview(true));
    const actions = store.getActions();
    expect(actions).toEqual(expectedActions);
  });

  it('disable polly preview', async () => {
    const store = mockStore({
      project: {
        location: '~/test/'
      }
    });
    const expectedActions = [
      {
        type: 'SET_IS_POLLY_PREVIEW',
        payload: false
      }
    ];

    await store.dispatch(simulator.setIsPollyPreview(false));
    const actions = store.getActions();
    expect(actions).toEqual(expectedActions);
  });
});
