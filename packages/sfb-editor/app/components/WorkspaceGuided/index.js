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
import { Icon, Tab } from 'semantic-ui-react';

import WorkspaceGuidedResponse from '../WorkspaceGuidedResponse';
import WorkspaceGuidedVisuals from '../WorkspaceGuidedVisuals';

import styles from './styles.css';
import WorkspaceGuidedActions from '../WorkspaceGuidedActions';
import { Action } from '../WorkspaceGuidedActions/action';

class WorkspaceGuided extends React.PureComponent {
  state = {
    activeIndex: 0
  };

  changeActiveIndex = activeIndex => () => {
    this.setState({ activeIndex });
  };

  render() {
    const {
      project,
      workspace,
      className,
      setSelectedSceneId,
      importProjectSource,
      updateSceneAction,
      pushToNavigationStack,
      popNavigationStack,
      updateSceneCommand,
      deleteHearCommand,
      deleteActionCommand,
      openProjectFile
    } = this.props;

    if (!project.json || !setSelectedSceneId) {
      return <div className={[className, styles.container].join(' ')} />;
    }

    const { activeIndex } = this.state;
    const scene = project.json.scenes.find(
      ({ id }) => id === workspace.selectedSceneId
    );
    const sceneWithExtensions = project.jsonWithExtensions ? project.jsonWithExtensions.scenes.find(
      ({ id }) => id === workspace.selectedSceneId
    ) : {};

    const panes = [
      {
        menuItem: () => (
          <button
            key="Say"
            type="button"
            onClick={this.changeActiveIndex(0)}
            className={['item', activeIndex === 0 ? 'active' : null].join(' ')}
          >
            <Icon name="chat" />
            Say
          </button>
        ),
        render: () => (
          <WorkspaceGuidedResponse
            key={scene.id}
            scene={scene}
            project={project}
            workspace={workspace}
            importProjectSource={importProjectSource}
            updateSceneAction={updateSceneAction}
            setSelectedSceneId={setSelectedSceneId}
            pushToNavigationStack={pushToNavigationStack}
            popNavigationStack={popNavigationStack}
            updateSceneCommand={updateSceneCommand}
            deleteHearCommand={deleteHearCommand}
            deleteActionCommand={deleteActionCommand}
            openProjectFile={openProjectFile}
          />
        )
      },
      {
        menuItem: () => (
          <button
            key="Visuals"
            type="button"
            onClick={this.changeActiveIndex(1)}
            className={['item', activeIndex === 1 ? 'active' : null].join(' ')}
          >
            <Icon name="image" />
            Visuals
          </button>
        ),
        render: () => <WorkspaceGuidedVisuals key={scene.id} scene={scene} sceneWithExtensions={sceneWithExtensions} />
      },
      {
        menuItem: () => (
          <button
            key="Actions"
            type="button"
            onClick={this.changeActiveIndex(2)}
            className={['item', activeIndex === 2 ? 'active' : null].join(' ')}
          >
            <Icon name="share" flipped="vertically" />
            Actions
          </button>
        ),
        render: () => (
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
        )
      }
    ];

    return scene ? (
      <div className={[className, styles.container].join(' ')}>
        <Tab
          panes={panes}
          activeIndex={activeIndex}
          menu={{ secondary: true, pointing: true }}
        />
      </div>
    ) : (
      <div className={[className, styles.container].join(' ')} />
    );
  }
}

WorkspaceGuided.propTypes = {
  className: PropTypes.string,
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

export default WorkspaceGuided;
