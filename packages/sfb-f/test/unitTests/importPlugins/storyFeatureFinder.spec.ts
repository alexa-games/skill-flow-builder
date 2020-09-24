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


import { StoryFeatureFinder } from '../../../importPlugins/storyFeatureFinder';
import { strict as assert } from 'assert';

export const TestOneSceneStory = `
    @  scene one
    * say
        hello

    over
    *then
        // Comment
        hear this { 
            -> test 
        }

        -> going to the market

        hear a lot of things { 
            if foo { 
                -> going to the market
            }
        }

    hear simple hear {{

        <->       going to the market   
        }
    }

    *end

`;

export const TestTwoSceneStory = `
@  scene one abc
    * say
        hello
        *  then
        if (foo) {
            -> another place
        }
    @scene two
        *say
        whats up?  I hear you.
    *then
        stuff

        things`;

export const TestThreeSceneStory = `
@  scene one foo
    * say
        hello
        there
    *then
    { test }

    @   middle  scene    

    *then
        stuff

        things
        
    @       final scene xyz

    *say 
        Nothing

    *then
        -> next scene 
        hear bosy, bliew adi 

        {


            -> other scene

        }
x        `;

describe("StoryFeatureFinder", function () {
    

    it("getReferences - one scene story, success", () => {
        const finder = new StoryFeatureFinder(TestOneSceneStory.split('\n'));
        const ranges = finder.getReferences('test');
        assert.equal(ranges.length, 1, 'Found one ref');
    });

    it("getReferences - one scene story, whole hear included", () => {
        const finder = new StoryFeatureFinder(TestOneSceneStory.split('\n'));
        const ranges = finder.getReferences('test');

        assert.equal(ranges.length, 1, 'Found one ref');
        assert.ok(ranges[0].start.row < ranges[0].end.row, 'Covers multiple rows');
    });

    it("getReferences - one scene story, multiple refs", () => {
        const finder = new StoryFeatureFinder(TestOneSceneStory.split('\n'));
        const ranges = finder.getReferences('going to the market');

        assert.equal(ranges.length, 3, 'Found correct number of refs');
        assert.ok(ranges[0].start.row === ranges[0].end.row - 1, 'Covers one row');
        assert.ok(ranges[1].start.row === ranges[1].end.row - 1, 'Covers one row');
        assert.ok(ranges[2].start.row < ranges[2].end.row - 1, 'Covers multiple rows');
    });

    it("getReferences - one scene story, not found", () => {
        const finder = new StoryFeatureFinder(TestOneSceneStory.split('\n'));
        const ranges = finder.getReferences('none');
        assert.equal(ranges.length, 0, 'Found no ref');
    });

    it("getReferences - two scene story, not found", () => {
        const finder = new StoryFeatureFinder(TestTwoSceneStory.split('\n'));
        const ranges = finder.getReferences('none');
        assert.equal(ranges.length, 0, 'Found no ref');
    });

    it("getReferences - large but simple here", () => {
        const finder = new StoryFeatureFinder(TestThreeSceneStory.split('\n'));
        const ranges = finder.getReferences('other scene');
        assert.equal(ranges.length, 1, 'Found ref');
        assert.equal(ranges[0].end.row - ranges[0].start.row, 8, 'Hear on many lines.');
    });

    it("getScenePropertyByType - Find then block in a scene", () => {
        const finder = new StoryFeatureFinder(TestThreeSceneStory.split('\n'));
        const sceneBlock = finder.findScene('final scene xyz');
        const block = finder.getScenePropertyByType(sceneBlock!.range, 'then')

        assert.ok(!!block, 'Range should be defined.');
        assert.equal(block!.range.start.row, 20, 'Found on this row');
        assert.equal(block!.range.start.column, 0, 'Always column 0');
        assert.equal(block!.range.end.row, 30, 'Ends here');
        assert.equal(block!.range.end.column, 9, 'last line of document, so at this column.');
    });

    it("getScenePropertyByType - Missing foo block", () => {
        const finder = new StoryFeatureFinder(TestThreeSceneStory.split('\n'));
        const sceneBlock = finder.findScene('final scene xyz');
        const block = finder.getScenePropertyByType(sceneBlock!.range, 'foo')

        assert.ok(!block, 'Should not be defined.');
    });
});
