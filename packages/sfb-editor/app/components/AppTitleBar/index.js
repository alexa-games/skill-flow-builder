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
import { remote, ipcRenderer } from 'electron';
import PropTypes from 'prop-types';
import { Icon, Dropdown, Popup, Button } from 'semantic-ui-react';

import { LOCALE_LIST } from '../../data/constants';
import { WorkspacePrimaryMode } from '../../data/enums';

import styles from './styles.css';
import log from 'electron-log';

const {Menu} = remote;

class AppTitleBar extends React.PureComponent {
  componentDidMount() {
    // Attach toggle stack views ipc listener
    ipcRenderer.on('new-project', () => this.handleSelectProjectAction('new'));
    ipcRenderer.on('open-project', () => this.handleSelectProjectAction('open'));
    ipcRenderer.on('explore-folder', () => this.handleSelectProjectAction('explore'));
    ipcRenderer.on('build', () => this.handleSelectBuildAction('build project'));
    ipcRenderer.on('close-project', () => this.handleSelectProjectAction('close'));
  }

  handleSelectProjectAction = value => {
    const {project, newProject, openProject, onProjectClose, onProjectOpen, saveProjectFile } = this.props;

    if (value === 'new') {
      newProject();
    } else if (value === 'open') {
      onProjectOpen();
    } else if (value === 'explore') {
      remote.shell.openItem(project.location);
    } else if (value === 'close') {
      onProjectClose();
    } else if (value === 'save') {
      saveProjectFile();
    }
  };

  handleSelectBuildAction = value => {
    const { buildProject, deployProject, uploadResources } = this.props;

    if (value === 'build project') {
      buildProject();
    } else if (value === 'deploy project') {
      deployProject();
    } else if (value === 'upload resources') {
      uploadResources();
    }
  };

  handlePrimaryModeChange = value => {
    const {setPrimaryMode, simulator, exitSimulator} = this.props;

    setPrimaryMode(value);

    // Stop the simulator if it is running if you click on a non-simulator tab
    const { isRunning } = simulator;
    if(isRunning && value !== WorkspacePrimaryMode.Simulator) {
      exitSimulator();
    }
  };

  handleChangeLocale = (e, data) => {
    const { setCurrentLocale } = this.props;

    setCurrentLocale(data.value);
  };

  handleUndo = () => {
    const { workspace } = this.props;
    const { editorReference } = workspace;

    if (editorReference) {
      const undoManager = editorReference.session.getUndoManager();

      undoManager.undo(editorReference.session, true);
    }
  };

  toggleProjectActions = enabled => {
    const currentMenu = Menu.getApplicationMenu();
    const toggleCommands = [
      'menu-save',
      'menu-save-as',
      'menu-build',
      'menu-close-project'
    ];
    toggleCommands.forEach(menuCommand => {
      const menuItem = currentMenu.getMenuItemById(menuCommand);
      menuItem.enabled = enabled;
    });
  };

