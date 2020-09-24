#!/usr/bin/env bash

# Copyright 2018 Amazon.com, Inc. and its affiliates. All Rights Reserved.
#
# SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
#
# Licensed under the Amazon Software License (the "License").
# You may not use this file except in compliance with the License.
# A copy of the License is located at
#
#   http://aws.amazon.com/asl/
#
# or in the "license" file accompanying this file. This file is distributed
# on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
# express or implied. See the License for the specific language governing
# permissions and limitations under the License.

set -euo pipefail

INSTALL_DIR=${INSTALL_DIR:-"$(pwd)"}

LAME_SOURCE_URL="https://downloads.sourceforge.net/project/lame/lame/3.99/lame-3.99.5.tar.gz"
LAME_SOURCE_FILE="lame-3.99.5.tar.gz"
LAME_SOURCE_DIR="lame-3.99.5"

FFMPEG_SOURCE_URL="https://ffmpeg.org/releases/ffmpeg-4.3.1.tar.bz2"
FFMPEG_SOURCE_FILE="ffmpeg-4.3.1.tar.bz2"
FFMPEG_INTERMEDIATE_TAR_FILE="ffmpeg-4.3.1.tar"
FFMPEG_SOURCE_DIR="ffmpeg-4.3.1"

if ! [ "$(expr substr $(uname -s) 1 10)" == "MINGW64_NT" ]; then
   echo "### Unsupported OS/Shell ###"
   echo "Please use a x64 Windows Machine with the Msys2 shell. If you are using Msys2, please ensure you are launching the 64 bit version."
   exit 1
fi

echo "################################################################################"
echo "################################################################################"
echo ""
echo ""
echo "Skill Flow Builder Dependency Installer for Windows - Terms and Agreements"
echo ""
echo ""
echo "The installer provided herein will retrieve several third-party libraries, "
echo "environments, and/or other software packages at install-time or build-time "
echo "(\"External Dependencies\") from third-party sources.  There are terms and "
echo "conditions that you need to agree to abide by if you choose to install the "
echo "External Dependencies.  If you do not agree with every term and condition "
echo "associated with the External Dependencies, enter “QUIT” in the command line "
echo "when prompted by the installer. "
echo "Else enter \"AGREE\"."
echo ""
echo ""
echo "################################################################################"
echo "################################################################################"

read input
input=$(echo $input | awk '{print tolower($0)}')
if [ $input == 'quit' ]
then
exit 1
elif [ $input == 'agree' ]
then
echo "################################################################################"
echo "Proceeding with installation"
echo "################################################################################"
else
echo "################################################################################"
echo 'Unknown option'
echo "################################################################################"
exit 1
fi

pushd $INSTALL_DIR

mkdir -p /usr/local/bin

mkdir -p $INSTALL_DIR/bin
mkdir -p $INSTALL_DIR/lib
mkdir -p $INSTALL_DIR/include

PACMAN_ARGS="--noconfirm --needed"

echo "### Updating Package List ###"
echo "### If this causes your Msys shell to close, relaunch it and start the script again ###"

pacman -Syuu

echo "### Installing Needed Packges for Compiliation ###"
pacman -S ${PACMAN_ARGS} make
pacman -S ${PACMAN_ARGS} diffutils
pacman -S ${PACMAN_ARGS} yasm
pacman -S ${PACMAN_ARGS} mingw-w64-x86_64-toolchain
pacman -S ${PACMAN_ARGS} p7zip

echo
echo "### Downloading Packages ###"
echo

wget -O $LAME_SOURCE_FILE $LAME_SOURCE_URL
wget -O $FFMPEG_SOURCE_FILE $FFMPEG_SOURCE_URL

echo
echo "### Installing LAME ###"
echo

tar xzvf $LAME_SOURCE_FILE
cd $LAME_SOURCE_DIR
./configure --prefix="$INSTALL_DIR" --bindir="$INSTALL_DIR/bin" --disable-shared --enable-nasm
make
make install
ln -s $INSTALL_DIR/bin/lame /usr/local/bin/lame

cd ..

echo
echo "### Installing FFmpeg ###"
echo

7z x -aoa $FFMPEG_SOURCE_FILE
7z x -aoa $FFMPEG_INTERMEDIATE_TAR_FILE
cd $FFMPEG_SOURCE_DIR 

./configure \
--prefix="$INSTALL_DIR" \
--enable-static \
--disable-shared \
--disable-ffprobe \
--disable-ffplay \
--disable-doc \
--disable-version3 \
--disable-gpl \
--disable-nonfree \
--disable-network \
--enable-libmp3lame \
--extra-ldflags='-L$INSTALL_DIR/lib -static' \
--extra-cflags='-I$INSTALL_DIR/include -static'

make
make install
ln -s $INSTALL_DIR/bin/ffmpeg /usr/local/bin/ffmpeg

popd