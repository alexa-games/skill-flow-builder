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

//import { DefaultFormatImportPlugin } from '@alexa-games/sfb-f';
import _ from 'underscore';

export function getValues(type, scene) {
  switch (type) {
    case 'say':
      return getSayValues(scene);
    case 'recap':
      return getRecapValues(scene);
    case 'reprompt':
      return getRepromptValues(scene);
    default:
      return [];
  }
}

export function getSayValues(scene) {
  if (_.isEmpty(scene.contents)) {
    return [];
  }

  return scene.contents[0].narration
    .split('||')
    .map(str => str.trim())
    .filter(str => str);
}

export function getRecapValues(scene) {
  if (_.isEmpty(scene.contents)) {
    return [];
  }

  return scene.contents[0].sceneDirections.reduce((acc, direction) => {
    if (direction.directionType === 'recap' && direction.parameters.message) {
      const recaps = direction.parameters.message
        .split('||')
        .map(str => str.trim())
        .filter(str => str);
      return acc.concat(recaps);
    }
    return acc;
  }, []);
}

export function getRepromptValues(scene) {
  if (_.isEmpty(scene.contents)) {
    return [];
  }

  return scene.contents[0].sceneDirections.reduce((acc, direction) => {
    if (
      direction.directionType === 'reprompt' &&
      direction.parameters.message
    ) {
      const reprompts = direction.parameters.message
        .split('||')
        .map(str => str.trim())
        .filter(str => str);
      return acc.concat(reprompts);
    }
    return acc;
  }, []);
}

// export function applyUpdates(type, originalSceneContent, sceneId, values) {
//   const formatImporter = new DefaultFormatImportPlugin.DefaultFormatImportPlugin();
//   let updateCommand;
//
//   console.log('applyUpdate: values');
//   console.log(values);
//
//   if (type === 'say') {
//     updateCommand = new DefaultFormatImportPlugin.UpdateSayCommand({ sceneId });
//     updateCommand.setSayList(values);
//   } else if (type === 'recap') {
//     updateCommand = new DefaultFormatImportPlugin.UpdateRecapCommand({
//       sceneId
//     });
//     updateCommand.setRecapList(values);
//   } else if (type === 'reprompt') {
//     updateCommand = new DefaultFormatImportPlugin.UpdateRepromptCommand({
//       sceneId
//     });
//     updateCommand.setRepromptList(values);
//   }
//
//   const updateCommandList = [updateCommand];
//   const { content } = formatImporter.applyCommands(
//     originalSceneContent,
//     updateCommandList
//   );
//
//   return content;
// }
