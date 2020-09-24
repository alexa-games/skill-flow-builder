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

import * as d3 from 'd3';
import React from 'react';
import PropTypes from 'prop-types';
import { Popup, Button } from 'semantic-ui-react';
import _, { debounce } from 'underscore';
import log from 'electron-log';

import {
  getUtterances,
  getSvgElementCenter,
  getTreeFromStoryJson,
  getGraphElements,
  getChildToParentMap
} from '../../../utils/graph';

import {
  textToHtml
} from '../../../utils-renderer';

import styles from './styles.css';
import { WorkspacePrimaryMode } from '../../../data/enums';

const NODE_RADIUS = 10;
const TREE_X_SPACING = 100;
const TREE_Y_SPACING = 200;
const OPEN_ICON_CHARACTER = '\uf067';
const CLOSE_ICON_CHARACTER = '\uf068';
const RECYCLE_ICON_CHARACTER = '\uf3e5';

const NODE_ACTION_ITEMS = [
  {
    icon: 'crosshairs',
    text: 'Focus',
    value: 'focus',
    description: 'Show path leading to selected'
  },
  {
    icon: 'trash',
    text: 'Delete',
    value: 'delete scene',
    description: 'Delete selected scene'
  },
  {
    icon: 'plus',
    text: 'Create',
    value: 'create child scene',
    description: 'Add child scene to selected scene'
  },
];

const MAP_ACTION_ITEMS = [
  {
    icon: 'expand',
    text: 'Best fit',
    value: 'best fit',
    description: 'Best fit'
  },
  {
    icon: 'expand arrows alternate',
    text: 'Expand All',
    value: 'expand all',
    description: 'Expand all'
  }
];

class WorkspaceGraphD3Tree extends React.PureComponent {
  componentDidMount() {
    this.init();
    this.renderTree();
  }

  componentDidUpdate() {
    this.renderTree();
  }

  map = null;

  zoom = null;

  tooltip = null;

  svgRoot = null;

  svgGroup = null;

  edgeContainer = null;

  nodeContainer = null;

  toolbarMessage = null;

  collapsedNodeIds = new Set();

  previousSelectedSceneId = null;

  previousProjectLocation = null;

  buildLayout = d3.tree().nodeSize([TREE_X_SPACING, TREE_Y_SPACING]);

  init() {
    this.map = d3.select(this.svgGroup);

    this.zoom = d3
      .zoom()
      .scaleExtent([0.1, 2])
      .on('zoom', this.handleZoomEvent);

    d3.select(this.svgRoot)
      .call(this.zoom)
      // disable double click zoom
      .on('dblclick.zoom', null);
  }

  getEdgeKey = d => `${d.source.data.id}->${d.target.data.id}`;

  getNodeKey = d => d.data.id;

  renderTree() {
    const { project } = this.props;

    if (!project.json) return; // exit

    // if this is a new project, reinitialize
    if (this.previousProjectLocation !== project.location) {
      d3.select(this.nodeContainer)
        .selectAll('*')
        .remove();
      d3.select(this.edgeContainer)
        .selectAll('*')
        .remove();
      this.previousProjectLocation = project.location;
      this.collapsedNodeIds = new Set();
    }

    const storyTree = getTreeFromStoryJson(project.json);

    if (!storyTree) return; // exit

    this.root = d3.hierarchy(storyTree);

    this.update();
  }

