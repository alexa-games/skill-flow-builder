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

export interface AudioFileAccessor {
    /**
     * Checkes if the audio exists.
     */
    exists(audioName: string): Promise<boolean>;

    /**
     * Get publically accessible URL of the audio.
     */
    getAudioURL(audioName: string): Promise<string>;

    /**
     * Upload the locally available audio file to publically available URL.
     */
    uploadAudio(audioName: string, workingDirectoryPath: string): Promise<string>;

    /**
     * Download the audio file to local.
     * @param audioName 
     * @param workingDirectoryPath 
     */
    downloadAudio(aduioUrl: string, workingDirectoryPath: string): Promise<void>;
}