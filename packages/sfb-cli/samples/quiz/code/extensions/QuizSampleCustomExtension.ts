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

import { DriverExtension, InstructionExtension, DriverExtensionParameter, InstructionExtensionParameter } from '@alexa-games/sfb-f';
import { HandlerInput } from 'ask-sdk';
import { ExtensionLoaderParameter } from '@alexa-games/sfb-skill';
import * as fastCsv from 'fast-csv';
import * as path from "path";

export enum Platform {
  AMAZON_ALEXA
}

export class QuizSampleCustomExtension implements DriverExtension, InstructionExtension {

    slotType : string = '';
    slotValues : any = [];
    handlerInput: HandlerInput | any = undefined;

    resourcePath : string;
    quizData: any = undefined;

    public constructor(param: ExtensionLoaderParameter) {

        // This is the name of the custom slot type that I am overriding for this question
        this.slotType = 'AnswerSlotType';
        this.slotValues = [];  

        this.resourcePath = param.configAccessor.getResourcePath(param.locale);
        console.log("Local resource directory path: " + this.resourcePath);
    }

    // Load the question data from the CSV file
    loadQuestionData() {
      return new Promise<void>((resolve, reject) => {
        // If cached, don't load it again
        if(this.quizData) {
          resolve();
          return;
        }

        this.quizData = {questions: []};

        const quizFile = path.resolve(this.resourcePath, "QuizData.csv");

        fastCsv.parseFile(quizFile, { headers: true })
            .on('error', (error: any) => { console.error(error); reject(error); })
            .on('data', (row: any) => { this.addQuizDataQuestion(row); })
            .on('end', () => { resolve(); });
      });
    }

    addQuizDataQuestion(row : any) {
      this.quizData.questions.push(row);
    }

    /**
     * 
     * @param storyState 
     * @param driver 
     * @param resultHelper 
     */
    async post(param: DriverExtensionParameter) {

        console.log(JSON.stringify(this.quizData));

        const storyState = param.storyState;

        let directive: any = undefined;

        // Clear out any current slots and set new ones
        this.slotValues = [];

        if(storyState) {
          // Fetching the possible answers as set in the story state by the *.abc file.
          const answerA = storyState.answerA;
          const answerB = storyState.answerB;
          const answerC = storyState.answerC;

          if(answerA || answerB || answerC) {
            this.slotValues.push(this.getSlotJson('1', answerA, []));
            this.slotValues.push(this.getSlotJson('2', answerB, []));
            this.slotValues.push(this.getSlotJson('3', answerC, []));
    
            directive = this.getDynamicEntitiesDirective();
    
            if (directive && this.handlerInput) {
              this.handlerInput.responseBuilder.addDirective(directive);
            }  
          }
        }
    }

    // This function, or any like it that you define in an extension implementing "SFBExtension.InstructionExtension" can be called directly
    // from your *.abc file, by putting the function name in your *then section.
    public async fetchQuestionDataFromExtension(param: InstructionExtensionParameter): Promise<void> {
      const storyState = param.storyState;

      // Load the data into this.quizData
      await this.loadQuestionData();

      if(storyState.showId == 1) {

        if(storyState.questionNum >= 1 && storyState.questionNum <= this.quizData.questions.length) { // Note: questionNum starts at "1" instead of "0"

          const questionInfo = this.quizData.questions[storyState.questionNum - 1];

          storyState.questionIntro = questionInfo.IntroText;
          storyState.question = questionInfo.QuestionText;
          storyState.questionAnswer = questionInfo.AnswerText;
          storyState.correctAnswer = questionInfo.CorrectAnswer;
          storyState.answerA = questionInfo.Answer1;
          storyState.answerB = questionInfo.Answer2;
          storyState.answerC = questionInfo.Answer3;
        }
      }

      return;
    }

    async pre(param: DriverExtensionParameter) {
      // Need to do this to setup this.handlerInput to containt our input handler, so that we can later
      // retrieve response builder from this.
      const handlerInput = param.userInputHelper.getHandlerInput();
      if(handlerInput) {
        this.handlerInput = handlerInput;
      }
    }

    private getDynamicEntitiesDirective(): any {

        let replaceEntityDirective = {
            type: 'Dialog.UpdateDynamicEntities',
            updateBehavior: 'REPLACE',
            types: [
              {
                name: this.slotType,
                values: this.slotValues
              }
            ]
          };
  
          return replaceEntityDirective;
    }  

    private getSlotJson(id: string, value: string, synonyms: string[]): any {
      return {
        id: id,
        name: {
          value: value,
          synonyms: synonyms
        }
      };
    }
}


