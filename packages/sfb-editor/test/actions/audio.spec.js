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
import * as audio from '../../app/actions/audio';

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
    })
}));
jest.mock('path', () => ({
  resolve: (folderPath, fileName) => `${folderPath}/${fileName}`,
  parse: filePath => ({
    filename: filePath,
    ext: '.mp3'
  }),
  basename: file => file
}));

describe('Audio Actions', () => {
  it('appends Audio', async () => {
    const store = mockStore({
      project: {
        location: '~/test/'
      },
      audio: {
        files: []
      }
    });
    const expectedActions = [
      {
        type: 'AUDIO_APPEND',
        payload: 'audio-file'
      }
    ];

    await store.dispatch(audio.appendAudio('audio-file'));
    const actions = store.getActions();
    expect(actions).toEqual(expectedActions);
  });

  it('updates Audio', async () => {
    const store = mockStore({
      project: {
        location: '~/test/'
      },
      audio: {
        files: []
      }
    });
    const expectedActions = [
      {
        type: 'AUDIO_APPEND',
        payload: 'audio-file'
      }
    ];

    await store.dispatch(audio.updateAudio('audio-file'));
    const actions = store.getActions();
    expect(actions).toEqual(expectedActions);
  });

  it('removes Audio', async () => {
    const store = mockStore({
      project: {
        location: '~/test/'
      },
      audio: {
        files: []
      }
    });
    const expectedActions = [
      {
        type: 'AUDIO_APPEND',
        payload: 'audio-file'
      }
    ];

    await store.dispatch(audio.removeAudio('audio-file'));
    const actions = store.getActions();
    expect(actions).toEqual(expectedActions);
  });

  it('replaces Audio', async () => {
    const store = mockStore({
      project: {
        location: '~/test/'
      },
      audio: {
        files: []
      }
    });
    const expectedActions = [
      {
        type: 'AUDIO_REPLACE',
        payload: 'audio-file'
      }
    ];

    await store.dispatch(audio.replaceAudio('audio-file'));
    const actions = store.getActions();
    expect(actions).toEqual(expectedActions);
  });

  it('fetches Audio', async () => {
    const store = mockStore({
      project: {
        location: '~/test/'
      },
      audio: {
        files: []
      },
      workspace: {
        currentLocale: 'en-US'
      }
    });

    const expectedActions = [
      {
        type: 'AUDIO_REPLACE',
        payload: [
          {
            filename: 'one-file',
            src: '/public/one-file'
          }
        ]
      }
    ];

    await store.dispatch(audio.fetchAudio());
    const actions = store.getActions();
    expect(actions).toEqual(expectedActions);
  });

  it('add File to Project', async () => {
    const store = mockStore({
      project: {
        location: '~/test/'
      },
      audio: {
        files: []
      },
      workspace: {
        currentLocale: 'en-US'
      }
    });

    const expectedActions = [
      {
        type: 'AUDIO_APPEND',
        payload: {
          filename: 'file-to-add',
          src: '/public/file-to-add'
        }
      }
    ];

    await store.dispatch(audio.addFileToProject('file-to-add'));
    const actions = store.getActions();
    expect(actions).toEqual(expectedActions);
  });
});
