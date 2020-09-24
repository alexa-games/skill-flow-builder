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


import { SceneEnumerator, ScenePropertyEnumerator } from '../../../importPlugins/storyFeatureEnumerator';
import { TestOneSceneStory, TestTwoSceneStory, TestThreeSceneStory } from './storyFeatureFinder.spec';
import { StoryFeatureFinder } from '../../../importPlugins/storyFeatureFinder';
import { strict as assert } from 'assert';

const TestStory = `
    @empty

    @not empty
    *say
        Hello

    @has props
    *say
        Hello
    *then
        -> what
        * fake
            Say what
`;

describe("StoryFeatureEnumerator", function () {
    describe("SceneEnumerator", function () {
        it("Empty story", () => {
            const finder = new SceneEnumerator([]);
            const block = finder.getNext();

            assert.equal(block, undefined, 'Should be undefined.');
        });

        it("One scene story", () => {
            const finder = new SceneEnumerator(TestOneSceneStory.split('\n'));
            const scene1 = finder.getNext();

            assert.ok(!!scene1,'Should be defined.');
            assert.equal(scene1!.blockName, 'scene one');

            const end = finder.getNext();
            assert.ok(!end, 'No more here.');
        });

        it("Two scene story", () => {
            const finder = new SceneEnumerator(TestTwoSceneStory.split('\n'));

            const scene1 = finder.getNext();
            assert.ok(!!scene1,'Should be defined.');
            assert.equal(scene1!.blockName, 'scene one abc');

            const scene2 = finder.getNext();
            assert.ok(!!scene2,'Should be defined.');
            assert.equal(scene2!.blockName, 'scene two');

            const end = finder.getNext();
            assert.ok(!end, 'No more here.');
        });
    });

    describe("ScenePropertyEnumerator", function () {
        
        it("Empty scene", () => {
            const finder = new SceneEnumerator(TestStory.split('\n'));
            const scene = finder.getNext();

            const propEnum = scene!.getPropertyEnumerator();

            const prop = propEnum.getNext();

            assert.equal(prop, undefined, 'Should be undefined.');
        });

        it("One say prop", () => {
            const finder = new StoryFeatureFinder(TestStory.split('\n'));
            const scene = finder.findScene('not empty');

            const propEnum = scene!.getPropertyEnumerator('say');

            let prop = propEnum.getNext();

            assert.ok(!!prop, 'Should be defined.');
            assert.equal(prop!.blockName, 'say', 'One say block');
            assert.ok(prop!.range.end.row === scene!.range.end.row, 'Last row should match scene last');

            prop = propEnum.getNext();

            assert.equal(prop, undefined, 'Should be undefined.');
        });

        it("Three props", () => {
            const finder = new StoryFeatureFinder(TestStory.split('\n'));
            const scene = finder.findScene('has props');

            const propEnum = scene!.getPropertyEnumerator();

            let prop = propEnum.getNext();

            assert.ok(!!prop, 'Should be defined.');
            assert.equal(prop!.blockName, 'say', 'say block');

            prop = propEnum.getNext();

            assert.ok(!!prop, 'Should be defined.');
            assert.equal(prop!.blockName, 'then', 'then block');

            prop = propEnum.getNext();

            assert.ok(!!prop, 'Should be defined.');
            assert.equal(prop!.blockName, 'fake', 'fake block');

            prop = propEnum.getNext();

            assert.equal(prop, undefined, 'Should be undefined.');
        });

        it("Three props - only then", () => {
            const finder = new StoryFeatureFinder(TestStory.split('\n'));
            const scene = finder.findScene('has props');

            const propEnum = scene!.getPropertyEnumerator('then');

            let prop = propEnum.getNext();

            assert.ok(!!prop, 'Should be defined.');
            assert.equal(prop!.blockName, 'then', 'Should be then block');

            prop = propEnum.getNext();

            assert.equal(prop, undefined, 'Should be undefined.');
        });
    });
});
