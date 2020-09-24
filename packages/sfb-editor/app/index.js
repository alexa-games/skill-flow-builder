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

import './app.global.css';

import React from 'react';
import { render } from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import shellEnv from 'shell-env';
import { setupKeyboardShortcuts } from './utils-renderer';
import { initUncaughtExceptionLogging } from './utils-main';
import { configureStore, history } from './store/configureStore';

import Root from './containers/Root';

// initUncaughtExceptionLogging();
const store = configureStore();

setupKeyboardShortcuts(store);
// MacOS: The packaged version of Electron discards most of the environment variables
// including all of those set by the shell scripts (like .profile, .bash_profile, etc).
// Importantly, the truncated PATH variable causes npx, ask, and aws scripts to not be found.
// The shell-env package solves the problem, and setting the process.env here gets
// the full complement of environment variables to the packaged app. This is a no-op
// on Windows.
process.env = shellEnv.sync();

render(
  <AppContainer>
    <Root store={store} history={history} />
  </AppContainer>,
  document.getElementById('root')
);

if (module.hot) {
  module.hot.accept('./containers/Root', () => {
    // eslint-disable-next-line global-require
    const NextRoot = require('./containers/Root').default;
    render(
      <AppContainer>
        <NextRoot store={store} history={history} />
      </AppContainer>,
      document.getElementById('root')
    );
  });
}
