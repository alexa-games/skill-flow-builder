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

import { SceneDirectionType } from '@alexa-games/sfb-f';
import _ from 'underscore';

export function findGoToAction(scene) {
  const action = scene.contents[0].sceneDirections.find(
    ({ directionType: type }) => type === SceneDirectionType.GO_TO
  );
  return action
    ? {
        utterances: [],
        type: action.directionType,
        gotoTarget: action.parameters.target
      }
    : null;
}

function getActionsFromDirections(directions, choices = []) {
  return directions.reduce((acc, direction) => {
    const { directionType } = direction;

    if (
      directionType === SceneDirectionType.GO_TO ||
      directionType === SceneDirectionType.SAVE_AND_GO ||
      directionType === SceneDirectionType.CHOICE ||
      directionType === SceneDirectionType.RESTART ||
      directionType === SceneDirectionType.PAUSE ||
      directionType === SceneDirectionType.RESUME ||
      directionType === SceneDirectionType.REPEAT ||
      directionType === SceneDirectionType.REPEAT_REPROMPT ||
      directionType === SceneDirectionType.BACK ||
      directionType === SceneDirectionType.END ||
      directionType === SceneDirectionType.RETURN
    ) {
      acc.push(direction);
    } else if (directionType === SceneDirectionType.CONDITION) {
      getActionsFromDirections(direction.parameters.directions, acc);
    }
    return acc;
  }, choices);
}

export function getActions(scene) {
  if (_.isEmpty(scene.contents)) {
    return [];
  }

  const choices = getActionsFromDirections(
    scene.contents[0].sceneDirections
  ).map(({ directionType, parameters, sourceScene }) => {
    if (directionType === SceneDirectionType.GO_TO) {
      return {
        type: SceneDirectionType.GO_TO,
        utterances: [],
        gotoTarget: parameters.target
      }; // exit
    }

    if (directionType === SceneDirectionType.SAVE_AND_GO) {
      return {
        type: SceneDirectionType.SAVE_AND_GO,
        utterances: [],
        saveAndGoTarget: parameters.target
      }; // exit
    }

    if (
      directionType === SceneDirectionType.RESTART ||
      directionType === SceneDirectionType.PAUSE ||
      directionType === SceneDirectionType.RESUME ||
      directionType === SceneDirectionType.REPEAT ||
      directionType === SceneDirectionType.REPROMPT ||
      directionType === SceneDirectionType.REPEAT_REPROMPT ||
      directionType === SceneDirectionType.BACK ||
      directionType === SceneDirectionType.END ||
      directionType === SceneDirectionType.RETURN
    ) {
      return {
        type: directionType,
        utterances: []
      }; // exit
    }

    if (!parameters.directions || parameters.directions.length == 0) {
      return {
        type: '<Not Set>',
        utterances: parameters.utterances
      }; // exit
    }

    const { utterances } = parameters;
    const goto = parameters.directions.find(
      ({ directionType: dt }) => dt === SceneDirectionType.GO_TO
    );
    const gotoTarget = goto ? goto.parameters.target : null;

    // Save and go is a "<-> sceneName" direction, which means go there and return back to here when done
    const saveAndGo = parameters.directions.find(
      ({ directionType: dt }) => dt === SceneDirectionType.SAVE_AND_GO
    );
    const saveAndGoTarget = saveAndGo ? saveAndGo.parameters.target : null;

    const type = directionType;

    // Special case to handle action commands that are not go tos or save and gos
    let innerAction = '';
    if (type === SceneDirectionType.CHOICE && !gotoTarget && !saveAndGoTarget) {
      if (parameters.directions.length > 0) {
        innerAction = parameters.directions[0].directionType;
      }
    }

    return {
      type,
      utterances,
      gotoTarget,
      sourceScene,
      saveAndGoTarget,
      innerAction
    };
  });

  return choices;
}
