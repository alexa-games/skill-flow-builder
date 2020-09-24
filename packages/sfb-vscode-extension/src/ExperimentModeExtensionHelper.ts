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

import { DefinitionProvider, CompletionItem, Location, SignatureHelpProvider,
    SignatureHelp, HoverProvider, Hover, TextDocument, Position, CancellationToken,
    CompletionItemProvider, CompletionItemKind, SignatureInformation, MarkdownString, Range, Uri} from 'vscode';

import { SFBImporter, StoryMetadata, ImportError, ImportErrorLine } from '@alexa-games/sfb-f';
import * as path from 'path';
import * as fs from 'fs';

import { Util, ContentItem } from './Util';

const defaultSlots: any = [
    {
        "name": "AMAZON.Actor",
        "description": "Names of actors and actresses."
    },
    {
        "name": "AMAZON.AdministrativeArea",
        "description": "Geographical regions that are typically under the jurisdiction of a particular government."
    },
    {
        "name": "AMAZON.AggregateRating",
        "description": "Words describing the overall rating for an item."
    },
    {
        "name": "AMAZON.Airline",
        "description": "Names of a variety of airlines."
    },
    {
        "name": "AMAZON.Airport",
        "description": "Names of a variety of airports."
    },
    {
        "name": "AMAZON.Anaphor",
        "description": "Recognizes words that are anaphors representing an item, such as 'this', 'that', and 'it'."
    },
    {
        "name": "AMAZON.Animal",
        "description": "Names of many different animals."
    },
    {
        "name": "AMAZON.Artist",
        "description": "Full names of artists."
    },
    {
        "name": "AMAZON.AT_CITY",
        "description": "Provides recognition for over 5, 000 Austrian and world cities commonly used by speakers in Germany and Austria."
    },
    {
        "name": "AMAZON.AT_REGION",
        "description": "Provides recognition for over 1000 geographic regions in Austria, Europe and the rest of the world commonly used by speakers in Germany or Austria."
    },
    {
        "name": "AMAZON.Athlete",
        "description": "Full names of athletes."
    },
    {
        "name": "AMAZON.Author",
        "description": "Full names of authors."
    },
    {
        "name": "AMAZON.Book",
        "description": "Titles of books."
    },
    {
        "name": "AMAZON.BookSeries",
        "description": "Titles of multi-book series."
    },
    {
        "name": "AMAZON.BroadcastChannel",
        "description": "Names and abbreviations of broadcast channels, such as TV and radio stations."
    },
    {
        "name": "AMAZON.CivicStructure",
        "description": "Words and phrases describing public structures and facilities, such as 'town hall', 'bus stop', and others."
    },
    {
        "name": "AMAZON.Color",
        "description": "Names of colors."
    },
    {
        "name": "AMAZON.Comic",
        "description": "Titles of comic books."
    },
    {
        "name": "AMAZON.Corporation",
        "description": "Full names of corporations."
    },
    {
        "name": "AMAZON.Country",
        "description": "Names of countries around the world."
    },
    {
        "name": "AMAZON.CreativeWorkType",
        "description": "Words for different types of creative works, such as 'song' or 'show'."
    },
    {
        "name": "AMAZON.DayOfWeek",
        "description": "Calendar days of the week."
    },
    {
        "name": "AMAZON.DE_CITY",
        "description": "Provides recognition for over 5, 000 German and world cities commonly used by speakers in Germany and Austria."
    },
    {
        "name": "AMAZON.DE_FIRST_NAME",
        "description": "Thousands of popular first names commonly used by speakers Germany."
    },
    {
        "name": "AMAZON.DE_REGION",
        "description": "Provides recognition for over 1000 geographic regions in Austria, Europe and the rest of the world commonly used by speakers in Germany or Austria."
    },
    {
        "name": "AMAZON.Dessert",
        "description": "Names of various desserts."
    },
    {
        "name": "AMAZON.DeviceType",
        "description": "Words for different types of devices, such as 'laptop'."
    },
    {
        "name": "AMAZON.Director",
        "description": "Full names of film directors."
    },
    {
        "name": "AMAZON.Drink",
        "description": "Names of beverages."
    },
    {
        "name": "AMAZON.EducationalOrganization",
        "description": "Names of schools, colleges, and other educational institutions."
    },
    {
        "name": "AMAZON.EUROPE_CITY",
        "description": "Provides recognition for over 5, 000 European and world cities."
    },
    {
        "name": "AMAZON.EventType",
        "description": "Words describing different types of events."
    },
    {
        "name": "AMAZON.Festival",
        "description": "Names of festivals."
    },
    {
        "name": "AMAZON.FictionalCharacter",
        "description": "Names of fictional characters from books, movies, television shows, and other fictional works."
    },
    {
        "name": "AMAZON.FinancialService",
        "description": "Names of businesses that provide financial services."
    },
    {
        "name": "AMAZON.Food",
        "description": "Names of food items."
    },
    {
        "name": "AMAZON.FoodEstablishment",
        "description": "Names of businesses that serve food."
    },
    {
        "name": "AMAZON.Game",
        "description": "Names of many different games."
    },
    {
        "name": "AMAZON.GB_CITY",
        "description": "Provides recognition for over 15, 000 United Kingdom and world cities commonly used by speakers in the United Kingdom."
    },
    {
        "name": "AMAZON.GB_FIRST_NAME",
        "description": "Thousands of popular first names commonly used by speakers in the United Kingdom."
    },
    {
        "name": "AMAZON.GB_REGION",
        "description": "Provides recognition for counties and regions of the United Kingdom."
    },
    {
        "name": "AMAZON.Genre",
        "description": "Names of many different genres that can be used to describe music, books, television shows, and other media."
    },
    {
        "name": "AMAZON.Landform",
        "description": "Names of landforms such as mountains, plains, lakes, rivers, bays, peninsulas, and seas."
    },
    {
        "name": "AMAZON.LandmarksOrHistoricalBuildings",
        "description": "Names of historical buildings and landmarks."
    },
    {
        "name": "AMAZON.Language",
        "description": "Natural languages such as Spanish, Tamil, Hindi, and English."
    },
    {
        "name": "AMAZON.LocalBusiness",
        "description": "Names of businesses."
    },
    {
        "name": "AMAZON.LocalBusinessType",
        "description": "Words describing different types of businesses a user might search for."
    },
    {
        "name": "AMAZON.MedicalOrganization",
        "description": "Names of medical organizations (physical or not) such as hospitals, institutions, or clinics."
    },
    {
        "name": "AMAZON.Month",
        "description": "Names of calendar months."
    },
    {
        "name": "AMAZON.Movie",
        "description": "Titles of movies."
    },
    {
        "name": "AMAZON.MovieSeries",
        "description": "Titles of several multi-movie series."
    },
    {
        "name": "AMAZON.MovieTheater",
        "description": "Names of movie theaters."
    },
    {
        "name": "AMAZON.MusicAlbum",
        "description": "Names of music albums."
    },
    {
        "name": "AMAZON.MusicCreativeWorkType",
        "description": "Words describing different types of musical works, such as songs and tracks."
    },
    {
        "name": "AMAZON.MusicEvent",
        "description": "Names of music-related events, such as music festivals and concerts."
    },
    {
        "name": "AMAZON.MusicGroup",
        "description": "Names of musical groups. Includes both individual performers and groups such as bands, orchestras, or choirs."
    },
    {
        "name": "AMAZON.Musician",
        "description": "Full names of musicians."
    },
    {
        "name": "AMAZON.MusicPlaylist",
        "description": "Names commonly used to describe playlists for music."
    },
    {
        "name": "AMAZON.MusicRecording",
        "description": "Titles of music recordings or tracks. Each title normally represents a single song."
    },
    {
        "name": "AMAZON.MusicVenue",
        "description": "Names of venues that are used for musical performances."
    },
    {
        "name": "AMAZON.MusicVideo",
        "description": "Titles of music videos."
    },
    {
        "name": "AMAZON.Organization",
        "description": "Names of non-governmental organizations."
    },
    {
        "name": "AMAZON.Person",
        "description": "Full names of real and fictional people."
    },
    {
        "name": "AMAZON.PostalAddress",
        "description": "Street addresses, consisting of the building or house number and street name."
    },
    {
        "name": "AMAZON.Professional",
        "description": ""
    },
    {
        "name": "AMAZON.ProfessionalType",
        "description": "Words describing a variety of professions."
    },
    {
        "name": "AMAZON.RadioChannel",
        "description": "Names of radio channels and programs."
    },
    {
        "name": "AMAZON.RelativePosition",
        "description": "Recognizes words that represent the relative position of an item in a list, such as 'top'."
    },
    {
        "name": "AMAZON.Residence",
        "description": "Names of well-known residences."
    },
    {
        "name": "AMAZON.Room",
        "description": "Names of rooms typical in houses and other buildings."
    },
    {
        "name": "AMAZON.ScreeningEvent",
        "description": "Names of events for screening films."
    },
    {
        "name": "AMAZON.Service",
        "description": "Names of services."
    },
    {
        "name": "AMAZON.SocialMediaPlatform",
        "description": "Names of social media platforms."
    },
    {
        "name": "AMAZON.SoftwareApplication",
        "description": "Names of software programs and apps."
    },
    {
        "name": "AMAZON.SoftwareGame",
        "description": "Names of software games, such as quiz games, trivia games, puzzle games, word games, and other video games."
    },
    {
        "name": "AMAZON.Sport",
        "description": "Names of sports."
    },
    {
        "name": "AMAZON.SportsEvent",
        "description": "Names of sporting events."
    },
    {
        "name": "AMAZON.SportsTeam",
        "description": "Names of many sports teams."
    },
    {
        "name": "AMAZON.StreetAddress",
        "description": "The names of streets used within a typical street address. Note that these names just include the street name, not the house number."
    },
    {
        "name": "AMAZON.StreetName",
        "description": "The names of streets used within a typical street address. Note that these names just include the street name, not the house number."
    },
    {
        "name": "AMAZON.TelevisionChannel",
        "description": "Names and abbreviations for television channels."
    },
    {
        "name": "AMAZON.TVEpisode",
        "description": "Titles of television episodes."
    },
    {
        "name": "AMAZON.TVSeason",
        "description": "Names of seasons of television shows."
    },
    {
        "name": "AMAZON.TVSeries",
        "description": "Titles of many television series."
    },
    {
        "name": "AMAZON.US_CITY",
        "description": "Provides recognition for over 15, 000 United States and world cities commonly used by speakers in the US."
    },
    {
        "name": "AMAZON.US_FIRST_NAME",
        "description": "Thousands of popular first names commonly used by speakers United States."
    },
    {
        "name": "AMAZON.US_STATE",
        "description": "Names of US states, territories, and the District of Columbia."
    },
    {
        "name": "AMAZON.VideoGame",
        "description": "Titles of video games."
    },
    {
        "name": "AMAZON.VisualModeTrigger",
        "description": "Recognizes words that indicate that a visual response is expected, such as 'show' or 'display'."
    },
    {
        "name": "AMAZON.WeatherCondition",
        "description": "Names of a variety of weather conditions, such as rain, cold, or humid."
    },
    {
        "name": "AMAZON.WrittenCreativeWorkType",
        "description": ""
    }
];

