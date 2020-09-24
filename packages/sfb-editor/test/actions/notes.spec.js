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
import * as notes from '../../app/actions/notes';
import { readFile } from '../../app/utils-main';

const middlewares = [thunk];
const mockStore = configureStore(middlewares);
jest.mock('../../app/utils-main', () => ({
  getContentPath: () => '',
  writeFile: () =>
    new Promise(resolve => {
      resolve();
    }),
  readFile: () =>
    new Promise(resolve => {
      resolve('Notes in file');
    }),
  makeDir: () =>
    new Promise(resolve => {
      resolve();
    })
}));

jest.mock('path', () => ({
  resolve: (folderPath, fileName) => `${folderPath}/${fileName}`,
  parse: filePath => ({
    filename: filePath,
    ext: '.png'
  }),
  basename: file => file
}));
describe('Notes Actions', () => {
  it('Update Notes', async () => {
    const store = mockStore({
      project: {
        location: '~/test/'
      },
      notes: {
        source: 'This is a note'
      }
    });
    const expectedActions = [
      {
        type: 'NOTES_UPDATE',
        payload: 'Updated notes.'
      }
    ];

    await store.dispatch(notes.updateNotes('Updated notes.'));
    const actions = store.getActions();
    expect(actions).toEqual(expectedActions);
  });

  it('Fetch Notes', async () => {
    const store = mockStore({
      project: {
        location: './'
      },
      notes: {
        source: ''
      }
    });
    const expectedActions = [
      {
        type: 'NOTES_UPDATE',
        payload: 'Notes in file'
      }
    ];

    await store.dispatch(notes.fetchNotes());
    const actions = store.getActions();
    expect(actions).toEqual(expectedActions);
  });

  it('Save Notes', async () => {
    const store = mockStore({
      project: {
        location: '~/test/'
      },
      notes: {
        source: 'This is a note'
      }
    });
    const expectedActions = [];

    await store.dispatch(notes.saveNotes());
    const actions = store.getActions();
    expect(actions).toEqual(expectedActions);
  });

  it('Save Notes Backup', async () => {
    const store = mockStore({
      project: {
        location: '~/test/'
      },
      notes: {
        source: 'This is a note'
      }
    });
    const expectedActions = [];

    await store.dispatch(notes.saveNotes(true));
    const actions = store.getActions();
    expect(actions).toEqual(expectedActions);
  });
});
