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
const localFileUtils = require('./fs');

// getContentPath
function getContentPath(location) {
  // Handle fallback from new structure to old structure if not found
  let contentDir = path.resolve(location, 'content');
  if (!fs.existsSync(contentDir)) {
    contentDir = location;
  }

  return contentDir;
}

// getResourcesPath
function getResourcesPath(location, locale) {
  // Set default locale if not set
  const localeToUse = locale || 'en-US';

  // Handle fallback from new structure to old structure if not found
  const resourceDir = path.resolve(location, 'content', localeToUse, 'resources');

  // If directory does not exist, create it, and also copy over the files from the default en-US locale
  if (!fs.existsSync(resourceDir)) {
    fs.mkdirSync(path.resolve(location, 'content', localeToUse));

    // Now do a recursive copy from content/en-US to content/<new locale>
    localFileUtils.recursiveCopy(path.resolve(location, 'content', 'en-US', '*'), path.resolve(location, 'content', localeToUse));
  }

  return resourceDir;
}

module.exports = {
  getContentPath,
  getResourcesPath
};
