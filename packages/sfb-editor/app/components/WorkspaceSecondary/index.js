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

import ResourcesSlotTypes from '../../containers/ResourcesSlotTypes';
import ResourcesSnippets from '../../containers/ResourcesSnippets';
import ResourcesImages from '../../containers/ResourcesImages';
import ResourcesAudio from '../../containers/ResourcesAudio';
import ResourcesNotes from '../../containers/ResourcesNotes';
import FrontPage from '../../containers/FrontPage';
import ResourcesDocs from '../../containers/ResourcesDocs';

import { WorkspaceSecondaryMode } from '../../data/enums';

import WorkspaceGraph from '../WorkspaceGraph';

import styles from './styles.css';

function Switch(props) {
  const { workspace } = props;

  switch (workspace.secondaryMode) {
    case WorkspaceSecondaryMode.Map:
      return <WorkspaceGraph {...props} />;
    case WorkspaceSecondaryMode.SlotTypes:
      return <ResourcesSlotTypes />;
    case WorkspaceSecondaryMode.Snippets:
      return <ResourcesSnippets />;
    case WorkspaceSecondaryMode.Images:
      return <ResourcesImages />;
    case WorkspaceSecondaryMode.Audio:
      return <ResourcesAudio />;
    case WorkspaceSecondaryMode.Notes:
      return <ResourcesNotes />;
    case WorkspaceSecondaryMode.Documentation:
      return <ResourcesDocs content="formatting" />;
    case WorkspaceSecondaryMode.Readme:
      return <ResourcesDocs content="readme" />;
    case WorkspaceSecondaryMode.News:
      return <FrontPage editorLocale={workspace.editorLocale} />;
    default:
      return null;
  }
}

function WorkspaceSecondary(props) {
  return (
    <div className={styles.container}>
      <Switch {...props} />
    </div>
  );
}

export default WorkspaceSecondary;
