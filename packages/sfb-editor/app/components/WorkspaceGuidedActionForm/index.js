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
import { Icon, Dropdown, Button } from 'semantic-ui-react';
import TextAreaAutoSize from '../UI/TextAreaAutoSize';

import styles from './styles.css';

const ACTION_OPTIONS = [
  {
    key: SceneDirectionType.GO_TO,
    text: 'Go To Scene',
    icon: 'arrow right',
    value: SceneDirectionType.GO_TO
  },
  {
    key: SceneDirectionType.SAVE_AND_GO,
    text: 'Save & Go To Scene',
    icon: 'retweet',
    value: SceneDirectionType.SAVE_AND_GO
  },
  {
    key: SceneDirectionType.RESTART,
    text: 'Restart',
    icon: 'arrow right',
    value: SceneDirectionType.RESTART
  },
  {
    key: SceneDirectionType.PAUSE,
    text: 'Pause',
    icon: 'arrow right',
    value: SceneDirectionType.PAUSE
  },
  {
    key: SceneDirectionType.RESUME,
    text: 'Resume',
    icon: 'arrow right',
    value: SceneDirectionType.RESUME
  },
  {
    key: SceneDirectionType.REPEAT,
    text: 'Repeat',
    icon: 'arrow right',
    value: SceneDirectionType.REPEAT
  },
  {
    key: SceneDirectionType.REPROMPT,
    text: 'Reprompt',
    icon: 'arrow right',
    value: SceneDirectionType.REPROMPT
  },
  {
    key: SceneDirectionType.BACK,
    text: 'Back',
    icon: 'arrow right',
    value: SceneDirectionType.BACK
  },
  {
    key: SceneDirectionType.END,
    text: 'End',
    icon: 'arrow right',
    value: SceneDirectionType.END
  },
  {
    key: SceneDirectionType.RETURN,
    text: 'Return',
    icon: 'arrow right',
    value: SceneDirectionType.RETURN
  }
];

class WorkspaceGuidedActionForm extends React.PureComponent {
  state = {
    targetOptions: [],
    newTarget: null
  };

  componentDidMount() {
    const {project} = this.props;

    const targetOptions = project.json.scenes.map(scene => ({
      key: scene.id,
      text: scene.id,
      value: scene.id
    }));

    this.setState({
      targetOptions
    })
  }

  handleAddItem = (e, { value }) => {
    const newValue = `${value}*`;
    this.setState({
      newTarget: { text: newValue, value, key: 'new' }
    })
  };

  render() {
    const {
      remove,
      action,
      target,
      project,
      utterances,
      handleChangeTarget,
      handleChangeAction,
      handleChangeUtterances,
      hideUtterances = false
    } = this.props;

    const { targetOptions, newTarget } = this.state;
    const targetList = targetOptions.slice();
    if (newTarget) {
      targetList.unshift(newTarget);
    }

    return (
      <div className={styles.container}>
        <div className={styles.form}>
          {hideUtterances ? (
            <div>
              <label htmlFor="hear-utterances">
                Utterances
                <small>Place each utterance on a separate line</small>
              </label>
              <TextAreaAutoSize
                id="hear-utterances"
                defaultValue={utterances}
                onChange={handleChangeUtterances}
                placeholder="Enter utterances here..."
              />
            </div>
          ) : null}
          <div>
            <label htmlFor="hear-action">Action</label>
            <Dropdown
              fluid
              selection
              id="hear-action"
              value={action}
              options={ACTION_OPTIONS}
              placeholder="Select Action Type"
              onChange={handleChangeAction}
            />
          </div>
          {!action ||
          action === SceneDirectionType.GO_TO ||
          action === SceneDirectionType.SAVE_AND_GO ? (
            <div style={{display: 'flex'}}>
              <div style={{flexGrow: '1'}}>
                <label htmlFor="hear-action-target">Action Target</label>
                <Dropdown
                  fluid
                  search
                  selection
                  value={target}
                  id="hear-action-target"
                  options={targetList}
                  placeholder="Select Action Target"
                  allowAdditions
                  additionLabel={<i>Create new scene: </i>}
                  onAddItem={this.handleAddItem}
                  onChange={handleChangeTarget}
                />
              </div>
            </div>
          ) : null}
        </div>
        <div className={styles.actions}>
          {remove ? (
            <button
              type="button"
              onClick={remove}
              title="Delete Action"
              className={styles.deleteButton}
            >
              <Icon size="large" name="trash"/>
            </button>
          ) : null}
        </div>
      </div>
    );
  }
}

WorkspaceGuidedActionForm.propTypes = {
  action: PropTypes.string,
  target: PropTypes.string,
  utterances: PropTypes.string,
  hideUtterances: PropTypes.bool,
  project: PropTypes.object.isRequired
};

export default WorkspaceGuidedActionForm;
