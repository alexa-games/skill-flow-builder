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

import * as fs from 'fs';
import * as path from 'path';
import * as sinon from 'sinon';
import { strict as assert } from 'assert';

export const PROJECT_CONTENT_DIR = '/dummy/project/content';

/**
 * Dummy file system for use with `mock-fs`.
 *
 * Directory tree is modeled as an object tree, with leaf nodes as file content.
 */
export const DUMMY_FILE_SYSTEM = {
  /**
   * SFB project content directory.
   *
   * Contains `.abc` files that form the story, and public resources.
   */
  [PROJECT_CONTENT_DIR]: {
    'MANIFEST.json': JSON.stringify({
      include: ['*.abc', 'more-content/*.abc'],
      version: 1,
    }),
    'foo.abc': `
@start
*say
  Dummy start scene! Go to next scene?
*then
  clear answeredNo
  hear yes, go to next scene {
    -> second scene
  }
  hear no {
    flag answeredNo
    -> answered no
  }

@second scene
*say
  You brave soul!
  [pause]
  You get nothing. The cake is a lie.
*then
  >> END
`,
    'more-content': {
      'bar.abc': `
@answered no
*say
  Just go to next scene! What say you?
*then
  hear yes {
    -> second scene
  }
  hear no {
    >> END
  }
`,
      'baz.abc': `
@global append
*then
  hear start over {
    >> RESTART
  }
`,
    },
  },
};

const FAKE_VS_CODE_PATH = path.resolve(`${__dirname}/../../node_modules/vscode/index.js`);

/**
 * `vscode` is exposed as a JS module to be imported, but it only really exists
 * inside the VS environment. The `vscode` node module doesn't actually contain
 * an executable JS file.
 *
 * Hence, we create a mock of the module by manually creating an `index.js` file
 * inside `node_modules`.
 *
 * Any module that depends on `vscode` must be dynamically `require`d after this
 * function is run.
 *
 * Note that you can still import VS typings from `vscode.d.ts` before running
 * this function.
 */
export const mockVsCode = () => {
  fs.writeFileSync(FAKE_VS_CODE_PATH, `
exports.TextEditorRevealType = {};
exports.DiagnosticSeverity = {};
exports.Uri = {};
exports.Location = class {
  constructor(...args) {
    this.stubType = 'Location';
    this.constructorArgs = args;
  }
};
exports.Position = class {
  constructor(line, character) {
    this.line = line;
    this.character = character;
  }
};
exports.Range = class {
  constructor(start, end) {
    this.start = start;
    this.end = end;
  }
};
exports.EventEmitter = class {};
exports.languages = {};
exports.window = {};
exports.workspace = {};
exports.commands = {};
exports.TreeItem = class {
  constructor(label, collapsibleState) {
    this.label = label;
    this.collapsibleState = collapsibleState;
  }
};
exports.TreeItemCollapsibleState = {};
exports.MarkdownString = class {
  constructor(value) {
    this.value = value;
  }
};
exports.SignatureHelp = class {};
exports.SignatureInformation = class {
  constructor(label, documentation) {
    this.label = label;
    this.documentation = documentation;
  }
};
exports.Hover = class {
  constructor(contents) {
    this.contents = contents;
  }
}
exports.CompletionItem = class {
  constructor(label, kind) {
    this.label = label;
    this.kind = kind;
  }
};
exports.CompletionItemKind = {
  Text: 0,
  Method: 1,
  Function: 2,
  Constructor: 3,
  Field: 4,
  Variable: 5,
  Class: 6,
  Interface: 7,
  Module: 8,
  Property: 9,
  Unit: 10,
  Value: 11,
  Enum: 12,
  Keyword: 13,
  Snippet: 14,
  Color: 15,
  Reference: 17,
  File: 16,
  Folder: 18,
  EnumMember: 19,
  Constant: 20,
  Struct: 21,
  Event: 22,
  Operator: 23,
  TypeParameter: 24
};
`);

  const vscode = require('vscode');

  sinon.stub(vscode, 'TextEditorRevealType').value({ AtTop: 3 });
  sinon.stub(vscode, 'DiagnosticSeverity').value({ Error: 0 });
  sinon.stub(vscode, 'Uri').value({
    file: (path) => ({ stubType: 'Uri', path }),
  });
  sinon.stub(vscode, 'languages').value({
    createDiagnosticCollection: sinon.stub().returns(sinon.stub()),
    registerDefinitionProvider: (...args) => ({
      stubType: 'registerDefinitionProvider',
      args,
    }),
    registerSignatureHelpProvider: (...args) => ({
      stubType: 'registerSignatureHelpProvider',
      args,
    }),
    registerHoverProvider: (...args) => ({
      stubType: 'registerHoverProvider',
      args,
    }),
    registerCompletionItemProvider: (...args) => ({
      stubType: 'registerCompletionItemProvider',
      args,
    }),
  });
  sinon.stub(vscode, 'window').value({
    activeTextEditor: null,
    onDidChangeActiveTextEditor: (...args) => ({
      stubType: 'onDidChangeActiveTextEditor',
      args,
    }),
    registerTreeDataProvider: sinon.stub(),
  });
  sinon.stub(vscode, 'workspace').value({
    onDidChangeTextDocument: (...args) => ({
      stubType: 'onDidChangeTextDocument',
      args,
    }),
  });
  sinon.stub(vscode, 'commands').value({
    registerCommand: sinon.stub(),
  });  

  return vscode;
};

/**
 * @see `mockVsCode`
 */
export const restoreVsCode = () => {
  fs.unlinkSync(FAKE_VS_CODE_PATH);
};

export const assertCalledManyTimesWithArgs = (sinonStub: any, calls: any[][]) => {
  assert.deepEqual(getArgsForEachCall(sinonStub), calls);
};

export const getArgsForEachCall = (sinonStub: any) => {
  return sinonStub.getCalls().map((c: any) => c.args);
}
