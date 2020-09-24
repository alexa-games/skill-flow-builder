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
import { ipcRenderer } from 'electron';
import { Message } from 'semantic-ui-react';

import styles from './styles.css';

class AutoUpdateBanner extends React.PureComponent {
  state = {
    classList: [styles.container, styles.hidden].join(' '),
    version: '',
    state: '',
    progress: 0
  };

  componentDidMount() {
    ipcRenderer.on('app-update', (event, message, data) => {
      console.log('received update message', message);
      this.setState({
        state: message
      });
      if (data && data.version) {
        this.setState({
          version: data.version
        });
      }
      if (data && data.progress) {
        this.setState({
          progress: data.progress
        });
      }
      this.showUpdate();
    });
  }

  handleRestartClick = () => {
    ipcRenderer.send('install-update');
  };

  handleDownloadUpdateClick = () => {
    this.setState({
      state: 'download-progress',
      progress: 0
    });
    ipcRenderer.send('download-update');
  };

  showUpdate = () => {
    this.setState({
      classList: [styles.container, styles.shown].join(' ')
    })
  };

  render() {
    const { classList, version, state, progress } = this.state;

    let messageContent;
    if (state === 'update-downloaded') {
      messageContent = <div>Update to v{version} is ready to install. <a href="#" onClick={this.handleRestartClick}>Apply and restart</a></div>;
    }
    if (state === 'update-available') {
      messageContent = <div>Update available. <a href="#" onClick={this.handleDownloadUpdateClick}>Download and install</a></div>;
    }
    if (state === 'download-progress') {
      messageContent = <div>Downloading update: {progress}%</div>;
    }

    return (
      <Message className={classList} info size="small" attached="top">
        {messageContent}
      </Message>
    );
  }
}

export default AutoUpdateBanner;
