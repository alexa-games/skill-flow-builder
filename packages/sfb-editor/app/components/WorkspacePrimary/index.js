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

import os from 'os';
import React from 'react';
import PropTypes from 'prop-types';
import { Input, Dropdown, Button, Checkbox, Modal, Icon, List, Menu, Message, Popup } from 'semantic-ui-react';
import { remote, ipcRenderer, shell } from 'electron';
import log from 'electron-log';

import { WorkspacePrimaryMode } from '../../data/enums';
import WorkspacePrimaryHeader from '../WorkspacePrimaryHeader';
import WorkspaceSource from '../WorkspaceSource';
import WorkspaceGuided from '../WorkspaceGuided';
import Simulator from '../../containers/Simulator';

import styles from './styles.css';
import WorkspaceGuidedActions from '../WorkspaceGuidedActions';

const COMMAND_KEY = os.platform() === 'win32' ? 'Ctrl' : '⌘';

class WorkspacePrimary extends React.PureComponent {
  constructor(props) {
    super(props);
    this.checkNodeVersion();
  }

  state = {
    targetFile: null,
    isSaveModalOpen: false,
    isEditingSceneId: false,
    isSaveStateModalOpen: false,
    saveSlot: 'slot-1',
    showNodeError: false,
    invalidSceneName: false
  };

  componentDidMount() {
    const { workspace,
            saveProjectFile,
            saveProjectFileAs
          } = this.props;

    this.setState({
      sceneId: workspace.selectedSceneId
    });

    // Wire up file save and save as click events from the main thread window
    ipcRenderer.on('save-project', () => { saveProjectFile(); } );
    ipcRenderer.on('save-as', () => { saveProjectFileAs(); } );
  }

  invalidSceneContextRef = React.createRef();

  checkNodeVersion = () => {
    const nodeVersion = process.versions.node;
    if (nodeVersion && nodeVersion.indexOf('10.') !== 0) {
      this.setState({showNodeError: true})
    }
  };

  closeSaveModal = () => {
    this.setState({
      targetFile: null,
      isSaveModalOpen: false
    });
  };

  openSaveModal = () => {
    this.setState({ isSaveModalOpen: true });
  };

  saveAndOpenProjectFile = () => {
    const { saveProjectFile, openProjectFile } = this.props;
    const { targetFile } = this.state;

    saveProjectFile()
      .then(() => openProjectFile(targetFile))
      .then(() => this.closeSaveModal())
      .catch(err => log.error(err));
  };

  discardAndOpenProjectFile = () => {
    const { openProjectFile } = this.props;
    const { targetFile } = this.state;

    openProjectFile(targetFile)
      .then(() => this.closeSaveModal())
      .catch(err => log.error(err));
  };

  cancelClickedSaveStateModal = () => {
    this.setState({ isSaveStateModalOpen: false });
  };

  saveClickedSaveStateModal = () => {
    this.setState({ isSaveStateModalOpen: false });

    const { saveSlot } = this.state;

    const {
      project,
      sendSimulatorCommand
    } = this.props;

    sendSimulatorCommand(`!save ${saveSlot}`, true);
  };

  handleSelectFileAction = ({ action, targetFile }) => {
    const {
      project,
      saveProjectFile,
      saveProjectFileAs,
      openProjectFile,
      isProjectUnSaved
    } = this.props;

    if (action === 'open') {
      if (!targetFile || targetFile === project.currentFile) {
        return;
      }
      const isProjectUnsaved = isProjectUnSaved()

      if (isProjectUnsaved) {
        this.setState({ targetFile });
        this.openSaveModal();
      } else {
        openProjectFile(targetFile).catch(err => log.error(err));
      }
    } else if (action === 'save') {
      saveProjectFile();
    } else if (action === 'save as') {
      saveProjectFileAs();
    }
  };

  onSceneIdChange = (e, { value }) => {
    this.setState({
      sceneId: value
    });
  };

  onEditSceneIdClicked = () => {
    const { workspace } = this.props;

    this.setState({
      sceneId: workspace.selectedSceneId,
      isEditingSceneId: true
    });
  };

