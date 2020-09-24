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
import { shell } from 'electron';

import styles from './styles.css';

const MAX_DISPLAY_COUNT = 3;
const AUTO_DISMISSAL_DELAY = 3000;

function getTitle(type) {
  switch (type) {
    case 'error':
      return 'ERROR';
    case 'warning':
      return 'Warning';
    case 'message':
    default:
      return 'Notifiction';
  }
}

class Toast extends React.PureComponent {
  timeout = null;

  componentDidMount() {
    const { id, type = 'message', loggerDismissToast } = this.props;

    if (type !== 'error') {
      this.timeout = setTimeout(
        () => loggerDismissToast({ id }),
        AUTO_DISMISSAL_DELAY
      );
    }
  }

  componentWillUnmount() {
    clearTimeout(this.timeout);
  }

  render() {
    const {
      id,
      title,
      error,
      message,
      type = 'message',
      loggerDismissToast
    } = this.props;

    const containerStyles = [styles.toast, styles[type]];

    let lineNumber;
    if (error && error.lineNumber) {
      lineNumber = error.lineNumber;
    }

    let sourceID;
    if (error && error.sourceID) {
      sourceID = error.sourceID;
    }

    return (
      <article key={id} className={containerStyles.join(' ')}>
        <header className={styles.toastHeader}>
          <h3>{title || getTitle(type)}</h3>
          <div className={styles.toastHeaderActions}>
            <button type="button" onClick={() => loggerDismissToast({ id })}>
              <Icon name="cancel" size="large" />
            </button>
          </div>
        </header>
        <p>{message || error.message}</p>
        {sourceID ? <p>File: {sourceID}</p> : ''}
        {lineNumber ? <p>Line: {lineNumber}</p> : ''}
      </article>
    );
  }
}

Toast.propTypes = {
  type: PropTypes.string,
  title: PropTypes.string,
  error: PropTypes.object,
  message: PropTypes.string,
  id: PropTypes.string.isRequired,
  loggerDismissToast: PropTypes.func.isRequired
};

function LogToaster(props) {
  const { toasts, loggerDismissToast } = props;

  if (toasts.length === 0) {
    return null;
  }

  const count =
    toasts.length > MAX_DISPLAY_COUNT ? MAX_DISPLAY_COUNT : toasts.length;

  return (
    <div className={styles.container}>
      {toasts.length > MAX_DISPLAY_COUNT ? (
        <header className={styles.toasterHeader}>
          <span>
            Showing {count} of {toasts.length}
          </span>
        </header>
      ) : null}
      {toasts.slice(0, MAX_DISPLAY_COUNT).map(toast => (
        <Toast
          {...toast}
          key={toast.id}
          loggerDismissToast={loggerDismissToast}
        />
      ))}
    </div>
  );
}

export default LogToaster;

LogToaster.propTypes = {
  toasts: PropTypes.array.isRequired,
  loggerDismissToast: PropTypes.func.isRequired
};
