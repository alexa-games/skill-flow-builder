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

import { InstructionExtension, InstructionExtensionParameter } from '@alexa-games/sfb-f';

/**
 * Custom Instruction Extension
 */
export class SampleCustomExtension implements InstructionExtension {
    public async pickRandomDay(param: InstructionExtensionParameter): Promise<void> {
        let randomDayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        param.storyState.randomDayName = randomDayName[Math.floor( Math.random() * randomDayName.length )];    
    }
}