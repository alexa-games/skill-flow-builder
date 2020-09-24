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

declare var process: any

import * as path from 'path';
import * as fs from 'fs';
import { readUtf8FileExcludingBom } from '@alexa-games/sfb-util';

import * as _ from 'lodash';

export class ConfigAccessor {

    static defaultStage = "dev";
    static defaultLocale = "en-us";

    private contentPath: string;

    private deployedFlag?: boolean;

    constructor(private abcConfig: any, contentPath: string) {
        this.contentPath = path.resolve(contentPath);
    }
    public set deployed(value: boolean) {
        this.deployedFlag = value;
    }
    setValue(keyName : string, val: any, stage? : string, locale? : string) : void {

        // Force stage and locale to lowercase
        stage = (stage) ? stage.toLowerCase() : stage;
        locale = (locale) ? locale.toLowerCase() : locale;

        if(stage && locale) {
            _.set(this.abcConfig, stage + "-" + locale + "." + keyName, val);
            return;
        } 

        if(stage) {
            _.set(this.abcConfig, stage + "." + keyName, val);
            return;
        }

        if(locale) {
            _.set(this.abcConfig, locale + "." + keyName, val);
            return;
        }

        _.set(this.abcConfig, "default." + keyName, val);
        return;
    }

    public get askSkillDirectoryName() {
        return this.getValue("ask-skill-directory-name");
    }

    public get validResourceFileExtensions(): string[] {
        return this.getValue("valid-resource-file-extensions") || ["json", "csv"];
    }

    public get additionalResourceDirectories(): string[] {
        return this.getValue("additional-resource-directories") || ["apl-templates"];
    }

    public get publishLocales(): string[] {
        return this.getValue("publish-locales");
    }

    public getResourcePath(locale: string) {
        
        const resourcesPathWithLocaleAndResources = path.join(this.contentPath, locale, "resources");

        if (this.deployedFlag === undefined) {
            // If nothing has set the deployedFlag to a specific value, test for the 
            // presence of the resources folder. Don't set the deployedFlag based on this 
            // result because fs.existsSync will also return true if the locale is not available.
            if(fs.existsSync(resourcesPathWithLocaleAndResources)) {
                return resourcesPathWithLocaleAndResources;
            }
        } else if (this.deployedFlag === false) {
            return resourcesPathWithLocaleAndResources
        }
       
        return path.join(this.contentPath, locale);
    }

    public getS3ResourcesUri(locale: string): string {
        return `https://${this.getS3DomainName(locale)}/${this.getS3BucketName(locale)}/${this.getAskSkillPath(locale)}/${locale}`;
    }

    public getS3DomainName(locale: string): string {
        return this.getValue("s3-domain-name", undefined, locale);
    }

    public getS3BucketName(locale: string): string {
        return this.getValue("s3-bucket-name", undefined, locale);
    }

    public getSnippetMapFilePath(locale: string): string {
        return path.join(this.getResourcePath(locale), this.getValue("snippet-map-filename", undefined, locale));;
    }

    public getAskSkillPath(locale: string): string {
        return this.getValue("ask-skill-directory-name", undefined, locale);
    }

    public shouldOverwriteWithSource(locale: string): boolean {
        return this.getValue("update-string-with-source", undefined, locale);
    }

    public getAplTemplatesFilePath(locale: string) {
        return path.resolve(this.getResourcePath(locale), this.getValue("apl-templates-filename", undefined, locale));
    }

    // Return "" for file path if apl-commands-filename does not exist
    public getAplCommandsFilePath(locale: string) {
        const aplCommandsFilename = this.getValue("apl-commands-filename", undefined, locale);
        return aplCommandsFilename ? path.resolve(this.getResourcePath(locale), aplCommandsFilename) : "";
    }

    getValue(keyName : string, stage? : string, locale? : string, skipLocaleMapping? : boolean, skillId? : string) : any {

        // Force stage and locate to lowercase
        stage = (stage) ? stage.toLowerCase() : stage;
        locale = (locale) ? locale.toLowerCase() : locale;
        
        // If not specified, check for an environment variable and use it
        if(!stage) {
            stage = process.env.stage;
            //console.log("Getting environment variable from: " +  JSON.stringify(process.env) );
        }

        if(!locale) {
            locale = process.env.locale;
        }

        // If still not specified, use a default value
        if(!stage) {
            stage = ConfigAccessor.defaultStage;
        }

        if(!locale) {
            locale = ConfigAccessor.defaultLocale;
        }

        let mappedLocaleToUse = locale;
        /*
        // First map from given locale to mappedLocaleToUse
        if(!skipLocaleMapping) {
            // Need to make sure to set skipLocaleMapping to true to avoid a forever recursive loop
            mappedLocaleToUse = ConfigHelper.getValue("localeToUse", stage, locale, true);
        }*/

        let val : any = undefined;

        // If skillId set, then try and lookup by it first
        if(skillId) {
            val = _.get(this.abcConfig, [skillId, keyName]);  // Don't use a string, because skill id includes dots, so instead use the lodash get array syntax
            if(val) { return val; }                
        }

        // First lookup by stage and mappedLocaleToUse
        val = _.get(this.abcConfig, stage + "-" + mappedLocaleToUse + "." + keyName);
        if(val) { return val; }

        // Then lookup by stage
        val = _.get(this.abcConfig, stage + "." + keyName);
        if(val) { return val; }

        // Then lookup by mappedLocaleToUse
        val = _.get(this.abcConfig, mappedLocaleToUse + "." + keyName);
        if(val) { return val; }

        // Then lookup by default
        val = _.get(this.abcConfig, "default." + keyName);
        if(val) { return val; }
        
        return val;
    }

    public getRequestLocalizedValue(keyName : string, event : any) {
        let locale = _.get(event, "request.locale");
        let skillId = _.get(event, "session.application.applicationId");
        //console.log("[DEBUG] ConfigHelper: getRequestLocalizedValue : Request locale=[ " + locale + "], SkillId=[" + skillId + "]");

        return this.getValue(keyName, undefined, locale, false, skillId);
    }

    public static async loadConfigFile(configFile: string, contentPath: string): Promise<ConfigAccessor> {
        const data = await readUtf8FileExcludingBom(configFile);
        return new ConfigAccessor(JSON.parse(data), contentPath);
    }
}