  update = () => {
    const { workspace } = this.props;
    const { selectedSceneId } = workspace;

    // collapse nodes
    Array.from(this.collapsedNodeIds).forEach(id => {
      const node = this.root.descendants().find(({ data }) => data.id === id);
      if (node) {
        node._children = node.children;
        delete node.children;
      }
    });

    // build layout
    const treeLayout = this.buildLayout(this.root);

    // edges
    const edgeContainer = d3.select(this.edgeContainer);
    const edges = edgeContainer
      .selectAll('path')
      .data(treeLayout.links(), this.getEdgeKey);

    edges
      .enter()
      .append('path')
      .merge(edges)
      // append hover handlers
      .attr(
        'd',
        d3
          .linkHorizontal()
          .x(d => d.y)
          .y(d => d.x)
      )
      .attr('class', d => {
        const classList = [styles.edge];

        // hide edges conneted to root
        if (d.source.depth === 0) {
          classList.push(styles.edgeHide);
        }

        // highlight edges connected to selected node
        // if (
        //   (d.source.data.id === selectedSceneId && !d.source.data.isLink) ||
        //   (d.target.data.id === selectedSceneId && !d.target.data.isLink)
        // ) {
        //   classList.push(styles.edgeSelected)
        // }

        // highlight edges connected to scenes with a hear
        if (
          d.source.data.scene &&
          getUtterances(d.source.data.scene, d.target.data.scene)
        ) {
          classList.push(styles.edgeHasHear);
        }

        return classList.join(' ');
      })
      .clone(true)
      .attr('class', styles.edgeOutline)
      .on('mouseenter', this.handleEdgeMouseEnter)
      .on('mouseleave', this.handleEdgeMouseLeave);

    edges.exit().remove();

    // nodes
    const nodeContainer = d3.select(this.nodeContainer);
    const nodes = nodeContainer
      .selectAll('g')
      .data(treeLayout.descendants(), this.getNodeKey);

    // NEW NODES
    const nodeContainers = nodes
      .enter()
      .append('g')
      // append hover handlers
      .on('mouseenter', this.handleNodeMouseEnter)
      .on('mouseleave', this.handleNodeMouseLeave)
      .attr('transform', d => `translate(${d.y},${d.x})`);

    // append background container
    nodeContainers
      .append('circle')
      .on('click', this.handleNodeClick)
      .attr('class', styles.nodeContainer)
      .attr('r', NODE_RADIUS * 4);

    // node circle
    nodeContainers
      .append('circle')
      .on('click', this.handleNodeClick)
      .attr('class', styles.nodeCircle)
      .attr('r', NODE_RADIUS);

    // link back icon
    nodeContainers
      .filter(d => d.data.isLink)
      .on('click', this.handleNodeClick)
      .append('text')
      .attr('class', styles.nodeLinkIcon)
      .text(RECYCLE_ICON_CHARACTER);

    // node label
    nodeContainers
      .append('text')
      .on('click', this.handleNodeClick)
      .attr('class', styles.nodeLabelOutline)
      .attr('y', NODE_RADIUS * -1.75)
      .text(d => d.data.label)
      .clone(true)
      .on('click', this.handleNodeClick)
      .attr('class', styles.nodeLabel);

    // toggle open icon
    nodeContainers
      .append('text')
      .on('click', this.handleNodeToggleClick)
      .attr('class', styles.nodeToggleIconOpen)
      .text(OPEN_ICON_CHARACTER);

    // toggle close icon
    nodeContainers
      .append('text')
      .on('click', this.handleNodeToggleClick)
      .attr('class', styles.nodeToggleIconClosed)
      .text(CLOSE_ICON_CHARACTER);

    // UPDATE NODES
    nodeContainers
      .merge(nodes)
      .attr('class', d => {
        const classList = [styles.node];
        if (d.depth === 0) {
          classList.push(styles.nodeHide);
        }
        if (selectedSceneId && selectedSceneId.localeCompare(d.data.id, 'en', {sensitivity: 'base'}) === 0) {
          classList.push(styles.nodeSelected);
        }
        if (d.data.isLink) {
          classList.push(styles.nodeLink);
        }

        // use css to hide and show the appropriate toggle
        if (d.children) {
          classList.push(styles.nodeOpen);
        } else if (d._children) {
          classList.push(styles.nodeClosed);
        }

        return classList.join(' ');
      })
      // x, y are flipped for horizontal layout
      .attr('transform', d => `translate(${d.y},${d.x})`);

    // REMOVE NODES
    nodes.exit().remove();

    // find selected node
    let selectedNode = null;
    treeLayout.each(n => {
      if (!n.data.isLink && selectedSceneId && selectedSceneId.localeCompare(n.data.id, 'en', {sensitivity: 'base'}) === 0) {
        selectedNode = n;
      }
    });

    if (
      this.zoom &&
      selectedNode &&
      selectedSceneId &&
      this.previousSelectedSceneId !== selectedSceneId
    ) {
      this.previousSelectedSceneId = selectedSceneId;
      d3.select(this.svgRoot)
        .transition()
        .duration(200)
        // x, y are flipped for horizonal layout
        .call(this.zoom.translateTo, selectedNode.y, selectedNode.x);
    }
  };

  handleNodeToggleClick = node => {
    const { setSelectedSceneId } = this.props;

    if (this.collapsedNodeIds.has(node.data.id)) {
      this.collapsedNodeIds.delete(node.data.id);
    } else {
      this.collapsedNodeIds.add(node.data.id);
    }

    // set selected scene id
    setSelectedSceneId(node.data.id);
    // rerender
    this.renderTree();
  };

