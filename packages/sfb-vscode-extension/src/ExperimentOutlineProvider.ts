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

import * as vscode from 'vscode';

import { SFBImporter, StoryMetadata } from '@alexa-games/sfb-f';
export class ExperimentOutlineProvider implements vscode.TreeDataProvider<any> {
	private _onDidChangeTreeData: vscode.EventEmitter<any | null> = new vscode.EventEmitter<any | null>();
	readonly onDidChangeTreeData: vscode.Event<any | null> = this._onDidChangeTreeData.event;

	public tree: any = {};
	private text: string;
	private editor: vscode.TextEditor;

	constructor(private context: vscode.ExtensionContext) {
		vscode.window.onDidChangeActiveTextEditor(() => this.onActiveEditorChanged());
		vscode.workspace.onDidChangeTextDocument(e => this.onDocumentChanged(e));
	}

	async refresh(offset?: any): Promise<void> {
		const enabled = vscode.window.activeTextEditor.document.languageId === 'abc-format';
		if (enabled) {
			let titleChanged: boolean = false;
			let names: any = {};
			if (this.tree) {
				for (let index of Object.keys(this.tree)) {
					names[this.tree[index].id] = true;
				}
			}

			let sceneRegex: RegExp = /^[\s]*?@.+?$/gm;
			let matches: any[] = this.editor.document.getText().match(sceneRegex);

			for (let newTitle of matches) {
				if (!names[newTitle.replace(/[\@]+/g, "").trim().toLowerCase()]) {
					titleChanged = true;
				}
			}

			if (!this.tree || matches.length != this.tree.length || titleChanged) {
				await this.parseTree();
			}

			if (offset) {
				this._onDidChangeTreeData.fire(offset);
			} else {
				this._onDidChangeTreeData.fire(null);
			}
		}
	}

	private async onActiveEditorChanged(): Promise<void> {
		if (vscode.window.activeTextEditor) {
			if (vscode.window.activeTextEditor.document.uri.scheme === 'file') {
				const enabled = vscode.window.activeTextEditor.document.languageId === 'abc-format';
				vscode.commands.executeCommand('setContext', 'abcExperimentOutlineEnabled', enabled);
				if (enabled) {
					await this.parseTree();
					await this.refresh();
				}
			}
		} else {
			vscode.commands.executeCommand('setContext', 'abcExperimentOutlineEnabled', false);
		}
	}

	private async onDocumentChanged(changeEvent: vscode.TextDocumentChangeEvent): Promise<any> {
		console.log("Tree on Document Changed start.");
		if (this.editor && changeEvent.document.uri.toString() === this.editor.document.uri.toString()) {
			let titleChanged: boolean = false;
			let names: any = {};
			if (this.tree) {
				for (let index of Object.keys(this.tree)) {
					names[this.tree[index].id] = true;
				}
			}

			let sceneRegex: RegExp = /(?:^[\s]*?@).+?$/gm;
			let matches: any[] = this.editor.document.getText().match(sceneRegex);

			if (matches == null) {
				this.tree = [];
				this._onDidChangeTreeData.fire(null);
				console.log("Tree on Document Changed end.");
				return false;
			} else {
				for (let newTitle of matches) {
					if (!names[newTitle.replace(/[\@]+/g, "").trim().toLowerCase()]) {
						titleChanged = true;
					}
				}

				if (!this.tree || matches.length != this.tree.length || titleChanged) {
					await this.parseTree();
					this._onDidChangeTreeData.fire(null);
					console.log("Tree on Document Changed end.");
					return true;
				}
			}
		}
		return null;
	}

	private async parseTree(): Promise<void> {
		const enabled = vscode.window.activeTextEditor.document.languageId === 'abc-format';
		if (enabled) {
			this.text = '';
			this.editor = vscode.window.activeTextEditor;
			this.tree = [];
			if (this.editor && this.editor.document) {

				this.text = this.editor.document.getText();

				let abcImporter: SFBImporter = new SFBImporter();
				try {
					let importedStory: StoryMetadata = await abcImporter.importABCStory("default", "", "", "", false, {
						content: this.text,
						ignoreSyntaxError: true
					});
					this.tree = importedStory.scenes;
				} catch (err) {
					// ignore import error
				}

			}
		}
	}

	getChildren(scene?: any): Thenable<any[]> {
		if (scene) {
			return Promise.resolve([]);
		} else {
			return Promise.resolve(this.tree ? this.tree : []);
		}
	}

	getTreeItem(scene: any): vscode.TreeItem {
		if (scene.id) {
			let treeItem: vscode.TreeItem = new vscode.TreeItem(scene.id, vscode.TreeItemCollapsibleState.None);
			let sourceLocation: vscode.Position = this.editor.document.positionAt(scene.customProperties.sourceLocation);
			let letterAtPosition: string = this.editor.document.getText(new vscode.Range(sourceLocation, sourceLocation.translate(0,1)));

			while (letterAtPosition !== "@" && this.editor.document.validatePosition(sourceLocation).isEqual(sourceLocation)) {
				sourceLocation = sourceLocation.translate(0, 1);
				letterAtPosition = this.editor.document.getText(new vscode.Range(sourceLocation, sourceLocation.translate(0,1)));
			}

			treeItem.command = {
				command: 'extension.openStorySelectionExperiment',
				title: '',
				arguments: [new vscode.Range(sourceLocation, sourceLocation)]
			};

			treeItem.iconPath = {
				light: this.context.asAbsolutePath('resources/scene_icon.svg'),
				dark: this.context.asAbsolutePath('resources/scene_icon_dark.svg')
			}
			treeItem.contextValue = scene.type;
			return treeItem;

		}

		return null;
	}

	select(range: vscode.Range) {
		this.editor.revealRange(range, vscode.TextEditorRevealType.AtTop);
	}
}
