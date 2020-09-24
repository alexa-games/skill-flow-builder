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

import { Form, Icon } from 'semantic-ui-react';
import React from 'react';
import PropTypes from 'prop-types';
import styles from './styles.css';
import SsmlEditor from '../UI/SsmlEditor';

export function EditForm(props) {
  const { content, onChange, deleteItem, onKeyUp } = props;

  return (
    <Form className={styles.editSayBlock}>
      <SsmlEditor
        value={content}
        onChange={onChange}
        onKeyUp={onKeyUp}
      />
      <small>
        Shift+Enter to <Icon name="save" /> Esc to <Icon name="undo" /> Drag in audio files <Icon name="music" />
      </small>
      <button
        type="button"
        onClick={deleteItem}
        className={styles.deleteButton}
      >
        <Icon name="trash" size="large" />
      </button>
    </Form>
  );
}

EditForm.propTypes = {
  content: PropTypes.node.isRequired,
  onChange: PropTypes.func.isRequired,
  onKeyUp: PropTypes.func,
  deleteItem: PropTypes.func.isRequired
};
