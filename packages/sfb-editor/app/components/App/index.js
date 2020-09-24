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

import path from 'path';
import React from 'react';
import PropTypes from 'prop-types';
import { Modal, Button, Image } from 'semantic-ui-react';

import os from 'os';
import { remote } from 'electron';
import settings from 'electron-settings';
import AppRail from '../../containers/AppRail';
import AppTitleBar from '../../containers/AppTitleBar';
import AppFooter from '../../containers/AppFooter';
import Workspace from '../../containers/Workspace';
import LogToaster from '../../containers/LogToaster';

import styles from './styles.css';
import ProjectCloseDialog from '../ProjectCloseDialog';
import loadingImage from '../../logo.png'
import { ProjectState, WorkspacePrimaryMode, WorkspaceSecondaryMode } from '../../data/enums';

const electron = require('electron');

const ApplicationLiveEventIntervalMs = 300000;

const CLOSE_DIALOG_TYPE = {
  PROJECT: 'project',
  WINDOW: 'window',
  OPEN_PROJECT: 'open project'
};

class App extends React.PureComponent {
  platform = os.platform();

  state = {
    isWindowLoading: true,
    showLoadingElement: true,
    closeDialogType: CLOSE_DIALOG_TYPE.PROJECT,
    isCloseProjectDialogOpen: false
  };

  componentWillUnmount() {
    if (!this.closeEventHandler) {
      this.closeEventHandler = this.attachCloseEventHandler();
    }
  }

  componentDidMount() {
    const {project, setSecondaryMode, loggerNotification} = this.props;
    const {location, currentFile} = project;

    if (location) {
      const {openProjectLocationOnBootUp} = this.props;

      openProjectLocationOnBootUp(location, currentFile);
    } else {
      const {setPrimaryMode} = this.props;

      setPrimaryMode(WorkspacePrimaryMode.Source);
    }

    setSecondaryMode(WorkspaceSecondaryMode.News); // Always set secondary mode back to news when starting

    this.closeEventHandler = this.attachCloseEventHandler();

    // Attach toggle stack views ipc listener
    const {ipcRenderer} = electron;
    ipcRenderer.on('toggle-stack-views', this.toggleStackViews);
    ipcRenderer.on('clear-voice-preview-cache', this.clearVoicePreviewCache);
    ipcRenderer.on('log-window', (event, message, data) => {
      loggerNotification({
        type: 'message',
        message
      });
      console.log(message, data);
    });
    ipcRenderer.on('console', (event, message, data) => {
      if (data) {
        console.log(message, data);
      } else {
        console.log(message);
      }
    });

    setTimeout(() => {
      this.setState({
        showLoadingElement: false
      });
    }, 1000);

    setTimeout(() => {
      this.setState({
        isWindowLoading: false
      });
    }, 3000);
  }

  closeEventHandler;

  attachCloseEventHandler() {
    const {getCurrentWindow} = remote;
    return getCurrentWindow().on('close', event => {
      event.preventDefault();
      if (this.noProjectChanges()) {
        return getCurrentWindow().destroy();
      }
      this.setState({
        isCloseProjectDialogOpen: true,
        closeDialogType: CLOSE_DIALOG_TYPE.WINDOW
      });
    });
  }

  noProjectChanges() {
    const {isProjectUnSaved} = this.props;
    return !isProjectUnSaved();
  }

  handleSaveNoSave(action) {
    const {saveProjectFile, discardBackupFiles} = this.props;
    if (action === 'nosave') {
      return discardBackupFiles(false);
    }
    if (action === 'save') {
      return saveProjectFile();
    }
  }

  handleProjectClose() {
    const {closeProject} = this.props;
    if (this.noProjectChanges()) {
      closeProject();
      return;
    }
    this.setState({
      isCloseProjectDialogOpen: true,
      closeDialogType: CLOSE_DIALOG_TYPE.PROJECT
    });
  }

  handleProjectOpen() {
    const {openProject} = this.props;
    if (this.noProjectChanges()) {
      openProject();
      return;
    }
    this.setState({
      isCloseProjectDialogOpen: true,
      closeDialogType: CLOSE_DIALOG_TYPE.OPEN_PROJECT
    });
  }

