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
import { DocumentFilter, ExtensionContext } from 'vscode';

import {
  mockVsCode,
  restoreVsCode,
  assertCalledManyTimesWithArgs,
} from './utilities';

describe('vscode.activate', () => {
  const SFB_FORMAT: DocumentFilter = { language: 'abc-format', scheme: 'file' };

  let mockedVsCode;
  let dummyExtensionContext: ExtensionContext;
  let updateDiagnostics: any;
  let activate: any; // Subject under test

  beforeEach(() => {
    mockedVsCode = mockVsCode();
    const extension = require('../extension');
    activate = extension.activate;

    updateDiagnostics = sinon.stub(extension, 'updateDiagnostics');

    dummyExtensionContext = {
      subscriptions: [],
    } as unknown as ExtensionContext;
  });

  afterEach(() => {
    sinon.restore();
    restoreVsCode();
  });

  it('creates diagnostic collection into extension context', async () => {
    const stubCollection = mockedVsCode.languages.createDiagnosticCollection();

    await activate(dummyExtensionContext);

    assert.equal(dummyExtensionContext.subscriptions[0], stubCollection);
  });

  it('does not update diagnostics', async () => {
    await activate(dummyExtensionContext);

    assertCalledManyTimesWithArgs(updateDiagnostics, []);
  });

  describe('with a current document', () => {
    beforeEach(() => {
      sinon.stub(mockedVsCode, 'window').value({
        activeTextEditor: { document: sinon.stub() },
        onDidChangeActiveTextEditor: sinon.stub(),
        registerTreeDataProvider: sinon.stub(),
      });
    });

    it('updates diagnostics with current document', async () => {
      const stubCollection = mockedVsCode.languages.createDiagnosticCollection();
      const stubDocument = mockedVsCode.window.activeTextEditor.document;

      await activate(dummyExtensionContext);

      assertCalledManyTimesWithArgs(updateDiagnostics, [
        [stubDocument, stubCollection],
      ]);
    });
  });

  it('subscribes 9 listeners', async () => {
    await activate(dummyExtensionContext);

    assert.equal(dummyExtensionContext.subscriptions.length, 9);
  });

  it('subscribes diagnostics update to active text editor change event', async () => {
    await activate(dummyExtensionContext);

    const stubCollection = mockedVsCode.languages.createDiagnosticCollection();
    const subscription = dummyExtensionContext.subscriptions[1] as any;

    assert.equal(subscription.stubType, 'onDidChangeActiveTextEditor');

    subscription.args[0]({ document: 'dummy-document' });

    assertCalledManyTimesWithArgs(updateDiagnostics, [
      ['dummy-document', stubCollection],
    ]);
  });

  it('subscribes diagnostics update to document change event', async () => {
    await activate(dummyExtensionContext);

    const stubCollection = mockedVsCode.languages.createDiagnosticCollection();
    const subscription = dummyExtensionContext.subscriptions[2] as any;

    assert.equal(subscription.stubType, 'onDidChangeTextDocument');

    subscription.args[0]({ document: 'dummy-foo-document' });

    assertCalledManyTimesWithArgs(updateDiagnostics, [
      ['dummy-foo-document', stubCollection],
    ]);
  });

  it('registers definition provider', async () => {
    await activate(dummyExtensionContext);

    const registeredProvider = dummyExtensionContext.subscriptions[3] as any;

    assert.equal(registeredProvider.stubType, 'registerDefinitionProvider');
    assert.equal(registeredProvider.args.length, 2);
    assert.deepEqual(registeredProvider.args[0], SFB_FORMAT);
    assert.equal(registeredProvider.args[1].constructor.name, 'SceneDefinitionProvider');
  });

  it('registers signature help provider', async () => {
    await activate(dummyExtensionContext);

    const registeredProvider = dummyExtensionContext.subscriptions[4] as any;

    assert.equal(registeredProvider.stubType, 'registerSignatureHelpProvider');
    assert.equal(registeredProvider.args.length, 3);
    assert.deepEqual(registeredProvider.args[0], SFB_FORMAT);
    assert.equal(registeredProvider.args[1].constructor.name, 'SceneContentProvider');
    assert.equal(registeredProvider.args[2], ' ');
  });

  it('registers hover provider', async () => {
    await activate(dummyExtensionContext);

    const registeredProvider = dummyExtensionContext.subscriptions[5] as any;

    assert.equal(registeredProvider.stubType, 'registerHoverProvider');
    assert.equal(registeredProvider.args.length, 2);
    assert.deepEqual(registeredProvider.args[0], SFB_FORMAT);
    assert.equal(registeredProvider.args[1].constructor.name, 'SceneDefinitionHover');
  });

  it('registers completion provider for scene property syntax', async () => {
    await activate(dummyExtensionContext);

    const registeredProvider = dummyExtensionContext.subscriptions[6] as any;

    assert.equal(registeredProvider.stubType, 'registerCompletionItemProvider');
    assert.equal(registeredProvider.args.length, 3);
    assert.deepEqual(registeredProvider.args[0], SFB_FORMAT);
    assert.equal(registeredProvider.args[1].constructor.name, 'SceneCompletionProvider');
    // @ts-ignore: Accessing private property for assertion
    assert.equal(registeredProvider.args[1].completionType, 'scene_property');
    assert.equal(registeredProvider.args[2], '*');
  });

  it('registers completion provider for scene goto syntax', async () => {
    await activate(dummyExtensionContext);

    const registeredProvider = dummyExtensionContext.subscriptions[7] as any;

    assert.equal(registeredProvider.stubType, 'registerCompletionItemProvider');
    assert.equal(registeredProvider.args.length, 4);
    assert.deepEqual(registeredProvider.args[0], SFB_FORMAT);
    assert.equal(registeredProvider.args[1].constructor.name, 'SceneCompletionProvider');
    // @ts-ignore: Accessing private property for assertion
    assert.equal(registeredProvider.args[1].completionType, 'scene_goto');
    assert.equal(registeredProvider.args[2], ' ');
    assert.equal(registeredProvider.args[3], '>');
  });

  it('registers completion provider for available slots', async () => {
    await activate(dummyExtensionContext);

    const registeredProvider = dummyExtensionContext.subscriptions[8] as any;

    assert.equal(registeredProvider.stubType, 'registerCompletionItemProvider');
    assert.equal(registeredProvider.args.length, 3);
    assert.deepEqual(registeredProvider.args[0], SFB_FORMAT);
    assert.equal(registeredProvider.args[1].constructor.name, 'SceneCompletionProvider');
    // @ts-ignore: Accessing private property for assertion
    assert.equal(registeredProvider.args[1].completionType, 'available_slots');
    assert.equal(registeredProvider.args[2], "'");
  });

  it('registers tree data provider', async () => {
    await activate(dummyExtensionContext);

    const calls = mockedVsCode.window.registerTreeDataProvider.getCalls();
    assert.equal(calls.length, 1);

    const args = calls[0].args;
    assert.equal(args[0], 'story-outline');
    assert.equal(args[1].constructor.name, 'ExperimentOutlineProvider');
  });

  it('registers story selection extension', async () => {
    await activate(dummyExtensionContext);

    const calls = mockedVsCode.commands.registerCommand.getCalls();
    assert.equal(calls.length, 1);

    const args = calls[0].args;
    assert.equal(args[0], 'extension.openStorySelectionExperiment');
  });
});
