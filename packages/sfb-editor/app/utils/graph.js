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

import memoize from 'memoize-one';
import log from 'electron-log';
import { SceneDirectionType } from '@alexa-games/sfb-f';

// get targets id for edges
export function getNavigationScenesForCurrentScene(ids, directions, currentId) {
  if (!directions) {
    return;
  }

  return directions.reduce((acc, direction) => {
    if (
      direction.directionType === SceneDirectionType.CHOICE ||
      direction.directionType === SceneDirectionType.CONDITION
    ) {
      getNavigationScenesForCurrentScene(acc, direction.parameters.directions, currentId);
    }
    if (
      direction.directionType === SceneDirectionType.GO_TO ||
      direction.directionType === SceneDirectionType.SAVE_AND_GO
    ) {
      const targetId = direction.parameters.target;
      if (currentId !== targetId &&
        !(targetId.startsWith('{') && targetId.endsWith('}')) &&
        targetId !== SceneDirectionType.BOOKMARK &&
        acc.add !== undefined) {
        acc.add(targetId);
      }
    }
    return acc;
  }, ids);
}

// get connected scenes ids for edges
export function getTargetSceneIds(scene) {
  const currentId = scene.id;
  const ids = scene.contents.reduce(
    (acc, variation) => getNavigationScenesForCurrentScene(acc, variation.sceneDirections, currentId),
    new Set()
  );
  return Array.from(ids);
}

// generate list of nodes and edges
export const getGraphElements = memoize(story => {
  const edges = [];
  const nodes = [];
  const nodeRefs = {};
  const sceneRefs = {};
  let globalChildIds = [];

  if (!story) return {nodes, edges, sceneRefs};

  story.scenes.forEach(scene => {
    const sceneId = scene.id;

    if (nodeRefs[sceneId]) {
      return;
    }

    const childIds = getTargetSceneIds(scene);

    if (sceneId.startsWith('global')) {
      globalChildIds = globalChildIds.concat(childIds);
    }

    const sourceID = scene.customProperties
      ? scene.customProperties.sourceID
      : '';
    const sourceLocation = scene.customProperties
      ? scene.customProperties.sourceLocation
      : '';

    const node = {
      scene,
      childIds,
      id: sceneId,
      children: [],
      isLink: false,
      label: sceneId,
      sourceID,
      sourceLocation
    };

    nodes.push(node);
    nodeRefs[sceneId] = node;
    sceneRefs[sceneId] = scene;

    // add edges
    childIds.forEach(id => {
      const targetId = id;
      if (targetId.startsWith('{') && targetId.endsWith('}')) {
        // ignore interpreted targets
        return; // continue
      }
      edges.push({
        from: sceneId,
        to: targetId
      });
    });
  });

  const globals = ['global append', 'global prepend', 'global postpend'];

  globals.forEach(from => {
    if (nodeRefs[from]) {
      nodeRefs[from].childIds.forEach(to => edges.push({from, to}));
    }
  });

  return {
    nodes,
    edges,
    nodeRefs,
    sceneRefs
  };
});

const incrementVisitedCount = (mapObject, key) => {
  let nodeVisitCount = mapObject.get(key) || 0;
  nodeVisitCount += 1;
  mapObject.set(key, nodeVisitCount);
};

const traverseChildren = (node, visited, globalVisited, rootNodes) => {
  node.children.forEach((childNode) => {
    if (!visited.has(childNode.id)) {
      if (rootNodes.has(childNode.id)) {
        rootNodes.delete(childNode.id);
      }
      visited.add(childNode.id);
      if (!globalVisited.has(childNode.id)) {
        incrementVisitedCount(globalVisited, childNode.id);
        traverseChildren(childNode, visited, globalVisited, rootNodes);
      }
    }
  })
};

const visitChildren = (node, visited) => {
  node.children.forEach((childNode) => {
    // We are assuming there are no cycles since we built the graph earlier with logic that removes them.
    incrementVisitedCount(visited, childNode.id);
    visitChildren(childNode, visited);
  })
};

