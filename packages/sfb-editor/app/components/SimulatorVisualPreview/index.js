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
import { Image } from 'semantic-ui-react';

function SimulatorVisualPreview(props) {
  const { background } = props;

  return (
    <>
      SHOW
      <div>
        <Image src={background} size="small" floated="left" />
        {Object.entries(props).map(([key, value]) => (
          <div key={key}>
            {key}: {value}
          </div>
        ))}
      </div>
    </>
  );
}

SimulatorVisualPreview.propTypes = {
  background: PropTypes.string.isRequired
};

export default SimulatorVisualPreview;