  onSaveSceneIdClicked = () => {
    const { changeSceneId } = this.props;
    const { sceneId } = this.state;

    if (!sceneId.match(/(\S+?)/gi)) {
      this.setState({
        invalidSceneName: true
      });
      return;
    }

    // Update the scene id
    changeSceneId(sceneId);

    this.setState({ isEditingSceneId: false, invalidSceneName: false });
  };

  onCancelSceneIdClicked = () => {
    this.setState({ isEditingSceneId: false, invalidSceneName: false });
  };

  restartSimulator = () => {
    const {
      sendSimulatorCommand
    } = this.props;

    sendSimulatorCommand(`!restart`);
  };

  backSimulator = () => {
    const {
      sendSimulatorCommand
    } = this.props;

    sendSimulatorCommand(`!back`);
  };

  saveSimulator = () => {
    this.setState({ isSaveStateModalOpen: true });
  };

  onSaveSlotChanged = (e, data) => {
    this.setState({saveSlot: data.value});
  };

  handleKeyUp = syntheticEvent => {
    if (syntheticEvent.keyCode === 13) {
      // enter
      this.onSaveSceneIdClicked();
    }
    if (syntheticEvent.keyCode === 27) {
      // escape
      this.onCancelSceneIdClicked();
    }
  };

  openExternal = (link) => () => {
    shell.openExternal(link);
  };

