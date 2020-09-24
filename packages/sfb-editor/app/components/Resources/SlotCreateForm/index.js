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

import { Form, Message, Segment } from 'semantic-ui-react';
import PropTypes from 'prop-types';
import React from 'react';
import styles from './styles.css';

class SlotTypeCreateForm extends React.PureComponent {
  state = {name: '', error: false, errorMessage: ''};

  handleChange = (e, {name, value}) => {
    const {slotTypeNameList} = this.props;
    // Ensure that the expression conforms to slot type naming conventions.
    // The name of a custom slot type must begin and end with an alphabetic character and can consist only of alphabetic characters or underscores.
    let error = false;
    let errorMessage = '';

    if (!(/^[a-zA-Z](([a-zA-Z_])*[a-zA-Z])*$/.test(value))) {
      error = true;
      errorMessage = 'The name of a custom slot type must begin and end with an alphabetic character and can consist only of alphabetic characters or underscores.';
    }

    if (slotTypeNameList.indexOf(value) > -1) {
      error = true;
      errorMessage = 'Slot type with this name already exists.';
    }

    this.setState({[name]: value, error, errorMessage});
  };

  handleSubmit = e => {
    const {onSuccess, appendSlotTypes, saveSlotTypes} = this.props;
    const {error} = this.state;
    if (error) return;
    const slotTypeName = e.target.name.value;
    appendSlotTypes({name: slotTypeName, values: []});
    saveSlotTypes()
      .then(() => onSuccess())
      .catch((err) => {
      console.log('Error caught in containing method', err);
    })
  };

  // regex for valid slot name [a-zA-Z](([a-zA-Z_])*[a-zA-Z])*/g

  render() {
    const {name, error, errorMessage} = this.state;
    return (
      <Segment inverted tertiary>
        <Form onSubmit={this.handleSubmit} error={error}>
          <Form.Group>
            <Form.Input error={error}
                        className={styles.flexGrow}
                        placeholder="Name"
                        name="name"
                        value={name}
                        onChange={this.handleChange}
            />
            <Form.Button primary content="Create"/>
          </Form.Group>
          <Message
            error
            header='Invalid Name'
            content={errorMessage}
          />
        </Form>
      </Segment>
    );
  }
}

SlotTypeCreateForm.propTypes = {
  onSuccess: PropTypes.func.isRequired,
  appendSlotTypes: PropTypes.func.isRequired,
  saveSlotTypes: PropTypes.func.isRequired,
  slotTypeNameList: PropTypes.array.isRequired
};

export default SlotTypeCreateForm;