  render() {
    const {locale, project, workspacePrimaryMode} = this.props;

    if (project.location) {
      this.toggleProjectActions(true);
    } else {
      this.toggleProjectActions(false);
    }

    return (
      // double clicking app title bar expands the window in OSX
      <header className={styles.container}>
        <div className={styles.leftSide}>
          <Popup
            size="tiny"
            content="New project"
            key="New"
            position="top center"
            trigger={
              <Button
                className={styles.toolboxButton}
                compact
                icon="file"
                onClick={() => this.handleSelectProjectAction('new')}
              />
            }
          />
          <Popup
            size="tiny"
            content="Save project"
            key="Save"
            position="top center"
            trigger={
              <Button
                className={styles.toolboxButton}
                compact
                icon="save"
                onClick={() => this.handleSelectProjectAction('save')}
              />
            }
          />
          <Popup
            size="tiny"
            content="Open project"
            key="Open"
            position="top center"
            trigger={
              <Button
                className={styles.toolboxButton}
                compact
                icon="folder open"
                onClick={() => this.handleSelectProjectAction('open')}
              />
            }
          />
          { (workspacePrimaryMode === WorkspacePrimaryMode.Source || workspacePrimaryMode === WorkspacePrimaryMode.Guided) ?
            <React.Fragment>
              &nbsp;
                <div
                style={{
                width: '1px',
                height: '20px',
                margin: '2px 0',
                background: '#aaa'
              }}
                />
                &nbsp;
                <Popup
                size="tiny"
                content="Undo last edit"
                key="Undo"
                position="top center"
                trigger={
                <Button
                  className={styles.toolboxButton}
                  compact
                  icon="undo"
                  onClick={() => this.handleUndo()}
                />
              }
              />
            </React.Fragment>
            : null
          }

        </div>
        <div className={styles.middle} />
        <div className={styles.rightSide}>
          {/* locale menu */}
          { (workspacePrimaryMode === WorkspacePrimaryMode.Writer || workspacePrimaryMode === WorkspacePrimaryMode.Simulator) ?
              <Dropdown
              scrolling
              value={locale}
              disabled={ !(workspacePrimaryMode === WorkspacePrimaryMode.Writer || workspacePrimaryMode === WorkspacePrimaryMode.Simulator) }
              className={styles.localeSelector}
              onChange={this.handleChangeLocale}
              options={LOCALE_LIST.map(l => ({ key: l, value: l, text: l }))}
            />
            : null
          }

          <div className={styles.primaryMode}>
            <Popup
              size="tiny"
              position="bottom center"
              content="Source"
              trigger={
                <button
                  type="button"
                  onClick={() => this.handlePrimaryModeChange(WorkspacePrimaryMode.Source)}
                  className={
                    workspacePrimaryMode === WorkspacePrimaryMode.Source ? styles.isSelected : null
                  }
                >
                  <Icon size="large" name="code" />
                </button>
              }
            />
            <Popup
              size="tiny"
              position="bottom center"
              content="Guided"
              trigger={
                <button
                  type="button"
                  onClick={() => this.handlePrimaryModeChange(WorkspacePrimaryMode.Guided)}
                  className={
                    workspacePrimaryMode === WorkspacePrimaryMode.Guided ? styles.isSelected : null
                  }
                >
                  <Icon size="large" name="compass" />
                </button>
              }
            />
            <Popup
              size="tiny"
              position="bottom center"
              content="Simulate"
              trigger={
                <button
                  type="button"
                  onClick={() => {
                    this.handlePrimaryModeChange(WorkspacePrimaryMode.Simulator)
                  }}
                  className={
                    workspacePrimaryMode === WorkspacePrimaryMode.Simulator ? styles.isSelected : null
                  }
                >
                  <Icon size="large" name="play" />
                </button>
              }
            />
          </div>

        </div>
      </header>
    );
  }
}

AppTitleBar.propTypes = {
  locale: PropTypes.string.isRequired,
  project: PropTypes.object.isRequired,
  build: PropTypes.object.isRequired,
  simulator: PropTypes.object.isRequired,
  newProject: PropTypes.func.isRequired,
  openProject: PropTypes.func.isRequired,
  deployProject: PropTypes.func.isRequired,
  exitSimulator: PropTypes.func.isRequired,
  workspace: PropTypes.object.isRequired,
  setPrimaryMode: PropTypes.func.isRequired,
  startSimulator: PropTypes.func.isRequired,
  resumeSimulator: PropTypes.func.isRequired,
  setCurrentLocale: PropTypes.func.isRequired,
  sendSimulatorCommand: PropTypes.func.isRequired,
  workspacePrimaryMode: PropTypes.string.isRequired,
  closeProject: PropTypes.func.isRequired,
  buildProject: PropTypes.func.isRequired,
  onProjectClose: PropTypes.func.isRequired,
  onProjectOpen: PropTypes.func.isRequired,
  uploadResources: PropTypes.func.isRequired,
  isProjectLoaded: PropTypes.bool.isRequired
};

export default AppTitleBar;
