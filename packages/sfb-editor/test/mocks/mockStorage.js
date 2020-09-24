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

export class MockStorage {
  constructor() {
    this.storage = {};
  }

  getItem = (key) => {
    return this.storage[key] || null;
  }

  setItem = (key, value) => {
    return this.storage[key] = value + '';
  }

  removeItem = (key) => {
    return delete this.storage[key];
  }

  clear = () => {
    return this.storage = {};
  }

  toString = () => {
    return '[object Storage]';
  }

  key = (idx) => {
    return Object.keys(this.storage)[idx] || null;
  }

  setupSpies = () => {
    spyOn(Storage.prototype, 'getItem').and.callFake(this.getItem);
    spyOn(Storage.prototype, 'setItem').and.callFake(this.setItem);
    spyOn(Storage.prototype, 'removeItem').and.callFake(this.removeItem);
    spyOn(Storage.prototype, 'clear').and.callFake(this.clear);
    spyOn(Storage.prototype, 'toString').and.callFake(this.toString);
    spyOn(Storage.prototype, 'key').and.callFake(this.key);
  }

}
