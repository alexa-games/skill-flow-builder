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

import { Form, Segment } from 'semantic-ui-react';
import PropTypes from 'prop-types';
import React from 'react';
import styles from './styles.css';

class SnippetCreateForm extends React.PureComponent {
  state = { name: '', value: '' };

  handleChange = (e, { name, value }) => this.setState({ [name]: value });

  handleSubmit = e => {
    const { onSuccess, createSnippet } = this.props;
    const snippetName = e.target.name.value;
    const snippetValue = e.target.value.value;
    createSnippet({ short: snippetName, long: snippetValue }).then(() =>
      onSuccess()
    );
  };

  render() {
    const { name, value } = this.state;
    return (
      <Segment inverted tertiary>
        <Form onSubmit={this.handleSubmit}>
          <Form.Group>
            <Form.Input
              width={4}
              placeholder="Name"
              name="name"
              value={name}
              onChange={this.handleChange}
            />
            <Form.Input
              className={styles.flexGrow}
              placeholder="Value"
              name="value"
              value={value}
              onChange={this.handleChange}
            />
            <Form.Button primary content="Create" />
          </Form.Group>
        </Form>
      </Segment>
    );
  }
}

SnippetCreateForm.propTypes = {
  onSuccess: PropTypes.func.isRequired,
  createSnippet: PropTypes.func.isRequired
};

export default SnippetCreateForm;
