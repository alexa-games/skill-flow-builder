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

import { SceneDirectionBuilder, StoryMetadata, StoryStateHelper } from '@alexa-games/sfb-f';
import { DriverExtensionTester, TestStoryBuilder } from '@alexa-games/sfb-test';
import { MetricsExtension } from '../..';
import * as chai from 'chai';
import chaiExclude from 'chai-exclude';
import { assert, expect } from 'chai';

chai.use(chaiExclude);


describe('Metrics Extension', () => {
   let testStory: StoryMetadata;

   beforeEach("set up set up test", async  (done) => {

      // Example of building *then section. but.. not required for this test.
      const instructions = new SceneDirectionBuilder();

      instructions.customDirection("fakeInstruction", {
         param1: "test-value"
      });

      const thenSection = instructions.build();

      // Example of creating a test story object. (also not required for this test)
      const testStoryBuilder = new TestStoryBuilder("test-story");
      testStoryBuilder.addScene("testing scene1", "this is a test scene", thenSection);
      testStoryBuilder.addScene("testing scene2", "this is a test scene", thenSection);
      testStoryBuilder.addScene("testing scene3", "this is a test scene", thenSection);

      testStory = testStoryBuilder.build();

      done();
   });

   it('Performs a basic metrics workflow', async ()=> {
      const expectedOutput = [{
         skillId: 'test-application-id',
         customerIdentifier: 'test-user-id',
         eventType: 'metrics',
         requestId: 'test-request-id',
         sessionId: 'test-session-id',
         stage: 'stage env variable not defined',
         locale: 'en-US',
         metadata: { schemaVersion: '1.0' },
         details:
             { previousSceneId: 'testing scene2', sceneId: 'testing scene1' } }];

      let generatedOutput: any[] = [];
      const metricsExtension = new MetricsExtension(async (m) => {
         assert.isOk(m);
         generatedOutput.push(m);
      });

      // This should work, or even setting it in the extension tester
      // @ts-ignore
      StoryStateHelper.setCurrentSceneID(testStory, 'testing scene2');
      const extensionTester = new DriverExtensionTester({
         extensions: [],
         locale: "en-US",
         story: testStory,
         storyState: {
            system_bookmark: 'testing scene2'
         }
      });


      await extensionTester.givenIntentRequest("some random intent");

      const testParam = extensionTester.generateDriverExtensionParameter();
      testParam.driver.stage.logVisitedScene(('testing scene1'));
      StoryStateHelper.setCurrentSceneID(testStory, 'testing scene1');

      try {
         await metricsExtension.pre(testParam);
         await metricsExtension.post(testParam);
         assert.deepEqualExcluding(generatedOutput, expectedOutput, ['eventId', 'timestamp']);
      } catch (err) {
         console.log(err);
         assert.fail(err.message);
      }
   });

   it('Basic workflow with track metrics (using promise override)', async ()=> {
      const expectedOutput = [{
         skillId: 'test-application-id',
         customerIdentifier: 'test-user-id',
         eventType: 'metrics',
         requestId: 'test-request-id',
         sessionId: 'test-session-id',
         stage: 'stage env variable not defined',
         locale: 'en-US',
         metadata: { schemaVersion: '1.0' },
         details:
             {
                previousSceneId: 'testing scene2',
                sceneId: 'testing scene1',
               'test-type': 'test-value'
             } }];

      let generatedOutput: any[] = [];
      const metricsExtension = new MetricsExtension(async (m) => {
         assert.isOk(m);
         return new Promise((resolve) => {
            generatedOutput.push(m);
            resolve();
         });
      });

      // This should work, or even setting it in the extension tester
      // @ts-ignore
      StoryStateHelper.setCurrentSceneID(testStory, 'testing scene2');
      const extensionTester = new DriverExtensionTester({
         extensions: [],
         locale: "en-US",
         story: testStory,
         storyState: {
            system_bookmark: 'testing scene2'
         }
      });


      await extensionTester.givenIntentRequest("some random intent");

      const testParam = extensionTester.generateDriverExtensionParameter();
      testParam.driver.stage.logVisitedScene(('testing scene1'));
      StoryStateHelper.setCurrentSceneID(testStory, 'testing scene1');

      try {
         await metricsExtension.pre(testParam);
         // @ts-ignore
         await metricsExtension.trackMetric({
            instructionParameters: {
               type: 'test-type',
               value: 'test-value'
            }
         });
         await metricsExtension.post(testParam);
         assert.deepEqualExcluding(generatedOutput, expectedOutput, ['eventId', 'timestamp']);
      } catch (err) {
         console.log(err);
         assert.fail(err.message);
      }
   });

   it('Does not overwrite previousScene and Scene', async() => {
      const expectedOutput = [{
         skillId: 'test-application-id',
         customerIdentifier: 'test-user-id',
         eventType: 'metrics',
         requestId: 'test-request-id',
         sessionId: 'test-session-id',
         stage: 'stage env variable not defined',
         locale: 'en-US',
         metadata: { schemaVersion: '1.0' },
         details:
             {
                previousSceneId: 'testing scene2',
                sceneId: 'testing scene1'
             } }];

      let generatedOutput: any[] = [];
      const metricsExtension = new MetricsExtension(async (m) => {
         assert.isOk(m);
         generatedOutput.push(m);
      });

      // This should work, or even setting it in the extension tester
      // @ts-ignore
      StoryStateHelper.setCurrentSceneID(testStory, 'testing scene2');
      const extensionTester = new DriverExtensionTester({
         extensions: [],
         locale: "en-US",
         story: testStory,
         storyState: {
            system_bookmark: 'testing scene2'
         }
      });


      await extensionTester.givenIntentRequest("some random intent");

      const testParam = extensionTester.generateDriverExtensionParameter();
      testParam.driver.stage.logVisitedScene(('testing scene1'));
      StoryStateHelper.setCurrentSceneID(testStory, 'testing scene1');

      try {
         await metricsExtension.pre(testParam);
         // @ts-ignore
         await metricsExtension.trackMetric({
            instructionParameters: {
               type: 'sceneId',
               value: 'test-value'
            }
         });
         // @ts-ignore
         await metricsExtension.trackMetric({
            instructionParameters: {
               type: 'previousSceneId',
               value: 'test-value'
            }
         });
         await metricsExtension.post(testParam);
         assert.deepEqualExcluding(generatedOutput, expectedOutput, ['eventId', 'timestamp']);
      } catch (err) {
         console.log(err);
         assert.fail(err.message);
      }
   });

   it('Handles promise rejection in override, expected to throw', async ()=> {
      const expectedOutput = [{
         skillId: 'test-application-id',
         customerIdentifier: 'test-user-id',
         eventType: 'metrics',
         requestId: 'test-request-id',
         sessionId: 'test-session-id',
         stage: 'stage env variable not defined',
         locale: 'en-US',
         metadata: { schemaVersion: '1.0' },
         details:
             {
                previousSceneId: 'testing scene2',
                sceneId: 'testing scene1',
                'test-type': 'test-value'
             } }];

      let generatedOutput: any[] = [];
      const metricsExtension = new MetricsExtension(async (m) => {
         assert.isOk(m);
         return new Promise((resolve, reject) => {
            reject();
         });
      });

      // This should work, or even setting it in the extension tester
      // @ts-ignore
      StoryStateHelper.setCurrentSceneID(testStory, 'testing scene2');
      const extensionTester = new DriverExtensionTester({
         extensions: [],
         locale: "en-US",
         story: testStory,
         storyState: {
            system_bookmark: 'testing scene2'
         }
      });


      await extensionTester.givenIntentRequest("some random intent");

      const testParam = extensionTester.generateDriverExtensionParameter();
      testParam.driver.stage.logVisitedScene(('testing scene1'));
      StoryStateHelper.setCurrentSceneID(testStory, 'testing scene1');


      await metricsExtension.pre(testParam);
      try {
         await metricsExtension.post(testParam);
      } catch (err){
         expect(err.message).to.eq('failed to send metrics');
      }
   });

   it('Handles bad data on trackMetrics', async() => {
      const expectedOutput = [{
         skillId: 'test-application-id',
         customerIdentifier: 'test-user-id',
         eventType: 'metrics',
         requestId: 'test-request-id',
         sessionId: 'test-session-id',
         stage: 'stage env variable not defined',
         locale: 'en-US',
         metadata: { schemaVersion: '1.0' },
         details:
             {
                previousSceneId: 'testing scene2',
                sceneId: 'testing scene1',
                'test-value': 1
             } }];

      let generatedOutput: any[] = [];
      const metricsExtension = new MetricsExtension(async (m) => {
         assert.isOk(m);
         generatedOutput.push(m);
      });

      // This should work, or even setting it in the extension tester
      // @ts-ignore
      StoryStateHelper.setCurrentSceneID(testStory, 'testing scene2');
      const extensionTester = new DriverExtensionTester({
         extensions: [],
         locale: "en-US",
         story: testStory,
         storyState: {
            system_bookmark: 'testing scene2'
         }
      });


      await extensionTester.givenIntentRequest("some random intent");

      const testParam = extensionTester.generateDriverExtensionParameter();
      testParam.driver.stage.logVisitedScene(('testing scene1'));
      StoryStateHelper.setCurrentSceneID(testStory, 'testing scene1');

      try {
         await metricsExtension.pre(testParam);
         // @ts-ignore
         await metricsExtension.trackMetric({
            instructionParameters: {
               type: 'test-value'
            }
         });
         // @ts-ignore
         await metricsExtension.trackMetric({
            instructionParameters: {
               value: 'test-value'
            }
         });
         // @ts-ignore
         await metricsExtension.trackMetric({
            instructionParameters: {
               pie: 'test-value'
            }
         });
         await metricsExtension.post(testParam);
         assert.deepEqualExcluding(generatedOutput, expectedOutput, ['eventId', 'timestamp']);
      } catch (err) {
         console.log(err);
         assert.fail(err.message);
      }
   })

   it('Initializes', async () => {
      const metricsExtension = new MetricsExtension();
      assert.isOk(metricsExtension);

      const metricsExtensionWithOverload = new MetricsExtension(async (m) => {});
      assert.isOk(metricsExtensionWithOverload);
   });
});