  handleNodeClick = node => {
    const {
      setSelectedSceneId,
      openProjectFile,
      project,
      simulator,
      resumeSimulator,
      sendSimulatorCommand,
      clearNavigationStack,
      isProjectUnSaved
    } = this.props;

    const { id } = node.data;
    const { sourceID } = node.data;

    const isProjectUnsaved = isProjectUnSaved();

    if (sourceID && sourceID !== project.currentFile && !isProjectUnsaved) {
      openProjectFile(sourceID, id).catch(err => log.error(err));
    } else if (
      sourceID &&
      sourceID !== project.currentFile &&
      isProjectUnsaved
    ) {
      setSelectedSceneId(id);
      clearNavigationStack();
    } else {
      setSelectedSceneId(id);
      clearNavigationStack();
    }

    if (simulator.isRunning) {
      resumeSimulator();

      if (id) {
        sendSimulatorCommand(`!clear_and_goto ${id}`);
      }
    }
  };

  handleEdgeMouseEnter = edge => {
    if (!edge.source.data.scene) {
      return; // exit
    }

    const utterances = getUtterances(
      edge.source.data.scene,
      edge.target.data.scene
    );

    if (utterances) {
      const utterance = utterances[0];
      const { x, y } = getSvgElementCenter(this.svgRoot, d3.event.target);

      // yes I know this is bad in React,
      // but I don't want to render the whole map
      this.tooltip.style.left = `${x}px`;
      this.tooltip.style.top = `${y}px`;
      this.tooltip.classList.remove(styles.say);
      this.tooltip.classList.add(styles.hear);
      this.tooltip.textContent = utterance;
    }
  };

  handleEdgeMouseLeave = () => {
    // yes I know this is bad in React,
    // but I don't want to render the whole map
    this.tooltip.classList.remove(styles.hear);
    this.tooltip.textContent = '';
  };

  handleNodeMouseEnter = node => {
    const { x, y } = getSvgElementCenter(this.svgRoot, d3.event.target);

    // yes I know this is bad in React,
    // but I don't want to render the whole map
    this.tooltip.style.left = `${x}px`;
    this.tooltip.style.top = `${y}px`;
    this.tooltip.classList.remove(styles.hear);
    this.tooltip.classList.add(styles.say);
    this.toolbarMessage.textContent = node.data.id;
    this.tooltip.innerHTML = node.data.scene ? textToHtml(node.data.scene.id) : '';

    if (node.data.scene && !_.isEmpty(node.data.scene.contents) && !_.isEmpty(node.data.scene.contents[0].narration)) {
      this.tooltip.innerHTML += '<hr/>' + textToHtml(node.data.scene.contents[0].narration);
    }
  };

  handleNodeMouseLeave = () => {
    // yes I know this is bad in React,
    // but I don't want to render the whole map
    this.toolbarMessage.textContent = this.previousSelectedSceneId;
    this.tooltip.classList.remove(styles.say);
    this.tooltip.textContent = '';
  };

  handleSceneToggle = () => {
    const { workspace } = this.props;
    const { selectedSceneId } = workspace;
    const isSelectedSceneCollapsed = this.collapsedNodeIds.has(selectedSceneId);

    if (isSelectedSceneCollapsed) {
      this.collapsedNodeIds.delete(selectedSceneId);
    } else {
      this.collapsedNodeIds.add(selectedSceneId);
    }

    this.forceUpdate();
    this.renderTree();
  };

  handleZoomEvent = () => {
    this.tooltip.textContent = '';
    this.map.attr('transform', d3.event.transform);
  };

  handleZoomToFit = () => {
    const { x, y, width, height } = this.map.node().getBBox();
    const fullWidth = this.svgRoot.clientWidth;
    const fullHeight = this.svgRoot.clientHeight;

    const scale = 0.9 / Math.max(width / fullWidth, height / fullHeight);
    const midX = x + width / 2;
    const midY = y + height / 2;

    d3.select(this.svgRoot)
      .call(this.zoom.scaleTo, scale)
      .call(this.zoom.translateTo, midX, midY);
  };

  handleExpandAll = () => {
    this.collapsedNodeIds = new Set();

    // rerender
    this.forceUpdate();
    this.renderTree();
    this.handleZoomToFit();
  };

  handleSceneFocus = () => {
    const { workspace } = this.props;
    const { selectedSceneId } = workspace;

    // collapse all scene nodes and find the selected scene node
    const selectedNode = this.root.descendants().reduce((acc, node) => {
      this.collapsedNodeIds.add(node.data.id);
      return node.data.id === selectedSceneId ? node : acc;
    }, null);

    // recursively reopen nodes from selected scene to root
    const openParent = node => {
      this.collapsedNodeIds.delete(node.data.id);
      if (node.parent) {
        openParent(node.parent);
      }
    };

    openParent(selectedNode.parent);

    // reset zoom
    d3.select(this.svgRoot).call(this.zoom.scaleTo, 1);
    // reset focus
    this.previousSelectedSceneId = null;
    // rerender
    this.forceUpdate();
    this.renderTree();
  };

