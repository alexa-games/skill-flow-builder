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

import { connectRouter } from 'connected-react-router';
import { combineReducers } from 'redux';

import slotTypes from './slot-types';
import workspace from './workspace';
import simulator from './simulator';
import snippets from './snippets';
import project from './project';
import build from './build';
import logger from './logger';
import images from './images';
import notes from './notes';
import languageStrings from './languageStrings';
import audio from './audio';

export default function createRootReducer(history) {
  return combineReducers({
    router: connectRouter(history),
    workspace,
    simulator,
    slotTypes,
    snippets,
    project,
    build,
    logger,
    images,
    audio,
    notes,
    languageStrings
  });
}
