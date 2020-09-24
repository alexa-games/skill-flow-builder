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

import {
    DriverExtension,
    DriverExtensionParameter,
    StoryStateHelper,
    InstructionExtension,
    InstructionExtensionParameter
} from '@alexa-games/sfb-f';
import { HandlerInput } from 'ask-sdk-core';
import uuid from 'uuid/v4';

interface MetricsEvent {
    skillId: string,
    timestamp: string,
    customerIdentifier: string,
    eventType: string,
    requestId: string,
    eventId: string,
    sessionId: string,
    stage: string,
    locale: string,
    metadata: {
        schemaVersion: string
    }
    details: {[key: string]: any}
}

export class MetricsExtension implements DriverExtension, InstructionExtension {
    private metricEvent: MetricsEvent;
    private reservedKeys = new Set();

    constructor(sendMetricsFunction?: (metricEvent: MetricsEvent) => Promise<void>) {
        if (sendMetricsFunction) {
            this.sendMetricsEvent = sendMetricsFunction;
        }
        this.reservedKeys.add('sceneId');
        this.reservedKeys.add('previousSceneId');
        this.metricEvent = this.getDefaultMetricsEvent();
    }

    async post(param: DriverExtensionParameter): Promise<void> {
        const request = param.userInputHelper.getHandlerInput();

        // driver knows if it is a reprompt
        const unhandledChoice = param.driver.isUnhandledChoice();
        if (unhandledChoice) {
            this.metricEvent.details.unhandledChoice = true;
        }

        this.metricEvent.details.sceneId = this.getLast(param.driver.getVisitedSceneIDsOnRun());
        this.metricEvent.locale = param.locale;

        this.addRequestParameters(request);

        const previousScenes = param.driver.getVisitedSceneIDsOnRun();

        try {
            if (previousScenes.length > 1) {
                await this.logPreviousScenes(previousScenes);
            } else {
                await this.sendMetricsEvent(this.metricEvent);
            }
            this.metricEvent = this.getDefaultMetricsEvent();
        } catch (err) {
            throw new Error('failed to send metrics');
        }
    }

    addRequestParameters(request: HandlerInput | undefined) {
        try {
            // We don't want this to crash the skill if there is a problem, so progressively add properties
            if (request) {
                const session = request.requestEnvelope.session;
                const req = request.requestEnvelope.request;
                if (req) {
                    this.metricEvent.timestamp = req.timestamp;
                    this.metricEvent.requestId = req.requestId;
                }
                if (session) {
                    this.metricEvent.sessionId = session.sessionId;
                    this.metricEvent.customerIdentifier = session.user.userId;
                    this.metricEvent.skillId = session.application.applicationId;
                }
            }
        } catch (err) {
            console.warn('[METRICS-ERROR] Error parsing properties for metrics', err);
        }
    }

    pre(param: DriverExtensionParameter): Promise<void> {
        this.metricEvent.details.previousSceneId = StoryStateHelper.getCurrentSceneID(param.driver.getCurrentStoryState()) || '';
        return Promise.resolve();
    }

    public async trackMetric(param: InstructionExtensionParameter): Promise<void> {
        const detailKey: string = param.instructionParameters['type'];
        if (detailKey && this.canWriteKey(detailKey)) {
            const detailValue = param.instructionParameters['value'] || 1;
            this.checkForDetailOverwrite(detailKey, detailValue);
            this.metricEvent.details[detailKey] = detailValue;
        } else {
            console.error('[METRICS-ERROR] Cannot map type and value for trackMetric call.', JSON.stringify(param.instructionParameters))
        }
    }

    private checkForDetailOverwrite(key: string, val: any) {
        if (this.metricEvent.details[key]) {
            console.error('[METRICS-ERROR] Overwriting value for type that is already set.', `
                type name: ${key}
                current value: ${this.metricEvent.details[key]}
                new value: ${val}
                `)
        }
    }

    private canWriteKey(key: string): boolean {
        if (this.reservedKeys.has(key)) {
            console.error(`[METRICS-ERROR] Cannot overwrite ${key}, it is reserved.`);
            return false;
        }
        return true;
    }


    private async sendMetricsEvent(metricEvent: MetricsEvent): Promise<void> {
        console.log('[METRICS]', JSON.stringify(metricEvent));
    };

    private getLast(arr: Array<any>) {
        if (arr.length === 0) {
            return undefined;
        }
        return arr[arr.length - 1];
    }

    private async logPreviousScenes(previousScenes: string[]) {
        for (const [index, sceneId] of previousScenes.entries()) {
            const metricEvent = this.metricEvent;
            if (previousScenes[index - 1]) {
                metricEvent.details = {};
                metricEvent.details.previousSceneId = previousScenes[index - 1];
            }
            metricEvent.details.sceneId = sceneId;
            await this.sendMetricsEvent(metricEvent);
        }
    }

    private getDefaultMetricsEvent() {
        return <MetricsEvent>{
            skillId: '',
            timestamp: '',
            customerIdentifier: '',
            eventType: 'metrics',
            requestId: '',
            eventId: uuid(),
            sessionId: '',
            stage: process.env.stage || 'stage env variable not defined',
            locale: '',
            metadata: {
                schemaVersion: '1.0'
            },
            details: {}
        }
    }
}
