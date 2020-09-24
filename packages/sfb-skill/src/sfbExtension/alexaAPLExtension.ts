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

import { DriverExtension, DriverExtensionParameter, VisualOptions, ImportErrorLine } from '@alexa-games/sfb-f';
import { ConfigAccessor } from './../configAccessor';
import { APLHelper } from './../handler/APLHelper';

export class AlexaAPLExtension implements DriverExtension {
    protected aplHelper: APLHelper;
    constructor(locale: string, configAccessor: ConfigAccessor) {
        try {
            this.aplHelper = new APLHelper(locale, configAccessor);
        } catch (err) {
            throw <ImportErrorLine>{
                errorMessage: err,
                errorName: 'APL Extension Error',
                lineNumber: 0,
                sourceID: "APL_TEMPLATE"
            };
        }
    }

    async post(param: DriverExtensionParameter) {
        const handlerInput = param.userInputHelper.getHandlerInput();
        const driver = param.driver;

        let visualProperties: VisualOptions[] | undefined = await driver.getVisuals();

		if (handlerInput && visualProperties && this.aplHelper.supportsDisplay(handlerInput)) {
			let visualDirectives: any[] = this.aplHelper.generateAPLDirectiveWithVisualOptions(visualProperties);
			for (let aplDirective of visualDirectives) {
				handlerInput.responseBuilder.addDirective(aplDirective);
			}
		}
    }

    async pre(param: DriverExtensionParameter) {
    }
}