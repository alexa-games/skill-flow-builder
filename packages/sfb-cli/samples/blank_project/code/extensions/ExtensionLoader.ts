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

import { DriverExtension, InstructionExtension, ImporterExtension } from '@alexa-games/sfb-f';
import { ExtensionLoaderParameter, AlexaExtension, AlexaAPLExtension, AlexaAudioPlayerExtension, AlexaMonetizationExtension } from '@alexa-games/sfb-skill';

type ExtensionType = DriverExtension|InstructionExtension|ImporterExtension;

export class ExtensionLoader {
    private readonly registeredExtensions: ExtensionType[];

    constructor(param: ExtensionLoaderParameter) {
        this.registeredExtensions = [
            // Alexa SFB extensions
            new AlexaExtension(),
            new AlexaAPLExtension(param.locale, param.configAccessor),
            new AlexaAudioPlayerExtension(param.locale, param.configAccessor),            
            new AlexaMonetizationExtension(param.locale, param.configAccessor)
        ];
    }

    public getExtensions(): ExtensionType[] {
        return this.registeredExtensions;
    }
}
