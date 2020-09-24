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

import {ContentItem} from '../importer/importer';
import {ImportResult} from '../importer/importerEntity';

// Interfaces for use by the rest of this module.
export interface ABCImportPlugin {
    parameters: any;
    
    /**
     * Unique name for the plug-in to identify the format/plug-in
     */
    readonly pluginName: string;
    
    /**
     * This method is called by the importer to convert the source story into a list of Scene objects,
     * which is used to build the imported ABCStoryMetadata
     *
     * @param inputData content of the source story.
     * @return list of Scene objects, which will be used to build the resulting metadata.
     */
    importData(contents : ContentItem[], param?: {[key: string]: any}): Promise<ImportResult>;

    /**
     * Get language version that this import plugin is optimized for.
     */
    getVersion(): number;
}
