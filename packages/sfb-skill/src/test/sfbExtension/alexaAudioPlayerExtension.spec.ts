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

import { AlexaAudioPlayerExtension, AudioPlayerDirective, AudioPlayerItem } from '../../sfbExtension/alexaAudioPlayerExtension';
import { ConfigAccessor } from '../../configAccessor';
import { SFBDriver, UserInputHelper, UserInput, DriverExtensionParameter, InstructionExtensionParameter, PlayStage, StoryAccessor } from '@alexa-games/sfb-f';
import * as testUtil from './testUtil';

const CONFIG_FILE = "./src/test/data/abcConfig.json";

describe('Alexa Audio Extension Tests', () => {

    it('Instantiation', async () => {

        const config = await ConfigAccessor.loadConfigFile(path.resolve(CONFIG_FILE), "");

        const alexaAudioPlayerExtension = new AlexaAudioPlayerExtension('en-us', config);

        assert.ok(alexaAudioPlayerExtension);
    });

    it('Play Directive', async () => {

        const config = await ConfigAccessor.loadConfigFile(path.resolve(CONFIG_FILE), "");

        const alexaAudioPlayerExtension = new AlexaAudioPlayerExtension('en-us', config);

        // TODO: change this MP3
        const audioItem : AudioPlayerItem = { 'url': 'https://sfb-framework.s3.amazonaws.com/examples/sounds/Bell_1.mp3' };

        const directive = alexaAudioPlayerExtension.generateAudioPlayerDirective(AudioPlayerDirective.Play, audioItem);

        assert.ok(directive);

        assert.equal(directive.type, "AudioPlayer.Play");
    });

    it('Stop Directive', async () => {

        const config = await ConfigAccessor.loadConfigFile(path.resolve(CONFIG_FILE), "");

        const alexaAudioPlayerExtension = new AlexaAudioPlayerExtension('en-us', config);

        const directive = alexaAudioPlayerExtension.generateAudioPlayerDirective(AudioPlayerDirective.Stop);

        assert.ok(directive);

        assert.equal(directive.type, "AudioPlayer.Stop");
    });

    it('Clear Queue Directive', async () => {

        const config = await ConfigAccessor.loadConfigFile(path.resolve(CONFIG_FILE), "");

        const alexaAudioPlayerExtension = new AlexaAudioPlayerExtension('en-us', config);

        const directive = alexaAudioPlayerExtension.generateAudioPlayerDirective(AudioPlayerDirective.ClearQueue);

        assert.ok(directive);

        assert.equal(directive.type, "AudioPlayer.ClearQueue");
    });

    it('No Directive', async () => {

        const config = await ConfigAccessor.loadConfigFile(path.resolve(CONFIG_FILE), "");

        const alexaAudioPlayerExtension = new AlexaAudioPlayerExtension('en-us', config);

        const directive = alexaAudioPlayerExtension.generateAudioPlayerDirective(AudioPlayerDirective.None);

        assert.equal(directive, undefined);
    });

    it('Test post', async () => {

        const config = await ConfigAccessor.loadConfigFile(path.resolve(CONFIG_FILE), "./src/test/data");

        const alexaMonetizationExtension = new AlexaAudioPlayerExtension('en-us', config);

        const userInputHelper = new UserInputHelper(testUtil.testUserInput);

        const param : DriverExtensionParameter = { storyState: {}, 
                                                   userInputHelper,
                                                   driver: testUtil.getDefaultBaseDriver(),
                                                   locale: 'en-US'
                                                 };

        await alexaMonetizationExtension.pre(param);

        await alexaMonetizationExtension.post(param);

    });

    it('Test post', async () => {

        const config = await ConfigAccessor.loadConfigFile(path.resolve(CONFIG_FILE), "./src/test/data");

        const alexaMonetizationExtension = new AlexaAudioPlayerExtension('en-us', config);

        const userInputHelper = new UserInputHelper(testUtil.testUserInput);

        const param : DriverExtensionParameter = { storyState: {}, 
                                                   userInputHelper,
                                                   driver: testUtil.getDefaultBaseDriver(),
                                                   locale: 'en-US'
                                                 };

        await alexaMonetizationExtension.pre(param);

        await alexaMonetizationExtension.post(param);

    });

    it('Test audio_player_play', async () => {

        const config = await ConfigAccessor.loadConfigFile(path.resolve(CONFIG_FILE), "./src/test/data");

        const alexaMonetizationExtension = new AlexaAudioPlayerExtension('en-us', config);

        const userInputHelper = new UserInputHelper(testUtil.testUserInput);

        const param : DriverExtensionParameter = { storyState: {}, 
                                                   userInputHelper,
                                                   driver: testUtil.getDefaultBaseDriver(),
                                                   locale: 'en-US'
                                                 };

        await alexaMonetizationExtension.audio_player_play(testUtil.getMockInstructionParameter("audio_player_play", {"url": "https://sfb-framework.s3.amazonaws.com/examples/sounds/Bell_1.mp3"}));
    });
    
    it('Test audio_player_play no url', async () => {

        const config = await ConfigAccessor.loadConfigFile(path.resolve(CONFIG_FILE), "./src/test/data");

        const alexaMonetizationExtension = new AlexaAudioPlayerExtension('en-us', config);

        const userInputHelper = new UserInputHelper(testUtil.testUserInput);

        const param : DriverExtensionParameter = { storyState: {}, 
                                                   userInputHelper,
                                                   driver: testUtil.getDefaultBaseDriver(),
                                                   locale: 'en-US'
                                                 };

        try {
            await alexaMonetizationExtension.audio_player_play(testUtil.getMockInstructionParameter("audio_player_play", {}));
            assert(false, 'Should have thrown by now.')
        } catch (e) {
            assert(true, 'Should throw an error');
        }
    });

});
