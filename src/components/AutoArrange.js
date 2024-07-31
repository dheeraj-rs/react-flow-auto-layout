import React, { useCallback } from 'react';
import { useReactFlow } from 'reactflow';
import { ZOOM_LEVEL } from './utils';

export function useAutoArrange(nodes, edges, setNodes) {
  const { fitView } = useReactFlow();

  const sortChildrenMap = useCallback((childrenMap) => {
    const sortedMap = new Map();
    for (const [key, children] of childrenMap.entries()) {
      const sortedChildren = children.sort(
        (a, b) => parseInt(a.handle) - parseInt(b.handle)
      );
      sortedMap.set(key, sortedChildren);
    }
    return sortedMap;
  }, []);

  const customLayout = useCallback(
    (nodes, edges) => {
      // If there are no nodes, return an empty array
      if (!nodes || nodes.length === 0) return [];

      // Create a map of nodes for quick access
      const nodeMap = new Map(nodes.map((node) => [node.id, { ...node }]));

      // Create a map to store children of each node
      const childrenMap = new Map();

      // Populate the childrenMap based on edges
      edges.forEach((edge) => {
        if (!childrenMap.has(edge.source)) {
          childrenMap.set(edge.source, []);
        }
        childrenMap
          .get(edge.source)
          .push({ id: edge.target, handle: edge.sourceHandle });
      });

      // Sort the children map for consistent layout
      const sortedChildrenMap = sortChildrenMap(childrenMap);

      // Create a map to store the level of each node
      const levels = new Map();

      // Recursive function to determine the level of each node
      const determineLevel = (nodeId, level = 0) => {
        levels.set(nodeId, Math.max(level, levels.get(nodeId) || 0));
        const children = sortedChildrenMap.get(nodeId) || [];
        children.forEach((child) => determineLevel(child.id, level + 1));
      };

      // Start determining levels from the root node (id: '1')
      determineLevel('1');

      // Define layout constants
      const NODE_WIDTH = 150;
      const BASE_NODE_HEIGHT = 60;
      const HORIZONTAL_SPACING = NODE_WIDTH * 1.8;
      const VERTICAL_SPACING = 40;

      // Function to calculate node height based on number of handles
      const getNodeHeight = (node) => {
        return Math.max(
          BASE_NODE_HEIGHT,
          (node.data.sourceHandles?.length || 1) * 40
        );
      };

      // Recursive function to position nodes
      const positionNode = (nodeId, x = 0, y = 0) => {
        const node = nodeMap.get(nodeId);
        if (!node) return 0;

        const children = sortedChildrenMap.get(nodeId) || [];
        const nodeHeight = getNodeHeight(node);

        node.position = { x, y };

        if (children.length === 0) return nodeHeight;

        let totalHeight = 0;
        children.forEach((child, index) => {
          const childNode = nodeMap.get(child.id);
          const childHeight = getNodeHeight(childNode);
          const childTotalHeight = positionNode(
            child.id,
            x + HORIZONTAL_SPACING,
            y + totalHeight
          );
          totalHeight +=
            Math.max(childHeight, childTotalHeight) + VERTICAL_SPACING;
        });

        if (children.length > 0) {
          node.position.y += (totalHeight - VERTICAL_SPACING - nodeHeight) / 2;
        }

        return Math.max(totalHeight, nodeHeight);
      };

      // Start positioning from the root node
      positionNode('1');

      // Return the array of positioned nodes
      return Array.from(nodeMap.values());
    },
    [sortChildrenMap]
  );

  const applyLayout = useCallback(() => {
    const newNodes = customLayout(nodes, edges);
    setNodes(newNodes);
    fitView({ padding: 0.2, minZoom: ZOOM_LEVEL, maxZoom: ZOOM_LEVEL });
  }, [nodes, edges, setNodes, fitView, customLayout]);

  return { applyLayout, customLayout };
}

export function AutoArrangeButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        zIndex: 4,
        padding: '5px 10px',
        backgroundColor: '#0f172a',
        color: '#fff',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
      }}
    >
      Auto Arrange
    </button>
  );
}
