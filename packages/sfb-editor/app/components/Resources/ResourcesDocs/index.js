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
import marked from 'marked';
import PropTypes from 'prop-types';
import styles from './styles.css';
import { WorkspaceSecondaryMode } from '../../../data/enums';
import docs from '../../../data/formatting.md';
import readme from '../../../data/README.md';

import { searchTerms } from './searchTerms';

const { shell } = require('electron');

const htmlFormatting = marked(docs);
const htmlReadme = marked(readme);

class ResourcesDocs extends React.PureComponent {
  constructor(props) {
    super(props);
    this.setSecondaryMode = this.props.setSecondaryMode;

    this.handleClick = this.handleClick.bind(this);
  }

  state = {
    searchQuery: '',
    searchResults: []
  };

  handleClick(e) {
    const anchor = e.target.closest('a[href]');

    if (anchor) {
      // Check for local links
      if (anchor.href.endsWith('CHANGELOG.md')) {
        e.preventDefault();

        this.setSecondaryMode(WorkspaceSecondaryMode.News);
        return;
      }
      if (anchor.href.endsWith('README.md')) {
        e.preventDefault();

        this.setSecondaryMode(WorkspaceSecondaryMode.Documentation);
        return;
      }
      if (anchor.href.endsWith('formatting.md')) {
        e.preventDefault();

        this.setSecondaryMode(WorkspaceSecondaryMode.Documentation);
        return;
      }

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

  handleResultSelect = (e, { result }) => {
    const { selector } = result;
    const target = document.querySelector(selector);

    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  handleChangeSearchQuery = e => {
    const searchQuery = e.target.value;
    const searchResults = searchTerms.filter(({ title }) =>
      title.includes(searchQuery.toLowerCase())
    );

    this.setState({
      searchQuery,
      searchResults
    });
  };

  render() {
    const { searchQuery, searchResults } = this.state;

    return (
      <div className={styles.container}>
        <div onClick={this.handleClick} className={styles.content}>
          <article dangerouslySetInnerHTML={{ __html: htmlFormatting }} />
        </div>
      </div>
    );
  }
}

ResourcesDocs.propTypes = {
  setSecondaryMode: PropTypes.func.isRequired
};

export default ResourcesDocs;
