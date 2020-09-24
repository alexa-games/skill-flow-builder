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

import { PersistenceAdapter } from 'ask-sdk';
import { RequestEnvelope } from 'ask-sdk-model';

export class TestPersistenceAdapter implements PersistenceAdapter {
    public attributes: any = {};

    constructor() {

    }

    /**
     * Retrieves persistence attributes from AWS DynamoDB.
     * @param {RequestEnvelope} requestEnvelope Request envelope used to generate partition key.
     * @returns {Promise<Object.<string, any>>}
     */
    async getAttributes(requestEnvelope: RequestEnvelope): Promise<{
        [key: string]: any;
    }> {
        return this.attributes;
    }

    /**
     * Saves persistence attributes to AWS DynamoDB.
     * @param {RequestEnvelope} requestEnvelope Request envelope used to generate partition key.
     * @param {Object.<string, any>} attributes Attributes to be saved to DynamoDB.
     * @return {Promise<void>}
     */
    async saveAttributes(requestEnvelope: RequestEnvelope, attributes: {
        [key: string]: any;
    }): Promise<void> {
        this.attributes = attributes;
    }

    /**
     * Delete persistence attributes from AWS DynamoDB.
     * @param {RequestEnvelope} requestEnvelope Request envelope used to generate partition key.
     * @return {Promise<void>}
     */
    async deleteAttributes(requestEnvelope: RequestEnvelope): Promise<void> {
    }
}

