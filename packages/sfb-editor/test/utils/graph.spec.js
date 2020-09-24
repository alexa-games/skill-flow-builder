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

import { generateGraph, getRootNodes, cleanGraphCycles, getChildToParentMap } from '../../app/utils/graph';

const utilsData = require('./graph.data');
const utilsDataNotStartNodeFirst = require('./graph.dataNotStartNodeFirst');

describe('D3Tree tests', () => {
  it('Hiking default', () => {
    const {nodes} = utilsData.hikingDefault.default;
    const {edges} = utilsData.hikingDefault.default;

    const root = nodes.find(({id}) => id === 'start');
    generateGraph(nodes, edges, 'start');
    cleanGraphCycles(nodes, ['start']);
    const additionalRootNodes = getRootNodes(nodes, root);
    cleanGraphCycles(nodes, additionalRootNodes.map(n => n.id));

    expect(root).toEqual(utilsData.hikingDefault.default.root);
    expect(additionalRootNodes).toEqual(utilsData.hikingDefault.default.additionalRootNodes);
  });

  it('Hiking with orphan root', () => {
    const {nodes} = utilsData.hikingDefault.orphan;
    const {edges} = utilsData.hikingDefault.orphan;

    const root = nodes.find(({id}) => id === 'start');
    generateGraph(nodes, edges, 'start');
    cleanGraphCycles(nodes, ['start']);
    const additionalRootNodes = getRootNodes(nodes, root);
    cleanGraphCycles(nodes, additionalRootNodes.map(n => n.id));

    expect(root).toEqual(utilsData.hikingDefault.orphan.root);
    expect(additionalRootNodes).toEqual(utilsData.hikingDefault.orphan.additionalRootNodes);
  });

  it('Test project', () => {
    const {nodes} = utilsData.testProject.data;
    const {edges} = utilsData.testProject.data;

    const root = nodes.find(({id}) => id === 'start');
    generateGraph(nodes, edges, 'start');
    cleanGraphCycles(nodes, ['start']);
    const additionalRootNodes = getRootNodes(nodes, root);
    cleanGraphCycles(nodes, additionalRootNodes.map(n => n.id));

    expect(root).toEqual(utilsData.testProject.data.root);
    expect(additionalRootNodes).toEqual(utilsData.testProject.data.additionalRootNodes);
    expect(nodes).toEqual(utilsData.testProject.data.nodesOutput);
  });

  it('Gets correct parent node', () => {
    const {edges} = utilsData.parentMapping;
    const mapObj = getChildToParentMap(edges);

    expect('start').toEqual(mapObj.get('second')[0]);
    expect('start').toEqual(mapObj.get('third')[0]);
    expect('orphanstart').toEqual(mapObj.get('orphan2')[0]);
    expect('orphan2').toEqual(mapObj.get('orphanstart')[0]);
  });
  
  it('Test project with Start node after nodes that link back to themselves', () => {
    const {nodes, edges} = utilsDataNotStartNodeFirst.testProject.data;

    const root = nodes.find(({id}) => id === 'start');
    generateGraph(nodes, edges, 'start');

    expect(root).toEqual(utilsDataNotStartNodeFirst.expectedProject.root);
  });
});
