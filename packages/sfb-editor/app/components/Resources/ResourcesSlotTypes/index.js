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
import { Segment, Button, Form, Icon, Header, Input } from 'semantic-ui-react';

import styles from './styles.css';
import SlotTypeCreateForm from '../../../containers/SlotTypeCreateForm';

class SlotTypeItem extends React.PureComponent {
  state = {
    isOpen: false,
    newValue: ''
  };

  toggleIsOpen = () => {
    const {isOpen} = this.state;
    this.setState({isOpen: !isOpen});
  };

  removeValue = (slotType, value) => () => {
    const {updateSlotTypes} = this.props;
    const update = {
      ...slotType,
      // Handle if value is a complex type or a simple string
      values: slotType.values.filter(v => (typeof v === 'object' && v.name && v.name.value) ? v.name.value !== value : v !== value)
    };

    updateSlotTypes(update);
  };

  removeSlotType = (slotType) => () => {
    const { removeSlotType } = this.props;
    removeSlotType(slotType);
  };

  onChangeNewValue = e => {
    this.setState({newValue: e.target.value});
  };

  onSubmitNewValue = slotType => e => {
    const {updateSlotTypes} = this.props;
    const {newValue} = this.state;

    if (newValue === '' || slotType.values.includes(newValue)) {
      return; // exit
    }

    const update = {
      ...slotType,
      values: slotType.values.concat(newValue)
    };

    updateSlotTypes(update);
    this.setState({newValue: ''});
  };

  render() {
    const {slotType, initialIsOpen} = this.props;
    const {name, values} = slotType;
    const {isOpen, newValue} = this.state;

    const expanded = isOpen || initialIsOpen;

    return (
      <React.Fragment>
        <div className={styles.header} onClick={this.toggleIsOpen}>
          <span>&nbsp;{name}&nbsp;</span>
          <Button
            icon="trash"
            type="button"
            onClick={this.removeSlotType(slotType)}
            className={[styles.contextButton, styles.deleteButton, expanded ? 'visible' : 'hidden'].join(' ')}
          />
          <span style={{flexGrow: 1}}>&nbsp;</span>
          <Icon name={!expanded ? 'chevron down' : 'chevron up'}/>
        </div>
        {expanded ? (
          <div className={styles.content}>
            <div className={styles.list}>
              {values.map(value => (

                // Check to see if value is a map and not a string value
                typeof value === "object" && value.name && value.name.value ?

                // If an object, then it can have a value and synonyms
                <div key={value.name.value} className={styles.listItem}>
                  <span className={styles.listItemValue}>{value.name.value}</span>
                  <Button
                    icon="trash"
                    type="button"
                    className={styles.deleteButton}
                    onClick={this.removeValue(slotType, value.name.value)}
                  />
                </div>
                :
                // Else it is just simple value strings
                <div key={value} className={styles.listItem}>
                  <span className={styles.listItemValue}>{value}</span>
                  <Button
                    icon="trash"
                    type="button"
                    className={styles.deleteButton}
                    onClick={this.removeValue(slotType, value)}
                  />
                </div>

              ))}
            </div>
            <Form onSubmit={this.onSubmitNewValue(slotType)}>
              <Form.Field>
                <Form.Input
                  action={<Button icon="plus" type="submit"/>}
                  value={newValue}
                  placeholder="Add another value..."
                  onChange={this.onChangeNewValue}
                  error={values.includes(newValue)}
                />
              </Form.Field>
            </Form>
          </div>
        ) : null}
      </React.Fragment>
    );
  }
}

SlotTypeItem.propTypes = {
  slotType: PropTypes.object.isRequired,
  updateSlotTypes: PropTypes.func.isRequired,
  removeSlotType: PropTypes.func.isRequired,
  initialIsOpen: PropTypes.bool
};

class ResourcesSlotTypes extends React.PureComponent {
  state = {
    filteredSlotTypes: [],
    filterString: '',
    showCreateForm: false
  };

  componentDidMount() {
    const {slotTypes} = this.props;
    this.setState({
      filteredSlotTypes: slotTypes
    });
  }

  toggleCreateForm = () => {
    const {showCreateForm} = this.state;
    this.setState({
      showCreateForm: !showCreateForm
    });
  };

  handleSlotTypeCreated = () => {
    const { filterString } = this.state;
    this.filterList(filterString);
    this.toggleCreateForm();
  };

  updateSlotValues = (update) => {
    const {updateSlotTypes} = this.props;
    const {filterString} = this.state;
    updateSlotTypes(update)
      .then(() => this.filterList(filterString))
      .catch((err) => {
        console.log(err);
      })
  };

  removeSlotTypes = (slotTypes) => {
    const {removeSlotTypes} = this.props;
    const {filterString} = this.state;
    removeSlotTypes(slotTypes)
      .then(() => this.filterList(filterString))
      .catch((err) => {
        console.log(err);
      })
  };

  filterList = filterString => {
    const {slotTypes} = this.props;
    const filteredList = slotTypes.filter(
      slotType =>
        !filterString ||
        filterString.length === 0 ||
        slotType.name.toUpperCase().indexOf(filterString.toUpperCase()) > -1 ||
        this.filterItems(slotType.values, filterString).length > 0
    );
    this.setState({
      filteredSlotTypes: filteredList,
      filterString
    });
  };

  filterItems = (items, filterString) => items.filter((item) => item.toUpperCase().indexOf(filterString.toUpperCase()) > -1);

  render() {
    const {slotTypes} = this.props;
    const {showCreateForm, filteredSlotTypes, filterString} = this.state;
    const currentSlotTypeNames = slotTypes.map((slot) => slot.name);

    return (
      <div>
        <header className={styles.container}>
          <Header as="h3">
            <Button
              size="small"
              floated="right"
              onClick={this.toggleCreateForm}
            >
              {showCreateForm ? 'Cancel' : 'New slot type'}
            </Button>
            <Icon name="question"/>
            <Header.Content>
              Slot Types
              <Header.Subheader>
                Slot types can only be used in <em>source mode</em>, see the document
                for more details.
              </Header.Subheader>
            </Header.Content>
          </Header>
          {showCreateForm ? (
            <SlotTypeCreateForm
              onSuccess={this.handleSlotTypeCreated}
              slotTypeNameList={currentSlotTypeNames}
            />
          ) : null}
          <Input
            icon="search"
            onChange={e => this.filterList(e.target.value)}
            fluid
            placeholder="Search slot types..."
          />
        </header>
        {filteredSlotTypes.map(slotType => (
          <SlotTypeItem
            key={slotType.name}
            slotType={slotType}
            updateSlotTypes={this.updateSlotValues}
            removeSlotType={this.removeSlotTypes}
            initialIsOpen={filterString.length > 0}
          />
        ))}
        {slotTypes.length === 0 ? (
          <div className={styles.container}>
          <div className={styles.missingItems}>
            <p>You don't have any slot types associated with this project.</p>
          </div>
          </div>
        ) : null}
      </div>
    );
  }
}

ResourcesSlotTypes.propTypes = {
  slotTypes: PropTypes.array.isRequired,
  updateSlotTypes: PropTypes.func.isRequired,
  removeSlotTypes: PropTypes.func.isRequired,
};

export default ResourcesSlotTypes;
