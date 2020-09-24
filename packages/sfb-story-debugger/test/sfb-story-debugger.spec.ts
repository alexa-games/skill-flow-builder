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

const fs = require('fs');
const path = require('path');

import {DefaultFormatImportPlugin, StoryMetadataHelper, SFBDriver} from '@alexa-games/sfb-f'
import { ABCDebugger } from '../index'
import { strict as assert } from 'assert';
import { EventEmitter } from 'events';

class Logger {

    lineHistory : string[] = [];

    log = (input: string) => {
        this.lineHistory.push(input);
        console.log(input);
      };    

    getLastLine = () => {
      return (this.lineHistory.length > 0) ? this.lineHistory[this.lineHistory.length - 1] : "";
    }

    // get the last line of actual output, which is preceded by a line of '%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%'
    // the return the line one after that line
    getLastOutputLine() : string {
      if(this.lineHistory.length == 0) {
        return "";
      }

      for(let i = this.lineHistory.length; i > 0; i--) {

        const line = this.lineHistory[i-1];

        if(line.includes("%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%")) {

          return (this.lineHistory.length > i) ? this.lineHistory[i] : "";
        }

      }

      return "";
    }

    outputResponse = (response : any, gameState : any) => {
    };  
}

async function initTestStoryMetadata() {

  const testABCStoryString: string = `
  @start
  *say
      this is a say at the start
  *then
      hear go to the ballpark {
          -> ballpark
      }

      hear go to the zoo {
        -> zoo
      }

      slot healthnumber as 'AMAZON.NUMBER'
      hear my health to {healthnumber} {
        -> health
      }

      slot fruit as 'customFruitSlot'
      hear my favorite fruit is {fruit}, {fruit} {
        -> fruit
      }

      hear * {
        -> start
      }

  @ballpark
  *say
      You're at the baseball game.
  *reprompt
      Still at the baseball game.
  *show
      template: 'default'
      background: 'ballpark.jpg'

  @zoo
  *say
      You're at the zoo.
  *then
      hear other scene {
        -> other scene
      }      

  @health
  *say
      Your health is now X
  *then
      -> start

  @fruit
  *say
      I love fruit too
  *then
      -> start

  @other scene
  *say
      I am an ending scene
          `;
    
  const testLanguageModel: any = 
  {
    "languageModel": {
        "types": [
            {
                "name": "customFruitSlot",
                "values": [
                    {
                        "id": null,
                        "name": {
                            "value": "banana",
                            "synonyms": []
                        }
                    },
                    {
                        "id": null,
                        "name": {
                            "value": "pear",
                            "synonyms": []
                        }
                    }
                ]
            }
        ],
        "intents": [
            {
                "name": "FlexibleAnswerIntent",
                "samples": [
                    "{healthNumber}",
                ],
                "slots": [
                    {
                        "name": "healthNumber",
                        "type": "AMAZON.NUMBER"
                    }
                ]
            },
        ],
        "invocationName": "testtest"
      }
    };

  const plugin = new DefaultFormatImportPlugin();

  const importResult = await plugin.importData([
          {
              id: "start.abc",
              text: testABCStoryString
          }
      ],
      {ignoreSyntaxError: false}
  );

  const storyMetadataHelper = new StoryMetadataHelper({
      pluginName: "default",
      scenes: importResult.importedScenes,
      storyID: "test story",
      storyTitle: "test story"
  });

  const storyJson = await storyMetadataHelper.getStoryMetadata();
  storyJson.alexaVoiceModel = testLanguageModel;

  return storyJson;
}

function assertIncludes(line : string, includes : string) {

  assert.ok(line.includes(includes), "Line: " + line + " must include " + includes);
}

let abcDebugger : undefined | ABCDebugger;