  render() {
    const {
      project,
      workspace,
      simulator,
      newProject,
      openProject,
      exitSimulator,
      startSimulator,
      saveProjectFile,
      resumeSimulator,
      setSelectedSceneId,
      setSyntaxErrors,
      updateProjectSource,
      importProjectSource,
      sendSimulatorCommand,
      updateSceneAction,
      openProjectLocation,
      pushToNavigationStack,
      popNavigationStack,
      setEditorReference,
      isProjectUnSaved,
      updateSceneCommand,
      deleteHearCommand,
      deleteActionCommand,
      openProjectFile
    } = this.props;

    const { sceneId, isSaveModalOpen, isSaveStateModalOpen, isEditingSceneId, saveSlot, showNodeError } = this.state;

    const isProjectUnsaved = isProjectUnSaved();

    let content;
    const mode = workspace.primaryMode;
    const { isRunning } = simulator;

    switch (mode) {
      case WorkspacePrimaryMode.Guided:
        content = (
          <WorkspaceGuided
            project={project}
            workspace={workspace}
            className={styles.guided}
            resumeSimulator={resumeSimulator}
            setSelectedSceneId={setSelectedSceneId}
            importProjectSource={importProjectSource}
            updateProjectSource={updateProjectSource}
            updateSceneAction={updateSceneAction}
            sendSimulatorCommand={sendSimulatorCommand}
            pushToNavigationStack={pushToNavigationStack}
            popNavigationStack={popNavigationStack}
            updateSceneCommand={updateSceneCommand}
            deleteHearCommand={deleteHearCommand}
            deleteActionCommand={deleteActionCommand}
            openProjectFile={openProjectFile}
          />
        );
        break;
      case WorkspacePrimaryMode.Simulator:
        content = (
          <Simulator />
        );
        break;
      default:
        content = null;
    }

    const classList = [
      styles.container,
      mode === WorkspacePrimaryMode.Simulator ? styles.simulatorIsRunning : null
    ];

    if (!project.location) {
      const { recentProjectList } = workspace;
      const Projects = recentProjectList.map(p => (
        <List.Item key={p.path} onClick={() => openProjectLocation(p.path, true)}>
          <List.Icon
            name="folder outline"
            size="large"
            verticalAlign="middle"
          />
          <List.Content>
            <List.Header as="a">{p.name}</List.Header>
            <List.Description as="a">{p.path}</List.Description>
          </List.Content>
        </List.Item>
      ));

      return (
        <div className={classList.join(' ')}>
          {showNodeError ? (
            <div className={styles.bannerMessageContainer}>
              <Message negative className={styles.bannerMessage}>
                <Message.Header>Incompatible Nodejs version detected</Message.Header>
                <p>Features of this app require nodejs 10.x or newer. <a href="#" onClick={this.openExternal('https://nodejs.org/en/download/')}>Download installer.</a></p>
              </Message>
            </div>
          ) : null}
          <div className={styles.openProjectMessage}>
            <Button
              primary
              size="huge"
              className={['spaced', styles.minWidthButton].join(' ')}
              onClick={newProject}
            >
              New Project
            </Button>
            <Button
              size="huge"
              className={['spaced', styles.minWidthButton].join(' ')}
              onClick={openProject}
            >
              Open a Project
            </Button>
            <h3>Recent Projects</h3>
            <List divided relaxed className={styles.projectList}>
              {Projects}
            </List>
          </div>
        </div>
      );
    }

    return (
      <div className={classList.join(' ')}>
        <WorkspacePrimaryHeader>
          {/* source mode */
          mode === WorkspacePrimaryMode.Source ? (
            <React.Fragment>
              <Dropdown
                simple
                scrolling
                text="File"
                direction="right"
                selectOnBlur={false}
                selectOnNavigation={false}
                className={styles.fileSelector}
              >
                <Dropdown.Menu>
                  {project.allProjectFileNames.reduce((acc, text) => {
                    const props = {
                      text,
                      key: text,
                      icon: 'file',
                      onClick: () =>
                        this.handleSelectFileAction({
                          action: 'open',
                          targetFile: text
                        })
                    };

                    if (text === project.currentFile) {
                      props.disabled = true;
                    }

                    acc.push(<Dropdown.Item {...props} />);
                    return acc;
                  }, [])}
                </Dropdown.Menu>
              </Dropdown>
              {/* file name */}
              <strong className={styles.fileName}>
                {project.currentFile}
                {isProjectUnsaved ? '*' : null}
              </strong>
            </React.Fragment>
          ) : null}
          {/* guided mode */
          mode === WorkspacePrimaryMode.Guided ? (
            <div className={styles.sceneNameContainer}>
              <div ref={this.invalidSceneContextRef}>
                Scene:</div>
              {isEditingSceneId ? (
                <React.Fragment>
                  <Input
                    value={sceneId}
                    className={styles.sceneIdInput}
                    onChange={this.onSceneIdChange}
                    onKeyUp={this.handleKeyUp}
                  />
                  <button
                    type="button"
                    title="Save Changes"
                    className={styles.headerButton}
                    onClick={this.onSaveSceneIdClicked}
                  >
                    <Icon name="checkmark" />
                  </button>
                  <button
                    type="button"
                    title="Cancel Changes"
                    className={styles.headerButton}
                    onClick={this.onCancelSceneIdClicked}
                  >
                    <Icon name="cancel" />
                  </button>
                </React.Fragment>
              ) : null}
              {!isEditingSceneId ? (
                <h3 className={styles.headerSceneId}>
                  {workspace.selectedSceneId}
                  <button
                    type="button"
                    title="Edit Scene Id"
                    className={styles.headerButton}
                    onClick={this.onEditSceneIdClicked}
                  >
                    <Icon name="pencil" />
                  </button>
                </h3>
              ) : null}
              <Popup
                context={this.invalidSceneContextRef}
                content="Oops! The scene name can't be blank and can't start with a space."
                position='top left'
                open={this.state.invalidSceneName}
                className={styles.invalidSceneName}
              />
            </div>
          ) : null}
          {/* simulator mode */
          mode === WorkspacePrimaryMode.Simulator && isRunning ? (
            <>
            <div className={styles.simulatorHeaderContainer}>
              <button type="button" onClick={this.restartSimulator}>
                <Icon name="fast backward" />
              </button>
              <button type="button" onClick={this.backSimulator}>
                <Icon name="step backward" />
              </button>
              <button type="button" onClick={this.saveSimulator}>
                <Icon name="save" />
              </button>
              <strong>{workspace.selectedSceneId}</strong>
            </div>
            <button type="button" onClick={exitSimulator}>
              <Icon name="close" />
            </button>
            </>
        ) : null}
        </WorkspacePrimaryHeader>

        {/* We need the source mode / ace editor to always be instantiated because it is the source of truth for some of the content and will be for all soon */}
        <div className={mode === WorkspacePrimaryMode.Source ? styles.content : styles.aceEditorHidden}>
          <WorkspaceSource
            project={project}
            workspace={workspace}
            setSyntaxErrors={setSyntaxErrors}
            setSelectedSceneId={setSelectedSceneId}
            updateProjectSource={updateProjectSource}
            setEditorReference={setEditorReference}
          />
        </div>
        <div className={mode === WorkspacePrimaryMode.Source ? styles.aceEditorHidden : styles.content}>{content}</div>

        <Modal size="tiny" open={isSaveModalOpen}>
          <Modal.Header>Save Current File</Modal.Header>
          <Modal.Content>
            Do you want to save any changes to the file you are currently
            working on?
          </Modal.Content>
          <Modal.Actions>
            <Button onClick={this.discardAndOpenProjectFile}>
              Discard Changes
            </Button>
            <Button primary onClick={this.saveAndOpenProjectFile}>
              Save Changes
            </Button>
          </Modal.Actions>
        </Modal>

        <Modal size="tiny" open={isSaveStateModalOpen}>
          <Modal.Header>Save Simulator State</Modal.Header>
          <Modal.Content>
            Save current simulator state to:&nbsp;

            <Dropdown
              value={saveSlot}
              onChange={this.onSaveSlotChanged}

              options={[{ key: "slot-1", value: "slot-1", text: "Slot 1" },
                { key: "slot-2", value: "slot-2", text: "Slot 2" },
                { key: "slot-3", value: "slot-3", text: "Slot 3" },
                { key: "slot-4", value: "slot-4", text: "Slot 4" },
                { key: "slot-5", value: "slot-5", text: "Slot 5" }
            ]}
            />

          </Modal.Content>
          <Modal.Actions>
            <Button onClick={this.cancelClickedSaveStateModal}>
              Cancel
            </Button>
            <Button primary onClick={() => this.saveClickedSaveStateModal()}>
              Save
            </Button>
          </Modal.Actions>
        </Modal>

      </div>
    );
  }
}

