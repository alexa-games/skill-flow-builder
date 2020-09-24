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

import { SceneDirectionType, StoryBlockRange, StoryFeatureFinder } from '@alexa-games/sfb-f';
import { loggerNotification } from './logger';
import { setSelectedSceneId } from './workspace';
import log from 'electron-log';
import * as _ from 'lodash';

import { saveProjectFile, updateProjectSource } from './project';
import {
  BlockStartExpressions,
  EndType,
  StoryBlockFinder
} from '@alexa-games/sfb-f/dist/importPlugins/storyBlockFinder';

// eslint-disable-next-line import/prefer-default-export
export function deleteScene(id) {
  return (dispatch, getState) => {
    const {workspace} = getState();
    const selectedSceneId = id || workspace.selectedSceneId;

    if (selectedSceneId === 'start') {
      dispatch(
        loggerNotification({
          type: 'warning',
          triggerToast: true,
          message: `You cannot delete the 'start' node.`
        })
      );
      return;
    }

    if (selectedSceneId) {
      const {editorReference} = workspace;
      const {doc} = editorReference.session;

      let finder = new StoryFeatureFinder(doc.getAllLines());
      const scene = finder.findScene(selectedSceneId);
      if (scene) {
        editorReference.session.remove(scene.range);
        // Grab lines again after scene is removed.
        finder = new StoryFeatureFinder(doc.getAllLines());
        const sceneReferences = finder.getReferences(selectedSceneId);

        // Remove lines in reverse order so we don't need to account for the changing
        // number of lines after each removal.
        sceneReferences.reverse().forEach((refRange) => {
          editorReference.session.remove(refRange);
        });
      }
    }
  };
}

export function addNewChildScene() {
  return (dispatch, getState) => {
    const {workspace} = getState();
    const {selectedSceneId, editorReference} = workspace;

    if (selectedSceneId && editorReference) {
      const finder = new StoryFeatureFinder(editorReference.session.doc.getAllLines());

      const uniqueSceneName = pickUniqueSceneName(selectedSceneId, finder);

      const parentScene = finder.findScene(selectedSceneId);
      if (parentScene) {
        const {doc} = editorReference.session;

        let insertPoint = parentScene.range.end;

        // Insert a new scene
        doc.insert(insertPoint,
          `@${uniqueSceneName}\n\t*say\n\t\tReplace with your content.\n\n`);

        const thenBlock = parentScene.getPropertyEnumerator('then').getNext();
        if (thenBlock) {
          // Found a then block, we can just add a hear statement when the
          // goto reference.
          insertPoint = thenBlock.range.end;
        } else {
          // No then block, add a block with a hear statement
          insertPoint = doc.insert(insertPoint, '\t*then\n');
        }

        doc.insert(insertPoint,
          `\t\thear go to scene ${uniqueSceneName} {\n\t\t\t-> ${uniqueSceneName}\n\t\t}\n\n`);
      }
    }
  };

  function pickUniqueSceneName(selectedSceneId, finder) {
    let count = 1;
    let uniqueSceneName = `${selectedSceneId}_${count}`;
    while (finder.findScene(uniqueSceneName)) {
      count += 1;
      uniqueSceneName = `${selectedSceneId}_${count}`;
    }

    return uniqueSceneName;
  }
}

function findGoToReferences(sceneId, finder, sceneStoryBlock) {
  const goToLines = [];
  const sceneReferences = finder.getReferences(sceneId);
  sceneReferences.reverse().forEach((refRange) => {
    const pattern = new RegExp(`^\\s*(->|<->)\\s*(.*)\\s*$`, 'i');

    const goToBlockFinder = new StoryBlockFinder({
      blockEndType: EndType.OneLine,
      range: refRange,
      lines: sceneStoryBlock.lines,
      blockStartMatch: pattern
    });
    let nextBlock = goToBlockFinder.getNextBlock();
    while (nextBlock) {
      goToLines.unshift(nextBlock); // insert in reverse order
      nextBlock = goToBlockFinder.getNextBlock();
    }
  });
  return goToLines;
}

