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
import os from 'os';
import path from 'path';
import mimes from 'mime-types';
import PropTypes from 'prop-types';
import { setEventTransfer } from 'slate-react';
import { Table, Icon, Header, Input } from 'semantic-ui-react';

import styles from './styles.css';
import audioSrc from './icon.png';

const FILE_EXPLORER = os.platform() === 'win32' ? 'File Explorer' : 'Finder';

const dragImage = new Image();

dragImage.src = audioSrc;

function handleDragOver(e) {
  if (
    e.dataTransfer.items &&
    Array.from(e.dataTransfer.items).every(({ kind }) => kind === 'file')
  ) {
    e.preventDefault();
  }
}

const handleDrop = props => e => {
  const { addFileToProject } = props;
  const files = Array.from(e.dataTransfer.items).map(item => item.getAsFile());

  files.forEach(file => addFileToProject(file.path));
};

const handleDragStart = fileData => e => {
  setEventTransfer(e, 'text', JSON.stringify({ ...fileData, type: 'audio' }));
  e.dataTransfer.setDragImage(dragImage, -20, 0);
};

const ResourcesAudio = props => {
  const { audioFiles } = props;

  return (
    <div>
      <header className={styles.headerContainer}>
        <Header as="h3">
          <Icon name="volume up" />
          <Header.Content>
            Audio Files
            <Header.Subheader>
              To add new files, drag them from {FILE_EXPLORER} into the table
              below. To use audio files, drag them from the table below into
              your say blocks.
              <br />
              Note: Your files also must be uploaded to S3 for preview to work. You can upload project resources currently using the SFB command line 'upload' command.
              Please do not use spaces in audio file names or directories.
            </Header.Subheader>
          </Header.Content>
        </Header>
      </header>
      <div
        onDrop={handleDrop(props)}
        onDragOver={handleDragOver}
        className={styles.container}
      >
        {audioFiles.length === 0 ? (
          <div className={styles.missingItems}>
            <p>This project does not contain any audio files.</p>
          </div>
        ) : (
          <Table striped singleLine>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Name</Table.HeaderCell>
                <Table.HeaderCell textAlign="right">Type</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {audioFiles.map(fileData => (
                <Table.Row key={fileData.src}>
                  <Table.Cell>
                    <span
                      draggable
                      className={styles.fileName}
                      onDragStart={handleDragStart(fileData)}
                    >
                      <Icon name="volume up" />
                      {fileData.filename}
                    </span>
                  </Table.Cell>
                  <Table.Cell collapsing>
                    {mimes.lookup(path.extname(fileData.filename))}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
      </div>
    </div>
  );
};

ResourcesAudio.propTypes = {
  audioFiles: PropTypes.array.isRequired
};

export default ResourcesAudio;
