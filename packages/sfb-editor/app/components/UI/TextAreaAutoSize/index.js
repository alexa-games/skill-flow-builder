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

import React, { useRef, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';

import styles from './styles.css';

function resize(el) {
  if (el) {
    el.style.height = '0';
    el.style.height = `${el.scrollHeight}px`;
  }
}

function TextAreaAutoSize(props) {
  const ref = useRef(null);

  useEffect(() => resize(ref.current), []);

  const handleInput = useCallback(e => {
    if (props.onInput) {
      props.onInput(e);
    }
    resize(ref.current);
  }, []);

  const classList = new Set([styles.container]);

  if (props.className) {
    classList.add(props.className);
  }

  return (
    <textarea
      {...props}
      ref={ref}
      onInput={handleInput}
      className={Array.from(classList).join(' ')}
    />
  );
}

TextAreaAutoSize.propTypes = {
  onInput: PropTypes.func,
  className: PropTypes.string
};

export default TextAreaAutoSize;