export class SceneDefinitionHover implements HoverProvider {
    public provideHover(document: TextDocument, position: Position, token: CancellationToken): Promise<Hover> {
        return new Promise<Hover> (async (resolve, reject) => {
            let text: string = document.getText();

            let line: string = document.lineAt(position.line).text;
            let gotoMatch: any = /^[\s]*(?:go to[\s]+?|->[\s]*?)([\s\S]+?)(?=\.[\s]*$|,[\s]*$|$)/gim.exec(line);

            if(gotoMatch != null) {
                let typing: string = gotoMatch[1];
                let regexString: string = `[@]+[\\s]*(${typing.trim()}[\\s\\S]*?)(?:\\.[\\s]*$|,[\\s]*$|$)([\\s\\S]+?)(?=\\@)`;
                let typingRegex: RegExp = new RegExp(regexString, "gim");

                let match: any = typingRegex.exec(text);

                if (match != null) {
                    let header: string = match[1];
                    let content: string = match[2];

                    let sigHelp: Hover = new Hover(new MarkdownString(`### ${header}`).appendCodeblock(content));

                    resolve(sigHelp);
                    return;
                }

                let regexLastScene: string = `[@]+[\\s]*(${typing.trim()}[^\\n]*?)(?:\\n)([^\\@]+?)(?=$)`

                let lastSceneRegex: RegExp = new RegExp(regexLastScene, "i");
                let lastMatch: any = lastSceneRegex.exec(text);

                if (lastMatch != null) {
                    let header: string = lastMatch[1];
                    let content: string = lastMatch[2];

                    let sigHelp: Hover = new Hover(new MarkdownString(`### ${header}`).appendCodeblock(content));

                    resolve(sigHelp);
                    return;
                }
            }

            resolve(null);
            return;
        });
    }
}