// This method will find all potential tree roots. If it is cyclic, the starting point will be returned
export const getRootNodes = (nodes, rootNode) => {
  const allVisitedNodes = new Map();
  const rootNodes = new Map();

  if (rootNode) {
    // don't bother with the tree from the current root
    allVisitedNodes.set(rootNode.id, 1);
    visitChildren(rootNode, allVisitedNodes);
  }

  nodes.forEach((node) => {
    // Ignore visited nodes
    if (!allVisitedNodes.has(node.id)) {
      incrementVisitedCount(allVisitedNodes, node.id);
      rootNodes.set(node.id, node);
      const localVisited = new Set();
      localVisited.add(node.id);
      traverseChildren(node, localVisited, allVisitedNodes, rootNodes);
    }
  });

  return Array.from(rootNodes.values());
};

export const generateGraph = (nodes, edges, rootNodeId) => {
  const visitedNodes = new Set();

  // Need to add root node id to visited list, so any targets that reference it add
  // it with "isLink" set to true.
  // Also need to process the root node first, so that it gets first chance to visit
  // nodes instead of having them already visited and prematurely having an "isLink"
  // true node as a child of the start node when it doesn't need to be.
  if (rootNodeId) {
    visitedNodes.add(rootNodeId);
  }

  // All edges that come from rootNodeId node are processed first
  let sortedEdges = edges.filter(({from}) => from === rootNodeId);

  // Then add all other edges
  sortedEdges = sortedEdges.concat(edges.filter(({from}) => from !== rootNodeId));

  sortedEdges.forEach(({from, to}) => {
    const source = nodes.find(({id}) => id === from);
    const target = nodes.find(({id}) => id === to);

    if (target) {
      if (!visitedNodes.has(target.id)) {
        // was not visited
        if (source.children) {
          source.children.push(target);
        }
        visitedNodes.add(target.id);
      } else {
        // was visited
        source.children.push({...target, isLink: true, children: []});
      }
    }
  });
};

export const cleanGraphCycles = (nodes, rootNodeIds) => {
  rootNodeIds.forEach((rootNodeId) => {
    nodes.forEach((node) => {
      const {children} = node;
      if (children && children.find(({id}) => id === rootNodeId)) {
        const target = nodes.find(({id}) => id === rootNodeId);
        node.children = children.filter(({id}) => id !== rootNodeId); // children.filter(({id}) => id !== rootNodeId);
        // node.isLink = true;
        node.children.push({...target, isLink: true, children: []});
      }
    });
  });
};

// returns a Map object that maps child node.id to an array of parent node.id
export const getChildToParentMap = memoize(edges => {
  const relationship = new Map();
  edges.forEach(({from: parent, to: child}) => {
    if (relationship.has(child)) {
      let parentArray = relationship.get(child);
      parentArray = parentArray.concat(parent);
      relationship.set(child, parentArray);
    } else {
      relationship.set(child, [parent]);
    }
  });
  return relationship;
});

export const getTreeFromStoryJson = memoize(json => {
  const {nodes, edges} = getGraphElements(json);
  // An orphan is a root node, so we can combine the concept and remove all orphan processing.

  // We know that there should be a start node for root.
  const root = nodes.find(({id}) => id === 'start');
  generateGraph(nodes, edges, 'start');
  cleanGraphCycles(nodes, ['start']);
  const additionalRootNodes = getRootNodes(nodes, root);
  cleanGraphCycles(nodes, additionalRootNodes.map(n => n.id));

  let rootChildren = [];

  if (root) {
    rootChildren = [root].concat(additionalRootNodes);
  } else {
    log.warn('No `start` node was found');
  }

  return rootChildren && rootChildren.length > 0
    ? {
      id: 'root',
      label: 'root',
      children: rootChildren
    }
    : null;
});

export function getUtterances(scene, target) {
  const direction = scene.contents[0].sceneDirections.find(
    dir =>
      dir.directionType === 'choice' &&
      dir.parameters.directions.find(
        d => d.directionType === 'go to' && d.parameters.target === target.id
      )
  );

  return direction ? direction.parameters.utterances : null;
}

export function getSvgElementCenter(svg, elem) {
  const bbox = elem.getBBox();
  const matrix = elem.getScreenCTM();
  const x = bbox.x + bbox.width * 0.5;
  const y = bbox.y + bbox.height * 0.5;

  return {
    x: matrix.a * x + matrix.c * y + matrix.e,
    y: matrix.b * x + matrix.d * y + matrix.f
  };
}
