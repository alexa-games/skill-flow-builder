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
import SlateHtmlSerializer from 'slate-html-serializer';

const ROOT_TAG = 'speak';
const ROOT_TAG_OPEN_LENGTH = `<${ROOT_TAG}>`.length;
const ROOT_TAG_CLOSE_LENGTH = `</${ROOT_TAG}>`.length;

const VALUE_REGEX = /{.*?}/g;
const SNIPPET_REGEX = /\[.*?\]/g;

const AMAZON_NAMESPACE_URI = 'http://www.amazon.com';
const AMAZON_NAMESPACE_STRING = 'xmlns:amazon="http://www.amazon.com"';

const ALL_NODES = [
  { object: 'text' },
  { type: 'amazon:effect' },
  { type: 'audio' },
  { type: 'break' },
  { type: 'emphasis' },
  { type: 'lang' },
  { type: 'parsererror' },
  { type: 'paragraph' },
  { type: 'phoneme' },
  { type: 'prosody' },
  { type: 'say-as' },
  { type: 'sentence' },
  { type: 'snippet' },
  { type: 'speak' },
  { type: 'value' },
  { type: 'sub' },
  { type: 'voice' },
  { type: 'w' }
];

const INLINE_NODES = [
  { object: 'text' },
  { type: 'amazon:effect' },
  { type: 'audio' },
  { type: 'break' },
  { type: 'emphasis' },
  { type: 'lang' },
  { type: 'parsererror' },
  { type: 'phoneme' },
  { type: 'prosody' },
  { type: 'say-as' },
  { type: 'snippet' },
  { type: 'value' },
  { type: 'sub' },
  { type: 'voice' },
  { type: 'w' }
];

export const schema = {
  document: {
    nodes: [
      {
        match: [{ type: 'speak' }]
      }
    ],
    normalize: (editor, error) => {
      if (error.code === 'child_type_invalid') {
        editor.setNodeByKey(error.child.key, { type: 'speak' });
      }
    }
  },
  // blocks
  blocks: {
    speak: {
      nodes: [{ match: ALL_NODES.filter(({ type }) => type !== 'speak') }]
    }
  },
  // inlines
  inlines: {
    'amazon:effect': {
      nodes: [{ match: INLINE_NODES }],
      data: {
        name: v => typeof v === 'string'
      }
    },
    audio: {
      isVoid: true,
      data: {
        src: v => typeof v === 'string'
      }
    },
    break: {
      isVoid: true,
      data: {
        strength: v =>
          ['none', 'x-weak', 'weak', 'medium', 'strong', 'x-strong'].includes(
            v
          ),
        time: v => typeof v === 'string'
      }
    },
    empahsis: {
      nodes: [{ match: INLINE_NODES }],
      data: {
        level: v => ['strong', 'moderate', 'reduced'].includes(v)
      }
    },
    lang: {
      nodes: [{ match: INLINE_NODES }],
      data: {
        'xml:lang': v => typeof v === 'string'
      }
    },
    parsererror: {
      nodes: [{ match: { object: 'text' } }]
    },
    phoneme: {
      nodes: [{ match: INLINE_NODES }],
      data: {
        alphabet: v => ['ipa', 'x-sampa'].includes(v),
        ph: v => typeof v === 'string'
      }
    },
    prosody: {
      nodes: [{ match: INLINE_NODES }],
      data: {
        rate: v => typeof v === 'string',
        pitch: v => typeof v === 'string',
        volume: v => typeof v === 'string'
      }
    },
    'say-as': {
      nodes: [{ match: INLINE_NODES }],
      data: {
        'interpret-as': v =>
          [
            'characters',
            'spell-out',
            'cardinal',
            'number',
            'ordinal',
            'digits',
            'fraction',
            'unit',
            'date',
            'time',
            'telephone',
            'address',
            'interjection',
            'expletive'
          ].includes(v),
        format: v =>
          ['mdy', 'dmy', 'ymd', 'md', 'dm', 'ym', 'my', 'd', 'm', 'y'].includes(
            v
          )
      }
    },
    snippet: {
      nodes: [{ match: { object: 'text' } }]
    },
    sub: {
      nodes: [{ match: INLINE_NODES }],
      data: {
        alias: v => typeof v === 'string'
      }
    },
    value: {
      nodes: [{ match: { object: 'text' } }]
    },
    voice: {
      nodes: [{ match: INLINE_NODES.filter(({ type }) => type !== 'voice') }],
      data: {
        name: v => typeof v === 'string'
      },
      normalize: (editor, error) => {
        if (error.code === 'child_type_invalid') {
          editor.removeNodeByKey(error.child.key);
        }
      }
    },
    w: {
      nodes: [{ match: INLINE_NODES }],
      data: {
        role: v =>
          ['amazon:VB', 'amazon:VBD', 'amazon:NN', 'amazon:SENSE_1'].includes(v)
      }
    }
  }
};

function Value(props) {
  return `{${props.children}}`;
}

function Snippet(props) {
  return `[${props.children}]`;
}