WorkspacePrimary.propTypes = {
  project: PropTypes.object.isRequired,
  openProject: PropTypes.func.isRequired,
  newProject: PropTypes.func.isRequired,
  changeSceneId: PropTypes.func.isRequired,
  updateSceneAction: PropTypes.func.isRequired,
  workspace: PropTypes.object.isRequired,
  simulator: PropTypes.object.isRequired,
  startSimulator: PropTypes.func.isRequired,
  resumeSimulator: PropTypes.func.isRequired,
  openProjectFile: PropTypes.func.isRequired,
  resumeSimulatorFromStart: PropTypes.func.isRequired,
  exitSimulator: PropTypes.func.isRequired,
  saveProjectFile: PropTypes.func.isRequired,
  saveProjectFileAs: PropTypes.func.isRequired,
  setSelectedSceneId: PropTypes.func.isRequired,
  setSyntaxErrors: PropTypes.func.isRequired,
  updateProjectSource: PropTypes.func.isRequired,
  importProjectSource: PropTypes.func.isRequired,
  sendSimulatorCommand: PropTypes.func.isRequired,
  setCurrentLocale: PropTypes.func.isRequired,
  openProjectLocation: PropTypes.func.isRequired,
  pushToNavigationStack: PropTypes.func.isRequired,
  popNavigationStack: PropTypes.func.isRequired,
  setEditorReference: PropTypes.func.isRequired,
  isProjectUnSaved: PropTypes.func.isRequired,
  updateSceneCommand: PropTypes.func.isRequired,
  deleteHearCommand: PropTypes.func.isRequired,
  deleteActionCommand: PropTypes.func.isRequired,
};

export default WorkspacePrimary;
