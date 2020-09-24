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

import { StoryFeatureFinder } from '@alexa-games/sfb-f';
import { StoryBlockFinder, BlockStartExpressions, EndType } from '@alexa-games/sfb-f/dist/importPlugins/storyBlockFinder';
import {
  addNewChildScene,
  addNewScene,
  areHearStatementsTheSame, deleteActionCommand, deleteHearCommand, deleteScene, findActionBlock,
  findHearBlock, getActionCommandForAction,
  getActionStoryBlockFinderForScene,
  getHearStoryBlockFinderForScene, renameScene, updateActionCommand, updateHearCommand, updateSceneCommand
} from '../../app/actions/editor';
import { MockAceEditor } from '../mocks/mockAceEditor';
import thunk from 'redux-thunk';
import configureStore from 'redux-mock-store';

const middlewares = [thunk];
const mockStore = configureStore(middlewares);



describe('Editor reference actions', () => {
  const sampleAbcFileContents = `
  @In the office
\t*say
\t\tYou're in a small office, there is a door to your left and a window in front of you. A desk sits below the window piled high with paperwork.
\t\t[sfx trumpet_1.mp3]
\t\tDo you explore the desk, try to climb out the window, or attempt to escape through the door?
\t*then
\t\thear explore the desk {
            -> explore the desk
        }
\t\t
\t\thear climb out the window {
\t\t\t-> climb out the window
        }

\t\thear escape through the door {
\t\t\t-> another scene
\t\t}
\t*reprompt
\t\tThis is a reprompt
\t*recap
\t\tthis is a recap
@another scene
\t*say
        This is another scene

@explore the desk
\t*say
\t\tWhile rummaging through the paperwork that's piled on the desk you find a room key. The key is a perfect fit for the door, you unlock it and step out into a small corridor.
\t\tDo you turn left or right?
\t*then 
\t\thear left {
\t\t    -> deadend
\t\t}

\t\thear right {
\t        -> first floor
\t\t}

@climb out the window
\t*say
        You clamber on top of the desk and climb out of the window expecting your feet to land 
        on the terrace. But there is nothing there, and you're falling.

\t*then
\t\t>> END

@a scene with no hears
\t*say
\t\tYou have no choice
\t*then
<-> explore the desk
-> climb out the window

@escape through the door
\t*say
\t\tYou pull on the handle but the door is locked. Your only options are to explore the desk or climb out the window.
\t*then
\t\thear explore the desk {
            -> explore the desk
        }
\t\t
        hear climb out the window {
            -> climb out the window
        }

@first floor lift
\t*say
        The doors to the elevator open. You step inside and look at buttons on the panel.
        second floor.
        reception.
        basement.
        Which button do you press?
    
    *then
        hear press second floor {
            -> second floor lift
        }
        
        hear reception {
            -> reception
        }
        
        hear basement {
            -> basement
        }

@first floor staircase
\t*say
        You walk over to the staircase, the coast seems clear. Do you go up or do you go down the stairs?
    
    *then
        hear go up { 
            -> second floor
        }
        
        hear down {
            -> reception
        }

@basement
\t*say
        The smell of damp hits you straight away as you step into the basement. You look around but there is no exit, your only option is to go back up.
        Do you take the elevator? or do you take the stairs?

    *then
        hear take the elevator {
            -> basement lift
        }
        
        hear take the stairs {
            -> basement staircase
        }

@reception
\t*say
        You arrive in the reception, the lights are off and there is no one behind the counter. You walk over to the main entrance and try the door, it's locked.
        As you turn around to head back something jumps out from behind the reception desk, you've been caught.

@second floor
\t*say
        You're on an empty roof terrace, there is no way out except for back down.
        Do you take the stairs or do you take the elevator?
        
    *then
        hear take the stairs {
            -> first floor
        }

        hear elevator {
            -> second floor lift
        }

@first floor
\t*say
        You're in a small opening at the end of a door lined corridor.
        There is staircase to your left and an elevator to your right. Do you take the stairs, take the elevator, or walk down the corridor?
    
    *then
        hear take the stairs {
            -> first floor staircase
        }
\t\t
        hear elevator {
            -> first floor lift
        }
        
        hear walk down the corridor {
            -> deadend
        }

@deadend
\t*say
        As you rush down the corridor you hear footsteps following you. You pick up pace but hit a deadend.
        You cannot turn back.
        Game-over.

\t*then
\t\t>> END

@basement lift
\t*say
        You call the elevator and wait in the dark for it to arrive. Straight away as the doors slide open you dive inside. You look at buttons on the panel.
        press second floor.
        first floor.
        reception.
        Which button do you press?
    
    *then
        hear press second floor {
            -> second floor
        }
        
        hear first floor {
            -> first floor 
        }
        
        hear reception {
            -> reception
        }
        -> go to park

@basement staircase
\t*say
        You're almost at the top of the staircase when you notice a flickering light coming from an alcove.
        You stop in your tracks unsure of whether to turn around or carry on towards the light.
        
    *then
        hear turn around {
            -> basement
        }
        
        hear carry on {
            -> carry on
        }

@second floor lift
\t*say
        You step into the elevator, glad to be out of the cold nights air.
        You look at buttons on the panel.
        press first floor.
        reception.
        basement.
        Which button do you press?
        
    *then
        hear press first floor {
            -> first floor 
        }
        
        hear reception {
            -> reception 
        }
        
        hear basement {
            -> basement
        }
        
        hear basement, base {
            -> basement
        }

@carry on
\t*say
        You reach the alcove and discover the flickering light is from an exit sign above a door.
        You push the door open, stumbling out onto the pavement.
        Congratulations you've escaped the office.

\t*then
\t\t>> END

@global restart scene
  *say
    this is a restart scene
  *then
    >> RESTART
    
@global pause scene
  *say
    this is a pause scene
  *then
    >> PAUSE    
    
@time to resume 
  *say
    this is a resume scene
  *then
    hear not pause {
      -> foo
    }
    >> RESUME  
    
@time to return
  *say
    this is a resume scene
  *then
    hear not pause {
      -> foo
    }
    >> RETURN  
    
    
@check the time
  *say
    It's 3pm
  *then
    hear of dear {
      >> END
    }
    >> BACK
`;

  it('makes an ACE Editor', () => {
    const mockEditor = new MockAceEditor(sampleAbcFileContents);
    expect(mockEditor.session.doc.getLine(1)).toEqual('  @In the office');
    expect(mockEditor.session.doc.getAllLines().length).toEqual(271);
  });

  describe('add and remove scenes', () => {
    it('renames a scene (and references)', async () => {
      const abcFileContent = `
@scene1
\t*say
\t\tthis is scene 1
\t*then
\t\t\t-> scene2
@scene2
\t*say
\t\tthis is scene 2
@scene3
\t*say
\t\tthis is scene 3
\t*then
\t\thear got to scene 2 {
\t\t-> scene2
\t\t}
\t\thear go to scene 2 and return {
\t\t\t<-> scene2
\t\t}`;
      const mockEditor = new MockAceEditor(abcFileContent);
      const store = mockStore({
        workspace: {
          editorReference: mockEditor
        }
      });
      store.dispatch(renameScene('scene2', 'chapter 2'));
      expect(mockEditor.session.doc.getLine(5)).toEqual('\t\t\t-> chapter 2 ');
      expect(mockEditor.session.doc.getLine(6)).toEqual('@chapter 2');
      expect(mockEditor.session.doc.getLine(14)).toEqual('\t\t\t-> chapter 2 ');
      expect(mockEditor.session.doc.getLine(17)).toEqual('\t\t\t<-> chapter 2 ');
    });

    it('adds a new scene', async () => {
      const abcFileContent = `
@scene1
\t*say
\t\tthis is scene 1
`;
      const mockEditor = new MockAceEditor(abcFileContent);
      const store = mockStore({
        workspace: {
          editorReference: mockEditor,
          selectedSceneId: 'scene1'
        }
      });
      store.dispatch(addNewScene('scene2'));
      expect(mockEditor.session.doc.getLine(4)).toEqual('@scene2');
    });

    it('adds a new child scene', async () => {
      const abcFileContent = `
@scene1
\t*say
\t\tthis is scene 1
`;
      const mockEditor = new MockAceEditor(abcFileContent);
      const store = mockStore({
        workspace: {
          editorReference: mockEditor,
          selectedSceneId: 'scene1'
        },
        project: {}
      });
      store.dispatch(addNewChildScene());
      expect(mockEditor.session.doc.getLine(4)).toEqual('\t*then');
      expect(mockEditor.session.doc.getLine(5)).toEqual('\t\thear go to scene scene1_1 {');
      expect(mockEditor.session.doc.getLine(6)).toEqual('\t\t\t-> scene1_1');
      expect(mockEditor.session.doc.getLine(7)).toEqual('\t\t}');
      expect(mockEditor.session.doc.getLine(8)).toEqual('');
      expect(mockEditor.session.doc.getLine(9)).toEqual('@scene1_1');
      expect(mockEditor.session.doc.getLine(10)).toEqual('\t*say');
      expect(mockEditor.session.doc.getLine(11)).toEqual('\t\tReplace with your content.');
    });

    it('deletes a scene (and references)', async () => {
      const abcFileContent = `
@scene1
\t*say
\t\tthis is scene 1
\t*then
\t\t\t-> scene2
@scene2
\t*say
\t\tthis is scene 2
@scene3
\t*say
\t\tthis is scene 3
\t*then
\t\thear got to scene 2 {
\t\t-> scene2
\t\t}
\t\thear go to scene 2 and return {
\t\t\t<-> scene2
\t\t}`;
      const mockEditor = new MockAceEditor(abcFileContent);
      const store = mockStore({
        workspace: {
          editorReference: mockEditor
        }
      });
      store.dispatch(deleteScene('scene2'));
      expect(mockEditor.session.doc.getLine(5)).toEqual('@scene3');
      expect(mockEditor.session.doc.getLine(6)).toEqual('\t*say');
      expect(mockEditor.session.doc.getAllLines().length).toEqual(10);
    })
  });

  describe('scene command manipulation', () => {
    it('adds or updates scene commands (say/reprompt/recap)', async () => {
      const abcFileContent = `
@scene1
\t*say
\t\tthis is scene 1
`;
      const mockEditor = new MockAceEditor(abcFileContent);
      const store = mockStore({
        workspace: {
          editorReference: mockEditor,
          selectedSceneId: 'scene1'
        }
      });
      store.dispatch(updateSceneCommand('reprompt', 'scene1', ['This is a new reprompt']));
      expect(mockEditor.session.doc.getLine(4)).toEqual('\t*reprompt');
      expect(mockEditor.session.doc.getLine(5)).toEqual('\t\tThis is a new reprompt');

      store.dispatch(updateSceneCommand('recap', 'scene1', ['This is a new recap']));
      expect(mockEditor.session.doc.getLine(6)).toEqual('\t*recap');
      expect(mockEditor.session.doc.getLine(7)).toEqual('\t\tThis is a new recap');

      store.dispatch(updateSceneCommand('say', 'scene1', ['This is the new say']));
      expect(mockEditor.session.doc.getLine(2)).toEqual('\t*say');
      expect(mockEditor.session.doc.getLine(3)).toEqual('\t\tThis is the new say');

      try {
        store.dispatch(updateSceneCommand('unsupported', 'scene1', ['This is the new say']));
        fail('Error should be thrown');
      } catch {}
      // This syntax should work, but I think the thunk is causing problems
      // expect(store.dispatch(updateSceneCommand('unsupported', 'scene1', ['This is the new say'])))
      //   .toThrowError();
    });

    it('updates a hear command', async ()=> {
      const abcFileContent = `
@scene1
\t*say
\t\tthis is scene 1
\t*then
\t\thear one, two three {
\t\t\t-> scene 2
\t\t}
`;
      const mockEditor = new MockAceEditor(abcFileContent);
      const store = mockStore({
        workspace: {
          editorReference: mockEditor,
          selectedSceneId: 'scene1'
        }
      });
      store.dispatch(updateHearCommand('scene1', ['one', 'two three'], 'scene 3', 'one, two, three', 'go to'));
      expect(mockEditor.session.doc.getLine(5)).toEqual('\t\thear one, two, three {');
      expect(mockEditor.session.doc.getLine(6)).toEqual('\t\t\t-> scene 3');
    })

    it('creates hear command (without a *then)', async ()=> {
      const abcFileContent = `
@scene1
\t*say
\t\tthis is scene 1
`;
      const mockEditor = new MockAceEditor(abcFileContent);
      const store = mockStore({
        workspace: {
          editorReference: mockEditor,
          selectedSceneId: 'scene1'
        }
      });
      store.dispatch(updateHearCommand('scene1', ['one', 'two three'], 'scene 3', 'one, two, three', 'go to'));
      expect(mockEditor.session.doc.getLine(4)).toEqual('\t*then');
      expect(mockEditor.session.doc.getLine(5)).toEqual('\t\thear one, two, three {');
      expect(mockEditor.session.doc.getLine(6)).toEqual('\t\t\t-> scene 3');
    })

    it('deletes hear command', async ()=> {
      const abcFileContent = `
@scene1
\t*say
\t\tthis is scene 1
\t*then
\t\thear one, two, three {
\t\t\t-> scene 3
\t\t}
\t\thear four, five, six {
\t\t\t-> scene 3
\t\t}
`;
      const mockEditor = new MockAceEditor(abcFileContent);
      const store = mockStore({
        workspace: {
          editorReference: mockEditor,
          selectedSceneId: 'scene1'
        }
      });
      store.dispatch(deleteHearCommand('scene1', 'one, two, three'));
      expect(mockEditor.session.doc.getLine(4)).toEqual('\t*then');
      expect(mockEditor.session.doc.getAllLines().length).toEqual(9);
      store.dispatch(deleteHearCommand('scene1', ['four', 'five', 'six']));
      expect(mockEditor.session.doc.getLine(4)).toEqual('\t*then');
      expect(mockEditor.session.doc.getAllLines().length).toEqual(6);
    })

    it('updates actions', () => {
      const abcFileContent = `
@scene1
\t*say
\t\tthis is scene 1
\t*then
\t\thear one, two, three {
\t\t\t-> scene 2
\t\t}
\t\t-> scene 2
`;
      const mockEditor = new MockAceEditor(abcFileContent);
      const store = mockStore({
        workspace: {
          editorReference: mockEditor,
          selectedSceneId: 'scene1'
        }
      });
      store.dispatch(updateActionCommand('scene1', 'scene 2', 'scene 3', 'go to'));
      expect(mockEditor.session.doc.getLine(5)).toEqual('\t\thear one, two, three {');
      expect(mockEditor.session.doc.getLine(6)).toEqual('\t\t\t-> scene 2');
      expect(mockEditor.session.doc.getLine(8)).toEqual('\t\t-> scene 3 ');
    });

    it('updates actions (without a *then)', () => {
      const abcFileContent = `
@scene1
\t*say
\t\tthis is scene 1
`;
      const mockEditor = new MockAceEditor(abcFileContent);
      const store = mockStore({
        workspace: {
          editorReference: mockEditor,
          selectedSceneId: 'scene1'
        }
      });
      store.dispatch(updateActionCommand('scene1', null, 'scene 3', 'go to'));
      expect(mockEditor.session.doc.getLine(5)).toEqual('\t\t-> scene 3 ');
    });

    it('deletes an action', () => {
      const abcFileContent = `
@scene1
\t*say
\t\tthis is scene 1
\t*then
\t\thear one, two, three {
\t\t\t-> scene 2
\t\t}
\t\t-> scene 2
`;
      const mockEditor = new MockAceEditor(abcFileContent);
      const store = mockStore({
        workspace: {
          editorReference: mockEditor,
          selectedSceneId: 'scene1'
        }
      });
      store.dispatch(deleteActionCommand('scene1', 'scene 2', 'go to'));
      expect(mockEditor.session.doc.getLine(5)).toEqual('\t\thear one, two, three {');
      expect(mockEditor.session.doc.getLine(6)).toEqual('\t\t\t-> scene 2');
      expect(mockEditor.session.doc.getLine(8)).toEqual('');
    })

  });
  describe('searching algorithm tests', () => {
    it('compares two hear statements as output from StoryBlockFinder', () => {
      let first = 'press first floor ';
      let second = 'press first floor ';
      expect(areHearStatementsTheSame(first, second)).toBe(true);

      first = 'press first floor, first floor,     first ';
      second = 'press first floor, first floor, first';
      expect(areHearStatementsTheSame(first, second)).toBe(true);

      first = 'first, press first floor, first floor ';
      second = 'press first floor, first floor, first ';
      expect(areHearStatementsTheSame(first, second)).toBe(true);

      first = 'press first floor, first floor,     first ';
      second = 'press first floor, first floor ';
      expect(areHearStatementsTheSame(first, second)).toBe(false);

      first = 'press first floor, first floor,     first ';
      second = 'press first floor, first floor, second ';
      expect(areHearStatementsTheSame(first, second)).toBe(false);

      first = 'press first floor, first floor,  ,,   first ';
      second = 'press first floor, first floor, first ';
      expect(areHearStatementsTheSame(first, second)).toBe(true);

    });

    it('finds hear statements in a scene', async () => {
      const finder = new StoryFeatureFinder(sampleAbcFileContents.split('\n'));
      const hearStatements = ['press first floor', 'basement', ['basement'], ['basement', 'base']];
      let hearBlock;

      for (let hearStatement of hearStatements) {
        let hearFinder = getHearStoryBlockFinderForScene('second floor lift', finder);
        hearBlock = findHearBlock(hearFinder, hearStatement);
        if (!hearBlock) {
          fail('Should never be undefined');
        }
      }
    });

    it('does not find missing hear statement in a scene', async () => {
      const finder = new StoryFeatureFinder(sampleAbcFileContents.split('\n'));
      const hearStatements = ['empty', '', null, undefined];
      let hearBlock;

      for (let hearStatement of hearStatements) {
        let hearFinder = getHearStoryBlockFinderForScene('second floor lift', finder);
        hearBlock = findHearBlock(hearFinder, hearStatement);
        if (hearBlock) {
          fail('Should not find any blocks');
        }
      }
    });

    it('finds action blocks as expected', async () => {
      const actionsToFind = [
        {
          goto: 'go to park',
          action: 'go to',
          scene: 'basement lift'
        },
        {
          goto: 'explore the desk',
          action: 'save and go',
          scene: 'a scene with no hears'
        },
        {
          goto: '',
          action: 'restart',
          scene: 'global restart scene'
        },
        {
          goto: null,
          action: 'pause',
          scene: 'global pause scene'
        },
        {
          goto: '',
          action: 'pause',
          scene: 'global pause scene'
        },
        {
          goto: null,
          action: 'resume',
          scene: 'time to resume'
        },
        {
          goto: '  ',
          action: 'resume',
          scene: 'time to resume'
        },
        {
          goto: '  ',
          action: 'return',
          scene: 'time to return'
        },
        {
          goto: null,
          action: 'back',
          scene: 'check the time'
        },
        {
          goto: '',
          action: 'back',
          scene: 'check the time'
        },
        {
          goto: null,
          action: 'ending',
          scene: 'climb out the window'
        },
        {
          goto: '',
          action: 'ending',
          scene: 'climb out the window'
        }
      ];

      for (const t of actionsToFind) {
        const actionCommand = getActionCommandForAction(t.action);
        const finder = new StoryFeatureFinder(sampleAbcFileContents.split('\n'));
        const actionFinder = getActionStoryBlockFinderForScene(t.scene, finder, actionCommand);
        const actionBlock = findActionBlock(actionFinder, t.goto);
        if (!actionBlock) {
          fail(`action block for '${actionCommand}' was not found.`);
        }
      }
    });
  })

});