export function renameScene(sceneId, newSelectSceneId) {
  return (dispatch, getState) => new Promise((resolve) => {
      const {workspace} = getState();
      const selectedSceneId = sceneId || workspace.selectedSceneId;

      if (selectedSceneId === 'start') {
        dispatch(
          loggerNotification({
            type: 'warning',
            triggerToast: true,
            message: `You cannot rename the 'start' node.`
          })
        );
        return;
      }

      if (!selectedSceneId) {
        log.warn('Error finding scene to rename');
        return;
      }

      const {editorReference} = workspace;
      const {doc} = editorReference.session;

      let finder = new StoryFeatureFinder(doc.getAllLines());
      const sceneStoryBlock = finder.findScene(selectedSceneId);
      const sceneNameLine = doc.getLine(sceneStoryBlock.range.start.row);
      if (sceneStoryBlock) {
        const sceneIdRange = {
          start: sceneStoryBlock.range.start,
          end: {
            row: sceneStoryBlock.range.start.row,
            column: sceneNameLine.length
          }
        };
        editorReference.session.remove(sceneIdRange);
        editorReference.session.doc.insert(sceneIdRange.start, `@${newSelectSceneId}`);
        // Grab lines again after scene is removed.
        finder = new StoryFeatureFinder(doc.getAllLines());

        // Remove lines in reverse order so we don't need to account for the changing
        // number of lines after each removal.
        const goToLines = findGoToReferences(selectedSceneId, finder, sceneStoryBlock);
        goToLines.forEach((goToBlock) => {
          editorReference.session.remove(goToBlock.range);
          editorReference.session.doc.insert(goToBlock.range.start, `\t\t\t${goToBlock.blockName} ${newSelectSceneId} \n`);
        });
      }

      return resolve();
    });
}

export function addNewScene(sceneName) {
  return (dispatch, getState) => {
    const {workspace} = getState();
    const {selectedSceneId, editorReference} = workspace;
    if (!editorReference) {
      log.error('Editor reference is not defined');
      throw new Error('Editor reference not found, please restart the application.');
    }
    const finder = new StoryFeatureFinder(editorReference.session.doc.getAllLines());
    const parentScene = finder.findScene(selectedSceneId);

    if (parentScene) {
      const {doc} = editorReference.session;
      const insertPoint = parentScene.range.end;
      // Insert a new scene
      doc.insert(insertPoint,
        `@${sceneName}\n\t*say\n\t\tReplace with your content.\n\n`);
    }
  }
}

export function getActionCommandForAction(action) {
  const actionCommandMap = {
    [SceneDirectionType.GO_TO]: '->',
    [SceneDirectionType.SAVE_AND_GO]: '<->',
    [SceneDirectionType.RESTART]: '>> RESTART',
    [SceneDirectionType.PAUSE]: '>> PAUSE',
    [SceneDirectionType.RESUME]: '>> RESUME',
    [SceneDirectionType.BACK]: '>> BACK',
    [SceneDirectionType.END]: '>> END',
    [SceneDirectionType.RETURN]: '>> RETURN',
    [SceneDirectionType.REPEAT]: '>> REPEAT',
    [SceneDirectionType.REPROMPT]: '>> REPROMPT'
  };
  return actionCommandMap[action];
}

export function ensureSceneHasCommand(doc, sceneId, command) {
  const finder = new StoryFeatureFinder(doc.getAllLines());
  const scene = finder.findScene(sceneId);
  const block = finder.getScenePropertyByType(scene.range, command);
  if (!block) {
    const insertPosition = {
      row: scene.range.end.row,
      column: 0
    };
    doc.insert(insertPosition,
      `\t*${command}\n`);
  }
}

export function deleteActionCommand(sceneId, gotoSceneId, action) {
  return (dispatch, getState) => {
    const actionCommand = getActionCommandForAction(action);
    if (!actionCommand) {
      throw new Error(`Action '${action}' is not supported.`);
    }

    const {workspace} = getState();
    const {editorReference} = workspace;
    if (!editorReference) {
      log.error('Editor reference is not defined');
      throw new Error('Editor reference not found, please restart the application.');
    }
    const finder = new StoryFeatureFinder(editorReference.session.doc.getAllLines());
    const actionFinder = getActionStoryBlockFinderForScene(sceneId, finder, actionCommand);
    const actionBlock = findActionBlock(actionFinder, gotoSceneId);

    editorReference.session.remove(actionBlock.range);
  }
}

