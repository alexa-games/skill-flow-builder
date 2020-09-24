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

import { HandlerInput } from 'ask-sdk';
import { VisualOptions } from '@alexa-games/sfb-f';
import { ConfigAccessor } from '../configAccessor';

import * as path from 'path';
import * as fs from 'fs';
import { readUtf8FileExcludingBomSync } from '@alexa-games/sfb-util';

export class APLHelper {
    private templates: any;
    private commands: any = {};

    constructor(private locale: string = "en-US", private configAccessor: ConfigAccessor) {
        const aplTemplatePath = configAccessor.getAplTemplatesFilePath(locale);
        if (!fs.existsSync(aplTemplatePath)) {
            throw new Error(`Could not find the required APL template configuration in '${aplTemplatePath}'`);
        }

        try {
            this.templates = JSON.parse(readUtf8FileExcludingBomSync(aplTemplatePath));
        } catch(err) {
            throw new Error(`There was a problem while parsing the APL template configuration.\n${err}`);
        }

        // Note: It is ok if the APL commands file is missing
        const aplCommandPath = configAccessor.getAplCommandsFilePath(locale);
        if (aplCommandPath && fs.existsSync(aplCommandPath)) {
            
            try {
                this.commands = JSON.parse(readUtf8FileExcludingBomSync(aplCommandPath));
            } catch(err) {
                throw new Error(`There was a problem while parsing the APL commands configuration.\n${err}`);
            }
        }
    }

    supportsDisplay(handlerInput: HandlerInput): boolean {
        return (handlerInput.requestEnvelope.context &&
          handlerInput.requestEnvelope.context.System &&
          handlerInput.requestEnvelope.context.System.device &&
          handlerInput.requestEnvelope.context.System.device.supportedInterfaces &&
          (handlerInput.requestEnvelope.context.System.device.supportedInterfaces['Alexa.Presentation.APL'] ||
            handlerInput.requestEnvelope.context.System.device.supportedInterfaces.Display) &&
          handlerInput.requestEnvelope.context.Viewport) !== undefined;
    }
      
    generateAPLDirectiveWithVisualOptions(visualProperties: VisualOptions[]): any[] {
        let templateName: string = "default";
        if (visualProperties[0] && visualProperties[0].template) {
            templateName = visualProperties[0].template
        }

        // no slide show support yet. show the first page only
        let aplTemplateDirective: any = this.templates[templateName];

        if(!aplTemplateDirective) {
            return [];
        }

        // Check for missing directive items
        if(!aplTemplateDirective.type) {
            aplTemplateDirective.type = "Alexa.Presentation.APL.RenderDocument";
        }

        if(!aplTemplateDirective.token) {
            aplTemplateDirective.token = "ABC_RENDERED_DOCUMENT";
        }

        if(!aplTemplateDirective.version && aplTemplateDirective.document && aplTemplateDirective.document.version ) {
            aplTemplateDirective.version = aplTemplateDirective.document.version;
        }

        aplTemplateDirective.datasources.visualProperties = Object.assign(aplTemplateDirective.datasources.visualProperties, visualProperties[0]);

        return [
            aplTemplateDirective
        ];
    }

    generateAPLCommand(commandName: string): any {
        return this.commands[commandName];
    }

    getAPLTemplates(): any {
        return this.templates;
    }
}