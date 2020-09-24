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

import React from 'react';
import PropTypes from 'prop-types';
import log from 'electron-log';
import { getVoicePreview } from './utils';

class SimulatorAudioPreview extends React.PureComponent {
  constructor(props) {
    super(props);

    const { autoStart } = props;

    this.state.autoStart = autoStart;

    this.handleCanPlayAudio = this.handleCanPlayAudio.bind(this);
  }

  state = {
    src: null,
    autoStart: true
  };

  componentDidMount() {
    this.componentDidUpdate();
  }

  componentDidUpdate() {
    const { src } = this.state;

    if (src) {
      return; // exit
    }

    const { ssml, simulator } = this.props;

    if (this.audioElement && !this.audioElement.paused) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
    }

    if (simulator.isPollyPreview) {
      this.asyncAction = getVoicePreview(ssml)
        .then(result => {
          this.setState({ src: result.url });
          return null;
        })
        .catch(err => log.error(err));
    }
  }

  componentWillUnmount() {
  }

  audioElement = null;

  asyncAction = null;

  handleCanPlayAudio = () => {
    const { autoStart } = this.state;

    if (autoStart) {
      this.audioElement.play();
    }
  };

  render() {
    const { simulator } = this.props;
    const { src } = this.state;

    return (
      <>
        {simulator.isPollyPreview ? (
          <audio
            preload="auto"
            controls
            onCanPlay={this.handleCanPlayAudio}
            ref={el => {
              this.audioElement = el;
            }}
          >
            {src ? <source src={src} type="audio/mpeg" /> : null}
          </audio>
        ) : null}
      </>
    );
  }
}

SimulatorAudioPreview.propTypes = {
  ssml: PropTypes.string.isRequired,
  simulator: PropTypes.object.isRequired,
  autoStart: PropTypes.bool.isRequired
};

export default SimulatorAudioPreview;
