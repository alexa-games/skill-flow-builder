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

define("ace/mode/abc_highlight_rules",["require","exports","module","ace/lib/oop","ace/mode/text_highlight_rules"], function (require, exports, module) {
  "use strict";

  var oop = require("../lib/oop");
  var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;

  var ABCHighlightRules = function () {
    this.$rules = {
      start: [
        {
          include: "#comment"
        },
        {
          include: "#scene"
        }
      ],
      "#scene": [
        {
          token: [
            "text",
            "entity.name.class",
            "text",
            "entity.name.class"
          ],
          regex: /^([ \t]*?)(@)([ \t]*)([\S].*?)$/,
          push: [
            {
              regex: /^(?=[ \t]*?@)/,
              next: "pop"
            },
            {
              include: "#directionSection"
            },
            {
              token: [
                "entity.other.attribute-name"
              ],
              regex: /\*(say|reprompt|recap|show)[\s]*$/,
              push: [
                {
                  regex: /(?=^[\s]*(?:\*|@))/,
                  next: "pop"
                },
                {
                  include: "#comment"
                },
                {
                  token: [
                    "keyword.operator",
                    "variable",
                    "keyword.operator"
                  ],
                  regex: /({)(.*?)(})/
                },
                {
                  token: [
                    "keyword.operator",
                    "variable",
                    "keyword.operator"
                  ],
                  regex: /(<)(.*?)(>)/
                },
                {
                  token: [
                    "keyword.operator",
                    "variable",
                    "keyword.operator"
                  ],
                  regex: /(\[)(.*?)(\])/
                },
                {
                  token: "keyword.operator",
                  regex: /\|\|/
                },
                {
                  token: "string",
                  regex: /.+?/
                }
              ]
            }
          ]
        }
      ],
      "#directionSection": [
        {
          token: "entity.name.function",
          regex: /\*do|\*then/,
          push: [
            {
              token: "text",
              regex: /(?=^[\s]*(?:\*|@))/,
              next: "pop"
            },
            {
              include: "#comment"
            },
            {
              include: "#brackets"
            },
            {
              include: "#directionKeywords"
            }
          ]
        }
      ],
      "#directionKeywords": [
        {
          token: ["text", "keyword.control", "text"],
          regex: /^([\s]*)(hear)([\s]+)/,
          push: [
            {
              token: "text",
              regex: /(?=,[\s]*$|\.[\s]*$|{$|$)/,
              next: "pop"
            }, {
              token: ["string", "text"],
              regex: /([^,{}]+?)(,?)/
            }
          ]
        },
        {
          token: ["text", "keyword.control", "text"],
          regex: /^([\s]*)(if)([\s]+)/,
          push: [
            {
              token: "text",
              regex: /(?=,[\s]*$|\.[\s]*$|{$|$)/,
              next: "pop"
            }, {
              token: ["text", "keyword.operator", "text"],
              regex: /([\s]+?)(>=|<=|<|>||==|is|and|or|&&|\|\|greater than|larger than|bigger than|smaller than|less than|more than|equals to|equal to)([,]?[\s]+?)/
            }, {
              token: "string",
              regex: /'[^{}]*?'/
            }, {
              token: "keyword.operator",
              regex: /[\d]+?/
            }, {
              token: "variable",
              regex: /[^{}\s]+?/
            }
          ]
        },
        {
          token: [
            "text",
            "keyword.control",
            "text",
            "entity.name.class"
          ],
          regex: /^([\s]*)(go to)([\s]+)(?:([\s\S]*?)(?=$))?/
        },
        {
          token: [
            "text",
            "keyword.control",
            "text",
            "entity.name.class"
          ],
          regex: /^([\s]*)(->)([\s]*)(?:([\s\S]*?)(?=$))?/
        },
        {
          token: "keyword.function",
          regex: /^[\s]*time[\s]*(?=,[\s]*$|\.[\s]*$|$)/
        },
        {
          token: [
            "text",
            "entity.name.function",
            "text",
            "string"
          ],
          regex: /^([\s]*)(roll)([\s]+)(?:([\S\s]+?)(?=$))?/
        },
        {
          token: [
            "text",
            "entity.name.function",
            "text",
            "variable"
          ],
          regex: /^([\s]*)(flag|unflag|clear|pop|dequeue)([\s]+)(?:([\S]+?)(?=[\s]*$))?/
        },
        {
          token: [
            "text",
            "entity.name.function",
            "text",
            "variable",
            "text",
            "keyword.operator",
            "text",
            "constant.numeric",
            "string",
            "variable"
          ],
          regex: /^([\s]*)(set)([\s]+)(?:([\S]+?)([\s]+)(?:(to|as)([\s]+)(?:([\d]+?)|('[\S\s]+?'?)|([\S]+?))(?=[\s]*$))?)?/
        },
        {
          token: [
            "text",
            "entity.name.function",
            "text",
            "variable",
            "text",
            "keyword.operator",
            "text",
            "string",
            "variable"
          ],
          regex: /^([\s]*)(slot)([\s]+)(?:([\S]+?)([\s]+)(?:(to|as)([\s]+)(?:('[\S\s]+?'?)|([\S]+?))(?=,[\s]*$|\.[\s]*$|$))?)?/
        },
        {
          token: [
            "text",
            "entity.name.function",
            "text",
            "variable",
            "text",
            "keyword.operator",
            "text",
            "keyword.operator",
            "string",
            "variable"
          ],
          regex: /^([\s]*)(reduce|increase|decrease)([\s]+)(?:([\S]+?)([\s]+)(?:(by)([\s]+)(?:([\d]+?)|('[\S\s]+?'?)|([\S]+?))(?=,[\s]*$|\.[\s]*$|$))?)?/
        },
        {
          token: [
            "text",
            "entity.name.function",
            "text",
            "keyword.operator",
            "string",
            "variable",
            "text",
            "keyword.operator",
            "text",
            "variable"
          ],
          regex: /^([\s]*)(stack)([\s]+)(?:(?:([\d]+?)|('[\S\s]+?'?)|([\S]+?))([\s]+)(?:(on)([\s]+)([\S]+?)(?=,[\s]*$|\.[\s]*$|$))?)?/
        },
        {
          token: [
            "text",
            "entity.name.function",
            "text",
            "keyword.operator",
            "string",
            "variable",
            "text",
            "keyword.operator",
            "text",
            "variable"
          ],
          regex: /^([\s]*)(put)([\s]+)(?:(?:([\d]+?)|('[\S\s]+?'?)|([\S]+?))([\s]+)(?:(into)([\s]+)([\S]+?)(?=,[\s]*$|\.[\s]*$|$))?)?/
        },
        {
          token: [
            "text",
            "entity.name.function",
            "text",
            "keyword.operator",
            "string",
            "variable",
            "text",
            "keyword.operator",
            "text",
            "variable"
          ],
          regex: /^([\s]*)(enqueue|put)([\s]+)(?:(?:([\d]+?)|('[\S\s]+?'?)|([\S]+?))([\s]+)(?:(into)([\s]+)([\S]+?)(?=[\s]*$))?)?/
        },
        {
          token: [
            "text",
            "entity.name.function",
            "text",
            "keyword.operator",
            "string",
            "variable",
            "text",
            "keyword.operator",
            "text",
            "variable"
          ],
          regex: /^([\s]*)(remove)([\s]+)(?:(?:([\d]+?)|('[\S\s]+?'?)|([\S]+?))([\s]+)(?:(from)([\s]+)([\S]+?)(?=[\s]*$))?)?/
        },
        {
          token: [
            "text",
            "entity.name.class",
            "text",
            "entity.name.class",
            "text"
          ],
          regex: /^([ \t]*?)(>>)([ \t]*?)(end|restart|resume|pause|repeat|back|reprompt|END|RESTART|RESUME|PAUSE|REPEAT|BACK|REPROMPT)([\s\S]*?$)/
        },
        {
          token: [
            "text",
            "entity.name.function",
            "text"
          ],
          regex: /^([ \t]*?)([\S]+?)([ \t]*?)(?=$)/,
        },
        {
          token: [
            "text",
            "entity.name.function"
          ],
          regex: /^([ \t]*?)([\S]+)/,
          push:[
            {
              token: "text",
              regex: /(?=$)/,
              next: "pop"
            },
            {
              regex: /([\S]+?)([\s]*?)(?:(=)([\s]*?)(?:('[\s\S]+?'))?)?/,
              token: [
                "variable",
                "text",
                "keyword.operator",
                "text",
                "string"
              ]
            }
          ]
        }
      ],
      "#brackets": [
        {
          token: "keyword.control",
          regex: /{|}/
        }
      ],
      "#comment": [
        {
          token: "comment.line",
          regex: /^[ \t]*?\/\/[ \t\S]*?$/
        }
      ]
    };

    this.normalizeRules();
  };

  ABCHighlightRules.metaData = {
    fileTypes: ['abc'],
    name: 'ABC',
    scopeName: 'text.abcnotation'
  };


  oop.inherits(ABCHighlightRules, TextHighlightRules);

  exports.ABCHighlightRules = ABCHighlightRules;
});


define("ace/mode/abc",["require","exports","module","ace/lib/oop","ace/mode/text","ace/mode/abc_highlight_rules","ace/mode/folding/cstyle"], function (require, exports, module) {
  "use strict";

  var oop = require("../lib/oop");
  var TextMode = require("./text").Mode;
  var ABCHighlightRules = require("./abc_highlight_rules").ABCHighlightRules;
//    var FoldMode = require("./folding/cstyle").FoldMode;

  var Mode = function () {
    this.HighlightRules = ABCHighlightRules;
    // Disabling folding rules because they are messing up the editor
//        this.foldingRules = new FoldMode();
//        this.$behaviour = this.$defaultBehaviour;
  };
  oop.inherits(Mode, TextMode);

  (function () {
    this.$id = "ace/mode/abc";
  }).call(Mode.prototype);

  exports.Mode = Mode;
});
(function() {
  window.require(["ace/mode/abc"], function(m) {
    if (typeof module == "object" && typeof exports == "object" && module) {
      module.exports = m;
    }
  });
})();
