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
import { Table, Card, Button, Checkbox, Dimmer, Loader, Image, Segment } from 'semantic-ui-react';
import { getSecondsSinceTimestamp, getCurrentTimestamp } from '@alexa-games/sfb-util'

import SimulatorVisualPreview from '../SimulatorVisualPreview';
import SimulatorAudioPreview from '../SimulatorAudioPreview';
import SimulatorChoices from '../SimulatorChoices';
import SimulatorVariablesPreview from '../SimulatorVariablesPreview';
import paragraphImage from '../../paragraph.png'

import styles from './styles.css';

const electron = require('electron');

const { BrowserWindow } = electron.remote;

const SAVE_SLOT_OPTIONS = [
  {
    icon: 'file outline',
    text: 'Load state from Slot 1',
    value: 'slot-1'
  },
  {
    icon: 'file outline',
    text: 'Load state from Slot 2',
    value: 'slot-2'
  },
  {
    icon: 'file outline',
    text: 'Load state from Slot 3',
    value: 'slot-3'
  },
  {
    icon: 'file outline',
    text: 'Load state from Slot 4',
    value: 'slot-4'
  },
  {
    icon: 'file outline',
    text: 'Load state from Slot 5',
    value: 'slot-5'
  }
];

class Simulator extends React.PureComponent {
  state = {
    importingProject: true
  };

  componentDidMount() {
    const { ipcRenderer } = electron;

    ipcRenderer.on('access-token-updated', this.voicePreviewAccessTokenUpdated);

    const { reimportProjectForSimulator } = this.props;
    const projectImportPromise = reimportProjectForSimulator();
    projectImportPromise.then(() => {
      this.setState({
        importingProject: false
      })
    })
  }

  handleLoadStateAction = ({filename}) => {
    const {
      project,
      simulator,
      startSimulatorWithCommand
    } = this.props;

    startSimulatorWithCommand(`!load ${filename}`);
  };

  handleSelectSimulateMode = value => {
    const {
      project,
      simulator,
      workspace,
      exitSimulator,
      startSimulator,
      resumeSimulator,
      sendSimulatorCommand
    } = this.props;

    if (value === 'exit') {
      exitSimulator();
    } else if (value === 'start') {
      startSimulator();
    } else if (value === 'current') {
      resumeSimulator();

      if (workspace.selectedSceneId) {
        sendSimulatorCommand(`!clear_and_goto ${workspace.selectedSceneId}`);
      }
    }
  };

  handleVoicePreviewChanged = (event, data) => {
    const {
      setIsPollyPreview,
      reimportProjectForSimulator
    } = this.props;

    if(data.checked) {
      setIsPollyPreview(true);
      reimportProjectForSimulator();
    } else {
      setIsPollyPreview(data.checked);
      reimportProjectForSimulator();
    }
  }

  showVoicePreviewLoginWindow = () => {
    const modalPath = 'https://sfb-framework.s3.amazonaws.com/pollyPreviewLogin/index.html';
    let win = new BrowserWindow({ width: 600, height: 600 });
    win.on('close', () => { win = null });
    win.loadURL(modalPath);
    win.show();
  }

  voicePreviewAccessTokenUpdated = (event, arg) => {
    const {
      setIsPollyPreview,
      reimportProject,
      setPollyPreviewAccessTokenInfo
    } = this.props;

    setPollyPreviewAccessTokenInfo({ accessToken: arg, timestamp: getCurrentTimestamp() })
    setIsPollyPreview(true);
    reimportProject();
  }

