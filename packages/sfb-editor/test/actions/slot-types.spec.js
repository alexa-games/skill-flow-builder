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
import * as slotTypes from '../../app/actions/slot-types';

const middlewares = [thunk];
const mockStore = configureStore(middlewares);

jest.mock('path', () => ({
  resolve: (folderPath, fileName) => `${folderPath}/${fileName}`,
  parse: filePath => ({
    filename: filePath,
    ext: '.png'
  }),
  basename: file => file
}));
jest.mock('../../app/utils-main', () => ({
  getResourcesPath: () => '',
  readJson: () =>
    new Promise(resolve => {
      resolve('');
    }),
  writeJson: () =>
    new Promise(resolve => {
      resolve('');
    }),
  writeFile: () =>
    new Promise(resolve => {
      resolve();
    }),
  readFile: () =>
    new Promise(resolve => {
      resolve('This is file contents');
    }),
  makeDir: () =>
    new Promise(resolve => {
      resolve();
    })
}));

describe('Slot Types Actions', () => {
  it('appends slot types', async () => {
    const store = mockStore({
      project: {
        location: '~/test/'
      }
    });
    const expectedActions = [
      {
        type: 'SLOT_TYPES_APPEND',
        payload: 'slot types payload'
      }
    ];

    await store.dispatch(slotTypes.appendSlotTypes('slot types payload'));
    const actions = store.getActions();
    expect(actions).toEqual(expectedActions);
  });

  it('updates slot types', async () => {
    const store = mockStore({
      project: {
        location: '~/test/'
      },
      workspace: {
        currentLocale: 'en-US'
      },
      slotTypes: {
        types: []
      }
    });
    const expectedActions = [
      {
        type: 'SLOT_TYPES_UPDATE',
        payload: 'slot types payload'
      },
      {
        type: 'LOGGER_NOTIFY',
        payload: {
          type: 'message',
          message: 'Project slot types saved.'
        }
      }
    ];

    await store.dispatch(slotTypes.updateSlotTypes('slot types payload'));
    const actions = store.getActions();
    expect(actions).toEqual(expectedActions);
  });

  it('remove slot types', async () => {
    const store = mockStore({
      project: {
        location: '~/test/'
      },
      workspace: {
        currentLocale: 'en-US'
      },
      slotTypes: {
        types: []
      }
    });
    const expectedActions = [
      {
        type: 'SLOT_TYPES_REMOVE',
        payload: 'slot types payload'
      },
      {
        type: 'LOGGER_NOTIFY',
        payload: {
          type: 'message',
          message: 'Project slot types saved.'
        }
      }
    ];

    await store.dispatch(slotTypes.removeSlotTypes('slot types payload'));
    const actions = store.getActions();
    expect(actions).toEqual(expectedActions);
  });

  it('replaces slot types', async () => {
    const store = mockStore({
      project: {
        location: '~/test/'
      }
    });
    const expectedActions = [
      {
        type: 'SLOT_TYPES_REPLACE',
        payload: 'slot types payload'
      }
    ];

    await store.dispatch(slotTypes.replaceSlotTypes('slot types payload'));
    const actions = store.getActions();
    expect(actions).toEqual(expectedActions);
  });

  it('fetch slot types', async () => {
    const store = mockStore({
      project: {
        location: '~/test/'
      },
      workspace: {
        currentLocale: 'en-US'
      }
    });
    const expectedActions = [
      {
        type: 'SLOT_TYPES_REPLACE',
        payload: []
      }
    ];

    await store.dispatch(slotTypes.fetchSlotTypes());
    const actions = store.getActions();
    expect(actions).toEqual(expectedActions);
  });

  it('save slot types', async () => {
    const store = mockStore({
      project: {
        location: '~/test/'
      },
      workspace: {
        currentLocale: 'en-US'
      },
      slotTypes: {
        types: []
      }
    });
    const expectedActions = [
      {
        type: 'LOGGER_NOTIFY',
        payload: {
          type: 'message',
          message: 'Project slot types saved.'
        }
      }
    ];

    await store.dispatch(slotTypes.saveSlotTypes());
    const actions = store.getActions();
    expect(actions).toEqual(expectedActions);
  });
});
