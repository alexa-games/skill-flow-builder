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

import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as LanguageStringsActions from '../actions/languageStrings';
import * as ProjectActions from '../actions/project';
import * as WorkspaceActions from '../actions/workspace';
import * as SimulatorActions from '../actions/simulator';
import WorkspaceWriter from '../components/WorkspaceWriter';

function mapStateToProps(state) {
  return {
    languageStrings: state.languageStrings,
    project: state.project,
    simulator: state.simulator,
    workspace: state.workspace
  };
}

function mapDispatchToProps(dispatch) {
  return {
    ...bindActionCreators(LanguageStringsActions, dispatch),
    ...bindActionCreators(ProjectActions, dispatch),
    ...bindActionCreators(WorkspaceActions, dispatch),
    ...bindActionCreators(SimulatorActions, dispatch)
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WorkspaceWriter);
