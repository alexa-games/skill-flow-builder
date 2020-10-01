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
import * as mockFileSystem from 'mock-fs';
import * as path from 'path';
import { strict as assert } from 'assert';
import {
  CompletionItem,
  Position,
  Range,
  TextDocument,
  TextLine
} from 'vscode';

import {
  PROJECT_CONTENT_DIR,
  DUMMY_FILE_SYSTEM,
  mockVsCode,
  restoreVsCode,
} from './utilities';

describe('ExperimentModeExtensionHelper', () => {
  describe('SceneDefinitionProvider', () => {
    let dummyFileSystem: any;
    let dummyDocument: TextDocument;
    let dummyPosition: Position;
    let sceneDefinitionProvider: any; // Subject under test

    beforeEach(() => {
      mockVsCode();
      sceneDefinitionProvider = new (require('../ExperimentModeExtensionHelper').SceneDefinitionProvider)();

      dummyFileSystem = JSON.parse(JSON.stringify(DUMMY_FILE_SYSTEM));
      mockFileSystem(dummyFileSystem);

      dummyDocument = {
        languageId: 'abc-format',
        uri: { fsPath: path.resolve(`${PROJECT_CONTENT_DIR}/foo.abc`), },
        lineAt: sinon.stub(),
        positionAt: (sourceLocation) => ({ stubType: 'Position', sourceLocation })
      } as unknown as TextDocument;

      dummyPosition = { line: 12345, character: 6789 } as unknown as Position;
    });

    afterEach(() => {
      mockFileSystem.restore();
      restoreVsCode();
    });

    describe('when current line contains scene instruction', () => {
      beforeEach(() => {
        dummyDocument
          .lineAt
          // @ts-ignore: Access underlying duck-typed mock object
          .withArgs(dummyPosition.line)
          .returns({ text: '<-> second scene' });
      });

      const itReturnsSceneLocation = () => {
        it('returns scene location to jump to', async () => {
          const jumpLocation = await sceneDefinitionProvider.provideDefinition(
            dummyDocument,
            dummyPosition,
            null,
          );

          assert.deepEqual(
            JSON.parse(JSON.stringify(jumpLocation)),
            {
              stubType: 'Location',
              constructorArgs: [
                { stubType: 'Uri', path: path.resolve('/dummy/project/content/foo.abc') },
                { stubType: 'Position', sourceLocation: 188 },
              ]
            },
          );
        });
      };

      itReturnsSceneLocation();

      describe('when current story has syntax errors', () => {
        beforeEach(() => {
          delete dummyFileSystem[PROJECT_CONTENT_DIR]['more-content']['bar.abc'];

          mockFileSystem.restore();
          mockFileSystem(dummyFileSystem);
        });

        itReturnsSceneLocation();
      });

      describe('when current scene instruction contains non-existent scene', () => {
        beforeEach(() => {
          dummyDocument
            .lineAt
            // @ts-ignore: Access underlying duck-typed mock object
            .withArgs(dummyPosition.line)
            .returns({ text: '-> nonexistent scene' });
        });

        it('resolves to null', async () => {
          assert.equal(
            await sceneDefinitionProvider.provideDefinition(dummyDocument, dummyPosition, null),
            null,
          );
        });
      });
    });

    describe('when current line does not contain scene instruction', () => {
      beforeEach(() => {
        dummyDocument
          .lineAt
          // @ts-ignore: Access underlying duck-typed mock object
          .withArgs(dummyPosition.line)
          .returns({ text: 'some other kind of instruction' });
      });

      it('resolves to null', async () => {
        assert.equal(
          await sceneDefinitionProvider.provideDefinition(dummyDocument, dummyPosition, null),
          null,
        );
      });
    });
  });

  describe('SceneCompletionProvider', () => {
    const expectedNumberOfScenes = 4;

    let sceneCompletionProvider: any; // Subject under test
    let dummyFileSystem: any;
    let dummyDocument: TextDocument;
    let dummyPosition: Position;

    beforeEach(() => {
      mockVsCode();

      dummyFileSystem = JSON.parse(JSON.stringify(DUMMY_FILE_SYSTEM));
      mockFileSystem(dummyFileSystem);

      dummyDocument = {
        languageId: 'abc-format',
        uri: { fsPath: path.resolve(`${PROJECT_CONTENT_DIR}/foo.abc`), },
        positionAt: sinon.stub(),
        getText: function getTextMock(range?) {
          return 'this is text';
        }
      } as unknown as TextDocument;
      dummyPosition = { line: 12345, character: 'foo' } as unknown as Position;
    });

    afterEach(() => {
      mockFileSystem.restore();
      restoreVsCode();
    });

    describe('when completionType is "scene_goto"', () => {

      function assertScenes(actual: any) {
        assert(Array.isArray(actual));
        assert.equal(actual.length, expectedNumberOfScenes, 'returned incorrect number of scenes');
        actual.forEach((value: CompletionItem) => {
          assert.equal(value.kind, 12 /* Enum */, 'incorrect completion item kind found');
        });
      }

      beforeEach(() => {
        sceneCompletionProvider = new (require('../ExperimentModeExtensionHelper').SceneCompletionProvider)('scene_goto');
      });

      it('returns scenes if portion starts with "go to"', async () => {
        dummyDocument.lineAt = (line) => { 
          return {
            firstNonWhitespaceCharacterIndex: 1,
            isEmptyOrWhitespace: false,
            lineNumber: dummyPosition.line,
            range: { start: 1, end: 2 } as unknown as Range,
            rangeIncludingLineBreak: { start: 1, end: 2 },
            text: 'go to',
          } as unknown as TextLine; 
        };
        const actual = await sceneCompletionProvider.provideCompletionItems(dummyDocument, dummyPosition, null);

        assertScenes(actual);
      });

      it('returns scenes if portion starts with "->"', async () => {
        dummyDocument.lineAt = (line) => { 
          return {
            firstNonWhitespaceCharacterIndex: 1,
            isEmptyOrWhitespace: false,
            lineNumber: dummyPosition.line,
            range: { start: 1, end: 2 } as unknown as Range,
            rangeIncludingLineBreak: { start: 1, end: 2 },
            text: '->',
          } as unknown as TextLine; 
        };
        const actual = await sceneCompletionProvider.provideCompletionItems(dummyDocument, dummyPosition, null);

        assertScenes(actual);
      });

      it('returns scenes if portion starts with "<->"', async () => {
        dummyDocument.lineAt = (line) => { 
          return {
            firstNonWhitespaceCharacterIndex: 1,
            isEmptyOrWhitespace: false,
            lineNumber: dummyPosition.line,
            range: { start: 1, end: 2 } as unknown as Range,
            rangeIncludingLineBreak: { start: 1, end: 2 },
            text: '<->',
          } as unknown as TextLine; 
        };
        const actual = await sceneCompletionProvider.provideCompletionItems(dummyDocument, dummyPosition, null);

        assertScenes(actual);
      });

      it('returns nothing if portion starts with something else', async () => {
        dummyDocument.lineAt = (line) => { 
          return {
            firstNonWhitespaceCharacterIndex: 1,
            isEmptyOrWhitespace: false,
            lineNumber: dummyPosition.line,
            range: { start: 1, end: 2 } as unknown as Range,
            rangeIncludingLineBreak: { start: 1, end: 2 },
            text: 'something else',
          } as unknown as TextLine; 
        };
        const actual = await sceneCompletionProvider.provideCompletionItems(dummyDocument, dummyPosition, null);

        assert.equal(actual, undefined);
      });
    });

    describe('when completionType is "scene_property"', () => {
      const expectedNumberOfKeywords = 5;

      beforeEach(() => {
        sceneCompletionProvider = new (require('../ExperimentModeExtensionHelper').SceneCompletionProvider)('scene_property');
        dummyDocument.lineAt = (line) => { 
          return {
            firstNonWhitespaceCharacterIndex: 1,
            isEmptyOrWhitespace: false,
            lineNumber: dummyPosition.line,
            range: { start: 1, end: 2 } as unknown as Range,
            rangeIncludingLineBreak: { start: 1, end: 2 },
            text: 'text',
          } as unknown as TextLine; 
        };
      });

      it('returns keywords if previous character is "*"', async () => {
        dummyDocument.getText = (range?) => '*';

        const actual = await sceneCompletionProvider.provideCompletionItems(dummyDocument, dummyPosition, null);

        assert(Array.isArray(actual));
        assert.equal(expectedNumberOfKeywords, actual.length, 'incorrect number of keywords returned');
        actual.forEach((value: CompletionItem) => {
          assert.equal(value.kind, 4 /* Field */, 'incorrect completion item kind found')
        });
      });

      it('returns nothing for other characters', async () => {
        dummyDocument.getText = (range?) => '>';

        const actual = await sceneCompletionProvider.provideCompletionItems(dummyDocument, dummyPosition, null);

        assert.equal(actual, undefined);
      });
    });

    describe('when completionType is "available_slots"', () => {
      const expectedNumberOfSlots = 91;

      beforeEach(() => {
        sceneCompletionProvider = new (require('../ExperimentModeExtensionHelper').SceneCompletionProvider)('available_slots');
      });

      it('returns default slots if portion matches slot regex', async () => {
        dummyDocument.lineAt = (line) => { 
          return {
            firstNonWhitespaceCharacterIndex: 1,
            isEmptyOrWhitespace: false,
            lineNumber: dummyPosition.line,
            range: { start: 1, end: 2 } as unknown as Range,
            rangeIncludingLineBreak: { start: 1, end: 2 },
            text: "slot   as '",
          } as unknown as TextLine; 
        };
        const actual = await sceneCompletionProvider.provideCompletionItems(dummyDocument, dummyPosition, null);

        assert(Array.isArray(actual));
        assert.equal(actual.length, expectedNumberOfSlots, 'incorrect number of slots returned');
        actual.forEach((value: CompletionItem) => {
          assert.equal(value.kind, 12 /* Enum */, 'incorrect completion item kind found');
        })
      });

      it('returns nothing if portion does not match slot regex', async () => {
        dummyDocument.lineAt = (line) => { 
          return {
            firstNonWhitespaceCharacterIndex: 1,
            isEmptyOrWhitespace: false,
            lineNumber: dummyPosition.line,
            range: { start: 1, end: 2 } as unknown as Range,
            rangeIncludingLineBreak: { start: 1, end: 2 },
            text: 'there are no slots here'
          } as unknown as TextLine; 
        };
        const actual = await sceneCompletionProvider.provideCompletionItems(dummyDocument, dummyPosition, null);

        assert.equal(actual, undefined);
      });
    });
  });

  describe('SceneContentProvider', () => {
    let dummyFileSystem: any;
    let dummyDocument: TextDocument;
    let dummyPosition: Position;
    let sceneContentProvider: any; // Subject under test
    let mockedVsCode: any;

    beforeEach(() => {
      mockedVsCode = mockVsCode();
      sceneContentProvider = new (require('../ExperimentModeExtensionHelper').SceneContentProvider)();

      dummyFileSystem = JSON.parse(JSON.stringify(DUMMY_FILE_SYSTEM));
      mockFileSystem(dummyFileSystem);

      dummyDocument = {
        languageId: 'abc-format',
        uri: { fsPath: path.resolve(`${PROJECT_CONTENT_DIR}/foo.abc`), },
        lineAt: sinon.stub(),
        positionAt: (sourceLocation) => ({ stubType: 'Position', sourceLocation })
      } as unknown as TextDocument;

      dummyPosition = { line: 12345, character: 6789 } as unknown as Position;
    });

    afterEach(() => {
      mockFileSystem.restore();
      restoreVsCode();
    });

    it('returns signature that matches "increase" pattern', async () => {
      dummyDocument.lineAt = (line) => { 
        return {
          text: 'increase ',
        } as unknown as TextLine; 
      };

      const actual = await sceneContentProvider.provideSignatureHelp(dummyDocument, dummyPosition, null);

      assert.equal(actual.signatures.length, 1);
      sinon.assert.match(
        actual.signatures[0],
        {
          label: 'increase [variableName] by [number]',
          documentation: 'Increase the numeric value of the variable.'
        }
      );
    });

    it('returns signature that matches "decrease" pattern', async () => {
      dummyDocument.lineAt = (line) => { 
        return {
          text: 'decrease ',
        } as unknown as TextLine; 
      };

      const actual = await sceneContentProvider.provideSignatureHelp(dummyDocument, dummyPosition, null);
      
      assert.equal(actual.signatures.length, 1);
      sinon.assert.match(
        actual.signatures[0],
        {
          label: 'decrease [variableName] by [number]',
          documentation: 'Decrease the numeric value of the variable.'
        }
      );
    });

    it('returns signature that matches "set" pattern', async () => {
      dummyDocument.lineAt = (line) => { 
        return {
          text: 'set ',
        } as unknown as TextLine; 
      };

      const actual = await sceneContentProvider.provideSignatureHelp(dummyDocument, dummyPosition, null);
      
      assert.equal(actual.signatures.length, 1);
      sinon.assert.match(
        actual.signatures[0],
        {
          label: 'set [variableName] to [string|number|variable]',
          documentation: 'Store a value to a variable.'
        }
      );
    });

    it('returns signature that matches "->" pattern', async () => {
      dummyDocument.lineAt = (line) => { 
        return {
          text: '-> ',
        } as unknown as TextLine; 
      };

      const actual = await sceneContentProvider.provideSignatureHelp(dummyDocument, dummyPosition, null);
      
      assert.equal(actual.signatures.length, 1);
      sinon.assert.match(
        actual.signatures[0],
        {
          label: '-> [scene name]',
          documentation: 'Transition to [scene name].'
        }
      );
    });

    it('returns signature that matches "go to" pattern', async () => {
      dummyDocument.lineAt = (line) => { 
        return {
          text: 'go to ',
        } as unknown as TextLine; 
      };

      const actual = await sceneContentProvider.provideSignatureHelp(dummyDocument, dummyPosition, null);
      
      assert.equal(actual.signatures.length, 1);
      sinon.assert.match(
        actual.signatures[0],
        {
          label: 'go to [scene name]',
          documentation: 'Transition to [scene name].'
        }
      );
    });

    it('returns signature that matches "if" pattern', async () => {
      dummyDocument.lineAt = (line) => { 
        return {
          text: 'if ',
        } as unknown as TextLine; 
      };

      const actual = await sceneContentProvider.provideSignatureHelp(dummyDocument, dummyPosition, null);
      
      assert.equal(actual.signatures.length, 1);
      sinon.assert.match(
        actual.signatures[0],
        {
          label: 'if [conditions]',
          documentation: '[condition] are logical condition to check.' + 
            " If the condition passes, executes all instructions below this statement until period(.) is reached."
        }
      );
    });

    it('returns signature that matches "hear" pattern', async () => {
      dummyDocument.lineAt = (line) => { 
        return {
          text: 'hear ',
        } as unknown as TextLine; 
      };

      const actual = await sceneContentProvider.provideSignatureHelp(dummyDocument, dummyPosition, null);
      
      assert.equal(actual.signatures.length, 1);
      sinon.assert.match(
        actual.signatures[0],
        {
          label: 'hear [utterances]',
          documentation: '[utterances] are comma separated words that your story is expecting to hear at this point.' +
            " When user speaks one of the expected utterances, executes all instructions below this statement until period(.) is reached."
        }
      );
    });

    it('returns signature that matches "flag" pattern', async () => {
      dummyDocument.lineAt = (line) => { 
        return {
          text: 'flag ',
        } as unknown as TextLine; 
      };

      const actual = await sceneContentProvider.provideSignatureHelp(dummyDocument, dummyPosition, null);
      
      assert.equal(actual.signatures.length, 1);
      sinon.assert.match(
        actual.signatures[0],
        {
          label: 'flag [variableName]',
          documentation: "flagging a variable sets the value of the variable to true. Once flagged, checking the variable in 'if condition' would result in pass."
        }
      );
    });

    it('returns signature that matches "unflag" pattern', async () => {
      dummyDocument.lineAt = (line) => { 
        return {
          text: 'unflag ',
        } as unknown as TextLine; 
      };

      const actual = await sceneContentProvider.provideSignatureHelp(dummyDocument, dummyPosition, null);
      
      assert.equal(actual.signatures.length, 1);
      sinon.assert.match(
        actual.signatures[0],
        {
          label: 'unflag [variableName]',
          documentation: "Unflagging a variable sets the value of the variable to false. When the variable is unflaged, checking the variable in 'if condition' would result in fail."
        }
      );
    });

    it('returns signature that matches "stack" pattern', async () => {
      dummyDocument.lineAt = (line) => { 
        return {
          text: 'stack ',
        } as unknown as TextLine; 
      };

      const actual = await sceneContentProvider.provideSignatureHelp(dummyDocument, dummyPosition, null);
      
      assert.equal(actual.signatures.length, 1);
      sinon.assert.match(
        actual.signatures[0],
        {
          label: "stack [string|number|variable] on [stackName]",
          documentation: "Add the given item (string|number|variable) on top of a stack."
        }
      );
    });

    it('returns signature that matches "enqueue" pattern', async () => {
      dummyDocument.lineAt = (line) => { 
        return {
          text: 'enqueue ',
        } as unknown as TextLine; 
      };

      const actual = await sceneContentProvider.provideSignatureHelp(dummyDocument, dummyPosition, null);
      
      assert.equal(actual.signatures.length, 1);
      sinon.assert.match(
        actual.signatures[0],
        {
          label: "enqueue [string|number|variable] into [queueName]",
          documentation: "Add the given item (string|number|variable) into a queue."
        }
      );
    });

    it('returns signature that matches "pop" pattern', async () => {
      dummyDocument.lineAt = (line) => { 
        return {
          text: 'pop ',
        } as unknown as TextLine; 
      };

      const actual = await sceneContentProvider.provideSignatureHelp(dummyDocument, dummyPosition, null);
      
      assert.equal(actual.signatures.length, 1);
      sinon.assert.match(
        actual.signatures[0],
        {
          label: "pop [stackName]",
          documentation: "Pop the top item off of the given stack, and temporarily store the result into the variable called {system_return}."
        }
      );
    });

    it('returns signature that matches "dequeue" pattern', async () => {
      dummyDocument.lineAt = (line) => { 
        return {
          text: 'dequeue ',
        } as unknown as TextLine; 
      };

      const actual = await sceneContentProvider.provideSignatureHelp(dummyDocument, dummyPosition, null);
      
      assert.equal(actual.signatures.length, 1);
      sinon.assert.match(
        actual.signatures[0],
        {
          label: "dequeue [queueName]",
          documentation: "Dequeue first item in the given queue, and temporarily store the result into the variable called {system_return}."

        }
      );
    });

    it('returns signature that matches "remove" pattern', async () => {
      dummyDocument.lineAt = (line) => { 
        return {
          text: 'remove ',
        } as unknown as TextLine; 
      };

      const actual = await sceneContentProvider.provideSignatureHelp(dummyDocument, dummyPosition, null);
      
      assert.equal(actual.signatures.length, 1);
      sinon.assert.match(
        actual.signatures[0],
        {
          label: "remove [string|number|variable] from [stackName|queueName|bagName]",
          documentation: "Find and remove the value given (string|number|variable) from the given stack, queue, or bag."

        }
      );
    });

    it('returns signature that matches "put" pattern', async () => {
      dummyDocument.lineAt = (line) => { 
        return {
          text: 'put ',
        } as unknown as TextLine; 
      };

      const actual = await sceneContentProvider.provideSignatureHelp(dummyDocument, dummyPosition, null);
      
      assert.equal(actual.signatures.length, 1);
      sinon.assert.match(
        actual.signatures[0],
        {
          label: "put [string|number|variable] into [bagName]",
          documentation: "Add an item (string|number|variable) into a bag. The number of the item in the bag can be accessed by writing 'bagName.itemName'."

        }
      );
    });

    it('returns signature that matches "time" pattern', async () => {
      dummyDocument.lineAt = (line) => { 
        return {
          text: 'time ',
        } as unknown as TextLine; 
      };

      const actual = await sceneContentProvider.provideSignatureHelp(dummyDocument, dummyPosition, null);
      
      assert.equal(actual.signatures.length, 1);
      sinon.assert.match(
        actual.signatures[0],
        {
          label: "time",
          documentation: "Get the current epoch time in milliseconds, and store the result into the variable called {system_return}."

        }
      );
    });

    it('returns signature that matches "slot" pattern', async () => {
      dummyDocument.lineAt = (line) => { 
        return {
          text: 'slot ',
        } as unknown as TextLine; 
      };

      const actual = await sceneContentProvider.provideSignatureHelp(dummyDocument, dummyPosition, null);
      
      assert.equal(actual.signatures.length, 1);
      sinon.assert.match(
        actual.signatures[0],
        {
          label: "slot [variableName] as [string]",
          documentation: "Set the type of the variable as [string]."

        }
      );
    });

    it('returns nothing if no pattern is matched', async () => {
      dummyDocument.lineAt = (line) => { 
        return {
          text: '',
        } as unknown as TextLine; 
      };

      const actual = await sceneContentProvider.provideSignatureHelp(dummyDocument, dummyPosition, null);
      
      assert.equal(actual, null);
    });
  });

  describe('SceneDefinitionHover', () => {
    let dummyFileSystem: any;
    let dummyDocument: TextDocument;
    let dummyPosition: Position;
    let sceneDefinitionHover: any; // Subject under test
    let mockedVsCode: any;

    beforeEach(() => {
      mockedVsCode = mockVsCode();
      sceneDefinitionHover = new (require('../ExperimentModeExtensionHelper').SceneDefinitionHover)();

      dummyFileSystem = JSON.parse(JSON.stringify(DUMMY_FILE_SYSTEM));
      mockFileSystem(dummyFileSystem);

      dummyDocument = {
        languageId: 'abc-format',
        uri: { fsPath: path.resolve(`${PROJECT_CONTENT_DIR}/foo.abc`), },
        lineAt: sinon.stub().returns({
          text: 'this is some text'
        }),
        positionAt: (sourceLocation) => ({ stubType: 'Position', sourceLocation }),
        getText: function getTextMock(range?) {
          return '';
        }
      } as unknown as TextDocument;

      dummyPosition = { line: 12345, character: 6789 } as unknown as Position;
    });

    afterEach(() => {
      mockFileSystem.restore();
      restoreVsCode();
    });

    it('returns hover matching the first pattern', async () => {
      dummyDocument.lineAt = sinon.stub().returns({
        text: `-> explore the desk`
      });
      dummyDocument.getText = sinon.stub().returns(
`
@start 
  -> explore the desk

@explore the desk
  -> ending

@ending
  >> END
`);
      const appendCodeblockSpy = sinon.spy();

      mockedVsCode.MarkdownString.prototype.appendCodeblock = appendCodeblockSpy;

      const actual = await sceneDefinitionHover.provideHover(dummyDocument, dummyPosition, null);

      assert('contents' in actual);
      assert(appendCodeblockSpy.calledWith(`\n  -> ending\n\n`));
    });
    
    it('returns hover matching the last pattern', async () => {
      dummyDocument.lineAt = sinon.stub().returns({
        text: `-> ending`
      });
      dummyDocument.getText = sinon.stub().returns(
`
@start 
  -> explore the desk

@explore the desk
  -> ending

@ending
  >> END
`);
      const appendCodeblockSpy = sinon.spy();

      mockedVsCode.MarkdownString.prototype.appendCodeblock = appendCodeblockSpy;

      const actual = await sceneDefinitionHover.provideHover(dummyDocument, dummyPosition, null);

      assert('contents' in actual);
      assert(appendCodeblockSpy.calledWith(`  >> END\n`));
    });

    it('returns nothing if goto pattern is not matched', async () => {
      const actual = await sceneDefinitionHover.provideHover(dummyDocument, dummyPosition, null);
    
      assert.equal(actual, null);  
     });
  });
});
