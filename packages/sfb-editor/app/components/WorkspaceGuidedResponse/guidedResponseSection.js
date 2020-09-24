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
import * as shortid from 'shortid';
import { getValues } from './utils';
import { htmlUnescape } from '../../utils-renderer';
import styles from './styles.css';
import WorkspaceGuidedWrapper from '../WorkspaceGuidedWrapper';
import SsmlPresenter from '../UI/SsmlPresenter';
import { EditForm } from './editForm';

export class WorkspaceGuidedResponseSection extends React.PureComponent {
  state = {
    values: []
  };

  handleEdit = () => {
    const {type, scene, setSectionEdited} = this.props;

    const values = this.convertToKeyedArray(getValues(type, scene));

    setSectionEdited(type);
    this.setState({values});
  };

  handleCancel = () => {
    const {type, scene, setSectionEdited} = this.props;

    const values = this.convertToKeyedArray(getValues(type, scene));

    setSectionEdited(null);
    this.setState({values});
  };

  handleAdd = () => {
    const {values} = this.state;
    const copy = values.slice();

    copy.push({content: '', id: shortid.generate()});
    this.setState({values: copy});
  };

  handleSave = () => {
    const {type, scene, updateSceneCommand} = this.props;
    const {values} = this.state;

    updateSceneCommand(type, scene.id, this.convertFromKeyedArray(values));

    this.handleCancel();
  };

  handleDelete = index => () => {
    const {values} = this.state;
    const copy = values.slice();

    copy.splice(index, 1);
    this.setState({values: copy});
  };

  handleChange = index => (e, value) => {
    const {values} = this.state;
    const copy = values.slice();

    // HTML Unescape value here, because SSML editor encodes things like " into &quot;
    const unescapedValue = htmlUnescape(value);
    const idAtIndex = copy[index].id;

    copy[index] = {content: unescapedValue, id: idAtIndex};

    this.setState({values: copy});
  };

  handleKeyUp = (e) => {
    if (e.keyCode === 27) {
      // escape and cancel
      this.handleCancel();
    }
    if (e.key === 'Enter' && e.shiftKey) {
      // save
      e.preventDefault();
      this.handleSave();
    }
  };

  convertToKeyedArray = (values) => values.map((value) => ({content: value, id: shortid.generate()}));

  convertFromKeyedArray = (values) => values.map((value) => value.content);

  render() {
    const {
      type,
      title,
      scene,
      project,
      isEditing,
      importProjectSource
    } = this.props;

    const values = !isEditing ? this.convertToKeyedArray(getValues(type, scene)) : this.state.values;

    const actions = {
      edit: this.handleEdit,
      save: this.handleSave,
      cancel: this.handleCancel
    };

    return (
      <React.Fragment>
        <h3 className={styles.heading}>{title} </h3>
        <WorkspaceGuidedWrapper
          type="ssml"
          actions={actions}
          isEditing={isEditing}
        >
          {values.length > 0 ? (
            <ul className={styles.list}>
              {values.map((value, i) => (
                <li key={value.id}>
                  {!isEditing ? (
                    <SsmlPresenter
                      key={value.id}
                      onClick={this.handleEdit}
                      className={styles.sayBlock}
                    >
                      {value.content || ''}
                    </SsmlPresenter>
                  ) : (

                    <EditForm
                      scene={scene}
                      sayType={type}
                      project={project}
                      content={value.content || ''}
                      onChange={this.handleChange(i)}
                      onKeyUp={this.handleKeyUp}
                      deleteItem={this.handleDelete(i)}
                      importProjectSource={importProjectSource}
                    />
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.notDefined}>{title} not defined.</p>
          )}
          {isEditing ? (
            <button
              type="button"
              onClick={this.handleAdd}
              className={styles.addButton}
            >
              Add {title}
            </button>
          ) : null}
        </WorkspaceGuidedWrapper>
      </React.Fragment>
    );
  }
}

WorkspaceGuidedResponseSection.propTypes = {
  type: PropTypes.string.isRequired,
  scene: PropTypes.object.isRequired,
  title: PropTypes.string.isRequired,
  project: PropTypes.object.isRequired,
  isEditing: PropTypes.bool.isRequired,
  setSectionEdited: PropTypes.func.isRequired,
  importProjectSource: PropTypes.func.isRequired,
  updateSceneCommand: PropTypes.func.isRequired
};
