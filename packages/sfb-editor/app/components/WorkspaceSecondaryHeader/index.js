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

import { Search } from 'semantic-ui-react';

import styles from './styles.css';

const WorkspaceSecondaryHeader = props => {
  const {
    children,
    placeholder,
    searchQuery,
    searchResults,
    handleResultSelect,
    handleChangeSearchQuery
  } = props;

  return (
    <header className={styles.header}>
      <Search
        value={searchQuery}
        results={searchResults}
        className={styles.search}
        placeholder={placeholder}
        onResultSelect={handleResultSelect}
        onSearchChange={handleChangeSearchQuery}
      />

      {children}
    </header>
  );
};

WorkspaceSecondaryHeader.propTypes = {
  children: PropTypes.any,
  placeholder: PropTypes.string.isRequired,
  searchQuery: PropTypes.string.isRequired,
  searchResults: PropTypes.array.isRequired,
  handleResultSelect: PropTypes.func.isRequired,
  handleChangeSearchQuery: PropTypes.func.isRequired
};

export default WorkspaceSecondaryHeader;
