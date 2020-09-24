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

define('ace/snippets/abc', ['require', 'exports', 'module'], (
  require,
  exports,
  module
) => {
  exports.snippetText =
    '\n\
  snippet zupfnoter.print\n\
    %%%%hn.print {"startpos": ${1:pos_y}, "t":"${2:title}", "v":[${3:voices}], "s":[[${4:syncvoices}1,2]], "f":[${5:flowlines}],  "sf":[${6:subflowlines}], "j":[${7:jumplines}]}\n\
  \n\
  snippet zupfnoter.note\n\
    %%%%hn.note {"pos": [${1:pos_x},${2:pos_y}], "text": "${3:text}", "style": "${4:style}"}\n\
  \n\
  snippet zupfnoter.annotation\n\
    %%%%hn.annotation {"id": "${1:id}", "pos": [${2:pos}], "text": "${3:text}"}\n\
  \n\
  snippet zupfnoter.lyrics\n\
    %%%%hn.lyrics {"pos": [${1:x_pos},${2:y_pos}]}\n\
  \n\
  snippet zupfnoter.legend\n\
    %%%%hn.legend {"pos": [${1:x_pos},${2:y_pos}]}\n\
  \n\
  \n\
  \n\
  snippet zupfnoter.target\n\
    "^:${1:target}"\n\
  \n\
  snippet zupfnoter.goto\n\
    "^@${1:target}@${2:distance}"\n\
  \n\
  snippet zupfnoter.annotationref\n\
    "^#${1:target}"\n\
  \n\
  snippet zupfnoter.annotation\n\
    "^!${1:text}@${2:x_offset},${3:y_offset}"\n\
  \n\
  \n\
  ';
  exports.scope = 'abc';
});
(function() {
  window.require(['ace/snippets/abc'], m => {
    if (typeof module === 'object' && typeof exports === 'object' && module) {
      module.exports = m;
    }
  });
})();
