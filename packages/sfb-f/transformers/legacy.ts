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


/**
 * Leaving the original function here for the time being.  Unit tests are calling it to demonstrate 
 * compatibility. 
 */
export function substituteSlotValues(line : string, eventParams : any, isCondition : boolean = true) : any {
    // Now substitute in all the {variable1}, {variable2}, etc. fields
    let regex = /\{([^{}]*?)\}/g;

    let matches = line.match(regex);
    
    let allSlotsFilled : boolean = true;

    while(matches) {
        let slotsToFill : any = {};

        // Find all the replacement slot names
        for(const match of matches) {
            slotsToFill[match] = 1;
        }

        let keys = Object.keys(slotsToFill);
        
        for(let keyOriginal of keys) {
            // Remove the opening and closing { } signs and single quotes within the key
            let key = keyOriginal.substr(1, keyOriginal.length - 2).replace(/\'/g,"");

            line = line.replace(new RegExp("\\{" + keyOriginal.substr(1, keyOriginal.length - 2) + "\\}","g"), "{" + key + "}");

            if (key.split(".").length > 1 ) {
                let splitKey:string[] = key.split(".");
                let crawl:any = eventParams[splitKey[0].replace(/'/g, "")];
                for (let i = 1; i < splitKey.length; i++) {

                    if (crawl != undefined) {
                        crawl = crawl[splitKey[i]];

                        if(crawl != undefined && i == splitKey.length - 1) {
                            let find = "\\{" + key + "\\}";			

                            let re = new RegExp(find, 'g');
                    
                            let value: any = crawl;
        
                            line = line.replace(re, value);
                        } if (crawl == undefined) {
                            let find = "\\{" + key + "\\}";			

                            let re = new RegExp(find, 'g');

                            let value: any = crawl;

                            line = line.replace(re, "undefined");
                        }
                    } else {
                        let find = "\\{" + key + "\\}";			

                        let re = new RegExp(find, 'g');

                        line = line.replace(re, "false");

                        allSlotsFilled = true;
                    }
                }
            } else {
                if(eventParams[key.replace(/'/g, "")] != undefined) {
                    let find = "\\{" + key + "\\}";			

                    let re = new RegExp(find, 'g');
            
                    let value: any = eventParams[key.replace(/'/g, "")];
                    if (isNaN(value) && isCondition) {
                        value =  "'" + value.replace(/'/g, "\\'") + "'";
                    }

                    line = line.replace(re, value);

                } else {
                    let find = "\\{" + key + "\\}";			

                    let re = new RegExp(find, 'g');

                    line = line.replace(re, "false");

                    allSlotsFilled = true;
                }
            }
        }		

        matches = line.match(regex);
    }

    return { value: line, allSlotsFilled : allSlotsFilled};
}
