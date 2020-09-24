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

/**
 * Registering a unhandledRejection handler that throws the provided exception ensures that code 
 * that has an unhandled rejection fails a test case and does not let failing code continue unnoticed.  
 * This is the warning this code replaces: UnhandledPromiseRejectionWarning: Unhandled promise 
 * rejection. This error originated either by throwing inside of an async function without a catch block, 
 * or by rejecting a promise which was not handled with .catch(). (rejection id: 1)
 */
export function crashOnUnhandledRejections() {
    process.on('unhandledRejection', unhandledRejection => { 
        if (unhandledRejection instanceof Error) {
            const error = unhandledRejection as Error;
            console.error('unhandledRejection called. There is likely a missing "await" in this call stack: ' + error.stack);
        } else {
            const rejectionDescription = unhandledRejection ? typeof unhandledRejection + ' ' + unhandledRejection.toString() : 'undefined';
            console.error(`unhandledRejection called. There is likely a missing "await" where ${rejectionDescription} was thrown.`);
        }
        throw unhandledRejection 
    });
}