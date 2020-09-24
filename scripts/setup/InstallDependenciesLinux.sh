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

LAME_SOURCE_URL="https://downloads.sourceforge.net/project/lame/lame/3.100/lame-3.100.tar.gz"
LAME_SOURCE_FILE="lame-3.100.tar.gz"
LAME_SOURCE_DIR="lame-3.100"

FFMPEG_SOURCE_URL="https://ffmpeg.org/releases/ffmpeg-4.3.1.tar.bz2"
FFMPEG_SOURCE_FILE="ffmpeg-4.3.1.tar.bz2"
FFMPEG_SOURCE_DIR="ffmpeg-4.3.1"

echo "################################################################################"
echo "################################################################################"
echo ""
echo ""
echo "Skill Flow Builder Dependency Installer for Linux - Terms and Agreements"
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

mkdir -p $INSTALL_DIR/bin
mkdir -p $INSTALL_DIR/lib
mkdir -p $INSTALL_DIR/include

pushd $INSTALL_DIR

echo
echo "### Downloading Packages ###"
echo

if [ ! $(which wget) ]
then
  echo "Error: Please install 'wget' to download the dependency packages."
  exit 1
fi

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

cd ..

echo
echo "### Installing FFmpeg ###"
echo

tar xjvf $FFMPEG_SOURCE_FILE
cd $FFMPEG_SOURCE_DIR

PATH="$INSTALL_DIR/bin:$PATH" PKG_CONFIG_PATH="$INSTALL_DIR/lib/pkgconfig" ./configure \
  --prefix="$INSTALL_DIR" \
  --pkg-config-flags="--static" \
  --extra-cflags="-I$INSTALL_DIR/include -static" \
  --extra-ldflags="-L$INSTALL_DIR/lib -static" \
  --extra-libs="-lpthread -lm" \
  --optflags='-fstack-protector-strong -fpie -pie -Wl,-z,relro,-z,now -D_FORTIFY_SOURCE=2' \
  --bindir="$INSTALL_DIR/bin" \
  --enable-static \
  --disable-shared \
  --disable-ffprobe \
  --disable-ffplay \
  --disable-doc \
  --disable-version3 \
  --disable-gpl \
  --disable-nonfree \
  --disable-network \
  --disable-decoders \
  --disable-encoders \
  --enable-libmp3lame \
  --enable-decoder=mp3* \
  --enable-encoder=libmp3lame
make
make install

popd