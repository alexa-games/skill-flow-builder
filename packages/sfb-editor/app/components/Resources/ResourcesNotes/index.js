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

import { Header, Icon } from 'semantic-ui-react';
import styles from './styles.css';

class ResourcesNotes extends React.PureComponent {
  state = {
    s: []
  };

  componentDidMount() {
    this.props.fetchNotes();
  }

  onChangeNotes = e => {
    this.props.updateNotes(e.target.value);
  };

  render() {
    const {notes} = this.props;

    return (
      <div className={styles.container}>
        <header>
          <Header as="h3">
            <Icon name="pencil"/>
            <Header.Content>
              Notes
              <Header.Subheader>
                Notes are saved with your project.
              </Header.Subheader>
            </Header.Content>
          </Header>
        </header>
        <textarea
          value={notes}
          onChange={this.onChangeNotes}
          placeholder="Enter project specific notes here..."
        />
      </div>
    );
  }
}

ResourcesNotes.propTypes = {
  fetchNotes: PropTypes.func.isRequired,
  updateNotes: PropTypes.func.isRequired,
  notes: PropTypes.string.isRequired,
};

export default ResourcesNotes;
