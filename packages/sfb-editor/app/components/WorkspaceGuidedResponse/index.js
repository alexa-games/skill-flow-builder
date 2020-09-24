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

import styles from './styles.css';
import { WorkspaceGuidedResponseSection } from './guidedResponseSection';
import WorkspaceGuidedActions from '../WorkspaceGuidedActions';
import { Header, Icon } from 'semantic-ui-react';
import { Action } from '../WorkspaceGuidedActions/action';

// WorkspaceGuidedResponse
class WorkspaceGuidedResponse extends React.PureComponent {
  state = {
    sectionEdited: null
  };

  setSectionEdited = sectionEdited => {
    this.setState({sectionEdited});
  };

  render() {
    const {
      scene,
      project,
      workspace,
      importProjectSource,
      updateSceneAction,
      setSelectedSceneId,
      pushToNavigationStack,
      popNavigationStack,
      updateSceneCommand,
      deleteHearCommand,
      deleteActionCommand,
      openProjectFile
    } = this.props;

    const {sectionEdited} = this.state;

    return (
      <div className={styles.container}>
        <WorkspaceGuidedResponseSection
          type="say"
          title="Say"
          scene={scene}
          project={project}
          isEditing={sectionEdited === 'say'}
          setSectionEdited={this.setSectionEdited}
          importProjectSource={importProjectSource}
          updateSceneCommand={updateSceneCommand}
        />

        <WorkspaceGuidedResponseSection
          type="recap"
          title="Recap"
          scene={scene}
          project={project}
          isEditing={sectionEdited === 'recap'}
          setSectionEdited={this.setSectionEdited}
          importProjectSource={importProjectSource}
          updateSceneCommand={updateSceneCommand}
        />

        <WorkspaceGuidedResponseSection
          type="reprompt"
          title="Reprompt"
          scene={scene}
          project={project}
          isEditing={sectionEdited === 'reprompt'}
          setSectionEdited={this.setSectionEdited}
          importProjectSource={importProjectSource}
          updateSceneCommand={updateSceneCommand}
        />

        <Header style={{borderBottom: '2px solid rgba(34,36,38,.15)'}}>
          <Icon size='tiny' name="share" flipped="vertically"/>
          <Header.Content>
            Quick Actions
          </Header.Content>
        </Header>
        <WorkspaceGuidedActions
          key={scene.id}
          scene={scene}
          project={project}
          workspace={workspace}
          updateSceneAction={updateSceneAction}
          setSelectedSceneId={setSelectedSceneId}
          pushToNavigationStack={pushToNavigationStack}
          popNavigationStack={popNavigationStack}
          deleteHearCommand={deleteHearCommand}
          deleteActionCommand={deleteActionCommand}
          openProjectFile={openProjectFile}
        />
      </div>
    );
  }
}

WorkspaceGuidedResponse.propTypes = {
  scene: PropTypes.object.isRequired,
  project: PropTypes.object.isRequired,
  workspace: PropTypes.object.isRequired,
  setSelectedSceneId: PropTypes.func.isRequired,
  importProjectSource: PropTypes.func.isRequired,
  updateSceneAction: PropTypes.func.isRequired,
  pushToNavigationStack: PropTypes.func.isRequired,
  popNavigationStack: PropTypes.func.isRequired,
  updateSceneCommand: PropTypes.func.isRequired,
  deleteHearCommand: PropTypes.func.isRequired,
  deleteActionCommand: PropTypes.func.isRequired,
  openProjectFile: PropTypes.func.isRequired,
};

export default WorkspaceGuidedResponse;
