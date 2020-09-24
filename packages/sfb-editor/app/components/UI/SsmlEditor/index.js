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
import { Inline } from 'slate';
import PropTypes from 'prop-types';
import { Dropdown, Icon } from 'semantic-ui-react';

import { Editor, getEventRange, getEventTransfer } from 'slate-react';

import {
  schema,
  serialize,
  deserialize
  // snapSelectionToWord,
} from './utils';

import SsmlEditorMenu from '../SsmlEditorMenu';
import { pollyVoices } from '../../../data/polly-voices';

import styles from './styles.css';

class SsmlEditor extends React.Component {
  state = {
    value: null
  };

  componentDidMount = () => {
    const { value } = this.props;

    this.setState({ value: deserialize(value) });
    this.updateMenu();
  };

  componentDidUpdate = () => {
    this.updateMenu();
  };

  menuRef = React.createRef();

  handleChange = editor => {
    const { onChange } = this.props;
    const { value: stateValue } = this.state;
    const { value } = editor;

    if (onChange && value.document !== stateValue.document) {
      onChange(null, serialize(value));
    }

    this.setState({ value });
  };

  handleDrop = (e, editor) => {
    const { type, filename, snippetText, params } = JSON.parse(
      getEventTransfer(e).text
    );

    if (type === 'audio' && filename) {
      const range = getEventRange(e, editor);

      // Insert a [sfx <filename>] snippet on audio tag drop
      editor.insertInlineAtRange(range, {
        type: 'snippet',
        nodes: [
          {
            object: 'text',
            text: `sfx ${filename}`
          }
        ]
      });
    }

    if (type === 'snippet' && snippetText) {
      const range = getEventRange(e, editor);
      let snippetParams = '';
      if (params && params.length > 0) {
        snippetParams = ` ${params.join(' ')}`;
      }
      editor.insertInlineAtRange(range, {
        type: 'snippet',
        nodes: [
          {
            object: 'text',
            text: snippetText + snippetParams
          }
        ]
      });
    }
  };

  applyMenuCommand = (cmd, editor) => {
    const { value } = this.state;
    const { fragment } = value;

    if (cmd.toLowerCase() === 'voice') {
      const innerVoiceNodes = fragment
        .getBlocks()
        .find(({ type }) => type === 'voice');

      if (!innerVoiceNodes) {
        editor
          .delete()
          .insertInline({
            type: 'voice',
            data: {
              name: pollyVoices[0].name
            },
            nodes: [
              {
                object: 'text',
                text: fragment.getText()
              }
            ]
          })
          .moveToEnd();
      }
    } else if (cmd.toLowerCase() === 'value') {
      editor
        .delete()
        .insertInline({
          type: 'value',
          data: {},
          nodes: [
            {
              object: 'text',
              text: fragment.getText()
            }
          ]
        })
        .moveToEnd();
    }
  };

  // https://www.slatejs.org/#/hovering-menu
  updateMenu = () => {
    const menu = this.menuRef.current;

    if (!menu) return;

    const { value } = this.state;
    const { fragment, selection } = value;

    if (selection.isCollapsed || fragment.text === '') {
      menu.removeAttribute('style');
      return;
    }

    const native = window.getSelection();
    const range = native.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    const top = rect.top + window.pageYOffset - menu.offsetHeight;
    const left =
      rect.left + window.pageXOffset - menu.offsetWidth / 2 + rect.width / 2;

    menu.style.opacity = 1;
    menu.style.top = `${top}px`;
    menu.style.left = `${left}px`;
  };

  updateVoiceName = (node, editor) => (e, data) => {
    const newVoiceInline = Inline.create({
      type: 'voice',
      data: {
        name: data.value
      },
      nodes: [
        {
          object: 'text',
          text: node.getText()
        }
      ]
    });

    editor.replaceNodeByKey(node.key, newVoiceInline);
  };

  // https://docs.slatejs.org/guides/rendering#nodes-and-marks
  renderNode = (props, editor, next) => {
    const { node, attributes, children } = props;
    let newnode = next();

    switch (node.type) {
      case 'parsererror':
        newnode = (
          <span
            {...attributes}
            title="Error"
            className={styles.parserErrorToken}
          >
            <Icon name="exclamation circle" />
            {children}
          </span>
        );
        break;
      case 'speak':
        newnode = <div {...attributes}>{children}</div>;
        break;
      case 'voice':
        newnode = (
          <span
            {...attributes}
            title="Polly Voice"
            className={styles.voiceToken}
          >
            <Icon name="user circle" />
            <Dropdown
              scrolling
              value={node.data.get('name')}
              className={styles.voiceTokenDropdown}
              onChange={this.updateVoiceName(node, editor)}
              options={pollyVoices.map(pollyVoice => ({
                text: `${pollyVoice.name} (${pollyVoice.locale})`,
                value: pollyVoice.name
              }))}
            />
            {children}
          </span>
        );
        break;
      case 'snippet':
        newnode = (
          <span {...attributes} title="Snippet" className={styles.snippetToken}>
            <Icon name="cut" />
            {children}
          </span>
        );
        break;
      case 'value':
        newnode = (
          <span
            {...attributes}
            title="Dynamic Value"
            className={styles.valueToken}
          >
            <Icon name="question circle" />
            {children}
          </span>
        );
        break;
      case 'audio':
        newnode = (
          <span {...attributes} title="Audio" className={styles.audioToken}>
            <Icon name="volume up" />
            {node.data.get('src')}
          </span>
        );
        break;
      default:
        break;
    }
    return newnode;
  };

  // https://docs.slatejs.org/guides/rendering#the-editor-itself
  renderEditor = (props, editor, next) => {
    const { menuMode } = this.state;
    const children = next();

    return (
      <React.Fragment>
        {children}
        <SsmlEditorMenu
          editor={editor}
          mode={menuMode}
          ref={this.menuRef}
          applyMenuCommand={this.applyMenuCommand}
        />
      </React.Fragment>
    );
  };

  handleKeyUp = syntheticEvent => {
    const { onKeyUp } = this.props;
    if (onKeyUp && typeof onKeyUp === 'function') {
      syntheticEvent.preventDefault();
      onKeyUp(syntheticEvent);
    }
  };

  render() {
    const { readOnly = false, placeholder = 'Enter SSML here...' } = this.props;
    const { value } = this.state;

    return value ? (
      <div className={styles.editorContainer}>
        <Editor
          {...this.props}
          autoFocus
          value={value}
          schema={schema}
          readOnly={readOnly}
          placeholder={placeholder}
          renderNode={this.renderNode}
          renderEditor={this.renderEditor}
          className={`${styles.container} ssml-editor`}
          onDrop={!readOnly ? this.handleDrop : undefined}
          onChange={!readOnly ? this.handleChange : undefined}
          onKeyUp={!readOnly ? this.handleKeyUp : undefined}
        />
      </div>
    ) : null;
  }
}

SsmlEditor.propTypes = {
  value: PropTypes.string,
  readOnly: PropTypes.bool,
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
  placeholder: PropTypes.string,
  onKeyUp: PropTypes.func
};

export default SsmlEditor;