  handleCloseProjectDialogResponse(action) {
    const {closeProject, openProject} = this.props;
    const {closeDialogType} = this.state;
    const {getCurrentWindow} = remote;
    this.setState({
      isCloseProjectDialogOpen: false
    });
    this.handleSaveNoSave(action).then(() => {
      // eslint-disable-next-line default-case
      switch (closeDialogType) {
        case CLOSE_DIALOG_TYPE.PROJECT:
          closeProject();
          break;
        case CLOSE_DIALOG_TYPE.WINDOW:
          getCurrentWindow().destroy();
          break;
        case CLOSE_DIALOG_TYPE.OPEN_PROJECT:
          openProject();
          break;
      }
      return null;
    }).catch(() => {
    });
  }

  toggleStackViews = () => {
    const {
      workspace,
      setIsStacked,
    } = this.props;

    setIsStacked(!workspace.isStacked);
  };

  clearVoicePreviewCache = () => {
    const {clearVoicePreviewCache} = this.props;

    clearVoicePreviewCache();
  };

  render() {
    const {project, discardBackupFiles, restoreBackupFiles} = this.props;
    const {isWindowLoading, showLoadingElement, isCloseProjectDialogOpen} = this.state;
    return (
      <div className={`${styles.container} platform-${this.platform}`}>
        {isWindowLoading ? (
          <div style={{
            gridArea: 'app-title-bar',
            backgroundColor: 'white',
            display: 'flex',
            flexGrow: '1',
            alignItems: 'center',
            flexDirection: 'column',
            justifyContent: 'center',
            position: 'fixed',
            width: '100vw',
            height: '100vh'
          }}>
            <img alt="loading placeholder"
                 className={showLoadingElement ? styles.fadeShowElement : styles.fadeHideElement} src={loadingImage}
                 style={{height: '100px'}}/>
            <div style={{color: 'white', position: 'absolute', bottom: '20px'}}>The Dutch are da best</div>
          </div>
        ) : (
          <React.Fragment>
            <AppTitleBar
              isProjectLoaded={!!project.location}
              onProjectClose={() => this.handleProjectClose()}
              onProjectOpen={() => this.handleProjectOpen()}
            />
            <AppRail isProjectLoaded={!!project.location}/>
            <ProjectCloseDialog
              isModalOpen={isCloseProjectDialogOpen}
              projectName={project.name}
              onOptionSelected={a => this.handleCloseProjectDialogResponse(a)}
            />
            <Workspace/>
            <AppFooter/>
            <LogToaster/>

            <Modal size="tiny" open={project.isRestoreBackUpModalOpen}>
              <Modal.Header>Restore Unsaved Changes</Modal.Header>
              <Modal.Content>
                <div className={styles.modalContent}>
                  Looks like SFB might have crashed.
                  <br/>
                  <br/>
                  Would you like to restore the autosaved back up file?
                </div>
              </Modal.Content>
              <Modal.Actions>
                <Button onClick={discardBackupFiles}>Discard Back Up File</Button>
                <Button primary onClick={restoreBackupFiles}>
                  Restore Back Up File
                </Button>
              </Modal.Actions>
            </Modal>
          </React.Fragment>
        )}
      </div>
    );
  }
}

App.propTypes = {
  project: PropTypes.object.isRequired,
  workspace: PropTypes.object.isRequired,
  setIsStacked: PropTypes.func.isRequired,
  setPrimaryMode: PropTypes.func.isRequired,
  setSecondaryMode: PropTypes.func.isRequired,
  discardBackupFiles: PropTypes.func.isRequired,
  restoreBackupFiles: PropTypes.func.isRequired,
  openProjectLocationOnBootUp: PropTypes.func.isRequired,
  closeProject: PropTypes.func.isRequired,
  openProject: PropTypes.func.isRequired,
  clearVoicePreviewCache: PropTypes.func.isRequired,
  saveProjectFile: PropTypes.func.isRequired,
  loggerNotification: PropTypes.func.isRequired,
  isProjectUnSaved: PropTypes.func.isRequired
};

export default App;
