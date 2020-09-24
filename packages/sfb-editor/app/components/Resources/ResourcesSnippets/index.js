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
import { Message, Icon, Header, Input, List, Button } from 'semantic-ui-react';

import { setEventTransfer } from 'slate-react';
import styles from './styles.css';
import snippetIcon from './icon.png';
import SnippetCreateForm from '../../../containers/SnippetCreateForm';

class SnippetItem extends React.PureComponent {
  constructor(props) {
    super(props);
    this.dragImage = new Image();
    this.dragImage.src = snippetIcon;
  }

  state = {
    isOpen: false,
    iconMap: {
      break: 'pause',
      audio: 'volume up',
      voice: 'microphone',
      default: 'cut'
    }
  };

  toggleIsOpen = () => {
    const { isOpen } = this.state;

    this.setState({ isOpen: !isOpen });
  };

  handleDragOver = e => {
    e.preventDefault();
  };

  handleDragStart = (short, long) => e => {
    const params = this.getSnippetParameters(long);
    setEventTransfer(
      e,
      'text',
      JSON.stringify({ snippetText: short, type: 'snippet', params })
    );
    e.dataTransfer.setDragImage(this.dragImage, -20, 0);
  };

  getSnippetParameters = (snippetText) => snippetText.match(/(\$[0-9]+)/g);

  getIcon(snippetCode) {
    // Looks for <audio or </audio style tags in order to map icons to the type of tag
    const m = snippetCode.match(/<\/?([a-zA-Z]+)/);
    const { iconMap } = this.state;
    if (m && m[1] && iconMap[m[1]]) {
      return iconMap[m[1]];
    }
    return iconMap.default;
  }

  handleDelete = snippetName => () => {
    const { onDelete } = this.props;
    onDelete(snippetName);
  };

  render() {
    const { item } = this.props;
    const { short, long } = item;
    const { isOpen } = this.state;

    return (
      <React.Fragment>
        <List.Item
          className={styles.snippetListItem}
          draggable
          onClick={this.toggleIsOpen}
          onDragStart={this.handleDragStart(short, long)}
          onDragOver={this.handleDragOver}
        >
          <List.Content floated="right">
            <Icon name={!isOpen ? 'chevron down' : 'chevron up'} />
          </List.Content>
          <List.Content>
            <Icon className={styles.snippetIcon} name={this.getIcon(long)} />
            {short}
          </List.Content>
        </List.Item>
        {isOpen ? (
          <div className={styles.content}>
            <code className={styles.code}>{long}</code>
            <Button
              onClick={this.handleDelete(short)}
              className={styles.deleteButton}
              type="button"
              icon="trash"
            />
          </div>
        ) : null}
      </React.Fragment>
    );
  }
}

SnippetItem.propTypes = {
  item: PropTypes.object.isRequired,
  onDelete: PropTypes.func.isRequired
};

class ResourcesSnippets extends React.PureComponent {
  state = {
    filteredSnippets: [],
    filterString: '',
    showCreateForm: false
  };

  componentDidMount() {
    const { snippets } = this.props;
    this.setState({
      filteredSnippets: snippets
    });
  }

  handleSnippetCreated = () => {
    const { filterString } = this.state;
    this.filterSnippetList(filterString);
    this.toggleCreateForm();
  };

  toggleCreateForm = () => {
    const { showCreateForm } = this.state;
    this.setState({
      showCreateForm: !showCreateForm
    });
  };

  filterSnippetList = filterString => {
    const { snippets } = this.props;
    const filteredList = snippets.filter(
      snippet =>
        !filterString ||
        filterString.length === 0 ||
        snippet.short.toUpperCase().indexOf(filterString.toUpperCase()) > -1
    );
    this.setState({
      filteredSnippets: filteredList,
      filterString
    });
  };

  handleDelete = short => {
    const { deleteSnippet } = this.props;
    const { filterString } = this.state;
    deleteSnippet({ short }).then(() => this.filterSnippetList(filterString));
  };

  render() {
    const { hasError, errorMessage, snippets } = this.props;
    const { filteredSnippets, showCreateForm } = this.state;
    let noResults = null;
    if (snippets.length === 0) {
      noResults = `You don't have any snippets associated with this project.`;
    } else if (filteredSnippets.length === 0) {
      noResults = `No snippets found for your filter query.`;
    }
    return (
      <div>
        <header className={styles.container}>
          <Header as="h3">
            <Button
              size="small"
              floated="right"
              onClick={this.toggleCreateForm}
            >
              {showCreateForm ? 'Cancel' : 'New snippet'}
            </Button>
            <Icon name="cut" />
            <Header.Content>
              Snippets
              <Header.Subheader>
                To use a snippet, put <strong>[snippet name]</strong> in your
                say block, or drag and drop from the list below.
              </Header.Subheader>
            </Header.Content>
          </Header>
          {showCreateForm ? (
            <SnippetCreateForm onSuccess={this.handleSnippetCreated} />
          ) : null}
          <Input
            icon="search"
            onChange={e => this.filterSnippetList(e.target.value)}
            fluid
            placeholder="Filter snippets..."
          />
        </header>
        {hasError ? (
          <Message warning>
            <p>{errorMessage}</p>
          </Message>
        ) : (
          <React.Fragment>
            <List divided verticalAlign="middle">
              {filteredSnippets.map(p => (
                <SnippetItem
                  onDelete={this.handleDelete}
                  item={p}
                  key={p.short}
                />
              ))}
            </List>
            <div className={[styles.container, styles.missingItems].join(' ')}>
            <p>{noResults}</p>
            </div>
          </React.Fragment>
        )}
      </div>
    );
  }
}

ResourcesSnippets.propTypes = {
  snippets: PropTypes.array.isRequired,
  hasError: PropTypes.bool.isRequired,
  errorMessage: PropTypes.string.isRequired,
  deleteSnippet: PropTypes.func.isRequired
};

export default ResourcesSnippets;