export class SceneContentProvider implements SignatureHelpProvider {
    public async provideSignatureHelp(document: TextDocument, position: Position, token: CancellationToken): Promise<SignatureHelp> {
        return new Promise<SignatureHelp> (async (resolve, reject) => {
            let line: string = document.lineAt(position.line).text;
            let keywordSignatures: any[] = [
                {
                    regex: /^[\s]*increase /g,
                    label: "increase [variableName] by [number]",
                    description: "Increase the numeric value of the variable."
                },
                {
                    regex: /^[\s]*decrease /g,
                    label: "decrease [variableName] by [number]",
                    description: "Decrease the numeric value of the variable."
                },
                {
                    regex: /^[\s]*set /g,
                    label: "set [variableName] to [string|number|variable]",
                    description: "Store a value to a variable."
                },
                {
                    regex: /^[\s]*\-\> /g,
                    label: "-> [scene name]",
                    description: "Transition to [scene name]."
                },
                {
                    regex: /^[\s]*go to /g,
                    label: "go to [scene name]",
                    description: "Transition to [scene name]."
                },
                {
                    regex: /^[\s]*if /g,
                    label: "if [conditions]",
                    description: "[condition] are logical condition to check."
                    + " If the condition passes, executes all instructions below this statement until period(.) is reached."
                },
                {
                    regex: /^[\s]*hear /g,
                    label: "hear [utterances]",
                    description: "[utterances] are comma separated words that your story is expecting to hear at this point."
                        + " When user speaks one of the expected utterances, executes all instructions below this statement until period(.) is reached."
                },
                {
                    regex: /^[\s]*flag /g,
                    label: "flag [variableName]",
                    description: "flagging a variable sets the value of the variable to true. Once flagged, checking the variable in 'if condition' would result in pass."
                },
                {
                    regex: /^[\s]*unflag /g,
                    label: "unflag [variableName]",
                    description: "Unflagging a variable sets the value of the variable to false. When the variable is unflaged, checking the variable in 'if condition' would result in fail."
                },
                {
                    regex: /^[\s]*stack /g,
                    label: "stack [string|number|variable] on [stackName]",
                    description: "Add the given item (string|number|variable) on top of a stack."
                },
                {
                    regex: /^[\s]*enqueue /g,
                    label: "enqueue [string|number|variable] into [queueName]",
                    description: "Add the given item (string|number|variable) into a queue."
                },
                {
                    regex: /^[\s]*pop /g,
                    label: "pop [stackName]",
                    description: "Pop the top item off of the given stack, and temporarily store the result into the variable called {system_return}."
                },
                {
                    regex: /^[\s]*dequeue /g,
                    label: "dequeue [queueName]",
                    description: "Dequeue first item in the given queue, and temporarily store the result into the variable called {system_return}."
                },
                {
                    regex: /^[\s]*remove /g,
                    label: "remove [string|number|variable] from [stackName|queueName|bagName]",
                    description: "Find and remove the value given (string|number|variable) from the given stack, queue, or bag."
                },
                {
                    regex: /^[\s]*put /g,
                    label: "put [string|number|variable] into [bagName]",
                    description: "Add an item (string|number|variable) into a bag. The number of the item in the bag can be accessed by writing 'bagName.itemName'."
                },
                {
                    regex: /^[\s]*time /g,
                    label: "time",
                    description: "Get the current epoch time in milliseconds, and store the result into the variable called {system_return}."
                },
                {
                    regex: /^[\s]*slot /g,
                    label: "slot [variableName] as [string]",
                    description: "Set the type of the variable as [string]."
                },
            ];

            let sigHelp: SignatureHelp = new SignatureHelp();
            sigHelp.activeParameter = 0;
            sigHelp.activeSignature = 0;
            sigHelp.signatures = [];

            for (let keyItem of keywordSignatures) {
                if (line.match(keyItem.regex) != null) {
                    sigHelp.signatures.push(new SignatureInformation(keyItem.label, keyItem.description));
                }
            }
            if (sigHelp.signatures.length > 0) {
                resolve(sigHelp);
                return;
            }

            resolve(null);
            return;
        });
    }
}

