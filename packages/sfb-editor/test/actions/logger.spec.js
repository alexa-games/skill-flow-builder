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
import * as logger from '../../app/actions/logger';

const middlewares = [thunk];
const mockStore = configureStore(middlewares);

describe('Logger Actions', () => {
  it('notification', async () => {
    const store = mockStore({
      project: {
        location: '~/test/'
      }
    });
    const expectedActions = [
      {
        type: 'LOGGER_NOTIFY',
        payload: 'logger notification'
      }
    ];

    await store.dispatch(logger.loggerNotification('logger notification'));
    const actions = store.getActions();
    expect(actions).toEqual(expectedActions);
  });

  it('close', async () => {
    const store = mockStore({
      project: {
        location: '~/test/'
      }
    });
    const expectedActions = [
      {
        type: 'LOGGER_CLOSE'
      }
    ];

    await store.dispatch(logger.loggerClose());
    const actions = store.getActions();
    expect(actions).toEqual(expectedActions);
  });

  it('open errors', async () => {
    const store = mockStore({
      project: {
        location: '~/test/'
      }
    });
    const expectedActions = [
      {
        type: 'LOGGER_OPEN_ERRORS'
      }
    ];

    await store.dispatch(logger.loggerOpenErrors());
    const actions = store.getActions();
    expect(actions).toEqual(expectedActions);
  });

  it('open messages', async () => {
    const store = mockStore({
      project: {
        location: '~/test/'
      }
    });
    const expectedActions = [
      {
        type: 'LOGGER_OPEN_MESSAGES'
      }
    ];

    await store.dispatch(logger.loggerOpenMessages());
    const actions = store.getActions();
    expect(actions).toEqual(expectedActions);
  });

  it('dismiss toast', async () => {
    const store = mockStore({
      project: {
        location: '~/test/'
      }
    });
    const expectedActions = [
      {
        type: 'LOGGER_DISMISS_TOAST',
        payload: 'logger dismiss toast'
      }
    ];

    await store.dispatch(logger.loggerDismissToast('logger dismiss toast'));
    const actions = store.getActions();
    expect(actions).toEqual(expectedActions);
  });

  it('clear error and messages', async () => {
    const store = mockStore({
      project: {
        location: '~/test/'
      }
    });
    const expectedActions = [
      {
        type: 'LOGGER_CLEAR_ERRORS_AND_MESSAGES'
      }
    ];

    await store.dispatch(logger.loggerClearErrorsAndMessages());
    const actions = store.getActions();
    expect(actions).toEqual(expectedActions);
  });
});