// Slate HTML Serializer
// https://docs.slatejs.org/other-packages/index
const rules = [
  {
    serialize(obj, children) {
      const Root = ROOT_TAG;

      if (obj.object === 'block') {
        switch (obj.type) {
          case ROOT_TAG:
            return <Root {...obj.data.toObject()}>{children}</Root>;
          default:
            return undefined;
        }
      }
      if (obj.object === 'inline') {
        switch (obj.type) {
          case 'parsererror':
            return null;
          case 'voice':
            return <voice name={obj.data.get('name')}>{children}</voice>;
          case 'audio':
            return <audio src={obj.data.get('src')}>{children}</audio>;
          case 'value':
            return <Value>{children.first()}</Value>;
          case 'snippet':
            return <Snippet>{children.first()}</Snippet>;
          default:
            return undefined;
        }
      }
      if (obj.object === 'string') {
        // disables the replacing of line feed characters with <br/>
        // https://docs.slatejs.org/other-packages/index
        return children;
      }
    },
    deserialize(el, next) {
      // parse text nodes for values
      if (el.nodeType === 3) {
        return parseSsml(el.nodeValue);
      }
      // parse tags
      switch (el.tagName.toLowerCase()) {
        case 'parsererror':
          return {
            object: 'inline',
            type: 'parsererror',
            nodes: [
              {
                object: 'text',
                text: `Error Parsing SSML. ${el.innerText}`
              }
            ]
          };
        case ROOT_TAG:
          return {
            object: 'block',
            type: ROOT_TAG,
            nodes: next(el.childNodes)
          };
        case 'audio':
          return {
            object: 'inline',
            type: 'audio',
            data: {
              src: el.getAttribute('src')
            }
          };
        case 'voice':
          return {
            object: 'inline',
            type: 'voice',
            data: {
              name: el.getAttribute('name')
            },
            nodes: next(el.childNodes)
          };
        // fallback for legacy snippets
        default:
          // Remove Amazon namespace prefix put there by the DOMParser
          if (el.namespaceURI === AMAZON_NAMESPACE_URI) {
            return {
                object: 'text',
                text: el.outerHTML.replace(` ${AMAZON_NAMESPACE_STRING}`, '') // Note: The space before the namespace must be removed too
              };
          } else {
            // legacy snippets tagname's could be anything
            return {
              object: 'text',
              text: el.outerHTML
            };
          }
      }
    }
  }
];

const parseForInlines = (regex, type, fn = returnTextNode) => ssml => {
  const valueMatches = ssml.match(regex);

  if (valueMatches && valueMatches.length > 0) {
    // slice up original string
    const pieces = ssml.split(regex);

    // reduce over pieces and insert inline nodes
    return pieces.reduce((acc, piece, i) => {
      const accumulator = acc.concat(fn(piece));

      // if thers is a value to insert
      if (i <= valueMatches.length - 1) {
        const text = valueMatches[i].substr(1, valueMatches[i].length - 2);

        // insert value
        accumulator.push({
          object: 'inline',
          type,
          nodes: [
            {
              object: 'text',
              text
            }
          ]
        });
      }

      return accumulator;
    }, []);
  }

  return fn(ssml);
};

function returnTextNode(text) {
  return {
    object: 'text',
    text
  };
}

function parseSsml(ssml) {
  const parseForSnippets = parseForInlines(SNIPPET_REGEX, 'snippet');
  const parseForValues = parseForInlines(
    VALUE_REGEX,
    'value',
    parseForSnippets
  );

  return parseForValues(ssml);
}

// Slate HTML Serializer - DOM Parser
// https://developer.mozilla.org/en-US/docs/Web/API/DOMParser
function parseHtml(str) {
  const parser = new DOMParser();
  const strWithAmazonNamespace = str.replace(`<${ROOT_TAG}>`, `<${ROOT_TAG} ${AMAZON_NAMESPACE_STRING}>`);
  const doc = parser.parseFromString(strWithAmazonNamespace, 'application/xml');

  return doc.firstElementChild;
}

export const htmlSerializer = new SlateHtmlSerializer({
  rules,
  parseHtml,
  defaultBlock: ROOT_TAG
});

function closeAudioTags(str) {
  return str.split('></audio>').join('/>');
}

function removeRootWrapper(ssml) {
  const newssml = ssml.replace(/<\/speak><speak>/g, '\n');

  return newssml.startsWith(`<${ROOT_TAG}>`)
    ? newssml.slice(
        ROOT_TAG_OPEN_LENGTH,
        newssml.length - ROOT_TAG_CLOSE_LENGTH
      )
    : newssml;
}

function removeHtmlEntities(ssml) {
  return ssml.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}

function addRootWrapper(ssml) {
  return !ssml.startsWith(`<${ROOT_TAG}>`)
    ? `<${ROOT_TAG}>${ssml}</${ROOT_TAG}>`
    : ssml;
}

function pipe(fns, data) {
  return fns.reduce((acc, fn) => fn(acc), data);
}

export function serialize(value) {
  const fns = [
    htmlSerializer.serialize,
    closeAudioTags,
    removeHtmlEntities,
    removeRootWrapper
  ];

  return pipe(
    fns,
    value
  );
}

export function deserialize(ssml) {
  const fns = [addRootWrapper, htmlSerializer.deserialize];

  return pipe(
    fns,
    ssml
  );
}

// snap to whole word selections
// https://stackoverflow.com/questions/7380190/select-whole-word-with-getselection
export function snapSelectionToWord() {
  const sel = window.getSelection();

  if (!sel.isCollapsed) {
    // Detect if selection is backwards
    const range = document.createRange();

    range.setStart(sel.anchorNode, sel.anchorOffset);
    range.setEnd(sel.focusNode, sel.focusOffset);

    const backwards = range.collapsed;

    range.detach();

    // modify() works on the focus of the selection
    const endNode = sel.focusNode;
    const endOffset = sel.focusOffset;

    sel.collapse(sel.anchorNode, sel.anchorOffset);

    const direction = backwards
      ? ['backward', 'forward']
      : ['forward', 'backward'];

    sel.modify('move', direction[0], 'character');
    sel.modify('move', direction[1], 'word');
    sel.extend(endNode, endOffset);
    sel.modify('extend', direction[1], 'character');
    sel.modify('extend', direction[0], 'word');
  }
}
