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

// The module 'vscode' contains the VS Code extensibility API
// Import the necessary extensibility types to use in your code below
import {ExtensionContext, languages, DocumentFilter} from 'vscode';
import * as vscode from 'vscode';

import { ExperimentOutlineProvider } from './ExperimentOutlineProvider';

import { SFBImporter, ImportErrorLine } from '@alexa-games/sfb-f';

import { SceneCompletionProvider as ExperimentCompletionProvider } from './ExperimentModeExtensionHelper';
import { SceneContentProvider as ExperimentContentProvider } from './ExperimentModeExtensionHelper';
import { SceneDefinitionHover as ExperimentDefinitionHover } from './ExperimentModeExtensionHelper';
import { SceneDefinitionProvider as ExperimentDefinitionProvider } from './ExperimentModeExtensionHelper';

import { Util, ContentItem } from './Util';
const DEFAULT_MODE: DocumentFilter = { language: 'abc-format', scheme: 'file' };

let diagnosticCollection: vscode.DiagnosticCollection;

// This method is called when your extension is activated. Activation is
// controlled by the activation events defined in package.json.
export async function activate(context: ExtensionContext) {
    diagnosticCollection = vscode.languages.createDiagnosticCollection();

    context.subscriptions.push(diagnosticCollection);
	if (vscode.window.activeTextEditor) {
		await updateDiagnostics(vscode.window.activeTextEditor.document, diagnosticCollection);
    }

	context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(e => updateDiagnostics(e.document, diagnosticCollection)));
    context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(e => updateDiagnostics(e.document, diagnosticCollection)));

    context.subscriptions.push(languages.registerDefinitionProvider(
        DEFAULT_MODE, new ExperimentDefinitionProvider()));
    context.subscriptions.push(languages.registerSignatureHelpProvider(
        DEFAULT_MODE, new ExperimentContentProvider(), ' '));
    context.subscriptions.push(languages.registerHoverProvider(
        DEFAULT_MODE, new ExperimentDefinitionHover()));
    context.subscriptions.push(languages.registerCompletionItemProvider(
        DEFAULT_MODE, new ExperimentCompletionProvider("scene_property"), "*"));
    context.subscriptions.push(languages.registerCompletionItemProvider(
        DEFAULT_MODE, new ExperimentCompletionProvider("scene_goto"), ' ', '>'));
    context.subscriptions.push(languages.registerCompletionItemProvider(
            DEFAULT_MODE, new ExperimentCompletionProvider("available_slots"), "'"));

    const experimentStoryOutlineProvider = new ExperimentOutlineProvider(context);
    vscode.window.registerTreeDataProvider("story-outline", experimentStoryOutlineProvider);
    vscode.commands.registerCommand('extension.openStorySelectionExperiment', range => experimentStoryOutlineProvider.select(range));
}

export const updateDiagnostics = async (document: vscode.TextDocument, collection: vscode.DiagnosticCollection): Promise<void> => {
	if (document && document.languageId == DEFAULT_MODE.language) {
        console.log("Diagnostic start");
        let abcImporter: SFBImporter = new SFBImporter();

        try {
            let contents: ContentItem[] = await Util.getContentItemsFromDocument(document);
            console.log("importing for diagnostics.");
            const result = await abcImporter.importABCStory("default", "", "", "", false, {
                contents: contents
            });
            console.log("diag import done.");

            collection.clear();
        } catch (err) {
            console.log("diag import errored.");

            let importErrors: ImportErrorLine[] = err.errorItems;

            let errorCollections: any[] = [];
            for (let errorItem of importErrors) {
                console.log(document.uri);
                if (errorItem.sourceID != document.uri.fsPath) {
                    continue;
                }

                let lineNumber: number = errorItem.lineNumber - 1;
                let textLine: vscode.TextLine = document.lineAt(lineNumber);

                errorCollections.push({
                    code: '',
                    message: errorItem.errorMessage,
                    range: textLine.range,
                    severity: vscode.DiagnosticSeverity.Error,
                    source: '',
                    relatedInformation: []
                });
            }

            collection.set(document.uri, errorCollections);
        }
	} else {
		collection.clear();
    }

    console.log("Diagnostic end");

}
