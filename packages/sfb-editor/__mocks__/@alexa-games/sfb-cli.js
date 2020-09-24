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

export const __mockBuildImportCommand__ = jest.fn().mockImplementation(_ => { return new __MockImportCommand__(); });

export const __mockBuildBakeCommand__ = jest.fn().mockImplementation(_ => { return new __MockBakeCommand__(); });

export const __mockBuildStageCommand__ = jest.fn().mockImplementation(_ => { return new __MockStageCommand__(); });

export const __mockBuildDeployCommand__ = jest.fn().mockImplementation(_ => { return new __MockDeployCommand__(); });

export const __mockBuildUploadResourcesCommand__ = jest.fn().mockImplementation(_ => { return new __MockUploadResourcesCommand__(); });

export const CommandFactory = jest.fn().mockImplementation(() => {
  return {
    buildImportCommand: __mockBuildImportCommand__,
    buildBakeCommand: __mockBuildBakeCommand__,
    buildStageCommand: __mockBuildStageCommand__,
    buildDeployCommand: __mockBuildDeployCommand__,
    buildUploadResourcesCommand: __mockBuildUploadResourcesCommand__
  };
});

export const __mockImportCommandRun__ = jest.fn();

export const __MockImportCommand__ = jest.fn().mockImplementation(() => {
  return {
    run: __mockImportCommandRun__
  };
});

export const __mockBakeCommandRun__ = jest.fn();

export const __MockBakeCommand__ = jest.fn().mockImplementation(() => {
  return {
    run: __mockBakeCommandRun__
  };
});

export const __mockStageCommandRun__ = jest.fn();

export const __MockStageCommand__ = jest.fn().mockImplementation(() => {
  return {
    run: __mockStageCommandRun__
  };
});

export const __mockDeployCommandRun__ = jest.fn();

export const __MockDeployCommand__ = jest.fn().mockImplementation(() => {
  return {
    run: __mockDeployCommandRun__
  };
});

export const __mockUploadResourcesCommandRun__ = jest.fn();

export const __MockUploadResourcesCommand__ = jest.fn().mockImplementation(() => {
  return {
    run: __mockUploadResourcesCommandRun__
  };
});
