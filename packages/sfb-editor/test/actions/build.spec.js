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
import * as build from '../../app/actions/build';
import * as sfbCli from '@alexa-games/sfb-cli';

const middlewares = [thunk];
const mockStore = configureStore(middlewares);

jest.mock('@alexa-games/sfb-cli');
jest.mock('electron');

describe('Build Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('build project', async () => {
    const store = mockStore({
      project: {
        location: '~/test/'
      }
    });
    const expectedActions = [
      {
        type: 'START_BUILD_ACTION'
      },
      {
        type: 'CLEAR_BUILD_OUTPUT'
      },
      {
        type: 'OPEN_BUILD_OUTPUT'
      },
      {
        type: 'LOG_TO_BUILD_OUTPUT',
        message: '\nProject was successfully built.\n'
      },
      {
        type: 'LOGGER_NOTIFY',
        payload: {
          triggerToast: true,
          title: 'Project built',
          message: 'Project was successfully built.'
        }
      },
      {
        type: 'END_BUILD_ACTION'
      }
    ];

    await store.dispatch(build.buildProject());
    const actions = store.getActions();
    expect(actions).toEqual(expectedActions);
    expect(sfbCli.__mockBuildImportCommand__.mock.calls.length).toBe(1);
    expect(sfbCli.__mockImportCommandRun__.mock.calls.length).toBe(1);
    expect(sfbCli.__mockBuildBakeCommand__.mock.calls.length).toBe(1);
    expect(sfbCli.__mockBakeCommandRun__.mock.calls.length).toBe(1);
  });

  it('deploy project', async () => {
    const store = mockStore({
      project: {
        location: '~/test/'
      }
    });
    const expectedActions = [
      {
        type: 'START_BUILD_ACTION'
      },
      {
        type: 'CLEAR_BUILD_OUTPUT'
      },
      {
        type: 'OPEN_BUILD_OUTPUT'
      },
      {
        type: 'LOG_TO_BUILD_OUTPUT',
        message: '\nProject was successfully deployed.\n'
      },
      {
        type: 'LOGGER_NOTIFY',
        payload: {
          triggerToast: true,
          title: 'Project deployed',
          message: 'Project was successfully deployed.'
        }
      },
      {
        type: 'END_BUILD_ACTION'
      }
    ];

    await store.dispatch(build.deployProject());
    const actions = store.getActions();
    expect(actions).toEqual(expectedActions);
    expect(sfbCli.__mockBuildImportCommand__.mock.calls.length).toBe(1);
    expect(sfbCli.__mockImportCommandRun__.mock.calls.length).toBe(1);
    expect(sfbCli.__mockBuildBakeCommand__.mock.calls.length).toBe(1);
    expect(sfbCli.__mockBakeCommandRun__.mock.calls.length).toBe(1);
    expect(sfbCli.__mockBuildDeployCommand__.mock.calls.length).toBe(1);
    expect(sfbCli.__mockDeployCommandRun__.mock.calls.length).toBe(1);
  });

  it('upload resources', async () => {
    const store = mockStore({
      project: {
        location: '~/test/'
      }
    });
    const expectedActions = [
      {
        type: 'START_BUILD_ACTION'
      },
      {
        type: 'CLEAR_BUILD_OUTPUT'
      },
      {
        type: 'OPEN_BUILD_OUTPUT'
      },
      {
        type: 'LOG_TO_BUILD_OUTPUT',
        message: '\nResources were successfully uploaded.\n'
      },
      {
        type: 'LOGGER_NOTIFY',
        payload: {
          triggerToast: true,
          title: 'Resources uploaded',
          message: 'Resources were successfully uploaded.'
        }
      },
      {
        type: 'END_BUILD_ACTION'
      }
    ];

    await store.dispatch(build.uploadResources());
    const actions = store.getActions();
    expect(actions).toEqual(expectedActions);
    expect(sfbCli.__mockBuildUploadResourcesCommand__.mock.calls.length).toBe(1);
    expect(sfbCli.__mockUploadResourcesCommandRun__.mock.calls.length).toBe(1);
  });
});
