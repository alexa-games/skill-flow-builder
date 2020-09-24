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
import * as project from '../../app/actions/project';

const middlewares = [thunk];
const mockStore = configureStore(middlewares);

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
    }),
  getContentPath: () => ''
}));

describe('Project Actions', () => {
  it('update project source', async () => {
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
            translation: {
              'utterance-yes': 'yes'
            }
          }
        }
      },
      notes: {
        source: {}
      }
    });
    const expectedActions = [
      {
        type: 'UPDATE_PROJECT_SOURCE',
        payload: 'project source'
      }
    ];

    await store.dispatch(project.updateProjectSource('project source'));
    const actions = store.getActions();
    expect(actions).toEqual(expectedActions);
  });

  it('update project JSON', async () => {
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
            translation: {
              'utterance-yes': 'yes'
            }
          }
        }
      },
      notes: {
        source: {}
      }
    });
    const expectedActions = [
      {
        type: 'UPDATE_PROJECT_JSON',
        payload: 'project json'
      }
    ];

    await store.dispatch(project.updateProjectJson('project json'));
    const actions = store.getActions();
    expect(actions).toEqual(expectedActions);
  });

  it('Sets project name', async () => {
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
        type: 'UPDATE_PROJECT_NAME',
        payload: 'This is a project name'
      }
    ];

    await store.dispatch(project.updateProjectName('This is a project name'));
    const actions = store.getActions();
    expect(actions).toEqual(expectedActions);
  });
});
