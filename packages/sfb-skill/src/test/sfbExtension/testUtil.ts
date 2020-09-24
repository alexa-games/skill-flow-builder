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

import { SFBDriver, UserInputHelper, UserInput, DriverExtensionParameter, InstructionExtensionParameter, PlayStage, StoryAccessor } from '@alexa-games/sfb-f';
import { AudioItemUtil } from '@alexa-games/sfb-f';

// Test data and mock functions/objects

export const testUserInput: UserInput = {
    intent: "something",
    slots: [
        {
            name: "slotName",
            value: "value"
        }
    ],
    value: "raw value"
};

export function getDefaultBaseDriver(): SFBDriver {
    const driver = new SFBDriver({
        storyTitle: 'test story',
        storyID: "test-story",
        pluginName: 'default',
        scenes: [{
            id: "start",
            contents: [
                {
                    narration: "test narration"
                }
            ]
        }]
    });

    return driver;
}

export function getMockInstructionParameter(instruction : string, params : {[key: string]: string}) : InstructionExtensionParameter {
    return { instructionName: instruction,
    instructionParameters: params,
    storyState: {},
    playStage: new PlayStage(new AudioItemUtil()),
    storyAccessor: new StoryAccessor({pluginName: "", 
      storyTitle: "",
      storyID: "",
      scenes: []
    })
  };
}
