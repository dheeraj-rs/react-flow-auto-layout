import React, { useMemo } from 'react';
import { useReactFlow } from 'reactflow';

export function useAutoArrange(initialNodes, initialEdges, setNodes) {
  const { fitView, getViewport } = useReactFlow();

  const sortChildrenMap = (childrenMap) => {
    return new Map(
      Array.from(childrenMap).map(([key, children]) => [
        key,
        children.sort((a, b) => parseInt(a.handle) - parseInt(b.handle)),
      ])
    );
  };

  const customLayout = (layoutNodes, layoutEdges) => {
    if (!layoutNodes || layoutNodes.length === 0) return [];

    const nodeMap = new Map(layoutNodes.map((node) => [node.id, { ...node }]));
    const childrenMap = new Map();

    layoutEdges.forEach((edge) => {
      if (!childrenMap.has(edge.source)) {
        childrenMap.set(edge.source, []);
      }
      childrenMap
        .get(edge.source)
        .push({ id: edge.target, handle: edge.sourceHandle });
    });

    const sortedChildrenMap = sortChildrenMap(childrenMap);
    const levels = new Map();

    const determineLevel = (nodeId, level = 0) => {
      levels.set(nodeId, Math.max(level, levels.get(nodeId) || 0));
      (sortedChildrenMap.get(nodeId) || []).forEach((child) =>
        determineLevel(child.id, level + 1)
      );
    };

    determineLevel('1');

    const NODE_WIDTH = 150;
    const BASE_NODE_HEIGHT = 60;
    const HORIZONTAL_SPACING = NODE_WIDTH * 1.8;
    const VERTICAL_SPACING = 40;

    const getNodeHeight = (node) =>
      Math.max(BASE_NODE_HEIGHT, (node.data.sourceHandles?.length || 1) * 40);

    const positionNode = (nodeId, x = 0, y = 0) => {
      const node = nodeMap.get(nodeId);
      if (!node) return 0;

      const children = sortedChildrenMap.get(nodeId) || [];
      const nodeHeight = getNodeHeight(node);

      node.position = { x, y };

      if (children.length === 0) return nodeHeight;

      let totalHeight = 0;
      children.forEach((child) => {
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

    positionNode('1');

    return Array.from(nodeMap.values());
  };

  const applyLayout = () => {
    const newNodes = customLayout(initialNodes, initialEdges);
    setNodes(newNodes);

    // Optional: Adjust the viewport only if needed, e.g., ensure nodes are visible
    // If not needed, simply remove this line
    const { zoom, x, y } = getViewport();
    fitView({ x, y, zoom, duration: 800 });
  };

  return useMemo(
    () => ({ applyLayout, customLayout }),
    [initialNodes, initialEdges, setNodes]
  );
}
