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
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import { Icon, Button } from 'semantic-ui-react';

import styles from './styles.css';

const ACTIONS = [
  {
    icon: 'user outline',
    value: 'voice',
    text: 'Voice'
  },
  {
    icon: 'question circle outline',
    value: 'value',
    text: 'Value'
  }
];

function Menu(props) {
  const { editor, applyMenuCommand } = props;

  return (
    <div className={styles.menu}>
      <Button.Group basic>
        {ACTIONS.map(({ icon, text, value }) => (
          <Button
            key={text}
            onClick={() => applyMenuCommand(value, editor, value)}
          >
            <Icon name={icon} />
            {text}
          </Button>
        ))}
      </Button.Group>
    </div>
  );
}

Menu.propTypes = {
  editor: PropTypes.object.isRequired,
  applyMenuCommand: PropTypes.func.isRequired
};

const SsmlEditorMenu = React.forwardRef((props, ref) => {
  const root = window.document.getElementById('root');

  return ReactDOM.createPortal(
    <div ref={ref} className={styles.hoverMenu}>
      <Menu {...props} />
    </div>,
    root
  );
});

export default SsmlEditorMenu;
