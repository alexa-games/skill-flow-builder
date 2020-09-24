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

import {StoryAccessor} from '../story/storyAccessor';
import {Instruction} from '../story/storyMetadata';

interface Address {
    version: number;
    sequence: {
        type: string;
        source: string;
        line: number;
        option?: string;
    }[];
}

/**
 * Story's call stack manager for generating addresses, and accessing instructions in the story based on the address.
 */
export class CallStackUtil {
    readonly PUBLISHED_VERSION: number = 1;

    constructor(private story: StoryAccessor) {
    }

    public getChoiceAddress(originAddress: string, lineNumber: number): string {
        const address = this.deserialize(originAddress);

        address.sequence.push({
            line: lineNumber,
            source: address.sequence[address.sequence.length - 1].source,
            type: "choice"
        });

        return this.serialize(address);
    }

    public getConditionAddress(originAddress: string, lineNumber: number): string {
        const address = this.deserialize(originAddress);

        address.sequence.push({
            line: lineNumber,
            source: address.sequence[address.sequence.length - 1].source,
            type: "condition"
        });

        return this.serialize(address);
    }

    public getSceneAddress(sceneID: string, lineNumber: number): string {
        const address: Address = {
            version: this.PUBLISHED_VERSION,
            sequence: [
                {
                    type: "scene",
                    source: sceneID,
                    line: lineNumber
                }
            ]
        }

        return this.serialize(address);
    }

    public getReturnAddress(originAddress: string, lineNumber: number): string {
        const address = this.deserialize(originAddress);

        address.sequence.push({
            line: lineNumber,
            source: address.sequence[address.sequence.length - 1].source,
            type: "jump"
        });

        return this.serialize(address);
    }

    public getSourceScene(address: string): string {
        if (this.isNewCallStack(address)) {
            const addressStructure = this.deserialize(address);

            return addressStructure.sequence[addressStructure.sequence.length - 1].source;
        } else {
            return address.split(":")[0];
        }
    }

    private isNewCallStack(address: string): boolean {
        try {
            const addressStructure = address.split("@");

            return addressStructure && parseInt(addressStructure[0]) <= this.PUBLISHED_VERSION;
        } catch(err) {
            return false;
        }
    }

    private deserialize(addressString: string): Address {        
        const result: Address = {
            version: this.PUBLISHED_VERSION,
            sequence: [

            ]
        };

        if (this.isNewCallStack(addressString)) {
            const sequencePre = addressString.split("@");

            const version = parseInt(sequencePre[0]);

            result.version = version;
            
            for (let i = 1; i < sequencePre.length; i++) {
                const sequenceProps = sequencePre[i].split("::");

                result.sequence.push({
                    source: sequenceProps[0],
                    type: sequenceProps[1],
                    line: parseInt(sequenceProps[2]),
                    option: sequenceProps[3]
                });
            }
            
            
            result;
        } else {
            result.sequence = [
                {
                    source: addressString.split("::")[0],
                    line: -1,
                    type: "legacy",
                    option: addressString
                }
            ];
        }

        return result;
    }

    private serialize(address: Address): string {
        let serializedString = String(address.version);

        for(let sequenceItem of address.sequence) {
            let sequenceItemSerialized = `@${sequenceItem.source}::${sequenceItem.type}::${sequenceItem.line}::`;
            
            if(sequenceItem.option) {
                sequenceItemSerialized += sequenceItem.option;
            }    
            
            serializedString += sequenceItemSerialized
        }

        return serializedString;
    }
    
    public getInstructions(address: string, storyState: any): Instruction[] {
        const addressStructure = this.deserialize(address);
        let instructions: Instruction[] = [];

        for (let addressItem of addressStructure.sequence) {
            
            switch(addressItem.type) {
            case "scene": {
                const sceneInstructions = this.story.getSceneInstructions(addressItem.source);

                instructions = this.getInstructionSection(addressItem.line, sceneInstructions);
                break;
            }
            case "jump": {
                instructions = this.getInstructionSection(addressItem.line + 1, instructions);

                break;
            }
            case "condition": {
                const section = this.getInstructionSection(addressItem.line, instructions);

                const conditionalInstruction = section[0].parameters.directions;

                instructions = (conditionalInstruction || []).concat(this.getInstructionSection(addressItem.line + 1, instructions));
                break;
            }
            case "choice": {
                const section = this.getInstructionSection(addressItem.line, instructions);

                const choiceInstruction = section[0].parameters.directions;

                instructions = choiceInstruction || [];
                break;
            }
            case "legacy": {
                if (addressItem.option && storyState.system_instruction_mem && storyState.system_instruction_mem[addressItem.option]) {
                    // For backward compatibility, needs to stay
                    instructions = storyState.system_instruction_mem[addressItem.option];
                }
            }
            }
        }

        return instructions;
    }

    public getInstructionSection(lineNumber: number, instructions: Instruction[]): Instruction[] {
        if (lineNumber >= instructions.length) {
            return [];
        } else if (lineNumber > 0) {
            return instructions.slice(lineNumber);
        } else {
            return instructions;
        }
    }

    public callStackExists(state: any) {
        return state.system_call_stack && state.system_call_stack.length > 0;
    }

    public addressInStack(state: any, address: string) {
        return state.system_call_stack && state.system_call_stack.includes(address);
    }
}