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

// @ts-nocheck
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtensionLoader = void 0;
const sfb_skill_1 = require("@alexa-games/sfb-skill");
class ExtensionLoader {
    constructor(param) {
        this.registeredExtensions = [
            new sfb_skill_1.AlexaExtension(),
            new sfb_skill_1.AlexaAPLExtension(param.locale, param.configAccessor),
            new sfb_skill_1.AlexaAudioPlayerExtension(param.locale, param.configAccessor),
            new sfb_skill_1.AlexaMonetizationExtension(param.locale, param.configAccessor)
        ];
    }
    getExtensions() {
        return this.registeredExtensions;
    }
}
exports.ExtensionLoader = ExtensionLoader;
