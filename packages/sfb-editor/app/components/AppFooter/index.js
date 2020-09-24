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

import React from 'react';
import PropTypes from 'prop-types';
import { remote } from 'electron';
import { Icon } from 'semantic-ui-react';
import BuildOutputWindow from '../BuildOutputWindow';
import LogWindow from '../LogWindow';

import styles from './styles.css';

const { app } = remote;

const DBLCLICK_THRESHOLD = 200;

function createDoubleClickHandler(fn) {
  let previousTimeStamp;

  return event => {
    if (event.timeStamp - previousTimeStamp < DBLCLICK_THRESHOLD) {
      fn();
    }
    previousTimeStamp = event.timeStamp;
  };
}

function AppFooter(props) {
  const {
    logger,
    build,
    loggerClose,
    loggerOpenErrors,
    loggerOpenMessages,
    openBuildOutput,
    closeBuildOutput,
    toggleExperimentalModeEnabledd
  } = props;

  const {
    log,
    showItems,
    totalErrors,
    totalMessages,
    unreadErrors,
    unreadMessages
  } = logger;

  const { buildOutput, isBuildOutputOpen } = build;

  const lastest = log[log.length - 1] || {
    message: `Welcome to the SFB Editor`
  };

  return (
    <footer className={styles.container}>
      <div className={styles.message}>{lastest.message}</div>

      <div className={styles.rightSide}>
        {/* notifications */}
        <div className={styles.unreadCounts}>
          <button
            type="button"
            title="Log Messages"
            onClick={loggerOpenMessages}
            className={unreadMessages !== 0 ? styles.hasLogMessages : null}
          >
            {totalMessages}
            <Icon name="flag" />
          </button>
          <button
            type="button"
            title="Error Messages"
            onClick={loggerOpenErrors}
            className={unreadErrors !== 0 ? styles.hasErrorMessages : null}
          >
            {totalErrors}
            <Icon name="warning circle" />
          </button>
          <button type="button" title="Build Output" onClick={openBuildOutput}>
            <Icon name="cogs" />
          </button>
        </div>

        {/* app version */}
        <div
          className={styles.version}
          onClick={createDoubleClickHandler(toggleExperimentalModeEnabledd)}
        >
          v{app.getVersion()}
        </div>
      </div>
      {showItems.length > 0 ? (
        <LogWindow showItems={showItems} loggerClose={loggerClose} />
      ) : null}
      {isBuildOutputOpen ? (
        <BuildOutputWindow
          buildOutput={buildOutput}
          closeBuildOutput={closeBuildOutput}
        />
      ) : null}
    </footer>
  );
}

AppFooter.propTypes = {
  logger: PropTypes.object.isRequired,
  build: PropTypes.object.isRequired,
  loggerClose: PropTypes.func.isRequired,
  loggerOpenErrors: PropTypes.func.isRequired,
  loggerOpenMessages: PropTypes.func.isRequired,
  toggleExperimentalModeEnabledd: PropTypes.func.isRequired
};

export default AppFooter;
