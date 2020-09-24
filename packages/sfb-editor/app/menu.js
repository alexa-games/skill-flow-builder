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

import { app, Menu, shell } from 'electron';

export default class MenuBuilder {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;
  }

  buildMenu() {
    if (
      process.env.NODE_ENV === 'development' ||
      process.env.DEBUG_PROD === 'true'
    ) {
      this.setupDevelopmentEnvironment();
    }

    const template =
      process.platform === 'darwin'
        ? this.buildDarwinTemplate()
        : this.buildDefaultTemplate();

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    return menu;
  }

  setupDevelopmentEnvironment() {
    this.mainWindow.openDevTools();
    this.mainWindow.webContents.on('context-menu', (e, props) => {
      const { x, y } = props;

      Menu.buildFromTemplate([
        {
          label: 'Inspect element',
          click: () => {
            this.mainWindow.inspectElement(x, y);
          }
        }
      ]).popup(this.mainWindow);
    });
  }

  buildDarwinTemplate() {
    const subMenuAbout = {
      label: app.getName(),
      submenu: [
        {
          label: 'Hide',
          accelerator: 'Command+H',
          selector: 'hide:'
        },
        {
          label: 'Hide Others',
          accelerator: 'Command+Shift+H',
          selector: 'hideOtherApplications:'
        },
        { label: 'Show All', selector: 'unhideAllApplications:' },
        { type: 'separator' },
        {
          label: 'Troubleshooting',
          submenu: [
            {
              label: 'Clear Voice Preview Cache',
              click: () => {
                this.mainWindow.clearVoicePreviewCache();
              }
            },
            {
              label: 'Reset Editor',
              click: () => {
                this.mainWindow.clearLocalSettingsAndRefresh();
              }
            }
          ]
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: 'Command+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    };

    // add edit menu
    const subMenuEdit = {
      label: 'Edit',
      submenu: [
        { label: 'Undo', role: 'undo', accelerator: 'Command+Z', selector: 'undo:' },
        { label: 'Redo', role: 'redo', accelerator: 'Shift+Command+Z', selector: 'redo:' },
        { type: 'separator' },
        { label: 'Cut Text', accelerator: 'Command+X', selector: 'cut:' },
        { label: 'Copy Text', accelerator: 'Command+C', selector: 'copy:' },
        { label: 'Paste Text', accelerator: 'Command+V', selector: 'paste:' }
        // {
        //   label: 'Select All',
        //   accelerator: 'Command+A',
        //   selector: 'selectAll:'
        // }
      ]
    };
    const subMenuViewDev = {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'Command+R',
          click: () => {
            this.mainWindow.webContents.reload();
          }
        },
        {
          label: 'Toggle Full Screen',
          accelerator: 'Ctrl+Command+F',
          click: () => {
            this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
          }
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: 'Alt+Command+I',
          click: () => {
            this.mainWindow.toggleDevTools();
          }
        },
        {
          label: 'Toggle Stack Views',
          click: () => {
            this.mainWindow.toggleStackViews();
          }
        }
      ]
    };
    const subMenuViewProd = {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Full Screen',
          accelerator: 'Ctrl+Command+F',
          click: () => {
            this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
          }
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: 'Alt+Command+I',
          click: () => {
            this.mainWindow.toggleDevTools();
          }
        },
        {
          label: 'Toggle Stack Views',
          click: () => {
            this.mainWindow.toggleStackViews();
          }
        }
      ]
    };
    const subMenuFile = {
      label: 'File',
      id: 'menu-file',
      submenu: [
        { label: 'New Project', click: () => this.mainWindow.sendMenuCommand('new-project')},
        { label: 'Open Project', click: () => this.mainWindow.sendMenuCommand('open-project')},
        { id: 'menu-close-project', label: 'Close Project', click: () => this.mainWindow.sendMenuCommand('close-project')},
        { type: 'separator' },
        { id: 'menu-save', label: 'Save', accelerator: 'Command+S', click: () => this.mainWindow.sendMenuCommand('save-project')},
        { id: 'menu-save-as', label: 'Save As...', click: () => this.mainWindow.sendMenuCommand('save-as')},
        { type: 'separator' },
        { id: 'menu-explore-folder', label: 'Explore Folder', click: () => this.mainWindow.sendMenuCommand('explore-folder')},
        { type: 'separator' },
        { id: 'menu-build', label: 'Build', click: () => this.mainWindow.sendMenuCommand('build')},
        { type: 'separator' },
      ]
    };
    const subMenuWindow = {
      label: 'Window',
      submenu: [
        {
          label: 'Minimize',
          accelerator: 'Command+M',
          selector: 'performMiniaturize:'
        },
        { label: 'Close', accelerator: 'Command+W', selector: 'performClose:' },
        { type: 'separator' },
        { label: 'Bring All to Front', selector: 'arrangeInFront:' }
      ]
    };
    // const subMenuHelp = {
    //   label: 'Help',
    //   submenu: [
    //     {
    //       label: 'Learn More',
    //       click() {
    //         shell.openExternal('http://electron.atom.io');
    //       }
    //     },
    //     {
    //       label: 'Documentation',
    //       click() {
    //         shell.openExternal(
    //           'https://github.com/atom/electron/tree/master/docs#readme'
    //         );
    //       }
    //     },
    //     {
    //       label: 'Community Discussions',
    //       click() {
    //         shell.openExternal('https://discuss.atom.io/c/electron');
    //       }
    //     },
    //     {
    //       label: 'Search Issues',
    //       click() {
    //         shell.openExternal('https://github.com/atom/electron/issues');
    //       }
    //     }
    //   ]
    // };

    const subMenuView =
      process.env.NODE_ENV === 'development' ? subMenuViewDev : subMenuViewProd;

    return [
      subMenuAbout,
      subMenuFile,
      subMenuEdit,
      subMenuView,
      subMenuWindow
      // subMenuHelp
    ];
  }

  buildDefaultTemplate() {
    const templateDefault = [
      {
        label: '&File',
        submenu: [
          { label: 'New Project', click: () => this.mainWindow.sendMenuCommand('new-project')},
          { label: 'Open Project', click: () => this.mainWindow.sendMenuCommand('open-project')},
          { id: 'menu-close-project', label: 'Close Project', click: () => this.mainWindow.sendMenuCommand('close-project')},
          { type: 'separator' },
          { id: 'menu-save', label: '&Save', accelerator: 'Ctrl+S', click: () => this.mainWindow.sendMenuCommand('save-project')},
          { id: 'menu-save-as', label: 'Save As...', click: () => this.mainWindow.sendMenuCommand('save-as')},
          { type: 'separator' },
          { id: 'menu-explore-folder', label: 'Explore Folder', click: () => this.mainWindow.sendMenuCommand('explore-folder')},
          { type: 'separator' },
          { id: 'menu-build', label: 'Build', click: () => this.mainWindow.sendMenuCommand('build')},
          { type: 'separator' },
          // {
          //   label: '&Save file',
          //   accelerator: 'Ctrl+S',
          //   click: () => {
          //     this.mainWindow.webContents.send('save_file_clicked');
          //   }
          // },
          // {
          //   label: 'Save current file as',
          //   click: () => {
          //     this.mainWindow.webContents.send('save_current_file_as_clicked');
          //   }
          // },
          {
            label: 'Troubleshooting',
            submenu: [
              {
                label: 'Clear Voice Preview Cache',
                click: () => {
                  this.mainWindow.clearVoicePreviewCache();
                }
              },
              {
                label: 'Reset Editor',
                click: () => {
                  this.mainWindow.clearLocalSettingsAndRefresh();
                }
              }
            ]
          },
          {
            label: '&Close',
            accelerator: 'Ctrl+W',
            click: () => {
              this.mainWindow.close();
            }
          }
        ]
      },
      {
        label: '&View',
        submenu:
        [
          {
            label: '&Reload',
            accelerator: 'Ctrl+R',
            click: () => {
              this.mainWindow.webContents.reload();
            }
          },
          {
            label: 'Toggle &Full Screen',
            accelerator: 'F11',
            click: () => {
              this.mainWindow.setFullScreen(
                !this.mainWindow.isFullScreen()
              );
            }
          },
          {
            label: 'Toggle &Developer Tools',
            accelerator: 'Alt+Ctrl+I',
            click: () => {
              this.mainWindow.toggleDevTools();
            }
          },
          {
            label: 'Toggle Stack Views',
            click: () => {
              this.mainWindow.toggleStackViews();
            }
          }
        ]
      }
    ];

    return templateDefault;
  }
}
