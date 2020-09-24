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

import * as path from 'path';
import { strict as assert } from 'assert';

import { ConfigAccessor } from '../../configAccessor';
import { APLHelper } from '../../handler/APLHelper';
import { HandlerInput } from 'ask-sdk';

const CONFIG_FILE = "./src/test/data/abcConfig.json";

const testRequest : any = {"requestEnvelope": 
    {
    "version": "123",
    "session": "123",
    "context": {
        "AudioPlayer": {
            "playerActivity": "IDLE"
        },
        "Display": {},
        "System": {
            "application": {
                "applicationId": "123",
            },
            "user": {
                "userId": "123",
            },
            "device": {
                "deviceId": "123",
                "supportedInterfaces": {
                    "AudioPlayer": {},
                    "Display": {
                        "templateVersion": "1.0",
                        "markupVersion": "1.0"
                    },
                    "Alexa.Presentation.APL": {
                        "runtime": {
                            "maxVersion": "1.0"
                        }
                    }
                }
            },
            "apiEndpoint": "https://api.amazonalexa.com",
            "apiAccessToken": "123",
        },
        "Viewport": {
            "experiences": [
                {
                    "arcMinuteWidth": 246,
                    "arcMinuteHeight": 144,
                    "canRotate": false,
                    "canResize": false
                }
            ],
            "shape": "RECTANGLE",
            "pixelWidth": 1024,
            "pixelHeight": 600,
            "dpi": 160,
            "currentPixelWidth": 1024,
            "currentPixelHeight": 600,
            "touch": [
                "SINGLE"
            ],
            "keyboard": []
        }
    },
    "request": {
        "type": "",
        "requestId": "123",
        "timestamp": "123",
        "locale": "123",
        "shouldLinkResultBeReturned": false
    }
  }
};

describe('Alexa APL Extension Test', () => {

    it('Initialization', async () => {

        const config = await ConfigAccessor.loadConfigFile(path.resolve(CONFIG_FILE), "./src/test/data");

        const aplHelper = new APLHelper('en-us', config);

        assert.ok(aplHelper);
    });

    it('Supports Display Test', async () => {

        const config = await ConfigAccessor.loadConfigFile(path.resolve(CONFIG_FILE), "./src/test/data");

        const aplHelper = new APLHelper('en-us', config);

        const handlerInput = testRequest as HandlerInput;

        const supportsDisplay = aplHelper.supportsDisplay(handlerInput);

        assert.ok(supportsDisplay);
    });

});
