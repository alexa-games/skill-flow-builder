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
import { Card, Button } from 'semantic-ui-react';

function SimulatorRequiredChoices(props) {
  const { sendSimulatorCommand } = props;

  return (
    <Card fluid>
      <Button.Group basic>
        <Button
          disabled
          size="huge"
          onClick={() => sendSimulatorCommand('help')}
        >
          Help
        </Button>
        <Button
          disabled
          size="huge"
          onClick={() => sendSimulatorCommand('stop')}
        >
          Stop
        </Button>
        <Button
          disabled
          size="huge"
          onClick={() => sendSimulatorCommand('cancel')}
        >
          Cancel
        </Button>
        <Button
          disabled
          size="huge"
          onClick={() => sendSimulatorCommand('exit')}
        >
          Exit
        </Button>
      </Button.Group>
    </Card>
  );
}

SimulatorRequiredChoices.propTypes = {
  sendSimulatorCommand: PropTypes.func.isRequired
};

export default SimulatorRequiredChoices;
