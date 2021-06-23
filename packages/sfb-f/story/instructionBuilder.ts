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

import { AudioBlendOption, VisualOptions} from '../driver/driverEntity';
import {Instruction, InstructionType} from '../story/storyMetadata';

export class InstructionBuilder {
    instructions: Instruction[] = [];

    private nestingStack: Instruction[] = [];

    constructor() {
    }

    public startChoice(utterances: string[], narration?: string, saveToHistory: boolean = true) {
        let parameters: any = {
            utterances: utterances,
            saveToHistory: String(saveToHistory),
            lines: 0,
            directions: []
        }

        if (narration) {
            parameters.narration = narration;
        }

        let direction: Instruction = {
            directionType: InstructionType.CHOICE,
            parameters: parameters
        };

        if (this.nestingStack.length > 0) {
            this.nestingStack[this.nestingStack.length - 1].parameters.directions.push(direction);
        } else {
            this.instructions.push(direction);   
        }

        this.nestingStack.push(direction);

        return this;
    }

    public startCondition(conditionString: string) {
        let parameters: any = {
            condition: conditionString,
            lines: 0,
            directions: []
        }

        let direction: Instruction = {
            directionType: InstructionType.CONDITION,
            parameters: parameters
        };

        if (this.nestingStack.length > 0) {
            this.nestingStack[this.nestingStack.length - 1].parameters.directions.push(direction);
        } else {
            this.instructions.push(direction);   
        }

        this.nestingStack.push(direction);

        return this;
    }

    public goTo(targetSceneID: string, targetSceneProperty?: string) {
        let parameters: any = {
            target: targetSceneID,
        }

        if (targetSceneProperty) {
            parameters.targetSceneProperty = targetSceneProperty;
        }

        let direction: Instruction = {
            directionType: InstructionType.GO_TO,
            parameters: parameters
        };

        if (this.nestingStack.length > 0) {
            this.nestingStack[this.nestingStack.length - 1].parameters.directions.push(direction);
        } else {
            this.instructions.push(direction);
        }

        return this;
    }

    public saveAndGoTo(targetSceneID: string, targetSceneProperty?: string) {
        let parameters: any = {
            target: targetSceneID,
        }

        if (targetSceneProperty) {
            parameters.targetSceneProperty = targetSceneProperty;
        }

        let direction: Instruction = {
            directionType: InstructionType.SAVE_AND_GO,
            parameters: parameters
        };

        if (this.nestingStack.length > 0) {
            this.nestingStack[this.nestingStack.length - 1].parameters.directions.push(direction);
        } else {
            this.instructions.push(direction);
        }

        return this;
    }

    public return() {
        let direction: Instruction = {
            directionType: InstructionType.RETURN,
            parameters: {}
        };

        if (this.nestingStack.length > 0) {
            this.nestingStack[this.nestingStack.length - 1].parameters.directions.push(direction);
        } else {
            this.instructions.push(direction);
        }

        return this;
    }

    public pause() {
        let direction: Instruction = {
            directionType: InstructionType.PAUSE,
            parameters: {}
        };

        if (this.nestingStack.length > 0) {
            this.nestingStack[this.nestingStack.length - 1].parameters.directions.push(direction);
        } else {
            this.instructions.push(direction);
        }

        return this;
    }

    public restart() {
        let direction: Instruction = {
            directionType: InstructionType.RESTART,
            parameters: {}
        };

        if (this.nestingStack.length > 0) {
            this.nestingStack[this.nestingStack.length - 1].parameters.directions.push(direction);
        } else {
            this.instructions.push(direction);
        }

        return this;
    }

    public repeat() {
        let direction: Instruction = {
            directionType: InstructionType.REPEAT,
            parameters: {}
        };

        if (this.nestingStack.length > 0) {
            this.nestingStack[this.nestingStack.length - 1].parameters.directions.push(direction);
        } else {
            this.instructions.push(direction);
        }

        return this;
    }

    public repeatReprompt() {
        let direction: Instruction = {
            directionType: InstructionType.REPEAT_REPROMPT,
            parameters: {}
        };

        if (this.nestingStack.length > 0) {
            this.nestingStack[this.nestingStack.length - 1].parameters.directions.push(direction);
        } else {
            this.instructions.push(direction);
        }

        return this;
    }

