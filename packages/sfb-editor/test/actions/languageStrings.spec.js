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
// eslint-disable-next-line no-unused-vars
import path from 'path';
import * as lang from '../../app/actions/languageStrings';

const middlewares = [thunk];
const mockStore = configureStore(middlewares);
// Mocking the methods used for fle system
jest.mock('../../app/utils-main', () => ({
  findAudioFiles: () =>
    new Promise(resolve => {
      resolve(['one-file']);
    }),
  getResourcesPath: () => '',
  copyFile: () =>
    new Promise(resolve => {
      resolve();
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
jest.mock('path', () => ({
  resolve: (folderPath, fileName) => `${folderPath}/${fileName}`,
  parse: filePath => ({
    filename: filePath,
    ext: '.mp3'
  }),
  basename: file => file
}));

describe('Language Strings Actions', () => {
  it('saves Language Strings', async () => {
    const store = mockStore({
      project: {
        location: '~/test/'
      },
      languageStrings: {
        langObj: {
          'en-US': {
            translation: {
              'utterance-yes': 'yes'
            }
          }
        }
      }
    });
    const expectedActions = [
      {
        type: 'LOGGER_NOTIFY',
        payload: {
          type: 'message',
          message: 'Project language strings saved.'
        }
      }
    ];

    await store.dispatch(lang.saveLanguageStrings());
    const actions = store.getActions();
    expect(actions).toEqual(expectedActions);
  });

  it('fetches Language Strings', async () => {
    const store = mockStore({
      project: {
        location: '~/test/'
      },
      languageStrings: {
        langObj: {
          'en-US': {
            translation: {
              'utterance-yes': 'yes'
            }
          }
        }
      }
    });
    const expectedActions = [
      {
        type: 'LANGUAGE_STRINGS_UPDATE',
        payload: 'This is file contents'
      }
    ];

    await store.dispatch(lang.fetchLanguageStrings());
    const actions = store.getActions();
    expect(actions).toEqual(expectedActions);
  });

  it('updates Language Strings', async () => {
    const store = mockStore({
      project: {
        location: '~/test/'
      },
      languageStrings: {
        langObj: {
          'en-US': {
            translation: {
              'utterance-yes': 'yes'
            }
          }
        }
      }
    });
    const expectedActions = [
      {
        type: 'LANGUAGE_STRINGS_UPDATE',
        payload: 'Update language strings'
      }
    ];

    await store.dispatch(lang.updateLanguageStrings('Update language strings'));
    const actions = store.getActions();
    expect(actions).toEqual(expectedActions);
  });
});
