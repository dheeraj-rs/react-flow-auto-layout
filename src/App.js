import React, { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  ReactFlowProvider,
  Handle,
  Position,
  MarkerType,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';

const initialNodes = [
  {
    id: '1',
    data: { label: 'Node 1', addNode: null },
    position: { x: 0, y: 0 },
    type: 'custom',
    style: { backgroundColor: '#0f172a', color: '#fff' },
  },
];

const initialEdges = [];

const CustomNode = ({ id, data }) => {
  const handleAddNode = useCallback(
    (handleId, event) => {
      event.preventDefault();
      data.addNode(id, handleId);
    },
    [id, data]
  );

  return (
    <div
      style={{
        backgroundColor: '#0f172a',
        color: '#fff',
        padding: 10,
        borderRadius: 5,
        position: 'relative',
      }}
    >
      {data.label}
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#555' }}
      />
      {['a', 'b', 'c'].map((handleId, index) => (
        <Handle
          key={handleId}
          type="source"
          position={Position.Right}
          id={handleId}
          style={{ top: `${25 + 25 * index}%`, background: '#555' }}
          onMouseDown={(event) => handleAddNode(handleId, event)}
        />
      ))}
    </div>
  );
};

const CustomEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style = {},
  markerEnd,
}) => {
  const midX = (sourceX + targetX) / 2;

  const path = `M${sourceX},${sourceY} L${midX},${sourceY} L${midX},${targetY} L${targetX},${targetY}`;

  return (
    <path
      id={id}
      style={style}
      className="react-flow__edge-path"
      d={path}
      markerEnd={markerEnd}
    />
  );
};

const edgeTypes = {
  custom: CustomEdge,
};

const arrowStyle = {
  stroke: '#94a3b8',
  strokeWidth: 1.5,
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: '#94a3b8',
  },
};

const nodeTypes = {
  custom: CustomNode,
};

function FlowApp() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { fitView } = useReactFlow();
  const [shouldArrange, setShouldArrange] = useState(false);

  // Function to sort the Map values based on the handle key
  function sortChildrenMap(childrenMap) {
    const sortedMap = new Map();

    for (const [key, children] of childrenMap.entries()) {
      // Sort the children array
      const sortedChildren = children.sort((a, b) =>
        a.handle.localeCompare(b.handle)
      );
      sortedMap.set(key, sortedChildren);
    }

    return sortedMap;
  }

  // Define a custom layout function using useCallback to memoize it
  const customLayout = useCallback((nodes, edges) => {
    // Create a map of nodes with their ids as keys for easy lookup
    const nodeMap = new Map(nodes.map((node) => [node.id, { ...node }]));
    // Create a map to store children of each node
    const childrenMap = new Map();

    // Build the tree structure by iterating through edges
    edges.forEach((edge) => {
      // Initialize the children array for the source node if not already present
      if (!childrenMap.has(edge.source)) {
        childrenMap.set(edge.source, []);
      }
      // Add the target node to the children array of the source node
      childrenMap
        .get(edge.source)
        .push({ id: edge.target, handle: edge.sourceHandle });
    });

    // Sort the childrenMap
    const sortedChildrenMap = sortChildrenMap(childrenMap);

    console.log('sortedChildrenMap : ', sortedChildrenMap);
    // Create a map to store levels of each node
    const levels = new Map();

    // Function to determine the level of each node
    const determineLevel = (nodeId, level = 0) => {
      // Set the level of the current node, ensuring it is the highest level encountered
      levels.set(nodeId, Math.max(level, levels.get(nodeId) || 0));
      // Get the children of the current node
      const children = sortedChildrenMap.get(nodeId) || [];
      // Recursively determine the level of each child node
      children.forEach((child) => determineLevel(child.id, level + 1));
    };

    // Start determining levels from the root node with id '1'
    determineLevel('1');

    // Constants for node dimensions and spacing
    const NODE_WIDTH = 150;
    const NODE_HEIGHT = 50;
    const HORIZONTAL_SPACING = NODE_WIDTH * 2;
    const VERTICAL_SPACING = NODE_HEIGHT * 2;

    // Function to calculate the position of each node
    const positionNode = (nodeId, x = 0, y = 0, level = 0) => {
      // Get the current node from the map
      const node = nodeMap.get(nodeId);
      // Get the children of the current node
      const children = sortedChildrenMap.get(nodeId) || [];

      // Set the position of the current node
      node.position = { x, y };

      // If the node has no children, return its height
      if (children.length === 0) return NODE_HEIGHT;

      let totalHeight = 0;
      // Iterate through the children and position each child node
      children.forEach((child, index) => {
        const childHeight = positionNode(
          child.id,
          x + HORIZONTAL_SPACING,
          y + totalHeight,
          level + 1
        );
        // Accumulate the total height of the children
        totalHeight += childHeight + VERTICAL_SPACING;
      });

      // Center the parent node vertically relative to its children
      node.position.y += (totalHeight - VERTICAL_SPACING - NODE_HEIGHT) / 2;

      return totalHeight;
    };

    // Start positioning nodes from the root node with id '1'
    positionNode('1');

    // Return the array of nodes with their updated positions
    return Array.from(nodeMap.values());
  }, []);

  // Define a function to apply the custom layout using useCallback to memoize it
  const applyLayout = useCallback(() => {
    // Generate the new layout of nodes using the customLayout function
    const newNodes = customLayout(nodes, edges);
    // Update the state with the newly positioned nodes
    setNodes(newNodes);
    // Fit the view to the new layout with a slight delay for rendering
    setTimeout(() => fitView({ padding: 0.2 }), 50);
  }, [nodes, edges, setNodes, fitView, customLayout]);

  useEffect(() => {
    if (shouldArrange) {
      applyLayout();
      setShouldArrange(false);
    }
  }, [shouldArrange, applyLayout]);

  const onConnect = useCallback(
    (params) => {
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: 'custom',
            markerEnd: { type: MarkerType.ArrowClosed },
            style: arrowStyle,
          },
          eds
        )
      );
    },
    [setEdges]
  );

  const addNode = useCallback(
    (sourceNodeId, handleId) => {
      const newNodeId = `node-${nodes.length + 1}`;
      const newNode = {
        id: newNodeId,
        data: {
          label: `Node ${nodes.length + 1}`,
          addNode,
          parentHandle: handleId,
        },
        position: { x: 0, y: 0 },
        type: 'custom',
        style: { backgroundColor: '#0f172a', color: '#fff' },
      };

      const newEdge = {
        id: `e${sourceNodeId}-${newNodeId}`,
        source: sourceNodeId,
        target: newNodeId,
        sourceHandle: handleId,
        type: 'custom',
        markerEnd: { type: MarkerType.ArrowClosed },
        style: arrowStyle,
      };

      setNodes((nds) => [...nds, newNode]);
      setEdges((eds) => [...eds, newEdge]);
      setShouldArrange(true);
    },
    [nodes, setNodes, setEdges]
  );

  const handleAutoArrange = () => {
    setShouldArrange(true);
  };

  return (
    <div
      style={{ width: '100vw', height: '100vh', backgroundColor: '#334155' }}
    >
      <button
        onClick={handleAutoArrange}
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
      <ReactFlow
        nodes={nodes.map((node) => ({
          ...node,
          data: { ...node.data, addNode },
        }))}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
      >
        <Controls />
        <Background color="#333" gap={16} />
      </ReactFlow>
    </div>
  );
}

function App() {
  return (
    <ReactFlowProvider>
      <FlowApp />
    </ReactFlowProvider>
  );
}

export default App;