    public goBack(backNumber: number) {
        let direction: Instruction = {
            directionType: InstructionType.BACK,
            parameters: {
                count: backNumber
            }
        };

        if (this.nestingStack.length > 0) {
            this.nestingStack[this.nestingStack.length - 1].parameters.directions.push(direction);
        } else {
            this.instructions.push(direction);
        }

        return this;
    }

    public setReprompt(repromptSSML: string) {
        let direction: Instruction = {
            directionType: InstructionType.REPROMPT,
            parameters: {
                message: repromptSSML,
            }
        };

        if (this.nestingStack.length > 0) {
            this.nestingStack[this.nestingStack.length - 1].parameters.directions.push(direction);
        } else {
            this.instructions.push(direction);
        }

        return this;
    }

    public setBackgroundMusic(audioURL: string, delayMs?: string, volume?: string, blendOption?: AudioBlendOption) {
        let param: any = {
            audioURL: audioURL
        }

        if (delayMs) param.delayMs = delayMs;
        if (volume) param.volume = volume;
        if (blendOption) param.blend = blendOption;

        let direction: Instruction = {
            directionType: InstructionType.BGM,
            parameters: param
        };
        
        if (this.nestingStack.length > 0) {
            if (!this.nestingStack[this.nestingStack.length - 1].parameters.directions) {
                this.nestingStack[this.nestingStack.length - 1].parameters.directions = [];
        }

            this.nestingStack[this.nestingStack.length - 1].parameters.directions.push(direction);
        } else {
            this.instructions.push(direction);    
        }
    }

    public setVisuals(visualOptions : VisualOptions) {

        let params : {[key: string]: string;}= {};
        Object.keys(visualOptions).forEach(function(key) {
            params[ key ] = visualOptions[key];
        }); 

        this.instructions.push({
            directionType: InstructionType.VISUALS,
            parameters: params
        });
        
        return this;
    }

    public increaseVariable(variableName: string, increaseBy: string) {
        let direction: Instruction = {
            directionType: InstructionType.INCREASE,
            parameters: {
                variableName: variableName,
                variableValue: increaseBy
            }
        };

        if (this.nestingStack.length > 0) {
            this.nestingStack[this.nestingStack.length - 1].parameters.directions.push(direction);
        } else {
            this.instructions.push(direction);    
        }

        return this;
    }

    public multiplyVariable(variableName: string, multiplyBy: string) {
        let direction: Instruction = {
            directionType: InstructionType.MULTIPLY,
            parameters: {
                variableName: variableName,
                variableValue: multiplyBy
            }
        };

        if (this.nestingStack.length > 0) {
            this.nestingStack[this.nestingStack.length - 1].parameters.directions.push(direction);
        } else {
            this.instructions.push(direction);    
        }

        return this;
    }

    public divideVariable(variableName: string, divideBy: string) {
        let direction: Instruction = {
            directionType: InstructionType.DIVIDE,
            parameters: {
                variableName: variableName,
                variableValue: divideBy
            }
        };

        if (this.nestingStack.length > 0) {
            this.nestingStack[this.nestingStack.length - 1].parameters.directions.push(direction);
        } else {
            this.instructions.push(direction);    
        }

        return this;
    }

    public modVariable(variableName: string, modBy: string) {
        let direction: Instruction = {
            directionType: InstructionType.MODULUS,
            parameters: {
                variableName: variableName,
                variableValue: modBy
            }
        };

        if (this.nestingStack.length > 0) {
            this.nestingStack[this.nestingStack.length - 1].parameters.directions.push(direction);
        } else {
            this.instructions.push(direction);    
        }

        return this;
    }

    public reduceVariable(variableName: string, reduceBy: string) {
        let direction: Instruction = {
            directionType: InstructionType.REDUCE,
            parameters: {
                variableName: variableName,
                variableValue: reduceBy
            }
        };

        if (this.nestingStack.length > 0) {
            this.nestingStack[this.nestingStack.length - 1].parameters.directions.push(direction);
        } else {
            this.instructions.push(direction);    
        }

        return this;
    }

