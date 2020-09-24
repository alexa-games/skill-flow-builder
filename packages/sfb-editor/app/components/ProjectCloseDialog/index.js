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
import { Button, Modal } from 'semantic-ui-react';

class ProjectCloseDialog extends React.PureComponent {
  render() {
    const { onOptionSelected, isModalOpen, projectName } = this.props;

    return (
      <Modal open={isModalOpen} centered={false} size="tiny">
        <Modal.Header>
          Do you want to save changes to {projectName}?
        </Modal.Header>
        <Modal.Content>
          <Modal.Description>
            <p>Your changes will be lost if you don’t save them.</p>
          </Modal.Description>
        </Modal.Content>
        <Modal.Actions>
          <Button
            color="red"
            className="left floated"
            content="Don't save"
            onClick={() => onOptionSelected('nosave')}
          />
          <Button onClick={() => onOptionSelected('cancel')}>Cancel</Button>
          <Button
            primary
            content="Save"
            onClick={() => onOptionSelected('save')}
          />
        </Modal.Actions>
      </Modal>
    );
  }
}

ProjectCloseDialog.propTypes = {
  onOptionSelected: PropTypes.func.isRequired,
  isModalOpen: PropTypes.bool.isRequired,
  projectName: PropTypes.string.isRequired
};

export default ProjectCloseDialog;
