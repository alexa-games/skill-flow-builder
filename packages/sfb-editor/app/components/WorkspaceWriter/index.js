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
import { Table, Button } from 'semantic-ui-react';
import { htmlUnescape } from '../../utils-renderer';

import SsmlEditor from '../UI/SsmlEditor';

import styles from './styles.css';

class EditLine extends React.PureComponent {
  onClick = () => {
    const { id, val, onClick = () => null } = this.props;

    onClick(id, val);
  };

  onChange = (e, data) => {
    const { id, onChange = () => null } = this.props;

    // Need to HTML Escape output from SSML Editor
    const unescapedData = htmlUnescape(data);

    onChange(id, unescapedData);
  };

  render() {
    const { id, val, selected } = this.props;

    return (
      <Table.Row positive={selected} onClick={this.onClick}>
        <Table.Cell>
          <b>{id}</b>
        </Table.Cell>
        <Table.Cell>
          <SsmlEditor value={val} onChange={this.onChange} />
        </Table.Cell>
      </Table.Row>
    );
  }
}

EditLine.propTypes = {
  id: PropTypes.string.isRequired,
  val: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  selected: PropTypes.bool.isRequired
};

class WorkspaceWriter extends React.PureComponent {
  componentDidMount() {
    const { fetchLanguageStrings } = this.props;

    fetchLanguageStrings();
  }

  onChangeEditLine = (id, val) => {
    const { workspace, languageStrings, updateLanguageStrings } = this.props;

    const { langObj } = languageStrings;
    const { currentLocale } = workspace;

    if (
      langObj &&
      langObj[currentLocale] &&
      langObj[currentLocale].translation
    ) {
      langObj[currentLocale].translation[id] = val;
    }

    updateLanguageStrings(langObj);
  };

  onEditLineClick = id => {
    const { setSelectedSceneId } = this.props;

    if (id) {
      const sceneId = id.split('.')[0];

      setSelectedSceneId(sceneId);
    }
  };

  render() {
    const {
      workspace,
      className,
      languageStrings,
      setCurrentLocale
    } = this.props;

    const { currentLocale, selectedSceneId } = workspace;

    const { langObj } = languageStrings;
    const languageStringsList =
      langObj[currentLocale] && langObj[currentLocale].translation
        ? Object.keys(langObj[currentLocale].translation).map(key => ({
            id: key,
            val: langObj[currentLocale].translation[key]
          }))
        : [];

    return (
      <div
        key={currentLocale}
        className={[className, styles.container].join(' ')}
      >
        <Table celled className={styles.table}>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>ID</Table.HeaderCell>
              <Table.HeaderCell>Localized Value</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {languageStringsList.map(p => (
              <EditLine
                id={p.id}
                key={p.id}
                val={p.val}
                onClick={this.onEditLineClick}
                onChange={this.onChangeEditLine}
                selected={p.id.startsWith(selectedSceneId)}
              />
            ))}
            {languageStringsList.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan="2" textAlign="center">
                  <Button onClick={() => setCurrentLocale(currentLocale)}>
                    Load Content
                  </Button>
                </Table.Cell>
              </Table.Row>
            ) : null}
          </Table.Body>
        </Table>
      </div>
    );
  }
}

WorkspaceWriter.propTypes = {
  className: PropTypes.string,
  workspace: PropTypes.object.isRequired,
  setCurrentLocale: PropTypes.func.isRequired,
  setSelectedSceneId: PropTypes.func.isRequired,
  languageStrings: PropTypes.object.isRequired,
  fetchLanguageStrings: PropTypes.func.isRequired,
  updateLanguageStrings: PropTypes.func.isRequired
};

export default WorkspaceWriter;
