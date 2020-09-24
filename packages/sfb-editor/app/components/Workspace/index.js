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
import SplitterLayout from 'react-splitter-layout';
import WorkspaceSecondary from '../WorkspaceSecondary';
import WorkspacePrimary from '../WorkspacePrimary';

import styles from './styles.css';
import NewProjectDialog from '../../containers/NewProjectDialog';
import WorkspaceGuidedActions from '../WorkspaceGuidedActions';
import AutoUpdateBanner from '../AutoUpdateBanner';
import WorkspaceGuided from '../WorkspaceGuided';

function Workspace({
                     project,
                     workspace,
                     simulator,
                     setMapType,
                     openProject,
                     newProject,
                     exitSimulator,
                     startSimulator,
                     resumeSimulator,
                     saveProjectFile,
                     openProjectFile,
                     saveProjectFileAs,
                     resumeSimulatorFromStart,
                     setSelectedSceneId,
                     setSyntaxErrors,
                     updateProjectSource,
                     importProjectSource,
                     sendSimulatorCommand,
                     addNewChildScene,
                     deleteScene,
                     changeSceneId,
                     updateSceneAction,
                     closeNewProjectModal,
                     setCurrentLocale,
                     openProjectLocation,
                     pushToNavigationStack,
                     popNavigationStack,
                     clearNavigationStack,
                     setEditorReference,
                     isProjectUnSaved,
                     updateSceneCommand,
                     deleteHearCommand,
                     deleteActionCommand
                   }) {
  const orientation = !!workspace.isStacked;

  return (
    <main className={styles.main}>
      <NewProjectDialog project={project} closeNewProjectModal={closeNewProjectModal}/>
      <AutoUpdateBanner />
      <SplitterLayout
        primaryIndex={0}
        percentage
        primaryMinSize={25}
        secondaryMinSize={25}
        secondaryInitialSize={50}
        vertical={orientation}
      >
        <WorkspaceSecondary
          project={project}
          workspace={workspace}
          simulator={simulator}
          resumeSimulator={resumeSimulator}
          sendSimulatorCommand={sendSimulatorCommand}
          setMapType={setMapType}
          openProjectFile={openProjectFile}
          addNewChildScene={addNewChildScene}
          deleteScene={deleteScene}
          setSelectedSceneId={setSelectedSceneId}
          clearNavigationStack={clearNavigationStack}
          saveProjectFile={saveProjectFile}
          isProjectUnSaved={isProjectUnSaved}
        />
        <WorkspacePrimary
          project={project}
          workspace={workspace}
          simulator={simulator}
          openProject={openProject}
          newProject={newProject}
          exitSimulator={exitSimulator}
          startSimulator={startSimulator}
          resumeSimulator={resumeSimulator}
          saveProjectFile={saveProjectFile}
          openProjectFile={openProjectFile}
          saveProjectFileAs={saveProjectFileAs}
          resumeSimulatorFromStart={resumeSimulatorFromStart}
          setSelectedSceneId={setSelectedSceneId}
          setSyntaxErrors={setSyntaxErrors}
          updateProjectSource={updateProjectSource}
          importProjectSource={importProjectSource}
          changeSceneId={changeSceneId}
          setCurrentLocale={setCurrentLocale}
          updateSceneAction={updateSceneAction}
          sendSimulatorCommand={sendSimulatorCommand}
          openProjectLocation={openProjectLocation}
          pushToNavigationStack={pushToNavigationStack}
          popNavigationStack={popNavigationStack}
          setEditorReference={setEditorReference}
          isProjectUnSaved={isProjectUnSaved}
          updateSceneCommand={updateSceneCommand}
          deleteHearCommand={deleteHearCommand}
          deleteActionCommand={deleteActionCommand}
        />
      </SplitterLayout>
    </main>
  );
}

Workspace.propTypes = {
  project: PropTypes.object.isRequired,
  setMapType: PropTypes.func.isRequired,
  openProject: PropTypes.func.isRequired,
  newProject: PropTypes.func.isRequired,
  workspace: PropTypes.object.isRequired,
  simulator: PropTypes.object.isRequired,
  exitSimulator: PropTypes.func.isRequired,
  startSimulator: PropTypes.func.isRequired,
  resumeSimulator: PropTypes.func.isRequired,
  saveProjectFile: PropTypes.func.isRequired,
  openProjectFile: PropTypes.func.isRequired,
  saveProjectFileAs: PropTypes.func.isRequired,
  resumeSimulatorFromStart: PropTypes.func.isRequired,
  setSelectedSceneId: PropTypes.func.isRequired,
  setSyntaxErrors: PropTypes.func.isRequired,
  updateProjectSource: PropTypes.func.isRequired,
  importProjectSource: PropTypes.func.isRequired,
  sendSimulatorCommand: PropTypes.func.isRequired,
  addNewChildScene: PropTypes.func.isRequired,
  deleteScene: PropTypes.func.isRequired,
  changeSceneId: PropTypes.func.isRequired,
  updateSceneAction: PropTypes.func.isRequired,
  closeNewProjectModal: PropTypes.func.isRequired,
  openProjectLocation: PropTypes.func.isRequired,
  pushToNavigationStack: PropTypes.func.isRequired,
  popNavigationStack: PropTypes.func.isRequired,
  clearNavigationStack: PropTypes.func.isRequired,
  setCurrentLocale: PropTypes.func.isRequired,
  setEditorReference: PropTypes.func.isRequired,
  isProjectUnSaved: PropTypes.func.isRequired,
  updateSceneCommand: PropTypes.func.isRequired,
  deleteHearCommand: PropTypes.func.isRequired,
  deleteActionCommand: PropTypes.func.isRequired,
};

export default Workspace;
