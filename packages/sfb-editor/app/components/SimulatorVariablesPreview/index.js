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
import { Button, Icon, Table } from 'semantic-ui-react';
import log from 'electron-log';
import styles from './styles.css';

class SimulatorVariablesPreview extends React.PureComponent {

  state = {
    editingVariable: "",
    editingVariableValue: undefined
  }

  handleInputChange = (event) => {
    const { target } = event;
    const { value } = target;

    this.setState({
      editingVariableValue: value
    });
  }

  onSaveVariable = (variableName, val) => {

    const { sendSimulatorCommand } = this.props;

    sendSimulatorCommand(`!set ${variableName}=${val}`, true);

    this.setState({ editingVariable: ""});
  }

  onCancelVariable = () => {
    this.setState({ editingVariable: "" });
  }

  onEditVariable = (variableName, val) => {
    this.setState({ editingVariable: variableName, editingVariableValue: val });
  }

  render() {
    const { simulator } = this.props;
    const { editingVariable, editingVariableValue } = this.state;

    log.info(simulator);

    const storyState = simulator && simulator.response && simulator.response.storyState ? simulator.response.storyState : {};
    const previousStoryState = simulator && simulator.response && simulator.response.previousStoryState ? simulator.response.previousStoryState : {};

    return (
      <Table striped>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Variable Name</Table.HeaderCell>
            <Table.HeaderCell>Old Value</Table.HeaderCell>
            <Table.HeaderCell>Current Value</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {Object.keys(storyState).map(keyName => {
            if (keyName.startsWith('system_')) {
              return;
            }

            const val = JSON.stringify(storyState[keyName]);

            let previousVal = '';
            if (previousStoryState[keyName]) {
              previousVal = JSON.stringify(previousStoryState[keyName]);
            }

            // Highlights rows that have difference between their old and new values
            return (
              <Table.Row key={keyName} warning={previousVal !== val}>
                <Table.Cell>{keyName}</Table.Cell>
                <Table.Cell>{previousVal}</Table.Cell>

                { editingVariable === keyName ? 
                <Table.Cell>
                  <input
                    id={keyName}
                    name={keyName}
                    value={editingVariableValue}
                    onChange={this.handleInputChange}
                  />

                  <button
                    type="button"
                    title="Save Changes"
                    className={styles.headerButton}
                    onClick={() => {this.onSaveVariable(keyName, editingVariableValue)}}
                  >
                    <Icon name="checkmark" />
                  </button>
                  <button
                    type="button"
                    title="Cancel Changes"
                    className={styles.headerButton}
                    onClick={() => {this.onCancelVariable()}}
                  >
                    <Icon name="cancel" />
                  </button>
                </Table.Cell>                
                :
                <Table.Cell>
                  {val}
                  <button
                    type="button"
                    title="Edit Scene Id"
                    className={styles.headerButton}
                    onClick={() => {this.onEditVariable(keyName, val)}}>
                    <Icon name="pencil" />
                  </button>
                </Table.Cell>
                }
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table>
    );
  }
}

SimulatorVariablesPreview.propTypes = {
  simulator: PropTypes.object.isRequired,
  sendSimulatorCommand: PropTypes.func.isRequired,
};

export default SimulatorVariablesPreview;