export class SceneCompletionProvider implements CompletionItemProvider {
    private completionType: string;

    public constructor(completionType: string) {
        this.completionType = completionType;
    }

    public provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken): Promise<CompletionItem[]> {
        return new Promise<CompletionItem[]>(async (resolve, reject) => {
            let gotoPortion: string = document.lineAt(position.line).text;
            let positionBefore: Position = new Position(position.line, position.character - 1);
            let previousCharacter: string = document.getText(new Range(positionBefore, position));

            if (this.completionType == 'scene_goto' && (gotoPortion.trim().toLowerCase().startsWith("go to") || gotoPortion.trim().toLowerCase().startsWith("->") || gotoPortion.trim().toLowerCase().startsWith("<->"))) {
                let headers: CompletionItem[] = [];
                let abcImporter: SFBImporter = new SFBImporter();

                let contents: ContentItem[] = await Util.getContentItemsFromDocument(document);

                let importedStory: StoryMetadata | undefined;

                try {
                    importedStory = await abcImporter.importABCStory("default", "", "", "", false, {
                        contents: contents,
                        ignoreSyntaxError: true
                    });
                } catch (err) {
                    importedStory = (<ImportError> err).importedData;
                }

                for (let scene of importedStory.scenes) {
                    let label:string = scene.id;
                    headers.push(new CompletionItem(label, CompletionItemKind.Enum));
                }

                resolve(headers);
            } else if(this.completionType == 'scene_property' && previousCharacter == "*") {
                let keywords: string[] = [
                    "say",
                    "reprompt",
                    "then",
                    "recap",
                    "show"
                ];
                let headers: CompletionItem[] = [];

                for (let keyword of keywords) {
                    headers.push(new CompletionItem(keyword, CompletionItemKind.Field));
                }
                resolve(headers);

            } else if(this.completionType == 'available_slots' && (gotoPortion.trim().match(/slot [\s\S]+? as '/g))) {
                let defaultSlotConfig:any = defaultSlots;

                let headers: CompletionItem[] = [];

                for (let slotType of defaultSlotConfig) {
                    let label:string = slotType.name;
                    headers.push(new CompletionItem(label, CompletionItemKind.Enum));
                }

                resolve(headers);
            } else {
                resolve(undefined);
            }
        });
    }
}

export class SceneDefinitionProvider implements DefinitionProvider {
    public provideDefinition(document: TextDocument, position: Position, token: CancellationToken): Promise<Location> {
        return new Promise<Location>(async (resolve, reject) => {
            let currentLine: string = document.lineAt(position.line).text;
            let searchingRegex: RegExp = /^[\s]*(?:go to[\s]+?|->[\s]*?|<->[\s]*?)([\s\S]+?)(?=\.[\s]*$|,[\s]*$|$)/igm;

            let searchMatch: any = searchingRegex.exec(currentLine);

            if(searchMatch == null) {
                resolve(null);
            } else {
                let searchWord: string = searchMatch[1];
                let abcImporter: SFBImporter = new SFBImporter();
                try {
                    let contents: ContentItem[] = await Util.getContentItemsFromDocument(document);

                    let importedStory: StoryMetadata | undefined;

                    try {
                        importedStory = await abcImporter.importABCStory("default", "", "", "", false, {
                            contents: contents,
                            ignoreSyntaxError: true
                        });
                    } catch (err) {
                        importedStory = (<ImportError> err).importedData;
                    }

                    for (let scene of importedStory.scenes) {
                        if (scene.id == searchWord.toLowerCase().trim()) {
                            let jumpLocation: Location = new Location(Uri.file(path.resolve('.', scene.customProperties.sourceID)),
                                document.positionAt(scene.customProperties.sourceLocation));

                            resolve(jumpLocation);
                            return;
                        }
                    }
                } catch (err) {
                    resolve(null);
                }

                resolve(null);
            }
        });
    }
}
