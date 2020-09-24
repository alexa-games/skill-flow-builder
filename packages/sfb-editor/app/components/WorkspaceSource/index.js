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
import AceEditor from '../../containers/AceEditor';

import styles from './styles.css';

function WorkspaceSource(props) {
  const {
    project,
    workspace,
    className,
    setSelectedSceneId,
    updateProjectSource,
    setSyntaxErrors,
    setEditorReference
  } = props;

  return (
    <div className={className || styles.aceEditor}>
      <AceEditor
        value={project.source}
        onChange={updateProjectSource}
        setSyntaxErrors={setSyntaxErrors}
        setSelectedSceneId={setSelectedSceneId}
        selectedSceneId={workspace.selectedSceneId}
        setEditorReference={setEditorReference}
      />
    </div>
  );
}

WorkspaceSource.propTypes = {
  className: PropTypes.string,
  project: PropTypes.object.isRequired,
  setSelectedSceneId: PropTypes.func.isRequired,
  setSyntaxErrors: PropTypes.func.isRequired,
  updateProjectSource: PropTypes.func.isRequired,
  setEditorReference: PropTypes.func.isRequired
};

export default WorkspaceSource;
