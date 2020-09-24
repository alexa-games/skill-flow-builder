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
import * as snippets from '../../app/actions/snippets';

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
    })
}));

describe('Snippet Actions', () => {
  it('appends snippets', async () => {
    const store = mockStore({
      project: {
        location: '~/test/'
      }
    });
    const expectedActions = [
      {
        type: 'SNIPPETS_APPEND',
        payload: 'snippets payload'
      }
    ];

    await store.dispatch(snippets.appendSnippets('snippets payload'));
    const actions = store.getActions();
    expect(actions).toEqual(expectedActions);
  });

  it('updates snippets', async () => {
    const store = mockStore({
      project: {
        location: '~/test/'
      }
    });
    const expectedActions = [
      {
        type: 'SNIPPETS_UPDATE',
        payload: 'snippets payload'
      }
    ];

    await store.dispatch(snippets.updateSnippets('snippets payload'));
    const actions = store.getActions();
    expect(actions).toEqual(expectedActions);
  });

  it('remove snippets', async () => {
    const store = mockStore({
      project: {
        location: '~/test/'
      }
    });
    const expectedActions = [
      {
        type: 'SNIPPETS_REMOVE',
        payload: 'snippets payload'
      }
    ];

    await store.dispatch(snippets.removeSnippets('snippets payload'));
    const actions = store.getActions();
    expect(actions).toEqual(expectedActions);
  });

  it('replace snippets', async () => {
    const store = mockStore({
      project: {
        location: '~/test/'
      }
    });
    const expectedActions = [
      {
        type: 'SNIPPETS_REPLACE',
        payload: 'snippets payload'
      }
    ];

    await store.dispatch(snippets.replaceSnippets('snippets payload'));
    const actions = store.getActions();
    expect(actions).toEqual(expectedActions);
  });

  it('fetch snippets', async () => {
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
        type: 'SNIPPETS_SET_ERROR',
        payload: null
      },
      {
        type: 'SNIPPETS_REPLACE',
        payload: []
      }
    ];

    await store.dispatch(snippets.fetchSnippets());
    const actions = store.getActions();
    expect(actions).toEqual(expectedActions);
  });

  it('create snippets', async () => {
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
        type: 'SNIPPETS_APPEND',
        payload: { short: 'foo', long: 'bar' }
      }
    ];

    await store.dispatch(snippets.createSnippet({ short: 'foo', long: 'bar' }));
    const actions = store.getActions();
    expect(actions).toEqual(expectedActions);
  });

  it('deletes snippets', async () => {
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
        type: 'SNIPPETS_REMOVE',
        payload: { short: 'foo' }
      }
    ];

    await store.dispatch(snippets.deleteSnippet({ short: 'foo' }));
    const actions = store.getActions();
    expect(actions).toEqual(expectedActions);
  });
});
