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

import { DriverExtension, InstructionExtension, ImporterExtension } from '@alexa-games/sfb-f';
import { SFBRequestHandler } from './AlexaSFBRequestHandler';
import { ConfigAccessor } from '../configAccessor';

import * as path from 'path';
import * as fs from 'fs';

type ExtensionType = DriverExtension|InstructionExtension|ImporterExtension;

export class SFBRequestHandlerFactory {
    static readonly FFMPEG_BIN_NAME = "ffmpeg";

    static create(event: any, context: any, extensions: ExtensionType[], configAccessor: ConfigAccessor, projectDir: string, customRequestHandler?: any): SFBRequestHandler {

        // Because we are generating a request handler, we must be running on a deployed 
        // environment rather than a local development simulation. Set deployed to true
        // so configAccessor can formulate the correct directory structure.
        configAccessor.deployed = true;

        const locale: string = event.request.locale? event.request.locale: "en-US";

        const dynamoDBTalbeName: any = configAccessor.getRequestLocalizedValue("dynamo-db-session-table-name", event);

        const storyMetadata: string = path.resolve(projectDir, "res", event.request.locale, configAccessor.getRequestLocalizedValue("abc-baked-filename", event));
                
        const pollyConfig: any = Object.assign(configAccessor.getRequestLocalizedValue("polly-config", event), {
            s3DomainName: configAccessor.getRequestLocalizedValue("s3-domain-name", event),
            bucketName: configAccessor.getRequestLocalizedValue("s3-bucket-name", event),
            workingDir: path.resolve("/", "tmp"),
            FFMPEGLocation: path.resolve("/", "tmp", SFBRequestHandlerFactory.FFMPEG_BIN_NAME)
        });
        
        this.setupFFMPEGbin(path.resolve(projectDir, SFBRequestHandlerFactory.FFMPEG_BIN_NAME), pollyConfig.workingDir);

        const defaultPollyConfig: any = configAccessor.getRequestLocalizedValue("default-narrator", event);
        
        // If custom type is passed in, then instantiate it instead of the common SFBRequestHandler
        if(!customRequestHandler) {
            customRequestHandler = SFBRequestHandler;
        }

        const sfbHandler = new customRequestHandler({
                locale: locale,
                story: require(storyMetadata),
                pollyVoiceConfig: pollyConfig,
                defaultVoiceConfig: defaultPollyConfig,
                attributeTableName: dynamoDBTalbeName
            },
            extensions,
            configAccessor,
            projectDir);

        return sfbHandler;
    }

    static setupFFMPEGbin(ffmpegSrcPath: string, workingDir: string) {
        if(!fs.existsSync(ffmpegSrcPath)) {
            console.log(`[WARN] Packaged FFMPEG not found in path: ${ffmpegSrcPath}`);
            return;
        }
    
        if(!fs.existsSync(workingDir)) {
            console.log(`[INFO] Initializing audio working directory: ${workingDir}`);
            fs.mkdirSync(workingDir);
        }
    
        if(!fs.existsSync(workingDir)) {
            console.log(`[WARN] Audio working directory initialization failed!`);
            return;
        }
        
        const destPath = path.join(workingDir, SFBRequestHandlerFactory.FFMPEG_BIN_NAME);
        if (fs.existsSync(destPath)) {
            console.log(`[INFO] FFMPEG already exists in the audio working directory: ${workingDir}`);
            return;
        }
    
        // Adding try catch to avoid crashing the editor when repeatedly called (race condition)
        try {
            console.log(`[INFO] Copying FFMPEG binary to audio working directory...`);
            fs.copyFileSync(ffmpegSrcPath, destPath);
    
            fs.chmodSync(destPath, '0700');
        } catch (err) {
            throw err;
        }	
    
        return;
    }
}