describe('SFB Story Debugger Tests', () => {

    it('Simple hear with choice', async () => {

        const storyJson = await initTestStoryMetadata();

        abcDebugger = new ABCDebugger(storyJson, [], undefined, {}, ".");
        const emitter = new EventEmitter();
        const logger = new Logger();
        abcDebugger.run(emitter, logger);

        await abcDebugger.runCommand("", logger);

        await abcDebugger.runCommand("go to the ballpark", logger);
        
        assertIncludes(logger.getLastOutputLine(), "baseball");

        await abcDebugger.runCommand("!quit", logger);
    });

    it('Test load and reload from file', async () => {

      const storyJson = await initTestStoryMetadata();

      abcDebugger = new ABCDebugger(storyJson, [], path.resolve("./test/testStory.json"), {}, ".");
      const logger = new Logger();
      abcDebugger.run(undefined, logger);

      await abcDebugger.runCommand("", logger);

      await abcDebugger.runCommand("go to the ballpark", logger);      
      assertIncludes(logger.getLastOutputLine(), "baseball");

      await abcDebugger.runCommand("!reload", logger);

      await abcDebugger.runCommand("!quit", logger);
    });

    it('Test clear state', async () => {

      const storyJson = await initTestStoryMetadata();

      abcDebugger = new ABCDebugger(storyJson, [], path.resolve("./test/testStory.json"), {}, ".");
      const logger = new Logger();
      abcDebugger.run(undefined, logger);

      await abcDebugger.runCommand("", logger);

      abcDebugger.clearState();
    });

    it('Simple hear with choice no emitter', async () => {

      const storyJson = await initTestStoryMetadata();

      abcDebugger = new ABCDebugger(storyJson, [], undefined, {}, ".");
      const logger = new Logger();
      abcDebugger.run(undefined, logger);

      await abcDebugger.runCommand("", logger);

      await abcDebugger.runCommand("go to the ballpark", logger);
      
      assertIncludes(logger.getLastOutputLine(), "baseball");

      await abcDebugger.runCommand("!quit", logger);
    });

    it('Test slot value', async () => {

      const storyJson = await initTestStoryMetadata();

      abcDebugger = new ABCDebugger(storyJson, [], undefined, {}, ".");
      const logger = new Logger();
      abcDebugger.run(undefined, logger);

      await abcDebugger.runCommand("", logger);

      await abcDebugger.runCommand("set my health to 5", logger);
      
      assertIncludes(logger.getLastOutputLine(), "Your health is now X");

      await abcDebugger.runCommand("!quit", logger);
    });

    it('Test custom slot value', async () => {

      const storyJson = await initTestStoryMetadata();

      abcDebugger = new ABCDebugger(storyJson, [], undefined, {}, ".");
      const logger = new Logger();
      abcDebugger.run(undefined, logger);

      await abcDebugger.runCommand("", logger);

      await abcDebugger.runCommand("my favorite fruit is banana", logger);      
      assertIncludes(logger.getLastOutputLine(), "I love fruit too");

      await abcDebugger.runCommand("banana", logger);      
      assertIncludes(logger.getLastOutputLine(), "I love fruit too");

      await abcDebugger.runCommand("!quit", logger);
    });

    it('Test set and get', async () => {

      const storyJson = await initTestStoryMetadata();

      abcDebugger = new ABCDebugger(storyJson, [], undefined, {}, ".");
      const emitter = new EventEmitter();
      const logger = new Logger();
      abcDebugger.run(emitter, logger);

      await abcDebugger.runCommand("", logger);

      await abcDebugger.runCommand("!set", logger);

      await abcDebugger.runCommand("!set newVariable=myValue", logger);

      await abcDebugger.runCommand("!set newVariableTrue=true", logger);

      await abcDebugger.runCommand("!set newVariableFalse=false", logger);

      await abcDebugger.runCommand("!get", logger);
      assertIncludes(logger.getLastLine(), "Available Variables");

      await abcDebugger.runCommand("!get newVariable", logger);

      assertIncludes(logger.getLastLine(), "myValue");

      await abcDebugger.runCommand("!quit", logger);
  });

  it('Test invalid command', async () => {

    const storyJson = await initTestStoryMetadata();

    abcDebugger = new ABCDebugger(storyJson, [], undefined, {}, ".");
    const emitter = new EventEmitter();
    const logger = new Logger();
    abcDebugger.run(emitter, logger);

    await abcDebugger.runCommand("", logger);

    await abcDebugger.runCommand("!", logger);
    assertIncludes(logger.getLastLine(), "an unrecognized debugger command");
    

    await abcDebugger.runCommand("!quit", logger);
  });

  it('Test save and load', async () => {

    const storyJson = await initTestStoryMetadata();

    abcDebugger = new ABCDebugger(storyJson, [], undefined, {}, ".");
    const emitter = new EventEmitter();
    const logger = new Logger();
    abcDebugger.run(emitter, logger);

    // Verify we are at the beginning
    await abcDebugger.runCommand("", logger);
    assertIncludes(logger.getLastOutputLine(), "start");

    // go to baseball field
    await abcDebugger.runCommand("go to the ballpark", logger);
    assertIncludes(logger.getLastOutputLine(), "baseball");

    // invalid save
    await abcDebugger.runCommand("!save", logger);
    assertIncludes(logger.getLastLine(), "Need save NAME");
    
    // then save
    await abcDebugger.runCommand("!save mySaveFile", logger);

    // then reset back to the beginning and verify we are at the beginning
    await abcDebugger.runCommand("!restart", logger);
    assertIncludes(logger.getLastOutputLine(), "start");

    // invalid load
    await abcDebugger.runCommand("!load", logger);

    // then load from our file and verify that we resume back at the baseball field
    await abcDebugger.runCommand("!load mySaveFile", logger);
    assertIncludes(logger.getLastOutputLine(), "baseball");

    // load something that doesn't exist
    await abcDebugger.runCommand("!load doesn't exist", logger);
    assertIncludes(logger.getLastLine(), "doesn't exist");

    await abcDebugger.runCommand("!quit", logger);
  });

  it('Test save and load from first scene', async () => {

    const storyJson = await initTestStoryMetadata();

    abcDebugger = new ABCDebugger(storyJson, [], undefined, {}, ".");
    const emitter = new EventEmitter();
    const logger = new Logger();
    abcDebugger.run(emitter, logger);

    // Verify we are at the beginning
    await abcDebugger.runCommand("", logger);
    assertIncludes(logger.getLastOutputLine(), "start");

    // then save
    await abcDebugger.runCommand("!save mySaveFile", logger);

    // then load from our file and verify that we are at the beginning
    await abcDebugger.runCommand("!load mySaveFile", logger);
    assertIncludes(logger.getLastOutputLine(), "start");

    await abcDebugger.runCommand("!quit", logger);
  });

  it('Test back', async () => {

    const storyJson = await initTestStoryMetadata();

    abcDebugger = new ABCDebugger(storyJson, [], undefined, {}, ".");
    const emitter = new EventEmitter();
    const logger = new Logger();
    abcDebugger.run(emitter, logger);

    // Verify we are at the beginning
    await abcDebugger.runCommand("", logger);
    assertIncludes(logger.getLastOutputLine(), "start");

    // go to baseball field
    await abcDebugger.runCommand("go to the ballpark", logger);
    assertIncludes(logger.getLastOutputLine(), "baseball");

    // then save
    await abcDebugger.runCommand("!back", logger);
    assertIncludes(logger.getLastOutputLine(), "start");

    await abcDebugger.runCommand("!back", logger);
    assertIncludes(logger.getLastLine(), "Not enough history to go back to");

    await abcDebugger.runCommand("!quit", logger);
  });

  it('Test pause', async () => {

    const storyJson = await initTestStoryMetadata();

    abcDebugger = new ABCDebugger(storyJson, [], undefined, {}, ".");
    const emitter = new EventEmitter();
    const logger = new Logger();
    abcDebugger.run(emitter, logger);

    // Verify we are at the beginning
    await abcDebugger.runCommand("", logger);
    assertIncludes(logger.getLastOutputLine(), "start");

    // then save
    await abcDebugger.runCommand("!pause", logger);

    await abcDebugger.runCommand("start", logger);

    await abcDebugger.runCommand("go to the zoo", logger);

    await abcDebugger.runCommand("!quit", logger);
  });

  it('Test clear_and_goto', async () => {

    const storyJson = await initTestStoryMetadata();

    abcDebugger = new ABCDebugger(storyJson, [], undefined, {}, ".");
    const emitter = new EventEmitter();
    const logger = new Logger();
    abcDebugger.run(emitter, logger);

    await abcDebugger.runCommand("", logger);
    assertIncludes(logger.getLastOutputLine(), "start");

    await abcDebugger.runCommand("!clear_and_goto zoo", logger);
    assertIncludes(logger.getLastOutputLine(), "zoo");

    await abcDebugger.runCommand("!clear_and_goto", logger);
    assertIncludes(logger.getLastLine(), "Need scene ID to go to ie");

    await abcDebugger.runCommand("!quit", logger);
  });

  it('Test help', async () => {

    const storyJson = await initTestStoryMetadata();

    abcDebugger = new ABCDebugger(storyJson, [], undefined, {}, ".");
    const emitter = new EventEmitter();
    const logger = new Logger();
    abcDebugger.run(emitter, logger);

    await abcDebugger.runCommand("", logger);
    assertIncludes(logger.getLastOutputLine(), "start");

    await abcDebugger.runCommand("!help", logger);

    await abcDebugger.runCommand("!quit", logger);
  });

  it('Test goto', async () => {

    const storyJson = await initTestStoryMetadata();
  
    abcDebugger = new ABCDebugger(storyJson, [], undefined, {}, ".");
    const emitter = new EventEmitter();
    const logger = new Logger();
    abcDebugger.run(emitter, logger);
  
    await abcDebugger.runCommand("!goto", logger);  
    assertIncludes(logger.getLastLine(), "Need scene ID to go to ie");

    await abcDebugger.runCommand("!goto zoo", logger);  
    assertIncludes(logger.getLastOutputLine(), "zoo");

    await abcDebugger.runCommand("", logger);  

    await abcDebugger.runCommand("!quit", logger);
  });
  
});

// Clean up afterwards if there was an error and an abcDebugger was left running, as it freezes the console window
after(async () => {  
  if(abcDebugger) {
    const logger = new Logger();
    await abcDebugger.runCommand("!quit", logger);
  }

  // clean up any temp files created
  if(fs.existsSync("./mySaveFile.json")) {
    fs.unlinkSync("./mySaveFile.json");
  }

  if(fs.existsSync("./saves/mySaveFile.json")) {
    fs.unlinkSync("./saves/mySaveFile.json");
  }

})
