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

import path from 'path'
import React from 'react'
import PropTypes from 'prop-types'
import { debounce } from 'lodash';

import './ace'
import './ext-language_tools'

const basePath = process.env.NODE_ENV === 'production' ?
  path.resolve(process.resourcesPath, 'sfb-extensions') :
  path.resolve(__dirname, 'sfb-extensions');

// set basePath to load abc-modes
window.ace.config.set('basePath', basePath);

// Loading auto-completing code here once at start of the editor
let langTools = ace.require("ace/ext/language_tools");

let customCompleter = {
  getCompletions: function (editor, session, pos, prefix, callback) {
    if (prefix.length === 0) {
      callback(null, []);
      return
    }

    if (prefix[0] === "*") {

      let commandList = [
        {word: "*say"},
        {word: "*show"},
        {word: "*reprompt"},
        {word: "*then"},
        {word: "*hear"},
        {word: "*if"},
        {word: "*flag"},
        {word: "*unflag"}
      ];

      callback(null, commandList.map(function (ea) {
        return {name: ea.word, value: ea.word, score: 100, meta: "command"}
      }));
    }

    //Adding auto-completion by scene id
    let line = session.getLine(pos.row);

    let isImmediatlyProceededByArrow = false;
    let column = pos.column - 1;
    if (line && line.length >= 4 && column >= 3) {
      let s = line.substr(column - 3, 3);
      if (s === "-> ") {
        isImmediatlyProceededByArrow = true;
      }
    }

    let sceneList = [];

    const lines = session.doc.getAllLines();
    for (let i = 0, l = lines.length; i < l; i++) {

      const line = lines[i].trim();

      if (line.startsWith("@") && line.length >= 2) {
        sceneList.push(line.substr(1));
      } else if (line.startsWith("-> ") && line.length >= 4) {
        sceneList.push(line.substr(3));
      }
    }

    // Check if the prefix starts with a dash, or if there is an -> right before you somewhere
    if (prefix[0] === "-") {
      callback(null, sceneList.map(function (word) {
        return {name: "-> " + word, value: "-> " + word, score: 100, meta: "scene"}
      }));
    }
    if (prefix[0] === "@") {
      callback(null, sceneList.map(function (word) {
        return {name: "@" + word, value: "@" + word, score: 100, meta: "scene"}
      }));
    }
    if (isImmediatlyProceededByArrow) {
      callback(null, sceneList.map(function (word) {
        return {name: word, value: word, score: 100, meta: "scene"}
      }));
    }


    callback(null, []);
  }
};

langTools.setCompleters([]);
langTools.addCompleter(customCompleter);

const initValue = '';

class AceEditor extends React.Component {
  state = {
    isInFocus: false
  };

  currentSyntaxErrorsStr = undefined;

  constructor(props) {
    super(props);

    const {value} = props;

    this.hasPendingTextChanges = false;
    this.isTyping = false;
    this.autoUpdateTimeoutHandle = undefined;
    this.autoUpdateTimeout = 1500;
    this.previousSelectedSceneId = undefined;
    this.aceEditor = undefined;
    this.silentOnChange = false;
    this.value = value || initValue;

    this.autoUpdate = this.autoUpdate.bind(this);
    this.commitToRedux = this.commitToRedux.bind(this);
    this.updateSceneHighlight = this.updateSceneHighlight.bind(this);
    this.onChange = this.onChange.bind(this);
    this.onCursorChange = this.onCursorChange.bind(this);
    this.onBlur = this.onBlur.bind(this);
    this.onFocus = this.onFocus.bind(this);
    this.currentFile = "";
  }

  componentDidMount = () => {
    this.aceEditor = window.ace.edit(this.aceEditorDiv);
    this.aceEditor.session.setMode('ace/mode/abc');
    this.aceEditor.setShowPrintMargin(false);
    this.aceEditor.setOption('wrap', true);
    this.aceEditor.getSession().setUseWorker(false);
    this.aceEditor.setOption("enableBasicAutocompletion", true);
    this.aceEditor.setOption("enableSnippets", true);
    this.aceEditor.setOption("enableLiveAutocompletion", true);

    this.componentDidUpdate();

    // Note: change event must happen before changeSelection event
    this.aceEditor.session.on('change', this.onChange);
    this.aceEditor.on('changeSelection', debounce(this.onCursorChange, 100));
    this.aceEditor.on('blur', this.onBlur);
    this.aceEditor.on('focus', this.onFocus);

    const {setEditorReference} = this.props;
    setEditorReference(this.aceEditor);

    // On initial load, the highlighting logic doesn't run. Run this on the next tick
    setTimeout(() => this.updateSceneHighlight());
  };

  componentDidUpdate = () => {
    // Don't do any updates if still typing
    if (this.isTyping) {
      return;
    }

    const {value, workspace, project, selectedSceneId} = this.props;

    this.value = value;
    const currentValue = this.aceEditor.session.getValue();
    const {isInFocus} = this.state;

    // Setting silent so onChange is not called for this programmatic update, only fire on change for user events

    // Only update if not currently in a dirty state, otherwise will blow away changes in the last 2 seconds
    if (!this.hasPendingTextChanges && (currentValue !== this.value)) {
      this.silentOnChange = true;
      if(this.value !== null) {
        this.aceEditor.session.setValue(this.value);
      }
      this.silentOnChange = false;
    }

    if (selectedSceneId && this.previousSelectedSceneId !== selectedSceneId) {
      this.previousSelectedSceneId = selectedSceneId;

      this.scrollSceneIntoView(selectedSceneId);
    }

    // Check for any changes in the syntax errors
    let {syntaxErrors} = workspace;
    this.showSyntaxErrors(syntaxErrors, project);


    if (this.currentFile !== project.currentFile) {
      this.currentFile = project.currentFile;
      this.commitToRedux();
    }

    this.aceEditor.resize();
  };

