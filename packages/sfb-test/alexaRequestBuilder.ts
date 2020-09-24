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

interface AlexaRequestEvent {
    version: string;
    session: AlexaSession;
    context: AlexaContext;
    request: AlexaRequest;
}


interface AlexaSession {
    new: boolean;
    sessionId: string;
    attributes?: {[key: string]: any};
    application: {
        applicationId: string;
    };
    user: {
        userId: string;
        accessToken?: string;
    };
}

interface AlexaContext {
    System: AlexaSystem;
    [prop: string]: any;
}

interface AlexaSystem {
    apiAccessToken: string;
    apiEndpoint: string;
    application: {
        applicationId: string;
    };
    device: {
        deviceId: string;
        supportedInterfaces: {[key: string]: any};
    },
    person?: {
        personId: string;
        accessToken?: string;
    },
    user: {
        userId: string;
        accessToken?: string;
    }
}

interface AlexaRequest {
    type: string; //"LaunchRequest" | "CanFulfillIntentRequest" | "IntentRequest" | "SessionEndedRequest";
    requestId: string;
    timestamp: string;
    locale: string;
    [prop: string]: any;
}

interface RequestIntent {
    name: string;
    confirmationStatus: 'NONE'|'CONFIRMED'|'DENIED';
    slots?: {
        [key: string]: RequestSlot;
    };
}

interface RequestSlot {
    name: string;
    value: string;
    confirmationStatus: 'NONE' | 'CONFIRMED' | 'DENIED';
    resolutions: SlotResolution;
}

interface SlotResolution {
    resolutionsPerAuthority: {
        authority: string;
        status: {
            code: "ER_SUCCESS_MATCH" | "ER_SUCCESS_NO_MATCH" | "ER_ERROR_TIMEOUT" | "ER_ERROR_EX";
        };
        values: {
            value: {
                name: string;
                id?: string;
            }
        }[]
    }[];
}

export class AlexaRequestBuilder {
    private request: AlexaRequestEvent;
    
    constructor() {
        this.request = {
            "version": "1.0",
            "session": {
                "new": true,
                "sessionId": "test-session-id",
                "application": {
                    "applicationId": "test-application-id"
                },
                "user": {
                    "userId": "test-user-id"
                }
            },
            "context": {
                "System": {
                    "application": {
                        "applicationId": "test-application-id"
                    },
                    "user": {
                        "userId": "test-user-id"
                    },
                    "device": {
                        "deviceId": "test-device-id",
                        "supportedInterfaces": {
                            "Alexa.Presentation.APL": {
                                "runtime": {
                                    "maxVersion": "1.2"
                                }
                            }
                        }
                    },
                    "apiEndpoint": "https://api.amazonalexa.com",
                    "apiAccessToken": "test-api-access-token"
                }
            },
            "request": {
                "type": "LaunchRequest",
                "requestId": "test-request-id",
                "timestamp": "2019-10-25T22:05:06Z",
                "locale": "en-US"
            }
        };
    }

    public setNewSession(isNewSession: boolean) {
        this.request.session.new = isNewSession;
    }

    public setApplicationId(applicationId: string) {
        this.request.session.application.applicationId = applicationId;
        this.request.context.System.application.applicationId = applicationId;
    }

    public setSessionId(sessionId: string) {
        this.request.session.sessionId = sessionId;
    }

    public setUserId(userId: string) {
        this.request.session.user.userId = userId;
        this.request.context.System.user.userId = userId;
    }

    public setRequestType(type: string) {
        this.request.request.type = type;
        if (type !== "IntentRequest") {
            delete this.request.request.intent;
        }
    }

    public setLocale(locale: string) {
        this.request.request.locale = locale;
    }

    public setIntent(intentName: string) {
        const requestObject = this.request.request;

        requestObject.type = "IntentRequest";
        requestObject.intent = <RequestIntent> {
            confirmationStatus: "NONE",
            name: intentName
        }

        this.request.request = requestObject;
    }

    public addSlot(intentName: string, slotName: string, slotValue: string) {
        const requestObject = this.request.request;

        if (!requestObject.intent) {
            this.setIntent(intentName);
        }

        if (!requestObject.intent.slots) {
            requestObject.intent.slots = {};
        }
        
        requestObject.intent.slots[slotName] = {
            confirmationStatus: "NONE",
            name: slotValue,
            resolutions: {
                resolutionsPerAuthority: [
                    {
                        authority: "some-fake-authority-id",
                        status: {
                            code: "ER_SUCCESS_MATCH"
                        },
                        values: [
                            {
                                value: {
                                    name: slotValue
                                }
                            }
                        ]
                    }
                ]
            }
        }
    
        this.request.request = requestObject;
    }

    public build(): any {
        return this.request;
    }
}