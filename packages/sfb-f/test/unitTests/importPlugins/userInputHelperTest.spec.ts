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

import { UserInputHelper } from './../../../importPlugins/userInputHelper';
import { UserInput, Slot } from './../../../driver/driverEntity';
import { strict as assert } from 'assert';

describe("User Input Helper Test", function () {
    it("getters and setters sanity test", async function () {
        const testUserInput: UserInput = {
            intent: "something",
            slots: [
                {
                    name: "slotName",
                    value: "value"
                }
            ],
            value: "raw value"
        };
        const inputHelper = new UserInputHelper(testUserInput);

        assert.equal(inputHelper.getInputIntent(), testUserInput.intent);
        assert.deepEqual(inputHelper.getInputSlots(), testUserInput.slots);
        assert.equal(inputHelper.getInputValue(), testUserInput.value);
        assert.equal(inputHelper.getHandlerInput(), testUserInput.handlerInput);
        assert.deepEqual(inputHelper.getUserInput(), testUserInput);

        const newIntent: string = 'new intent';
        const newSlots: Slot[] = [{
            name: "newSlotName",
            value: "new value"
        }];
        const newValue: string = "new raw value";
        const addingSlot: Slot = {
            name: "addingSlotName",
            value: "adding value"
        }

        inputHelper.setInputIntent(newIntent);
        inputHelper.setInputSlots(newSlots);
        inputHelper.setInputValue(newValue);

        assert.equal(inputHelper.getInputIntent(), newIntent);
        assert.deepEqual(inputHelper.getInputSlots(), newSlots);
        assert.equal(inputHelper.getInputValue(), newValue);

        inputHelper.clearUserInput();
        assert.deepEqual(inputHelper.getUserInput(), {});

        inputHelper.addInputSlot(addingSlot.name, addingSlot.value);
        assert.deepEqual(inputHelper.getInputSlots(), [addingSlot]);
    });
});