  showSyntaxErrors(syntaxErrors, project) {
    let syntaxErrorsStr = JSON.stringify(syntaxErrors);
    if (this.currentSyntaxErrorsStr !== syntaxErrorsStr) {

      this.currentSyntaxErrorsStr = syntaxErrorsStr;

      let annotations = [];

      if (syntaxErrors) {

        if (!Array.isArray(syntaxErrors)) {
          syntaxErrors = [syntaxErrors];
        }

        for (let err of syntaxErrors) {

          if (err.sourceID === project.currentFile) {

            let annotation =
              {
                "row": (err.lineNumber >= 2) ? err.lineNumber - 1 : err.lineNumber,
                "column": 0,
                "text": err.errorMessage, // Or the Json reply from the parser
                "type": "error" // also warning and information
              };

            annotations.push(annotation);
          }
        }
      }

      this.aceEditor.session.setAnnotations(annotations);
    }
  }

  scrollSceneIntoView = (sceneId) => {
    const spot = this.aceEditor.find(`@${sceneId}\n`);

    if (spot && spot.start && spot.start.row !== undefined) {
      this.aceEditor.scrollToLine(spot.start.row - 3);
    }
  };

  onFocus() {
    this.setState({
      isInFocus: true
    })
  }

  onBlur() {
    this.setState({
      isInFocus: false
    })
  }

  componentWillUnmount = () => this.aceEditor.destroy();

  resetOnChangeTimeout() {
    if (this.autoUpdateTimeoutHandle) {
      clearTimeout(this.autoUpdateTimeoutHandle);
      this.autoUpdateTimeoutHandle = null;
    }
  }

  onChange() {
    const {isInFocus} = this.state;
    // set this to true only if the change event was triggered by a user change on the editor (in focus changes)
    this.hasPendingTextChanges = !!isInFocus;

    this.resetOnChangeTimeout();
    this.updateSceneHighlight();

    if (this.silentOnChange) {
      this.silentOnChange = false;
      return;
    }
    this.isTyping = true;
    this.autoUpdateTimeoutHandle = setTimeout(() => {
      this.autoUpdate();
      this.isTyping = false;
    }, isInFocus ? this.autoUpdateTimeout : 0);
  }

  // Commit any updates from the SFB session to the Redux
  commitToRedux() {
    const {value} = this;
    const {isInFocus} = this.state;
    // this onChange fires updateProjectSource()
    const {onChange = () => null, saveProjectFile} = this.props;

    this.hasPendingTextChanges = false;

    if (!this.silentOnChange) {
      const currentValue = this.aceEditor.session.getValue();

      if (currentValue !== value) {
        this.value = currentValue;
        onChange(currentValue);
        if (!isInFocus) {
          saveProjectFile();
        }
      }
    }
  }

  updateSceneHighlight() {
    const startsWithAtSignRegex = /^\s*@/;

    const {setSelectedSceneId = () => null} = this.props;
    const { isInFocus } = this.state;
    let cursorPos = this.aceEditor.getCursorPosition();

    if (cursorPos) {
      let startingSceneRow = cursorPos.row;

      while (startingSceneRow >= 0) {

        let currentTextRow = this.aceEditor.session.getLine(startingSceneRow);

        // Look for the current scene name on the current line or previous lines
        if (currentTextRow && startsWithAtSignRegex.test(currentTextRow)) {

          let sceneId = currentTextRow.split("@")[1];

          sceneId = sceneId ? sceneId.trim() : sceneId;

          if (isInFocus && this.previousSelectedSceneId !== sceneId) {
            // Preset selected scene id here so we avoid behaviour that happens when you click on a tree node (like scrolling, etc.)
            this.previousSelectedSceneId = sceneId;
            setSelectedSceneId(sceneId);
          }

          break;
        }

        startingSceneRow--;
      }

      let endingSceneRow = startingSceneRow + 1;
      let totalLines = this.aceEditor.session.getLength();
      while (endingSceneRow < totalLines) {

        let currentTextRow = this.aceEditor.session.getLine(endingSceneRow);

        // Look for the start of the next scene
        if (currentTextRow && startsWithAtSignRegex.test(currentTextRow)) {
          endingSceneRow = endingSceneRow - 1;
          break;
        }

        endingSceneRow++;
      }

      if (this.selectedMarker) {
        this.aceEditor.session.removeMarker(this.selectedMarker);
        this.selectedMarker = undefined;
      }

      if (startingSceneRow !== -1) {
        let range = new ace.Range(startingSceneRow, 0, endingSceneRow, 2000);
        this.selectedMarker = this.aceEditor.session.addMarker(range, "editorHighlight", "line", true);
      }
    }
  }

  autoUpdate() {
    // CommitToRedux is heavy. Use with caution.
    this.commitToRedux();
    // this should not cause component update on this component
    const {reimportProject = () => null} = this.props;
    return reimportProject();
  }

  // Highlight the current scene in the editor
  onCursorChange() {
    this.updateSceneHighlight();
  }

  render() {
    return(
      <div
        ref={(el) => {
          this.aceEditorDiv = el
        }}
        style={{ width: "100%", height: "100%" }}/>
    );
  }
}

AceEditor.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  reimportProject: PropTypes.func.isRequired,
  saveProjectFile: PropTypes.func.isRequired,
  setSelectedSceneId: PropTypes.func.isRequired,
  setEditorReference: PropTypes.func.isRequired
};

export default AceEditor
