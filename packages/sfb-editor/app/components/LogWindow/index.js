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
import { Icon } from 'semantic-ui-react';

import styles from './styles.css';

function capitalize(type = 'message') {
  return type[0].toUpperCase() + type.substr(1);
}

export default function LogWindow(props) {
  const { showItems, loggerClose } = props;

  return (
    <div className={styles.logWindow}>
      <header>
        <strong>{capitalize(showItems[0].type)} Log</strong>
        <button type="button" onClick={loggerClose}>
          <Icon name="x" />
        </button>
      </header>

      <ol className={styles.log}>
        {showItems.reverse().map(({ type, message, error, timestamp }) => (
          <li key={timestamp} className={type}>
            <div className={styles.logTimestamp}>
              {new Date(timestamp).toGMTString()}
            </div>
            {error && error.sourceID ? (
              <div className={styles.logSourceID}>File: {error.sourceID}</div>
            ) : null}
            {error && error.lineNumber ? (
              <div className={styles.logLineNumber}>
                Line: {error.lineNumber}
              </div>
            ) : null}
            <div className={styles.logMessage}>
              {message}
              {error && error.stack ? (
                <pre>
                  <code>{error.stack}</code>
                </pre>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

LogWindow.propTypes = {
  showItems: PropTypes.array.isRequired,
  loggerClose: PropTypes.func.isRequired
};