    public setVariable(variableName: string, value: string) {
        let direction: Instruction = {
            directionType: InstructionType.SET,
            parameters: {
                variableName: variableName,
                variableValue: value
            }
        };

        if (this.nestingStack.length > 0) {
            this.nestingStack[this.nestingStack.length - 1].parameters.directions.push(direction);
        } else {
            this.instructions.push(direction);    
        }
        
        return this;
    }

    public setSlot(variableName: string, slotType: string) {
        let direction: Instruction = {
            directionType: InstructionType.SLOT,
            parameters: {
                variableName: variableName,
                variableType: slotType
            }
        };

        if (this.nestingStack.length > 0) {
            this.nestingStack[this.nestingStack.length - 1].parameters.directions.push(direction);
        } else {
            this.instructions.push(direction);    
        }
        
        return this;
    }

    public flag(variableName: string) {
        let direction: Instruction = {
            directionType: InstructionType.FLAG,
            parameters: {
                variableName: variableName
            }
        };

        if (this.nestingStack.length > 0) {
            this.nestingStack[this.nestingStack.length - 1].parameters.directions.push(direction);
        } else {
            this.instructions.push(direction);    
        }

        return this;
    }

    public unflag(variableName: string) {
        let direction: Instruction = {
            directionType: InstructionType.UNFLAG,
            parameters: {
                variableName: variableName
            }
        };

        if (this.nestingStack.length > 0) {
            this.nestingStack[this.nestingStack.length - 1].parameters.directions.push(direction);
        } else {
            this.instructions.push(direction);    
        }

        return this;
    }

    public clearVariable(variableName: string) {
        let direction: Instruction = {
            directionType: InstructionType.CLEAR,
            parameters: {
                variableName: variableName
            }
        };

        if (this.nestingStack.length > 0) {
            this.nestingStack[this.nestingStack.length - 1].parameters.directions.push(direction);
        } else {
            this.instructions.push(direction);    
        }

        return this;
    }

    public setRecap(message: string) {
        let direction: Instruction = {
            directionType: InstructionType.RECAP,
            parameters: {
                message: message,
            }
        };

        if (this.nestingStack.length > 0) {
            this.nestingStack[this.nestingStack.length - 1].parameters.directions.push(direction);
        } else {
            this.instructions.push(direction);    
        }

        return this;
    }

    public addToInventory(variableName: string, item: string) {
        let param: any = {
            variableName: variableName,
            itemName: item,
        }

        let direction: Instruction = {
            directionType: InstructionType.ADD_TO_INVENTORY,
            parameters: param
        };

        if (this.nestingStack.length > 0) {
            this.nestingStack[this.nestingStack.length - 1].parameters.directions.push(direction);
        } else {
            this.instructions.push(direction);    
        }

        return this;
    }

    public addItem(variableName: string, item: string, listSizeLimit?: number) {
        let param: any = {
            variableName: variableName,
            itemName: item,
        }

        if (listSizeLimit) {
            param.size = String(listSizeLimit);
        }

        let direction: Instruction = {
            directionType: InstructionType.ADD_ITEM,
            parameters: param
        };

        if (this.nestingStack.length > 0) {
            this.nestingStack[this.nestingStack.length - 1].parameters.directions.push(direction);
        } else {
            this.instructions.push(direction);    
        }
        
        return this;
    }

    public removeItem(variableName: string, item: string) {
        let direction: Instruction = {
            directionType: InstructionType.REMOVE_ITEM,
            parameters: {
                variableName: variableName,
                itemName: item
            }
        };

        if (this.nestingStack.length > 0) {
            this.nestingStack[this.nestingStack.length - 1].parameters.directions.push(direction);
        } else {
            this.instructions.push(direction);    
        }

        return this;
    }

    public removeFirstItem(listName: string) {
        let direction: Instruction = {
            directionType: InstructionType.REMOVE_FIRST,
            parameters: {
                variableName: listName
            }
        };

        if (this.nestingStack.length > 0) {
            this.nestingStack[this.nestingStack.length - 1].parameters.directions.push(direction);
        } else {
            this.instructions.push(direction);    
        }
        
        return this;
    }
    
