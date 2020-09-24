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

import * as sinon from 'sinon';
import { strict as assert } from 'assert';
import { TextDocument, Range } from 'vscode';

import {
  PROJECT_CONTENT_DIR,
  DUMMY_FILE_SYSTEM,
  mockVsCode,
  restoreVsCode,
  assertCalledManyTimesWithArgs,
} from './utilities';

describe('ExperimentOutlineProvider', () => {
  let mockedVsCode: any;
  let dummyFileSystem: any;
  let experimentOutlineProvider: any; // Subject under test

  beforeEach(() => {
    mockedVsCode = mockVsCode();
    experimentOutlineProvider = new (require('../ExperimentOutlineProvider').ExperimentOutlineProvider)();

    const dummyDocument = {
      languageId: 'abc-format',
      uri: { fsPath: `${PROJECT_CONTENT_DIR}/foo.abc`, },
      lineAt: sinon.stub(),
      positionAt: sinon.stub(),
      getText: () => DUMMY_FILE_SYSTEM[PROJECT_CONTENT_DIR]['foo.abc'],
    } as unknown as TextDocument;

    sinon.stub(mockedVsCode, 'window').value({
      activeTextEditor: {
        document: dummyDocument,
        revealRange: sinon.stub(),
      },
      onDidChangeActiveTextEditor: sinon.stub(),
      registerTreeDataProvider: sinon.stub(),
    });
  });

  afterEach(() => {
    sinon.restore();
    restoreVsCode();
  });

  const parseTree = async () => {
    // @ts-ignore: Access private method for more composable testing
    await experimentOutlineProvider.parseTree();
  };

  describe('.parseTree', () => {
    beforeEach(async () => {
      await parseTree();
    });

    it('sets the editor', async () => {
      assert.equal(
        // @ts-ignore: Access private method for more composable testing
        experimentOutlineProvider.editor,
        mockedVsCode.window.activeTextEditor,
      )
    });

    it('sets the text', async () => {
      assert.equal(
        // @ts-ignore: Access private method for more composable testing
        experimentOutlineProvider.text,
        DUMMY_FILE_SYSTEM[PROJECT_CONTENT_DIR]['foo.abc'],
      );
    });

    it('parses scenes and sets a tree', async () => {
      assert.deepEqual(
        (await experimentOutlineProvider.getChildren()).map(s => ({
          id: s.id,
          narrations: s.contents.map(c => c.narration),
        })),
        [
          {
            id: 'start',
            narrations: ['Dummy start scene! Go to next scene?'],
          },
          {
            id: 'second scene',
            narrations: ['You brave soul!\n  [pause]\n  You get nothing. The cake is a lie.'],
          },
        ],
      );
    });
  });

  describe('.getChildren', () => {
    beforeEach(async () => {
      await parseTree();
    });

    describe('without a given scene', () => {
      describe('with an empty tree', () => {
        beforeEach(async () => {
          experimentOutlineProvider.tree = [];
        });

        it('returns an empty array', async () => {
          assert.deepEqual(
            await experimentOutlineProvider.getChildren(),
            [],
          );
        });
      });

      describe('with a parsed tree', () => {
        it('returns the tree of scenes', async () => {
          assert.deepEqual(
            (await experimentOutlineProvider.getChildren()).map(s => s.id),
            ['start', 'second scene'],
          );
        });
      });
    });

    describe('with a given scene', () => {
      it('returns an empty array', async () => {
        assert.deepEqual(
          await experimentOutlineProvider.getChildren('dummy scene'),
          [],
        );
      });
    });
  });

  describe('.select', () => {
    beforeEach(async () => {
      await parseTree();
    });

    it('reveals range in active editor', async () => {
      const dummyRange = sinon.stub() as unknown as Range;

      experimentOutlineProvider.select(dummyRange);

      assertCalledManyTimesWithArgs(mockedVsCode.window.activeTextEditor.revealRange, [
        [dummyRange, 3],
      ]);
    });
  });

  describe('.refresh', () => {
    beforeEach(async () => {
      await parseTree();
    });

    it('fires correct offset', async () => {
      const offset = 'dummy offset';

      const fireSpy = sinon.spy();
      sinon.stub(experimentOutlineProvider, '_onDidChangeTreeData').value({ fire: fireSpy });

      await experimentOutlineProvider.refresh(offset);

      assert(fireSpy.calledWith(offset));
    });

    it('fires null', async () => {
      const fireSpy = sinon.spy();
      sinon.stub(experimentOutlineProvider, '_onDidChangeTreeData').value({ fire: fireSpy });

      await experimentOutlineProvider.refresh();

      assert(fireSpy.calledWith(null));
    });

    it('is a no-op if disabled', async () => {
      mockedVsCode.window.activeTextEditor.document.languageId = 'disabled';
      const fireSpy = sinon.spy();
      sinon.stub(experimentOutlineProvider, '_onDidChangeTreeData').value({ fire: fireSpy });

      await experimentOutlineProvider.refresh();

      assert(fireSpy.notCalled);
    });
  });

  describe('.getTreeItem', () => {
    beforeEach(async () => {
      await parseTree();
    });
    it('returns a valid tree item', async () => {
      sinon.stub(experimentOutlineProvider, 'editor').value({ 
        document: { 
          positionAt: sinon.stub().returns({
            translate: sinon.stub(),
          }),
          getText: sinon.stub(),
          validatePosition: sinon.stub().returns({
            isEqual: sinon.stub()
          })
        }
      });
      sinon.stub(experimentOutlineProvider, 'context').value({ 
        asAbsolutePath: sinon.stub()
      });
      
      const actual = await experimentOutlineProvider.getTreeItem({
        id: 'dummy id',
        customProperties: {
          sourceLocation: {
            translate: sinon.stub()
          }
        }
      });

      assert('command' in actual);
      assert('iconPath' in actual);
      assert('contextValue' in actual);
    });

    it('is a no-op if no valid scene id is passed', async () => {
      const actual = await experimentOutlineProvider.getTreeItem({id: null});

      assert.equal(actual, null);
    });
  });

  describe('.onActiveEditorChanged', () => {
    beforeEach(async () => {
      await parseTree();
    });

    it('handles an enabled active test editor', async () => {
      const commandSpy = sinon.spy();
      sinon.stub(mockedVsCode, 'commands').value({executeCommand: commandSpy});

      mockedVsCode.window.activeTextEditor.document.uri.scheme = 'file';
      mockedVsCode.window.activeTextEditor.document.languageId = 'abc-format';

      const parseTreeSpy = sinon.spy();
      const refreshSpy = sinon.spy();
      sinon.stub(experimentOutlineProvider, 'parseTree').value(parseTreeSpy);
      sinon.stub(experimentOutlineProvider, 'refresh').value(refreshSpy);

      await experimentOutlineProvider.onActiveEditorChanged();

      assert(commandSpy.calledWith('setContext', 'abcExperimentOutlineEnabled', true))
      assert(parseTreeSpy.called);
      assert(refreshSpy.called);
    });

    it('handles no active text editor', async () => {
      mockedVsCode.window.activeTextEditor = null;

      const commandSpy = sinon.spy();
      sinon.stub(mockedVsCode, 'commands').value({executeCommand: commandSpy});

      await experimentOutlineProvider.onActiveEditorChanged();

      assert(commandSpy.calledWith('setContext', 'abcExperimentOutlineEnabled', false))
    });
  });

  describe('.onDocumentChanged', () => {
    beforeEach(async () => {
      await parseTree();

      sinon.stub(experimentOutlineProvider.editor.document, 'uri').value('dummy uri');
    });

    it('handles matching no scene', async () => {
      const fireSpy = sinon.spy();
      sinon.stub(experimentOutlineProvider, '_onDidChangeTreeData').value({ fire: fireSpy });

      sinon.stub(experimentOutlineProvider.editor.document, 'getText').value(() => {
        return 'dummy text';
      });

      const actual = await experimentOutlineProvider.onDocumentChanged({
        document: {
          uri: 'dummy uri'
        }
      });

      assert(fireSpy.calledWith(null));
      assert.deepEqual(experimentOutlineProvider.tree, []);
      assert.equal(actual, false);
    });

    it('handles matching scenes', async () => {
      const fireSpy = sinon.spy();
      const parseTreeSpy = sinon.spy();
      sinon.stub(experimentOutlineProvider, '_onDidChangeTreeData').value({ fire: fireSpy });
      sinon.stub(experimentOutlineProvider, 'parseTree').value(parseTreeSpy);

      sinon.stub(experimentOutlineProvider, 'tree').value(null);

      const actual = await experimentOutlineProvider.onDocumentChanged({
        document: {
          uri: 'dummy uri'
        }
      });

      assert(fireSpy.calledWith(null));
      assert(parseTreeSpy.called);
      assert.equal(actual, true);
    });


    it('is a no-op when editor is not defined', async () => {
      sinon.stub(experimentOutlineProvider, 'editor').value(null);
      const actual = await experimentOutlineProvider.onDocumentChanged({
        document: {
          uri: 'dummy uri'
        }
      });

      assert.equal(actual, null);
    });

    it('is a no-op on a non-matching changeEvent', async () => {
      const actual = await experimentOutlineProvider.onDocumentChanged({
        document: {
          uri: 'random dummy uri'
        }
      });

      assert.equal(actual, null);
    });
  });
});
