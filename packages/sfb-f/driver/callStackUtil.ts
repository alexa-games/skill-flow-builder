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
import {Instruction, InstructionType} from '../story/storyMetadata';

interface Address {
    version: number;
    sequence: {
        type: string;
        source: string;
        variation: number;
        line: number;
        option?: string;
    }[];
}

/**
 * Story's call stack manager for generating addresses, and accessing instructions in the story based on the address.
 */
export class CallStackUtil {
    readonly PUBLISHED_VERSION: number = 2;

    constructor(private story: StoryAccessor) {
    }

    public getSceneAddress(sceneID: string, variationIndex: number, lineNumber: number): string {
        const address: Address = {
            version: this.PUBLISHED_VERSION,
            sequence: [
                {
                    type: "scene",
                    source: sceneID,
                    variation: variationIndex,
                    line: lineNumber
                }
            ]
        }

        return this.serialize(address);
    }

    public getUpdatedAddress(addressString: string, additionalLine: number): string {
        const address: Address = this.deserialize(addressString);

        address.sequence[0].line += additionalLine;

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

    public callStackExists(state: any) {
        return state.system_call_stack && state.system_call_stack.length > 0;
    }

    public addressInStack(state: any, address: string) {
        return state.system_call_stack && state.system_call_stack.includes(address);
    }

    public getDestination(address: string): {
        scene: string,
        i: number,
        line: number
    } {
        const addressStructure = this.deserialize(address);

        return {
            scene: addressStructure.sequence[0].source,
            i: addressStructure.sequence[0].variation,
            line: addressStructure.sequence[0].line
        };
    }

    public getInstructions(address: string, storyState: any): Instruction[] {
        const addressStructure = this.deserialize(address);
        let instructions: Instruction[] = [];

        for (let addressItem of addressStructure.sequence) {

            switch(addressItem.type) {
            case "scene": {
                const scene = this.story.getSceneByID(addressItem.source);
                const variation = addressItem.variation || 0;

                if (addressStructure.version === 1) {
                    instructions = this.getInstructionSection(addressItem.line,
                        scene.contents[variation].sceneDirections || []);
                } else {
                    instructions = this.sliceInstructions(addressItem.line,
                        scene.contents[variation].sceneDirections || []);
                }

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

    public updateAddressVersion(address: string): string {
        const addressStructure = this.deserialize(address);

        if (addressStructure.version === 1) {
            const variation = 0;
            const source = addressStructure.sequence[0].source;
            let line = 0;
            let instructions: Instruction[] = [];

            for (const addressItem of addressStructure.sequence) {
                switch(addressItem.type) {
                    case "scene": {
                        const scene = this.story.getSceneByID(addressItem.source);
                        const variation = addressItem.variation || 0;

                        line += addressItem.line;

                        instructions = this.getInstructionSection(addressItem.line,
                            scene.contents[variation].sceneDirections || []);

                        break;
                    }
                    case "jump": {
                        line += addressItem.line + 1;
                        instructions = this.getInstructionSection(addressItem.line + 1, instructions);

                        break;
                    }
                    case "condition": {
                        line += addressItem.line + 1;

                        const section = this.getInstructionSection(addressItem.line, instructions);
                        const conditionalInstruction = section[0].parameters.directions;

                        instructions = (conditionalInstruction || []).concat(this.getInstructionSection(addressItem.line + 1, instructions));

                        break;
                    }
                    case "choice": {
                        line += addressItem.line + 1;

                        const section = this.getInstructionSection(addressItem.line, instructions);
                        const choiceInstruction = section[0].parameters.directions;

                        instructions = choiceInstruction || [];

                        break;
                    }
                }
            }

            addressStructure.version = this.PUBLISHED_VERSION;
            addressStructure.sequence = [{
                type: "scene",
                source: source,
                variation: variation,
                line: line
            }];

            return this.serialize(addressStructure);
        } else {
            return address;
        }
    }

    private getInstructionSection(lineNumber: number, instructions: Instruction[]): Instruction[] {
        if (lineNumber >= instructions.length) {
            return [];
        } else if (lineNumber > 0) {
            return instructions.slice(lineNumber);
        } else {
            return instructions;
        }
    }

    private sliceInstructions(from: number, instructions: Instruction[]): Instruction[] {
        let lineCount = 0;

        let instructionGroup: Instruction[] = JSON.parse(JSON.stringify(instructions));

        while(instructionGroup.length > 0 && lineCount < from) {
            const observing = instructionGroup.splice(0, 1)[0];

            if (observing.directionType === InstructionType.CHOICE) {
                const remainingLine = from - lineCount;

                if (remainingLine > observing.parameters.directions.length) {
                    instructionGroup = observing.parameters.directions.concat(instructionGroup);
                } else {
                    instructionGroup = observing.parameters.directions;
                }
            } else if (observing.directionType === InstructionType.CONDITION) {
                instructionGroup = observing.parameters.directions.concat(instructionGroup);
            }

            lineCount++;
        }

        return instructionGroup;
    }

    private isNewCallStack(address: string): boolean {
        try {
            const addressStructure = address.split("@");

            return addressStructure && parseInt(addressStructure[0]) <= this.PUBLISHED_VERSION;
        } catch(err) {
            return false;
        }
    }

    public deserialize(addressString: string): Address {
        const result: Address = {
            version: this.PUBLISHED_VERSION,
            sequence: [

            ]
        };

        if (this.isNewCallStack(addressString)) {
            const sequencePre = addressString.split("@");

            const version = parseInt(sequencePre[0]);
            result.version = version;

            if (version == 1) {
                for (let i = 1; i < sequencePre.length; i++) {
                    const sequenceProps = sequencePre[i].split("::");

                    result.sequence.push({
                        type: sequenceProps[1],
                        source: sequenceProps[0],
                        variation: 0,
                        line: parseInt(sequenceProps[2]),
                        option: sequenceProps[3]
                    });
                }
            } else {
                const sequenceProps = sequencePre[1].split("::");
                result.sequence.push({
                    type: "scene",
                    source: sequenceProps[0],
                    variation: parseInt(sequenceProps[1]),
                    line: parseInt(sequenceProps[2])
                });
            }
        } else {
            result.sequence = [
                {
                    type: "legacy",
                    source: addressString.split("::")[0],
                    variation: 0,
                    line: -1,
                    option: addressString
                }
            ];
        }

        return result;
    }

    public serialize(address: Address): string {
        let serializedString = String(address.version);

        const sequenceItem = address.sequence[0];
        const sequenceItemSerialized = `@${sequenceItem.source}::${sequenceItem.variation}::${sequenceItem.line}`;
        serializedString += sequenceItemSerialized;

        return serializedString;
    }
}