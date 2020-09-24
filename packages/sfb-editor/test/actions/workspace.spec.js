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
import * as workspace from '../../app/actions/workspace';

const middlewares = [thunk];
const mockStore = configureStore(middlewares);

jest.mock('../../app/utils-main', () => ({
  getResourcesPath: () => '',
  readJson: () =>
    new Promise(resolve => {
      resolve('');
    })
}));

describe('Workspace Actions', () => {
  it('set isStacked', async () => {
    const store = mockStore({
      project: {
        location: '~/test/'
      }
    });
    const expectedActions = [
      {
        type: 'SET_IS_STACKED',
        payload: 'isStacked payload'
      }
    ];

    await store.dispatch(workspace.setIsStacked('isStacked payload'));
    const actions = store.getActions();
    expect(actions).toEqual(expectedActions);
  });

  it('sets current locale', async () => {
    const store = mockStore({
      project: {
        location: '~/test/'
      },
      workspace: {
        currentLocale: 'en-US'
      },
      languageStrings: {
        langObj: {
          'en-US': {
            translation: {}
          }
        }
      }
    });
    const expectedActions = [
      {
        type: 'SET_CURRENT_LOCALE',
        payload: 'en-GB'
      }
    ];

    await store.dispatch(workspace.setCurrentLocale('en-GB'));
    const actions = store.getActions();
    expect(actions).toEqual(expectedActions);
  });

  it('set editor locale to ja-JP', async () => {
    const store = mockStore({
      project: {
        location: '~/test/'
      },
      workspace: {
        currentLocale: 'en-US',
        editorLocale: 'en-US'
      },
      languageStrings: {
        langObj: {
          'en-US': {
            translation: {}
          }
        }
      }
    });
    const expectedActions = [
      {
        type: 'SET_EDITOR_LOCALE',
        payload: 'ja-JP'
      }
    ];

    await store.dispatch(workspace.setEditorLocale('ja-JP'));
    const actions = store.getActions();
    expect(actions).toEqual(expectedActions);
  });
});
