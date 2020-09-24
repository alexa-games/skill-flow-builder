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
import { SceneDirectionType } from '@alexa-games/sfb-f';
import WorkspaceGuidedWrapper from '../WorkspaceGuidedWrapper';
import WorkspaceGuidedActionForm from '../WorkspaceGuidedActionForm';
import WorkspaceGuidedActionSummary from '../WorkspaceGuidedActionSummary';

export class Action extends React.PureComponent {
  state = {
    action: null,
    target: null,
    utterances: ''
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

  edit = () => {
    const {edit, utterances, gotoTarget, saveAndGoTarget, type} = this.props;

    let action = type;

    if (saveAndGoTarget) {
      action = SceneDirectionType.SAVE_AND_GO;
    }

    if (gotoTarget) {
      action = SceneDirectionType.GO_TO;
    }

    const target = gotoTarget || saveAndGoTarget;

    edit();
    this.setState({
      action,
      target,
      utterances: utterances.join('\n')
    });
  };

  save = () => {
    const {
      cancel,
      scene,
      utterances,
      updateSceneAction,
      gotoTarget,
      saveAndGoTarget,
      type
    } = this.props;

    const stateAction = this.state.action;
    const stateTarget = this.state.target;
    const stateUtterances = this.state.utterances;

    const originalGoto = gotoTarget || saveAndGoTarget;

    const originalHear = utterances.filter(s => s.length > 0).join(', ');

    const hear = stateUtterances
      .split('\n')
      .filter(s => s.length > 0)
      .join(', ');

    if ((hear || !(type === 'choice')) && stateTarget && stateAction) {
      updateSceneAction(
        scene.id,
        originalHear,
        originalGoto,
        hear,
        stateTarget,
        stateAction,
        type
      );

      cancel();
      this.setState({
        action: null,
        target: null,
        utterances: ''
      });
    }
  };

  cancel = () => {
    const {cancel} = this.props;

    cancel();
    this.setState({
      action: null,
      target: null,
      utterances: ''
    });
  };

  remove = () => {
    const {
      scene,
      utterances,
      updateSceneAction,
      gotoTarget,
      saveAndGoTarget,
      type,
      deleteHearCommand,
      deleteActionCommand
    } = this.props;

    const originalGoto = gotoTarget || saveAndGoTarget;

    // Build up the original hear from the utterances list
    const originalHear = utterances.filter(s => s.length > 0).join(', ');

    if (type === 'choice') {
      // hear command
      deleteHearCommand(scene.id, originalHear);
    } else {
      deleteActionCommand(scene.id, originalGoto, type)
    }

    this.cancel();
  };

  render() {
    const {
      type,
      project,
      isEditing,
      gotoTarget,
      saveAndGoTarget,
      innerAction
    } = this.props;

    const {action, target, utterances} = this.state;

    const actions = {
      edit: this.edit,
      save: this.save,
      cancel: this.cancel
    };

    const isValidType = ['choice', 'go to', 'save and go'].includes(type);

    return (
      <li>
        {isValidType ? (
          <WorkspaceGuidedWrapper
            actions={actions}
            hideEditButton={innerAction}
            isEditing={isEditing}
          >
            {isEditing ? (
              <WorkspaceGuidedActionForm
                action={action}
                target={target}
                project={project}
                remove={this.remove}
                utterances={utterances}
                gotoTarget={gotoTarget}
                hideEditButton={
                  type ||
                  type === 'choice' ||
                  type === 'go to' ||
                  type === 'save and go'
                }
                saveAndGoTarget={saveAndGoTarget}
                hideUtterances={type === 'choice'}
                handleChangeTarget={this.handleChangeTarget}
                handleChangeAction={this.handleChangeAction}
                handleChangeUtterances={this.handleChangeUtterances}
              />
            ) : (
              <WorkspaceGuidedActionSummary {...this.props} />
            )}
          </WorkspaceGuidedWrapper>
        ) : (
          // invalid tpye
          <WorkspaceGuidedActionSummary {...this.props} />
        )}
      </li>
    );
  }
}
