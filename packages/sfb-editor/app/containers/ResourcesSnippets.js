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
import * as SnippetActions from '../actions/snippets';

import ResourcesSnippets from '../components/Resources/ResourcesSnippets';

function mapStateToProps(state) {
  return {
    snippets: state.snippets.snippets,
    hasError: state.snippets.hasError,
    errorMessage: state.snippets.errorMessage
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(SnippetActions, dispatch);
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ResourcesSnippets);
