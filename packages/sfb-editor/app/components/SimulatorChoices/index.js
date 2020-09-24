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
import { Button, Input, Form, Card } from 'semantic-ui-react';

import styles from './styles.css';

function getSlotType(option, scene) {
  const slotRegex = /{(.*?)}/g;
  const regexResult = slotRegex.exec(option);

  if (
    !scene ||
    !scene.contents ||
    !scene.contents[0] ||
    !scene.contents[0].sceneDirections
  ) {
    return 'UnknownSlotType';
  }

  const slotName = regexResult[1];
  const slots = scene.contents[0].sceneDirections.filter(
    ({ directionType }) => directionType === 'slot'
  );

  const slotType = slots.reduce(
    (acc, { parameters }) =>
      parameters.variableName === slotName ? parameters.variableType : acc,
    ''
  );

  return slotType;
}

class SlotInput extends React.PureComponent {
  state = {
    value: ''
  };

  onChangeInput = e => {
    this.setState({ value: e.target.value });
  };

  render() {
    const { option, project, simulator, sendSimulatorCommand } = this.props;
    const { value } = this.state;

    const targetId = simulator.response.id.toLowerCase();

    const scene = project.json.scenes.find(
      ({ id }) => id.toLowerCase() === targetId
    );
    const slotType = getSlotType(option, scene);

    const action = (
      <Button icon="play" size="medium" color="blue" type="submit" />
    );

    return (
      <Form onSubmit={() => sendSimulatorCommand(value)}>
        <Input
          type="text"
          size="small"
          value={value}
          action={action}
          placeholder={slotType}
          onChange={this.onChangeInput}
          className={styles.slotValueInput}
        />
      </Form>
    );
  }
}

SlotInput.propTypes = {
  option: PropTypes.string.isRequired,
  project: PropTypes.object.isRequired,
  simulator: PropTypes.object.isRequired,
  sendSimulatorCommand: PropTypes.func.isRequired
};

function Choice(props) {
  const { options, project, simulator, sendSimulatorCommand } = props;

  const option = options[0];
  const slotRegex = /{(.*?)}/g;

  return option.search(slotRegex) > -1 ? (
    <SlotInput
      option={option}
      project={project}
      simulator={simulator}
      sendSimulatorCommand={sendSimulatorCommand}
    />
  ) : (
    <Button
      size="medium"
      color="blue"
      onClick={() => sendSimulatorCommand(option)}
    >
      {option}
    </Button>
  );
}

Choice.propTypes = {
  options: PropTypes.array.isRequired,
  project: PropTypes.object.isRequired,
  simulator: PropTypes.object.isRequired,
  sendSimulatorCommand: PropTypes.func.isRequired
};

function SimulatorChoices(props) {
  const { choices, project, simulator, sendSimulatorCommand } = props;

  return choices.length > 0 ? (
    <Card fluid>
      {
        <div className={styles.choiceBoxLayout}>
          {' '}
          {choices.map(options => (
            <div key={options[0]}>
              <Choice
                key={options[0]}
                options={options}
                project={project}
                simulator={simulator}
                sendSimulatorCommand={sendSimulatorCommand}
              />
            </div>
          ))}
        </div>
      }
    </Card>
  ) : null;
}

SimulatorChoices.propTypes = {
  choices: PropTypes.array.isRequired,
  project: PropTypes.object.isRequired,
  simulator: PropTypes.object.isRequired,
  sendSimulatorCommand: PropTypes.func.isRequired
};

export default SimulatorChoices;
