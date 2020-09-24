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

export function getRegex(type) {
  switch (type) {
    case 'say':
      return /[\s]*\*[\s]*say\n([\s\S]+?)(?=\n[\s]*\*|$)/gi;
    case 'recap':
      return /[\s]*\*[\s]*recap\n([\s\S]+?)(?=\n[\s]*\*|$)/gi;
    case 'reprompt':
      return /[\s]*\*[\s]*reprompt\n([\s\S]+?)(?=\n[\s]*\*|$)/gi;
    case 'then':
      return /[\s]*\*[\s]*then\n([\s\S]+?)(?=\n[\s]*\*|$)/gi;
    case 'scene':
      return /(?:(?:\n[ \t]*?)|^)\@[\s]*([^\n]*?)\n([\s\S]+?)(?=\n[\s]*\@|$)/gi;
    default:
      return null;
  }
}
