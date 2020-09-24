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
import { Button, Form, Header, Message, Modal } from 'semantic-ui-react';
import PropTypes from 'prop-types';
import { remote } from 'electron';
import log from 'electron-log';
import path from 'path';

const starterTemplateOptions = [
  {
    text:
      'Blank Project - Start from scratch',
    value: 'blank_project',
    key: 'blank_project',
    name: 'Untitled Project'
  },
  {
    text:
      'Example Story - Great starting point, an interactive fiction hiking story that shows branches, flags, and number slot types',
    value: 'example_story',
    key: 'example_story',
    name: 'Example Story'
  },
  {
    text: 'Tutorial - A step by step feature walk through, displays a wide breadth of available features',
    value: 'tutorial',
    key: 'tutorial',
    name: 'Tutorial'
  },
  {
    text: 'Adventure - A widely branching narrative, shows tree view and widespread choices',
    value: 'adventure',
    key: 'adventure',
    name: 'Adventure'
  },
  {
    text:
      `Quiz Game - Multiple choice quiz with scoring and simulated opponent, uses a custom extension to load questions from a *.csv file, as well as the 'UpdateDynamicEntities' to handle non-static voice model values`,
    value: 'quiz',
    key: 'quiz',
    name: 'Quiz Game'
  }
];

class NewProjectDialog extends React.PureComponent {
  constructor(props, context) {
    super(props, context);

    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleDropdownInputChange = this.handleDropdownInputChange.bind(this);
    this.handleFindDirectory = this.handleFindDirectory.bind(this);
    this.handleOk = this.handleOk.bind(this);
    this.handleModalOpen = this.handleModalOpen.bind(this);
  }

  state = {
    projectPath: '',
    projectName: 'Untitled Project',
    projectTemplate: 'blank_project'
  };

  getDefaultProjectPath = () => {
    const { app } = remote;
    return app.getPath('documents');
  };

  handleInputChange(event) {
    const { target } = event;
    const { value, name } = target;

    this.setState({
      [name]: value
    });
  }

  handleDropdownInputChange(event, data) {
    const { value, name } = data;

    this.setState({
      [name]: value
    });
  }

  handleFindDirectory(event) {
    const { dialog, getCurrentWindow } = remote;

    const { projectPath } = this.state;

    event.preventDefault();

    const win = getCurrentWindow();
    const folderPaths = dialog.showOpenDialog(win, {
      title: 'New Project',
      defaultPath: projectPath,
      properties: ['openDirectory', 'createDirectory'],
      filters: [
        {
          name: 'Projects',
          extensions: ['abc']
        }
      ]
    });

    if (!folderPaths) {
      log.info('User did not select a folder.');
      return;
    }
    this.setState({
      projectPath: folderPaths[0]
    });
  }

  handleOk() {
    const { closeNewProjectModal, newProjectAtLocation } = this.props;

    const { projectPath, projectName, projectTemplate } = this.state;

    newProjectAtLocation(
      path.resolve(projectPath, projectName),
      projectTemplate
    );
    closeNewProjectModal();
  }

  handleModalOpen() {
    const projectPath = this.getDefaultProjectPath();
    this.setState({
      projectPath
    });
  }

  render() {
    const { isNewProjectModalOpen, closeNewProjectModal } = this.props;

    const { projectPath, projectName, projectTemplate } = this.state;

    const newProjectForm = 'new-project-form';
    const projectNameId = 'projectNameId';
    const projectPathId = 'projectPathId';
    const projectTemplateId = 'projectTemplateId';

    return (
      <Modal
        open={isNewProjectModalOpen}
        onMount={this.handleModalOpen}
        centered={false}
      >
        <Modal.Header>Create New Project</Modal.Header>
        <Modal.Content>
          <Modal.Description style={{ width: '100%' }}>
            <Header>
              Choose a project name, directory, and starter template
            </Header>
            <Form id={newProjectForm} onSubmit={this.handleOk}>
              <Form.Field>
                <label htmlFor={projectNameId}>Project name</label>
                <input
                  id={projectNameId}
                  placeholder="Project name"
                  name="projectName"
                  value={projectName}
                  onChange={this.handleInputChange}
                />
              </Form.Field>
              <Form.Field>
                <label htmlFor={projectPathId} style={{ cursor: 'pointer' }}>
                  Project directory
                </label>
                <div className="ui action input">
                  <input
                    id={projectPathId}
                    placeholder="Project directory"
                    name="projectPath"
                    value={projectPath}
                    style={{ cursor: 'pointer' }}
                    readOnly
                    onClick={this.handleFindDirectory}
                  />
                  <button
                    type="button"
                    className="ui icon button"
                    style={{ cursor: 'pointer' }}
                    onClick={this.handleFindDirectory}
                  >
                    <i aria-hidden="true" className="search icon" />
                  </button>
                </div>
              </Form.Field>
              <Form.Field>
                <label htmlFor={projectTemplateId}>Starter template</label>
                <Form.Select
                  fluid
                  options={starterTemplateOptions}
                  id={projectTemplateId}
                  placeholder="example_story"
                  name="projectTemplate"
                  value={projectTemplate}
                  onChange={this.handleDropdownInputChange}
                />
              </Form.Field>
            </Form>
            <Message>
              <Message.Header>Your project will be created at</Message.Header>
              <p>{path.resolve(projectPath, projectName)}</p>
            </Message>
          </Modal.Description>
        </Modal.Content>
        <Modal.Actions>
          <Button onClick={closeNewProjectModal}>Cancel</Button>
          <Button primary content="Ok" type="submit" form={newProjectForm} />
        </Modal.Actions>
      </Modal>
    );
  }
}

NewProjectDialog.propTypes = {
  isNewProjectModalOpen: PropTypes.bool.isRequired,
  closeNewProjectModal: PropTypes.func.isRequired,
  newProjectAtLocation: PropTypes.func.isRequired
};

export default NewProjectDialog;
