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
import { Icon, Popup } from 'semantic-ui-react';

import { WorkspaceSecondaryMode } from '../../data/enums';

import styles from './styles.css';

function NavItem(props) {
  const { icon, mode, title, currentMode, setModeAction } = props;

  const classList = [styles.button];

  if (mode === currentMode) {
    classList.push(styles.isActive);
  }

  const trigger = (
    <button
      type="button"
      className={classList.join(' ')}
      onClick={() => setModeAction(mode)}
    >
      <Icon name={icon} />
    </button>
  );

  return (
    <Popup inverted content={title} trigger={trigger} position="right center" />
  );
}

NavItem.propTypes = {
  icon: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  mode: PropTypes.string.isRequired,
  currentMode: PropTypes.string.isRequired,
  setModeAction: PropTypes.func.isRequired
};

function AppRail(props) {
  const {
    experimentalModeEnabled,
    setSecondaryMode,
    workspaceSecondaryMode,
    isProjectLoaded
  } = props;

  return (
    <aside className={styles.container}>
      {isProjectLoaded ? (
        <div>
          <NavItem
            mode={WorkspaceSecondaryMode.Map}
            title="Map"
            icon="sitemap"
            setModeAction={setSecondaryMode}
            currentMode={workspaceSecondaryMode}
          />
          <NavItem
            mode={WorkspaceSecondaryMode.SlotTypes}
            title="Slot Types"
            icon="question"
            setModeAction={setSecondaryMode}
            currentMode={workspaceSecondaryMode}
          />
          <NavItem
            mode={WorkspaceSecondaryMode.Audio}
            title="Audio"
            icon="volume up"
            setModeAction={setSecondaryMode}
            currentMode={workspaceSecondaryMode}
          />
          <NavItem
            mode={WorkspaceSecondaryMode.Images}
            title="Images"
            icon="image"
            setModeAction={setSecondaryMode}
            currentMode={workspaceSecondaryMode}
          />
          <NavItem
            mode={WorkspaceSecondaryMode.Snippets}
            title="Snippets"
            icon="cut"
            setModeAction={setSecondaryMode}
            currentMode={workspaceSecondaryMode}
          />
          <NavItem
            mode={WorkspaceSecondaryMode.Notes}
            title="Notes"
            icon="pencil"
            setModeAction={setSecondaryMode}
            currentMode={workspaceSecondaryMode}
          />
        </div>
      ) : null}

      <NavItem
        mode={WorkspaceSecondaryMode.News}
        title="News and Documentation"
        icon="newspaper outline"
        setModeAction={setSecondaryMode}
        currentMode={workspaceSecondaryMode}
      />
    </aside>
  );
}

AppRail.propTypes = {
  experimentalModeEnabled: PropTypes.bool.isRequired,
  setSecondaryMode: PropTypes.func.isRequired,
  workspaceSecondaryMode: PropTypes.string.isRequired,
  isProjectLoaded: PropTypes.bool.isRequired
};

export default AppRail;
