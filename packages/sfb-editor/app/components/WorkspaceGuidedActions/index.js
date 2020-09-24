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
import { SceneDirectionType } from '@alexa-games/sfb-f';
import WorkspaceGuidedWrapper from '../WorkspaceGuidedWrapper';
import WorkspaceGuidedActionForm from '../WorkspaceGuidedActionForm';

import { getActions } from './utils';

import styles from './styles.css';
import { Action } from './action';
import { Button, Icon } from 'semantic-ui-react';
import * as _ from 'lodash';
import log from 'electron-log';

// WorkspaceGuidedActions
class WorkspaceGuidedActions extends React.PureComponent {
  state = {
    type: null,
    action: null,
    target: null,
    utterances: '',
    editingIndex: null,
    isShowingNewActionForm: false
  };

  setEditingIndex = editingIndex => () => {
    this.setState({
      editingIndex,
      isShowingNewActionForm: false
    });
  };

  handleChangeUtterances = e => {
    this.setState({utterances: e.target.value});
  };

  handleChangeAction = (e, data) => {
    this.setState({action: data.value});
  };

  handleChangeTarget = (e, data) => {
    this.setState({target: data.value});
  };

  save = e => {
    const {scene, updateSceneAction} = this.props;

    const {utterances, target, action, type} = this.state;

    const hear = utterances
      .split('\n')
      .filter(s => s.length > 0)
      .join(', ');

    if (
      (hear || !(type === 'choice')) &&
      (target ||
        (action === SceneDirectionType.RESTART ||
          action === SceneDirectionType.PAUSE ||
          action === SceneDirectionType.RESUME ||
          action === SceneDirectionType.REPEAT ||
          action === SceneDirectionType.REPROMPT ||
          action === SceneDirectionType.BACK ||
          action === SceneDirectionType.END ||
          action === SceneDirectionType.RETURN)) &&
      action
    ) {
      updateSceneAction(scene.id, '', '', hear, target, action, type);
      this.cancel();
    }
  };

  appendAction = () => {
    this.setState({
      type: 'action',
      editingIndex: null,
      isShowingNewActionForm: true
    });
  };

  appendHearAction = () => {
    this.setState({
      type: 'choice',
      editingIndex: null,
      isShowingNewActionForm: true
    });
  };

  cancel = () => {
    this.setState({
      action: null,
      target: null,
      utterances: '',
      isShowingNewActionForm: false
    });
  };

  handleBackClick = () => {
    const {workspace, popNavigationStack} = this.props;
    const {selectedSceneHistory} = workspace;

    const previousScene = selectedSceneHistory[selectedSceneHistory.length - 1];
    if (previousScene) {
      this.selectScene(previousScene);
      popNavigationStack();
    }
  };

  handleSelectedScene = (sceneId) => {
    const {pushToNavigationStack, scene} = this.props;

    const newScene = this.getSceneForSceneId(sceneId);
    pushToNavigationStack(scene);
    this.selectScene(newScene);
  };

  selectScene(newScene) {
    const {setSelectedSceneId, openProjectFile, project} = this.props;
    const {currentFile} = project;
    if (newScene.customProperties.sourceID !== currentFile) {
      openProjectFile(newScene.customProperties.sourceID, newScene.id).catch(err => log.error(err));
    } else {
      setSelectedSceneId(newScene.id);
    }
  }

  getSceneForSceneId(sceneId) {
    const { project } = this.props;
    const { json } = project;
    const { scenes } = json;
    return _.find(scenes, (s) => {
      return s.id === sceneId;
    })
  }

  render() {
    const {
      scene,
      project,
      workspace,
      updateSceneAction,
      deleteHearCommand,
      deleteActionCommand
    } = this.props;

    const {selectedSceneHistory} = workspace;

    const {
      action,
      target,
      utterances,
      editingIndex,
      type,
      isShowingNewActionForm
    } = this.state;

    const actions = getActions(scene);

    const regularActions = actions.reduce((acc, action) => {
      if (!action.sourceScene || scene.id === action.sourceScene) {
        acc.push(action);
      }
      return acc;
    }, []);

    const formActions = {
      save: this.save,
      cancel: this.cancel
    };

    return (
      <div className={styles.container}>
        {selectedSceneHistory.length > 0 ? (
          <span className={styles.gotoWrapper}>
            <button
              className={styles.sceneAction}
              onClick={this.handleBackClick}
            >
              <Icon name="arrow left"/>
              Go back to <em>{selectedSceneHistory[selectedSceneHistory.length - 1].id}</em></button>
          </span>
        ) : null}
        {actions.length === 0 ? (
          <p className={styles.notDefined}>User responses not defined.</p>
        ) : null}
        <ul className={styles.actionsList}>
          {regularActions.map((choice, i) => (
            <Action
              key={i}
              {...choice}
              scene={scene}
              project={project}
              isEditing={editingIndex === i}
              edit={this.setEditingIndex(i)}
              cancel={this.setEditingIndex(null)}
              updateSceneAction={updateSceneAction}
              deleteHearCommand={deleteHearCommand}
              deleteActionCommand={deleteActionCommand}
              setSelectedSceneId={this.handleSelectedScene}
            />
          ))}
        </ul>
        {isShowingNewActionForm ? (
          <WorkspaceGuidedWrapper isEditing actions={formActions}>
            <WorkspaceGuidedActionForm
              action={action}
              target={target}
              project={project}
              gotoTarget={null}
              saveAndGoTarget={null}
              utterances={utterances}
              hideUtterances={type === 'choice'}
              handleChangeTarget={this.handleChangeTarget}
              handleChangeAction={this.handleChangeAction}
              handleChangeUtterances={this.handleChangeUtterances}
            />
          </WorkspaceGuidedWrapper>
        ) : (
          <div className={styles.actions}>
            <a role="button" href="#" onClick={this.appendHearAction}>Add Hear Action</a>
            <a role="button" href="#" onClick={this.appendAction}>Add Action</a>
          </div>
        )}
      </div>
    );
  }
}

WorkspaceGuidedActions.propTypes = {
  scene: PropTypes.object.isRequired,
  project: PropTypes.object.isRequired,
  workspace: PropTypes.object.isRequired,
  updateSceneAction: PropTypes.func.isRequired,
  setSelectedSceneId: PropTypes.func.isRequired,
  pushToNavigationStack: PropTypes.func.isRequired,
  popNavigationStack: PropTypes.func.isRequired,
  deleteHearCommand: PropTypes.func.isRequired,
  deleteActionCommand: PropTypes.func.isRequired,
  openProjectFile: PropTypes.func.isRequired,
};

export default WorkspaceGuidedActions;