  handleScenePlay = () => {
    const { workspace } = this.props;
    const { selectedSceneId } = workspace;
  };

  handleSceneAdd = selectedSceneId => {
    const { addNewChildScene } = this.props;
    addNewChildScene();
  };

  handleSceneDelete = () => {
    const { deleteScene, project, workspace, setSelectedSceneId } = this.props;
    const { selectedSceneId } = workspace;
    const {edges} = getGraphElements(project.json);

    const parentChildMap = getChildToParentMap(edges);
    const parentArray = parentChildMap.get(selectedSceneId);
    deleteScene(selectedSceneId);
    setSelectedSceneId(!parentArray ? 'start' : parentArray[0])
  };

  saveAfterUndo = debounce(() => {
    const { saveProjectFile } = this.props;
    saveProjectFile();
  }, 2000);

  handleSelectMenuOption = value => {
    if (value === 'create child scene') {
      this.handleSceneAdd();
    }
    if (value === 'delete scene') {
      this.handleSceneDelete();
    }
    if (value === 'best fit') {
      this.handleZoomToFit();
    }
    if (value === 'expand all') {
      this.handleExpandAll();
    }
    if (value === 'focus') {
      this.handleSceneFocus();
    }
    if (value === 'expand' || value === 'collapse') {
      this.handleSceneToggle();
    }
    if (value === 'undo edit') {
      this.handleUndoEdit();
    }
  };

  render() {
    const { workspace } = this.props;
    const { selectedSceneId } = workspace;
    const isSelectedSceneCollapsed = this.collapsedNodeIds.has(selectedSceneId);
    const {primaryMode } = workspace;

    // don't allow specific actions when in simulator mode
    const nodeActionItems = primaryMode === WorkspacePrimaryMode.Simulator ? [] : NODE_ACTION_ITEMS.concat({
      text: isSelectedSceneCollapsed ? 'Expand' : 'Collapse',
      value: isSelectedSceneCollapsed ? 'expand' : 'collapse',
      icon: isSelectedSceneCollapsed ? 'folder open outline' : 'folder outline',
      description: isSelectedSceneCollapsed
        ? 'Expand all children'
        : 'Collapse all children'
    });

    return (
      <div className={styles.container}>
        {/* canvas */}
        <div className={styles.canvas}>
          <svg
            width="100%"
            height="100%"
            preserveAspectRatio="xMaxYMin"
            ref={el => {
              this.svgRoot = el;
            }}
          >
            <g
              ref={el => {
                this.svgGroup = el;
              }}
            >
              <g
                ref={el => {
                  this.edgeContainer = el;
                }}
              />
              <g
                ref={el => {
                  this.nodeContainer = el;
                }}
              />
            </g>
          </svg>
        </div>

        {/* tooltip */}
        <div
          className={styles.tooltip}
          ref={el => {
            this.tooltip = el;
          }}
        />

        {/* toolbar */}
        <div className={styles.toolbar}>
          <div
            className={styles.toolbarMessage}
            ref={el => {
              this.toolbarMessage = el;
            }}
          >
            {selectedSceneId}
          </div>

          {nodeActionItems.map(props => (
            <Popup
              size="tiny"
              content={props.description}
              key={props.text}
              position="top center"
              trigger={
                <Button
                  className={styles.toolboxButton}
                  compact
                  icon={props.icon}
                  onClick={() => this.handleSelectMenuOption(props.value)}
                />
              }
            />
          ))}
          <div
            style={{
              width: '1px',
              height: '90%',
              margin: '2px 0',
              background: '#eee'
            }}
          >
            &nbsp;
          </div>
          {MAP_ACTION_ITEMS.map(props => (
            <Popup
              size="tiny"
              content={props.description}
              key={props.text}
              position="top center"
              trigger={
                <Button
                  className={styles.toolboxButton}
                  compact
                  icon={props.icon}
                  onClick={() => this.handleSelectMenuOption(props.value)}
                />
              }
            />
          ))}
        </div>
      </div>
    );
  }
}

WorkspaceGraphD3Tree.propTypes = {
  project: PropTypes.object.isRequired,
  workspace: PropTypes.object.isRequired,
  simulator: PropTypes.object.isRequired,
  resumeSimulator: PropTypes.func.isRequired,
  sendSimulatorCommand: PropTypes.func.isRequired,
  setSelectedSceneId: PropTypes.func.isRequired,
  clearNavigationStack: PropTypes.func.isRequired,
  addNewChildScene: PropTypes.func.isRequired,
  deleteScene: PropTypes.func.isRequired,
  saveProjectFile: PropTypes.func.isRequired,
  isProjectUnSaved: PropTypes.func.isRequired
};

export default WorkspaceGraphD3Tree;