export function deleteHearCommand(sceneId, hearPhrases) {
  return (dispatch, getState) => {
    const {workspace} = getState();
    const {editorReference} = workspace;
    if (!editorReference) {
      log.error('Editor reference is not defined');
      throw new Error('Editor reference not found, please restart the application.');
    }
    const finder = new StoryFeatureFinder(editorReference.session.doc.getAllLines());
    const hearFinder = getHearStoryBlockFinderForScene(sceneId, finder);
    const hearBlock = findHearBlock(hearFinder, hearPhrases);

    editorReference.session.remove(hearBlock.range);
  }
}

export function updateActionCommand(sceneId, originalGoto, gotoSceneId, action) {
  return (dispatch, getState) => {
    const actionCommand = getActionCommandForAction(action);
    if (!actionCommand) {
      throw new Error(`Action '${action}' is not supported.`);
    }

    const {workspace} = getState();
    const {editorReference} = workspace;
    if (!editorReference) {
      log.error('Editor reference is not defined');
      throw new Error('Editor reference not found, please restart the application.');
    }
    ensureSceneHasCommand(editorReference.session.doc, sceneId, 'then');
    const finder = new StoryFeatureFinder(editorReference.session.doc.getAllLines());
    const actionFinder = getActionStoryBlockFinderForScene(sceneId, finder, actionCommand);
    const actionBlock = findActionBlock(actionFinder, originalGoto);

    if (actionBlock) {
      // replace block
      editorReference.session.remove(actionBlock.range);
      editorReference.session.doc.insert(actionBlock.range.start,
        `\t\t${actionCommand} ${gotoSceneId || ''} \n\n`);
    } else {
      // insert block
      editorReference.session.doc.insert(actionFinder.range.end,
        `\t\t${actionCommand} ${gotoSceneId || ''} \n\n`);
    }
  }
}

export function updateHearCommand(sceneId, hearPhrases, gotoSceneId, newHearPhrases, action) {
  return (dispatch, getState) => {
    const {workspace} = getState();
    const {editorReference} = workspace;
    if (!editorReference) {
      log.error('Editor reference is not defined');
      throw new Error('Editor reference not found, please restart the application.');
    }
    ensureSceneHasCommand(editorReference.session.doc, sceneId, 'then');
    const finder = new StoryFeatureFinder(editorReference.session.doc.getAllLines());
    const hearFinder = getHearStoryBlockFinderForScene(sceneId, finder);
    const actionCommand = getActionCommandForAction(action);
    if (!actionCommand) {
      throw new Error(`Action '${action}' is not supported.`);
    }
    const hearBlock = findHearBlock(hearFinder, hearPhrases);

    if (hearBlock) {
      // replace block
      editorReference.session.remove(hearBlock.range);
      editorReference.session.doc.insert(hearBlock.range.start,
        `\t\thear ${newHearPhrases} {\n\t\t\t${actionCommand} ${gotoSceneId || ''}\n\t\t}\n\n`);
    } else {
      // insert block
      editorReference.session.doc.insert(hearFinder.range.end,
        `\t\thear ${newHearPhrases} {\n\t\t\t${actionCommand} ${gotoSceneId || ''}\n\t\t}\n\n`);
    }
  }
}

// pass all say commands as an array
// This method is called from the UI
export function updateSceneCommand(commandType, sceneId, commandValues) {
  if (commandType !== 'say' &&
    commandType !== 'reprompt' &&
    commandType !== 'recap'
  ) {
    throw new Error(`Command type '${commandType}' not supported.`);
  }
  return (dispatch, getState) => {
    const {workspace} = getState();
    const {editorReference} = workspace;
    if (!editorReference) {
      log.error('Editor reference is not defined');
      throw new Error('Editor reference not found, please restart the application.');
    }

    const finder = new StoryFeatureFinder(editorReference.session.doc.getAllLines());
    const scene = finder.findScene(sceneId);
    const block = scene.getPropertyEnumerator(commandType).getNext();
    const newBlock = `\t*${commandType}\n\t\t${commandValues.join('\n||\n')}\n`;
    const {doc} = editorReference.session;

    if (block) {
      // handle empty values
      if (isCommandEmpty(commandValues)) {
        editorReference.session.remove(block.range);
        return;
      }
      // handle block not existing
      editorReference.session.remove(block.range);
      doc.insert(block.range.start, newBlock);
    } else {
      doc.insert(scene.range.end, newBlock);
    }
  }
}

