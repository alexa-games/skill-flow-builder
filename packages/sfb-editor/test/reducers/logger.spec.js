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

import logger from '../../app/reducers/logger';

import {
  LOGGER_NOTIFY,
  LOGGER_CLOSE,
  LOGGER_OPEN_ERRORS,
  LOGGER_OPEN_MESSAGES,
  LOGGER_DISMISS_TOAST,
  LOGGER_CLEAR_ERRORS_AND_MESSAGES
} from '../../app/actions/logger';

 /* Stub the Date.now function to always return the same date */
const dateStub = 1580515200000; // UTC(2020, 1, 1)
Date.now = jest.fn(() => dateStub)

describe('Logger Reducer', () => {
  const initialState = {
    log: [],
    toasts: [],
    showItems: [],
    totalErrors: 0,
    totalMessages: 0,
    unreadErrors: 0,
    unreadMessages: 0
  };

  it('should return the initial state', () => {
    expect(logger(undefined, {})).toEqual(
      initialState
    );
  });

  it('closes logger', () => {
    const expectedState = {
      ...initialState,
      showItems: []
    };

    const state = logger({
      ...initialState,
      showItems: ['one', 'two', 'three']
    }, {
      type: LOGGER_CLOSE
    });

    expect(state).toEqual(expectedState);
  });

  it('opens errors', () => {
    const dummyItems = [
      {
        type: 'error',
        message: 'dummy error message'
      },
      {
        type: 'message',
        message: 'dummy message'
      }
    ];
    const expectedState = {
      ...initialState,
      log: dummyItems,
      showItems: [{
        type: 'error',
        message: 'dummy error message'
      }],
      unreadErrors: 0
    };

    const state = logger({
      ...initialState,
      log: dummyItems
    }, {
      type: LOGGER_OPEN_ERRORS
    });

    expect(state).toEqual(expectedState);
  });

  it('opens messages', () => {
    const dummyItems = [
      {
        type: 'error',
        message: 'dummy error message'
      },
      {
        type: 'message',
        message: 'dummy message'
      }
    ];
    const expectedState = {
      ...initialState,
      log: dummyItems,
      showItems: [{
        type: 'message',
        message: 'dummy message'
      }],
      unreadMessages: 0
    };

    const state = logger({
      ...initialState,
      log: dummyItems
    }, {
      type: LOGGER_OPEN_MESSAGES
    });

    expect(state).toEqual(expectedState);
  });

  it('dismisses toast', () => {
    const dummyToastId = 'dummy toast id to dismiss';
    const dummyToasts = [{
      id: dummyToastId,
      message: 'dummy message one'
    }, {
      id: 'random toast id',
      message: 'dummy message two'
    }];

    const expectedState = {
      ...initialState,
      toasts: [{
        id: 'random toast id',
        message: 'dummy message two'
      }]
    };

    const state = logger({
      ...initialState,
      toasts: dummyToasts
    }, {
      type: LOGGER_DISMISS_TOAST,
      payload: {
        id: dummyToastId
      }
    });

    expect(state).toEqual(expectedState);
  });

  it('notifies on error', () => {
    const expectedState = {
      ...initialState,
      log: [{
        type: 'error',
        message: 'dummy error message',
        timestamp: dateStub
      }],
      toasts: [],
      totalErrors: 1,
      unreadErrors: 1
    };

    const state = logger(undefined, {
      type: LOGGER_NOTIFY,
      payload: {
        type: 'error',
        message: 'dummy error message'
      }
    });

    expect(state).toEqual(expectedState);
  });

  it('notifies on message', () => {
    const expectedState = {
      ...initialState,
      log: [{
        type: 'message',
        message: 'dummy message',
        timestamp: dateStub
      }],
      toasts: [],
      totalMessages: 1,
      unreadMessages: 1
    };

    const state = logger(undefined, {
      type: LOGGER_NOTIFY,
      payload: {
        type: 'message',
        message: 'dummy message'
      }
    });

    expect(state).toEqual(expectedState);
  });
 
  it('clear errors and messages', () => {
    const dummyItems = [
      {
        type: 'error',
        message: 'dummy error message'
      },
      {
        type: 'message',
        message: 'dummy message'
      }
    ];
    const expectedState = {
      ...initialState,
      previousLog: dummyItems
    };

    const state = logger({
      ...initialState,
      log: dummyItems
    }, {
      type: LOGGER_CLEAR_ERRORS_AND_MESSAGES
    });

    expect(state).toEqual(expectedState);
  });
});
