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

import _ from 'underscore';
import { WorkspacePrimaryMode, WorkspaceSecondaryMode } from '../data/enums';

const PrimaryModes = new Map([
  [ 'guided', WorkspacePrimaryMode.Guided ],
  [ 'simulator', WorkspacePrimaryMode.Simulator ],
  [ 'source', WorkspacePrimaryMode.Source ],
  [ 'writer', WorkspacePrimaryMode.Writer ]
]);
const SecondaryModes = new Map([
  [ 'audio', WorkspaceSecondaryMode.Audio ],
  [ 'docs', WorkspaceSecondaryMode.Documentation ],
  [ 'images', WorkspaceSecondaryMode.Images ],
  [ 'map', WorkspaceSecondaryMode.Map ],
  [ 'news', WorkspaceSecondaryMode.News ],
  [ 'notes', WorkspaceSecondaryMode.Notes ],
  [ 'readme', WorkspaceSecondaryMode.ReadMe ],
  [ 'slotTypes', WorkspaceSecondaryMode.SlotTypes ],
  [ 'snippets', WorkspaceSecondaryMode.Snippets ]
]);

export function convertLegacyWorkspacePrimaryMode(workspacePrimaryMode) {
  if (!_.isEmpty(workspacePrimaryMode)) {
    const convertedPrimaryMode = PrimaryModes[workspacePrimaryMode];

    if (!_.isEmpty(convertedPrimaryMode)) {
      return convertedPrimaryMode;
    } else {
      return workspacePrimaryMode;
    }
  } else {
    return undefined;
  }
}

export function convertLegacyWorkspaceSecondaryMode(workspaceSecondaryMode) {
  if (!_.isEmpty(workspaceSecondaryMode)) {
    const convertedSecondaryMode = SecondaryModes[workspaceSecondaryMode];

    if (!_.isEmpty(convertedSecondaryMode)) {
      return convertedSecondaryMode;
    } else {
      return workspaceSecondaryMode;
    }
  } else {
    return undefined;
  }
}
