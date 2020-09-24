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
import { debounce } from 'lodash';
import memoize from 'memoize-one';
import PropTypes from 'prop-types';

import { WorkspaceSecondaryMode } from '../../data/enums';
import WorkspaceSecondaryHeader from '../WorkspaceSecondaryHeader';
import WorkspaceGraphD3Tree from './D3Tree';

import styles from './styles.css';

const DEBOUNCE_DURATION = 200;

function escapeRegExp(string) {
  // $& means the whole matched string
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const createFuzzyMatchTest = memoize(pattern => {
  if (!pattern) {
    return () => true;
  }

  const regex = new RegExp(escapeRegExp(pattern), 'i');

  return str => str.search(regex) !== -1;
});

class WorkspaceGraph extends React.PureComponent {
  state = {
    searchQuery: '',
    searchResults: []
  };

  mapTypeOptions = ['tree'];

  handleChangeSearchQuery = e => {
    const searchQuery = e.target.value;
    const { workspace } = this.props;
    const { secondaryMode } = workspace;

    if (secondaryMode === WorkspaceSecondaryMode.Map) {
      this.sceneResults(searchQuery);
    }

    this.setState({ searchQuery });
  };

  handleResultSelect = (e, { result }) => {
    const { workspace, setSelectedSceneId } = this.props;
    const { secondaryMode } = workspace;

    if (secondaryMode === WorkspaceSecondaryMode.Map) {
      setSelectedSceneId(result.title);
    }

    this.setState({
      searchQuery: '',
      searchResults: []
    });
  };

  sceneResults = debounce(
    searchQuery => {
      const { project } = this.props;
      const { json } = project;

      const searchResults = json.scenes
        .map(({ id }) => id)
        .filter(createFuzzyMatchTest(searchQuery))
        .map(title => ({ title }));

      this.setState({ searchResults });
    },
    DEBOUNCE_DURATION,
    { leading: true }
  );

  handleMapTypeChange = (e, data) => {
    const { setMapType } = this.props;

    const mapType = data.value;

    setMapType(mapType);
  };

  render() {
    const { searchQuery, searchResults } = this.state;

    return (
      <div className={styles.container}>
        <WorkspaceSecondaryHeader
          searchQuery={searchQuery}
          searchResults={searchResults}
          placeholder="Search for scene..."
          handleResultSelect={this.handleResultSelect}
          handleChangeSearchQuery={this.handleChangeSearchQuery}
        />
        <WorkspaceGraphD3Tree {...this.props} />
      </div>
    );
  }
}

WorkspaceGraph.propTypes = {
  workspace: PropTypes.object.isRequired,
  project: PropTypes.object.isRequired,
  setSelectedSceneId: PropTypes.func.isRequired,
  clearNavigationStack: PropTypes.func.isRequired,
  setMapType: PropTypes.func.isRequired
};

export default WorkspaceGraph;
