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
// fuzzy-responses module: a helper module to pick a fuzzy response from an actual response
*/

import { escapeRegExp } from './utilities';

type ResponseScore = {
    match: number,
    ratio: number
};

type ResponseScores = {
    [key: string] : ResponseScore
};

// Pick best response from the given list of strings, if key is provided, instead of a list of strings you can pass a list
// of objects and the item inside of the object named key will be used for the text match.
export function pickBestResponse(actualResponse: string, fuzzyResponses: string[], key?: any): {
    index: number,
    response: string | null
} | undefined
 {
    let fuzzyResponseScores: ResponseScores = {};

    if(!actualResponse) {
        actualResponse = "";
    }

    fuzzyResponses.forEach(function(fuzzyResponse: any) {

        let fuzzyResponseComparisonVal = fuzzyResponse;

        if(key) {
            fuzzyResponseComparisonVal = fuzzyResponse[key];
        }

        fuzzyResponseScores[fuzzyResponseComparisonVal] = {
            match: 0,
            ratio: 0
        };

        actualResponse.split(" ").forEach(function(item) {
            let regExp = new RegExp('(^|\\s)' + escapeRegExp(item) + '($|\\s)', 'ig');

            while ((regExp.exec(fuzzyResponseComparisonVal)) !== null) {
                fuzzyResponseScores[fuzzyResponseComparisonVal].match += 1;

                // Repeated words in the response string only count for 1 (like for word 'the' for example), by 'break'ing here
                break;
            }
        }); 

        fuzzyResponseScores[fuzzyResponseComparisonVal].ratio = fuzzyResponseScores[fuzzyResponseComparisonVal].match/fuzzyResponseComparisonVal.split(" ").length;
    });

    let fuzzyResponseMax: string | null = null;
    let fuzzyResponseMaxScore = {
        match: 0,
        ratio: 0
    };

    for (const fuzzyResponse in fuzzyResponseScores) {

        let fuzzyResponseScore = fuzzyResponseScores[fuzzyResponse];

        if (fuzzyResponseScore.match >= fuzzyResponseMaxScore.match && fuzzyResponseScore.ratio >= fuzzyResponseMaxScore.ratio) {
            fuzzyResponseMax = fuzzyResponse;
            fuzzyResponseMaxScore = fuzzyResponseScore;
        }
    }

    let matchedIndex = -1;
    let matchedItem: string | null = null;
    if(!key) {
        matchedIndex = fuzzyResponses.indexOf(fuzzyResponseMax || '');
        matchedItem = fuzzyResponseMax;
    } else {
        for(let i = 0; i < fuzzyResponses.length; i++) {
            let resp = fuzzyResponses[i];

            let content = resp[key];
            if(fuzzyResponseMax === content) {
                matchedIndex = i;
                matchedItem = resp;
                break;
            }
        }        
    }
    
    if (fuzzyResponseMaxScore.match > 0) {
        return {
            index: matchedIndex,
            response: matchedItem
        };
    } else {
        return undefined;
    }
}
