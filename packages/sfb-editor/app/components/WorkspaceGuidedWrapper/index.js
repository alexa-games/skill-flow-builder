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

function WorkspaceGuidedWrapper(props) {
  const { actions, children, isEditing, hideEditButton } = props;

  return (
    <section className={styles.container}>
      <div className={styles.content}>{children}</div>
      {actions ? (
        <div className={styles.actions}>
          {isEditing ? (
            // editing
            <React.Fragment>
              <button
                type="button"
                className="save"
                title="Save Changes"
                data-section="response"
                onClick={actions.save}
              >
                <Icon size="large" name="save" />
              </button>
              <button
                type="button"
                className="cancel"
                title="Cancel Editing"
                data-section="response"
                onClick={actions.cancel}
              >
                <Icon size="large" name="undo" />
              </button>
            </React.Fragment>
          ) : (
            // not editing
            <>
              {!hideEditButton ? (
                <button
                  title="Edit"
                  type="button"
                  data-section="response"
                  onClick={actions.edit}
                >
                  <Icon size="large" name="pencil" />
                </button>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </section>
  );
}

WorkspaceGuidedWrapper.propTypes = {
  actions: PropTypes.object,
  children: PropTypes.node.isRequired,
  isEditing: PropTypes.bool.isRequired
};

export default WorkspaceGuidedWrapper;