  render() {
    const {
      project,
      simulator,
      sendSimulatorCommand,
      workspace
    } = this.props;

    const { response, isRunning, showSpinner } = simulator;
    const {importingProject} = this.state;
    if (importingProject) {
      return (<Loader active inline='centered' className={styles.loaderContainer}>
          Importing project for simulation.
          <br />
          This could take up to 30 seconds, depending on project size.
        </Loader>)
    }

    // Handle case where there are syntax errors
    if (!project.importSuccessful) {
      const { syntaxErrors } = workspace;

      const syntaxErrorsDisplay = syntaxErrors.map(syntaxError => (
        <Table.Row key={syntaxError.sourceID}>
          <Table.Cell>{syntaxError.errorMessage}</Table.Cell>
          <Table.Cell>
            Row:{' '}
            {syntaxError.lineNumber >= 2
              ? syntaxError.lineNumber - 1
              : syntaxError.lineNumber}
          </Table.Cell>
          <Table.Cell>File: {syntaxError.sourceID}</Table.Cell>
        </Table.Row>
      ));

      return (
        <Card fluid className={styles.prompt}>
          <Card.Content>
            <p>
              Sorry, please fix the following syntax errors in your skill before
              previewing.
            </p>
            <Table celled>
              <Table.Body>
                {syntaxErrorsDisplay}
              </Table.Body>
            </Table>
          </Card.Content>
        </Card>
      );
    }

    if(!isRunning) {
      return (
        <div className={styles.startSimulateContainer}>
          <p/>
          <Button
          primary
          size="huge"
          className={['spaced', styles.minWidthButton].join(' ')}
          onClick={() => this.handleSelectSimulateMode('start')}
        >
          Simulate from Start
        </Button>
        <Button
          size="huge"
          className={['spaced', styles.minWidthButton].join(' ')}
          onClick={() => this.handleSelectSimulateMode('current')}
        >
          Simulate from Current
        </Button>
        {SAVE_SLOT_OPTIONS.map(props => (
          <Button
            {...props}
            key={props.text}
            content={props.text}
            className={['spaced', styles.minWidthButton].join(' ')}
            onClick={() =>
              this.handleLoadStateAction({ filename: props.value })
            }
          />
        ))}
        <Checkbox
          label="Voice Preview"
          toggle
          checked={simulator.isPollyPreview}
          onChange={(event, data) => this.handleVoicePreviewChanged(event, data) } />

          <p className={styles.hint}>Voice Preview requires a configured AWS account</p>

      </div>
      );
    }

    return (
      <div className={styles.container}>
        { response && !showSpinner ? <>
        {/* Response */}
        <Card fluid className={styles.prompt}>
          <Card.Content>
            SAY
            <p>{ response.pretty }</p>

            {/* Audio Preview */}
            <SimulatorAudioPreview
              autoStart
              simulator={ simulator }
              key={ response.prompt }
              ssml={ response.prompt }/>

          </Card.Content>
        </Card>

        {/* Reprompt */
          !response.ending ?
          <Card fluid className={ styles.prompt }>
            <Card.Content>
              {
                response.repromptPretty ?
                  <>
                  REPROMPT
                  <p>
                    { response.repromptPretty }
                  </p>

                  {/* Audio Preview */}
                  <SimulatorAudioPreview
                    autoStart={ false }
                    simulator={ simulator }
                    key={ response.reprompt }
                    ssml={ response.reprompt }/>

                  </> :
                  <p className={ styles.notDefined }>
                    Reprompt not defined.
                  </p>
              }
            </Card.Content>
          </Card> :
          null
        }

        {/* Visual Preview */}
        <figure className={styles.visualContainer}>
          {response.visuals.length > 0 ? (
            <SimulatorVisualPreview {...response.visuals[0]} />
          ) : (
            <span className={styles.notDefined}>
              SimulatorVisualPreview not defined.
            </span>
          )}
        </figure>

        {/* Choices */
        !response.ending ? (
          <React.Fragment>
            <SimulatorChoices
              project={project}
              simulator={simulator}
              choices={response.choices}
              sendSimulatorCommand={sendSimulatorCommand}
            />
            {/* Required Choices */}
            {/* <SimulatorRequiredChoices/> */}
          </React.Fragment>
        ) : null}

        {/* Debug Variables Display Preview */}
        <SimulatorVariablesPreview
          workspace={workspace}
          project={project}
          simulator={simulator}
          sendSimulatorCommand={sendSimulatorCommand}
        />
        </> : null }

        {/* Show spinner overlay if 'simulator.showSpinner' is true */}
        { showSpinner ?
        <Segment>
          <Dimmer active inverted>
            <Loader size='large'>Loading Preview...</Loader>
          </Dimmer>
          <Image src={paragraphImage} />
        </Segment>
        : null}

      </div>
    );
  }
}

Simulator.propTypes = {
  project: PropTypes.object.isRequired,
  simulator: PropTypes.object.isRequired,
  sendSimulatorCommand: PropTypes.func.isRequired,
  exitSimulator: PropTypes.func.isRequired,
  startSimulator: PropTypes.func.isRequired,
  startSimulatorWithCommand: PropTypes.func.isRequired,
  resumeSimulator: PropTypes.func.isRequired,
  workspace: PropTypes.object.isRequired,
  setIsPollyPreview: PropTypes.func.isRequired,
  setPollyPreviewAccessTokenInfo: PropTypes.func.isRequired,
  reimportProject: PropTypes.func.isRequired,
  reimportProjectForSimulator: PropTypes.func.isRequired
};

export default Simulator;
