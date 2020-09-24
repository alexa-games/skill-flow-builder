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

import { ABCExporter } from '../exportHandlers/exporter';

export class AlexaABCTwineHarlowExporter implements ABCExporter
{	

    public exportData(jsonInputObj : any, exportDataCallback : any) {

        console.log(jsonInputObj);

        let twineData = "";

        let title = jsonInputObj.title;

        // Twine output data looks like this
        /*
        <tw-storydata name="Journey Under the Sea" startnode="1" creator="Twine" creator-version="2.2.1" ifid="2B4BC8EA-D9FD-4C1B-A6E5-EB7470E3285D" zoom="1" format="Harlowe" format-version="2.1.0" options="" hidden><style role="stylesheet" id="twine-user-stylesheet" type="text/twine-css"></style>
        <script role="script" id="twine-user-script" type="text/twine-javascript">Hello World</script>
        <tw-passagedata pid="1" name="Welcome" tags="" position="463,58" size="100,100">Welcome to the game, do you go [[left]] or [[right]]?</tw-passagedata>
        <tw-passagedata pid="2" name="left" tags="" position="277,187" size="100,100">You are underwater, do you [[swim]] or [[drown]] or [[up]]?</tw-passagedata>
        <tw-passagedata pid="3" name="right" tags="" position="905,225" size="100,100">Double-click this passage to edit it.</tw-passagedata>
        </tw-storydata>
        */

        twineData += `<tw-storydata name="${title}" startnode="1" creator="Twine" creator-version="2.2.1" ifid="2B4BC8EA-D9FD-4C1B-A6E5-EB7470E3285D" zoom="1" format="Harlowe" format-version="2.1.0" options="" hidden>\n\n`;

        let pid = 1;

        let currCol = 0;
        let xCols = 20;

        let xPos = 100;

        let yPos = 100;

        for(let node of jsonInputObj.nodes) {

            let name = node.id;

            let bodyContent = node.body.content;

            bodyContent += "\n\n";

            if(node.body.recap) {
                bodyContent += "##Recap\n\n";
                bodyContent += node.body.recap;    
                bodyContent += "\n\n";
            }

            if(node.body.voice) {
                bodyContent += "##Voice\n\n";
                bodyContent += node.body.voice;    
                bodyContent += "\n\n";
            }

            if(node.body.effect) {
                bodyContent += "##Effect\n\n";
                bodyContent += node.body.effect;    
                bodyContent += "\n\n";
            }

            if(node.body.ambiance) {
                bodyContent += "##Ambiance\n\n";
                bodyContent += node.body.ambiance;    
                bodyContent += "\n\n";
            }

            if(node.body.image) {
                bodyContent += "##Image\n\n";
                bodyContent += node.body.image;    
                bodyContent += "\n\n";
            }
        
            if(node.action.targets && node.action.targets.length > 0) {
                bodyContent += "#" + node.action.type + "\n\n";
                bodyContent += node.action.content;
                bodyContent += "\n\n";
            }

            twineData += `<tw-passagedata pid="${pid}" name="${name}" tags="" position="${xPos},${yPos}" size="100,100">${bodyContent}</tw-passagedata>\n`        ;

            pid++;

            currCol++;
            if(currCol >= xCols) {
                currCol = 0;
                yPos += 200;
            }

            xPos = currCol * 200;
        }

        twineData += `</tw-storydata>\n\n`;


        if(exportDataCallback) {
            exportDataCallback(twineData);
            return;
        }
    }
}


