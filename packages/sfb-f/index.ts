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

/*
 SFB-f (Alexa Skill Flow Builder Framework)
 
 Collection of utility and driver functionality for Alexa Branching Content Framework.
*/
import  * as SFBExtensions from './extensions/SFBExtension';

export { SFBDriver } from './driver/driver';
export { SFBImporter, ImportOption } from './importer/importer';
export { SFBExtensions as SFBExtension };

export { StoryMetadata, InstructionType, Instruction, Scene, SceneVariation } from './story/storyMetadata';
export { InstructionBuilder } from './story/instructionBuilder';
export { StoryStateHelper } from './driver/storyStateHelper';
export { UserInput, Slot, VisualOptions, Choice, AudioBlendOption, BuiltInUserInput } from './driver/driverEntity';
export { ImportError, ImportErrorLine } from './importer/importerEntity';
export { PlayStage } from './driver/PlayStage';
export { StoryAccessor } from './story/storyAccessor';
export { ContentItem } from './importer/importer';
export { SourceContentHelper } from './importPlugins/sourceContentHelper';
export { StoryMetadataHelper } from './importPlugins/storyMetadataHelper';
export { UserInputHelper } from './importPlugins/userInputHelper';
export { AudioItemUtil } from './driver/AudioItemUtil';

export { GlobalDirectionsExtension, DriverExtension, DriverExtensionParameter, InstructionExtension, ImporterExtension, InstructionExtensionParameter } from './extensions/SFBExtension';
export { ABCImportPlugin as SFBImporterPlugin } from './importPlugins/importerPlugin';
export { DefaultFormatImportPlugin } from './importPlugins/DefaultFormatImportPlugin';
export { Segmenter, SegmentType, Segment, SegmenterBuilder } from './transformers/segmenter';
export { LanguageStrings } from './extensions/coreExtensions/LanguageStrings';
export { StoryFeatureFinder } from './importPlugins/storyFeatureFinder';
export { StoryBlockRange, StoryBlockPoint } from './importPlugins/storyBlockRange';

export { SFBContentTester } from './test/SFBContentTester';
export { 
    /**
     * @deprecated use new naming convention 'SceneDirection' is renamed to 'Instruction'
     */
    InstructionType as SceneDirectionType,

    /**
     * @deprecated use new naming convention 'SceneDirection' is renamed to 'Instruction'
     */
    Instruction as SceneDirection
} from './story/storyMetadata';

export { 
    /**
     * @deprecated use new naming convention 'SceneDirection' is renamed to 'Instruction'
     */
    InstructionBuilder as SceneDirectionBuilder
} from './story/instructionBuilder';

export {
    /**
     * @deprecated use [[SFBExtension]]
     */
    SFBExtensions
};

export {
    /**
     * @deprecated use [[SFBExtension]]
     */
    SFBExtensions as ABCExtension
};

export { 
    /**
     * @deprecated Use [[SFBImporterPlugin]]
     */
    ABCImportPlugin 
} from './importPlugins/importerPlugin';