    public removeLastItem(listName: string) {
        let direction: Instruction = {
            directionType: InstructionType.REMOVE_LAST,
            parameters: {
                variableName: listName
            }
        };

        if (this.nestingStack.length > 0) {
            this.nestingStack[this.nestingStack.length - 1].parameters.directions.push(direction);
        } else {
            this.instructions.push(direction);    
        }

        return this;
    }

    public rollDice(diceString: string) {
        let direction: Instruction = {
            directionType: InstructionType.ROLL,
            parameters: {
                diceString: diceString
            }
        };

        if (this.nestingStack.length > 0) {
            this.nestingStack[this.nestingStack.length - 1].parameters.directions.push(direction);
        } else {
            this.instructions.push(direction);    
        }

        return this;
    }

    public markEnding() {
        let direction: Instruction = {
            directionType: InstructionType.END,
            parameters: {}
        };

        if (this.nestingStack.length > 0) {
            this.nestingStack[this.nestingStack.length - 1].parameters.directions.push(direction);
        } else {
            this.instructions.push(direction);    
        }
        return this;
    }

    public closeChoice() {
        if (this.nestingStack.length > 0) {
            const closingIndex = this.nestingStack.length - 1;

            const previousIndex = this.nestingStack.length - 2;

            this.nestingStack[closingIndex].parameters.lines += this.nestingStack[closingIndex].parameters.directions.length;

            if (this.nestingStack[previousIndex]) {
                this.nestingStack[previousIndex].parameters.lines += this.nestingStack[closingIndex].parameters.lines;
            }

            this.nestingStack.splice(closingIndex, 1);
        }

        return this;
    }

    public closeCondition() {
        if (this.nestingStack.length > 0) {
            const closingIndex = this.nestingStack.length - 1;

            const previousIndex = this.nestingStack.length - 2;

            this.nestingStack[closingIndex].parameters.lines += this.nestingStack[closingIndex].parameters.directions.length;

            if (this.nestingStack[previousIndex]) {
                this.nestingStack[previousIndex].parameters.lines += this.nestingStack[closingIndex].parameters.lines;
            }

            this.nestingStack.splice(closingIndex, 1);
        }

        return this;
    }

    /**
     * @deprecated Use addInstruction() instead
     */
    public addSceneDirection(direction: Instruction) {
        if (this.nestingStack.length > 0) {
            this.nestingStack[this.nestingStack.length - 1].parameters.directions.push(direction);
        } else {
        this.instructions.push(JSON.parse(JSON.stringify(direction)));
        }
        return this;
    }

    public addInstruction(direction: Instruction) {
        if (this.nestingStack.length > 0) {
            this.nestingStack[this.nestingStack.length - 1].parameters.directions.push(direction);
        } else {
        this.instructions.push(JSON.parse(JSON.stringify(direction)));
        }
        return this;
    }

    public customDirection(customDirectionName: string, customParameters: {[key:string]: string} = {}) {
        let direction: Instruction = {
            directionType: InstructionType.CUSTOM,
            parameters: Object.assign({
                customName: customDirectionName
            }, customParameters)
        };

        if (this.nestingStack.length > 0) {
            this.nestingStack[this.nestingStack.length - 1].parameters.directions.push(direction);
        } else {
            this.instructions.push(direction);    
        }

        return this;
    }

    public getCurrentEpochTime() {
        let direction: Instruction = {
            directionType: InstructionType.GET_TIME,
            parameters: {}
        };

        if (this.nestingStack.length > 0) {
            this.nestingStack[this.nestingStack.length - 1].parameters.directions.push(direction);
        } else {
            this.instructions.push(direction);    
        }

        return this;
    }
    
    public setBookmark(bookmarkName: string, sceneName?: string) {
        let direction: Instruction = {
            directionType: InstructionType.BOOKMARK,
            parameters: {
                variableName: bookmarkName,
                variableValue: sceneName
            }
        };

        if (this.nestingStack.length > 0) {
            this.nestingStack[this.nestingStack.length - 1].parameters.directions.push(direction);
        } else {
            this.instructions.push(direction);    
        }

        return this;
    }

    public build() {
        return this.instructions;
    }
}