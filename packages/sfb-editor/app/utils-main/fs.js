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

// (!)
// No babel `import` `export` support in electron main thread
// Use plain Node JS `require` and `module.exports`

const fs = require('fs');
const util = require('util');
const path = require('path');
const { readUtf8FileExcludingBom } = require('@alexa-games/sfb-util');

const copyFilePromisified = util.promisify(fs.copyFile);
const writeFilePromisified = util.promisify(fs.writeFile);
const readdirPromisified = util.promisify(fs.readdir);
const mkdirPromisified = util.promisify(fs.mkdir);

const VALID_AUDIO_EXT = ['.mp3', '.wav'];

const VALID_IMAGE_EXT = ['.png', '.jpg', '.jpeg'];

// makeDir
function makeDir(location, options = { recursive: true }) {
  return mkdirPromisified(location, options).catch(err => {
    if (err.code === 'EEXIST') {
      return null;
    }
    throw err;
  });
}

function cleanDir(location) {
  const files = fs.readdirSync(location);

  files.forEach((filename) => {
    const filepath = path.resolve(location, filename);
    const stats = fs.statSync(filepath);

    // Don't remove directories in this clean dir function
    if (!stats.isDirectory()) {
      fs.unlinkSync(filepath);
    }
  });
}

// readFile
function readFile(location) {
  return readUtf8FileExcludingBom(location)
    .catch((err) => {
        return null;
    });
}

// readFile
function copyFile(source, destination, flag = fs.constants.COPYFILE_EXCL) {
  return copyFilePromisified(source, destination, flag).catch(() => null);
}

// readJson
function readJson(location) {
  return readFile(location)
    .then(source => JSON.parse(source))
    .catch((err) => {
      return null;
    });
}

// writeFile
function writeFile(location, content = '', options = 'utf8') {
  return writeFilePromisified(location, content, options);
}

// writeJson
function writeJson(location, json = {}, options = 'utf8') {
  const args = [json];
  if (options.indent) args.push(null, 2);
  const content = JSON.stringify(...args);
  return writeFilePromisified(location, content, options);
}

// return all the files in the given folder path recursively, with their path
// that remains after the initial folderPath is removed
function readdirRecursivePromisified(folderPath, ignoreHidden = true) {
  return readdirPromisified(folderPath, {withFileTypes: false})
    .then(files => {
    const returnedFileList = [];

      files
        .filter(f => f.indexOf('.') !== 0 || !ignoreHidden) // exclude files like .gitignore, .DS_Store, .thumbs etc.
        .forEach((filename) => {
      const stats = fs.statSync(path.resolve(folderPath, filename));

      if (stats.isDirectory()) {
        readdirRecursiveSyncHelper(
          folderPath,
          path.resolve(folderPath, filename),
            returnedFileList,
            ignoreHidden
        );
      } else {
        returnedFileList.push(filename);
      }
    });

    return returnedFileList;
  });
}

// helper function for above recursive promisified function above
function readdirRecursiveSyncHelper(
  originalFolderPath,
  folderPath,
  returnedFileList,
  ignoreHidden = true
) {
  const files = fs.readdirSync(folderPath);

  files
    .filter(f => f.indexOf('.') !== 0 || !ignoreHidden) // exclude files like .gitignore, .DS_Store, .thumbs etc.
    .forEach((filename) => {
    const stats = fs.statSync(path.resolve(folderPath, filename));

    if (stats.isDirectory()) {
      readdirRecursiveSyncHelper(
        originalFolderPath,
        path.resolve(folderPath, filename),
        returnedFileList
      );
    } else {
      const relativePath = path.relative(
        originalFolderPath,
        path.resolve(folderPath, filename)
      );
      returnedFileList.push(relativePath);
    }
  });
}

// findFiles
function findFiles(folderPath, ext = '.abc') {
  return readdirRecursivePromisified(folderPath)
    .then(files => files.filter(filename => path.extname(filename) === ext))
    .catch(() => []);
}

// findAudioFiles
function findAudioFiles(folderPath) {
  return readdirRecursivePromisified(folderPath)
    .then(files =>
      files.filter(filename => VALID_AUDIO_EXT.includes(path.extname(filename)))
    )
    .catch(() => []);
}

// findImageFiles
function findImageFiles(folderPath) {
  return readdirRecursivePromisified(folderPath)
    .then(files =>
      files.filter(filename => VALID_IMAGE_EXT.includes(path.extname(filename)))
    )
    .catch(() => []);
}

// copied from sfb-cli
function recursiveCopy(src, dst, options) {
  // Convert \\ to / so we can handle windows paths.
  const srcPath = src.replace(/\\/g,'/').split('/');

  let sourceTargetName = srcPath[srcPath.length - 1];

  if (sourceTargetName.length === 0) {
      sourceTargetName = '*';
  }

  const sourceTargetRegex = new RegExp(`^${sourceTargetName.replace("*", "[\\s\\S]*")}$`, 'g');

  let parentPath = '';

  if (srcPath && srcPath.length > 0 && srcPath[0].trim().length === 0) {
      parentPath = "/";
  }

  if (srcPath.length > 1) {
      parentPath += srcPath.slice(0, srcPath.length - 1).reduce((prev, current) => {
          if (prev) {
              return `${prev}/${current}`;
          }

          if (process.platform !== "win32" && current.trim().length === 0) {
              return "/";
          }
          return current;
      });
  }

  const files = fs.readdirSync(parentPath);
  if (!files) {
      return;
  }

  makeDir(dst);

  for (let i = 0; i < files.length; i += 1) {
      const file = files[i];
      if (file.match(sourceTargetRegex)){
          const sourceFilePath = path.join(parentPath, file);
          const destFilePath = path.join(dst, file);

          const sourceStat = fs.statSync(sourceFilePath);

          if (sourceStat.isDirectory()) {
              recursiveCopy(path.join(sourceFilePath, '*'), destFilePath, options);
          } else if (!fs.existsSync(destFilePath) ||
              sourceStat.mtimeMs > fs.statSync(destFilePath).mtimeMs) {
              fs.copyFileSync(sourceFilePath, destFilePath, options);
          }
      }
  }

}


module.exports = {
  makeDir,
  cleanDir,
  readFile,
  copyFile,
  readJson,
  writeFile,
  writeJson,
  findFiles,
  findAudioFiles,
  findImageFiles,
  recursiveCopy,
  readdirRecursivePromisified
};
