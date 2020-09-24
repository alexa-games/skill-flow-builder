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
import { strict as assert } from 'assert';
import { TextDocument, DiagnosticCollection } from 'vscode';

import {
  PROJECT_CONTENT_DIR,
  DUMMY_FILE_SYSTEM,
  mockVsCode,
  restoreVsCode,
} from './utilities';

describe('vscode.updateDiagnostics', function() {
  this.timeout(5000);

  let dummyFileSystem: any;
  let dummyDocument: TextDocument;
  let dummyCollection: DiagnosticCollection;
  let updateDiagnostics: any; // Subject under test

  beforeEach(() => {
    mockVsCode();
    updateDiagnostics = require('../extension').updateDiagnostics;

    dummyFileSystem = JSON.parse(JSON.stringify(DUMMY_FILE_SYSTEM));
    mockFileSystem(dummyFileSystem);

    dummyDocument = {
      languageId: 'abc-format',
      uri: { fsPath: `${PROJECT_CONTENT_DIR}/foo.abc`, },
      lineAt: sinon.stub().callsFake((lineNumber) => ({ range: `dummy-range-at-line-${lineNumber}` })),
    } as unknown as TextDocument;

    dummyCollection = new Map() as unknown as DiagnosticCollection;
    // @ts-ignore: Set dummy String-type keys and values
    dummyCollection.set('foo-key', 'foo-value');
  });

  afterEach(() => {
    mockFileSystem.restore();
    restoreVsCode();
  });

  it('clears diagnostic collection', async () => {
    await updateDiagnostics(dummyDocument, dummyCollection);

    // @ts-ignore
    assert.equal(dummyCollection.size, 0);
  });

  describe('with import errors', () => {
    beforeEach(() => {
      delete dummyFileSystem[PROJECT_CONTENT_DIR]['more-content']['bar.abc'];

      mockFileSystem.restore();
      mockFileSystem(dummyFileSystem);
    });

    it('pushes import errors into diagnostic collection', async () => {
      await updateDiagnostics(dummyDocument, dummyCollection);

      assert.deepEqual(
        // @ts-ignore
        dummyCollection.get(dummyDocument.uri),
        [
          {
            code: '',
            message: 'Cannot find the scene name=[answered no] to go to.',
            range: 'dummy-range-at-line-11',
            severity: 0,
            source: '',
            relatedInformation: [],
          },
        ],
      );
    });
  });

  describe('when document is empty', () => {
    beforeEach(() => {
      dummyDocument = null;
    });

    it('clears diagnostic collection', async () => {
      await updateDiagnostics(dummyDocument, dummyCollection);

      // @ts-ignore
      assert.equal(dummyCollection.size, 0);
    });
  });

  describe('when document is not sfb-format', () => {
    beforeEach(() => {
      dummyDocument = { languageId: 'some-other-language' } as unknown as TextDocument;
    });

    it('clears diagnostic collection', async () => {
      await updateDiagnostics(dummyDocument, dummyCollection);

      // @ts-ignore
      assert.equal(dummyCollection.size, 0);
    });
  });
});
