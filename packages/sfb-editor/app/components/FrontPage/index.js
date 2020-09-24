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
import { List, Segment } from 'semantic-ui-react'
import styles from './styles.css';
import * as querystring from 'querystring';

const { app } = remote;

const { shell } = require('electron');

class FrontPage extends React.PureComponent {
  constructor(props) {
    super(props);
    this.setSecondaryMode = this.props.setSecondaryMode;

    this.handleClick = this.handleClick.bind(this);
  }

  state = {
    webviewLoadFailed: false
  };
  
  componentDidMount = () => {
    const landingPageWebview = document.getElementById("landingPage");
    if(landingPageWebview) {
      landingPageWebview.addEventListener("did-fail-load", () => {
        this.setState({webviewLoadFailed: true});
      });
    }
  }

  handleClick(e) {
    const anchor = e.target.closest('a[href]');

    if (anchor) {
      // convert the ridiculous anchor href into the selector
      const selector = new URL(anchor.href).hash;
      let target;
      if (selector) {
        target = document.querySelector(selector);
      }

      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        e.preventDefault();
        shell.openExternal(anchor.href);
      }
    }
  }

  render() {

    const { webviewLoadFailed } = this.state;
    const { editorLocale } = this.props;

    const landingPageUrl = "https://sfb-framework.s3.amazonaws.com/web/landing/landing.html";

    const queryStr = querystring.stringify({ editorLocale, version: app.getVersion() });

    const landingPageUrlWithQueryString = `${landingPageUrl}?${queryStr}`;

    return (
      webviewLoadFailed ? 
      <div className={styles.container}>
        <Segment raised>
          <h1>Welcome to the SFB Editor</h1>
          <p>
          To view the latest news and documentation, please ensure you have an internet connection and restart this application.
          </p>
          <p>
          The following features will not work without an internet connection:
          </p>
          <List bulleted>
            <List.Item>Voice Preview will not function in offline mode.</List.Item>
          </List>      
        </Segment>
      </div>
      :
      <webview id="landingPage" src={landingPageUrlWithQueryString} style={{width: '100%', height: '100%'}} partition="landingpage"></webview>
    );
  }
}

FrontPage.propTypes = {
  editorLocale: PropTypes.string.isRequired,
  setSecondaryMode: PropTypes.func.isRequired
};

export default FrontPage;
