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
import _ from 'underscore';
import WorkspaceGuidedWrapper from '../WorkspaceGuidedWrapper';

import styles from './styles.css';

// WorkspaceGuidedVisuals
class WorkspaceGuidedVisuals extends React.PureComponent {
  state = {
    isEditing: false
  };

  edit = () => {
    this.setState({ isEditing: true });
  };

  save = () => {
    this.setState({ isEditing: false });
  };

  cancel = () => {
    this.setState({ isEditing: false });
  };

  render() {
    const { sceneWithExtensions } = this.props;
    const { isEditing } = this.state;

    const visuals = !_.isEmpty(sceneWithExtensions.contents) ?
      sceneWithExtensions.contents[0].sceneDirections.find(direction => direction.directionType === 'visuals') :
      undefined;

    const actions = null;
    // const actions = {
    //   edit: this.edit,
    //   save: this.save,
    //   cancel: this.cancel,
    // }

    return (
      <>
      Note: Visuals is currently preview only. To edit, please add a '*show' section to the scene using the 'Source' tab view.
      <WorkspaceGuidedWrapper actions={actions} isEditing={isEditing}>
        {visuals ? (
          <div className={styles.container}>
            {/* parameters */
            Object.entries(visuals.parameters).map(([key, value]) => (
              <div key={key} className={styles.parameter}>
                <strong className={styles.parameterKey}>{key}</strong>:
                { value && (value.toLowerCase().endsWith("png") || value.toLowerCase().endsWith("jpg")) ?
                <img src={value} style={{'maxWidth': '400px'}} alt="" />
                : null }
                <div className={styles.parameterValue}>{value}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.notDefined}>No visuals currently set for this scene.</p>
        )}
      </WorkspaceGuidedWrapper>
      </>
    );
  }
}

WorkspaceGuidedVisuals.propTypes = {
  scene: PropTypes.object.isRequired, // Note: This is the "scene" data before Snippet extensions are applied, for editing with
  sceneWithExtensions: PropTypes.object.isRequired // Note: This is the "scene" data after Snippet extensions are applied, for previewing with
};

export default WorkspaceGuidedVisuals;