// Checks whether the command array is empty
function isCommandEmpty(commandValues) {
  return commandValues.length === 1 && _.isEmpty(commandValues[0]);
}

export function areHearStatementsTheSame(first, second) {
  // This pattern expects the output from StoryBlockFinder
  // It should be in the format of ` hear statement `
  const pattern = / *(.+) */;
  const e1 = new RegExp(pattern, 'g');
  const e2 = new RegExp(pattern, 'g');
  // check that both expressions are valid
  const firstMatch = e1.exec(first);
  const secondMatch = e2.exec(second);

  if (!firstMatch || !secondMatch || firstMatch.length < 2 || secondMatch.length < 2) {
    return false;
  }

  const foo = cleanAndOrderHearString(firstMatch[1]);
  const bar = cleanAndOrderHearString(secondMatch[1]);
  return foo === bar;
}

// This method is very heavy, but since these arrays are usually small (<10) it will be fine
function cleanAndOrderHearString(hearString) {
  return hearString
    .split(',')
    .map((i) => _.trim(i))
    .filter(s => s.length > 0)
    .sort()
    .join(', ')
}

export function getHearStoryBlockFinderForScene(sceneId, storyFeatureFinder) {
  const scene = storyFeatureFinder.findScene(sceneId);
  const block = storyFeatureFinder.getScenePropertyByType(scene.range, 'then');

  return new StoryBlockFinder({
    blockEndType: EndType.BraceMatch,
    range: block.range,
    lines: scene.lines,
    blockStartMatch: BlockStartExpressions.HearMatch
  });
}

export function findHearBlock(hearFinder, hearStatements) {
  let hearStatement = '';
  if (Array.isArray(hearStatements)) {
    hearStatement = `${hearStatements.join(', ')}`;
  } else {
    hearStatement = hearStatements;
  }
  hearStatement = _.trimEnd(hearStatement, '{');
  let hearBlock = hearFinder.getNextBlock();
  while (hearBlock) {
    // block name really shouldn't have a trailing {
    const hearBlockName = _.trimEnd(hearBlock.blockName, '{');
    if (areHearStatementsTheSame(hearBlockName, hearStatement)) {
      return hearBlock;
    }
    hearBlock = hearFinder.getNextBlock();
  }
  return undefined;
}

function findLastHearBlock(hearBlockFinder) {
  let hearBlock = hearBlockFinder.getNextBlock();
  while (hearBlock) {
    const tempBlock = hearBlockFinder.getNextBlock();
    if (tempBlock) {
      hearBlock = tempBlock;
    } else {
      return hearBlock;
    }
  }
  return hearBlock;
}

export function getActionStoryBlockFinderForScene(sceneId, storyFeatureFinder, actionCommand) {
  const scene = storyFeatureFinder.findScene(sceneId);
  const block = storyFeatureFinder.getScenePropertyByType(scene.range, 'then');
  let croppedRange = block.range;
  // We're going to assume that our actions are at the end of the hears (this is convention)
  // Iterate through all the hear blocks and then reduce the range on the action block finder
  const hearBlockFinder = getHearStoryBlockFinderForScene(sceneId, storyFeatureFinder);
  if (hearBlockFinder) {
    const hearBlock = findLastHearBlock(hearBlockFinder);
    if (hearBlock) {
      croppedRange = new StoryBlockRange(hearBlock.range.end.row, hearBlock.range.end.column, block.range.end.row, block.range.end.column);
    }
  }

  const pattern = new RegExp(`^\\s*${actionCommand}\\s*(.*)\\s*$`, 'i');

  return new StoryBlockFinder({
    blockEndType: EndType.OneLine,
    range: croppedRange,
    lines: scene.lines,
    blockStartMatch: pattern
  });
}

export function findActionBlock(actionBlockFinder, actionName) {
  if (!actionBlockFinder) {
    return undefined;
  }
  let actionBlock = actionBlockFinder.getNextBlock();
  while (actionBlock) {
    if (actionBlock.blockName === (_.trim(actionName || ''))) {
      return actionBlock;
    }
    actionBlock = actionBlockFinder.getNextBlock();
  }
  return undefined;
}
