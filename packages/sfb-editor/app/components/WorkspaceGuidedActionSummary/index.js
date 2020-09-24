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
import { Icon } from 'semantic-ui-react';

import styles from './styles.css';

function ActionSummary(props) {
  const {
    type,
    utterances,
    gotoTarget,
    saveAndGoTarget,
    setSelectedSceneId,
    innerAction
  } = props;

  const target = gotoTarget || saveAndGoTarget;
  const utterance = utterances.length > 0 ? utterances[0] : null;

  const typeTarget = innerAction || type;

  return (
    <div className={styles.container}>
      {utterance ? <span className={styles.utterance}>{utterance}</span> : null}
      <span className={styles.gotoWrapper}>
        {!saveAndGoTarget ? (
          <Icon name="arrow right" />
        ) : (
          <Icon name="retweet" />
        )}
        {target ? (
          <button
            type="button"
            className={styles.sceneLink}
            onClick={() => setSelectedSceneId(target)}
          >
            {target}
          </button>
        ) : (
          <span className={styles.sceneAction}>{typeTarget}</span>
        )}
      </span>
    </div>
  );
}

ActionSummary.propTypes = {
  type: PropTypes.string,
  utterances: PropTypes.array,
  gotoTarget: PropTypes.string,
  saveAndGoTarget: PropTypes.string,
  setSelectedSceneId: PropTypes.func.isRequired
};

export default ActionSummary;
