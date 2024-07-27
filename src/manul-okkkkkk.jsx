import React, { useCallback, useState } from 'react';
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
  getBezierPath,
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
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}) => {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <path
      id={id}
      style={style}
      className="react-flow__edge-path"
      d={edgePath}
      markerEnd={markerEnd}
    />
  );
};

const edgeTypes = {
  custom: CustomEdge,
};

const arrowStyle = {
  stroke: '#94a3b8',
  strokeWidth: 2,
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
  const [nextNodeId, setNextNodeId] = useState(2);

  const customLayout = useCallback((nodes, edges) => {
    const nodeMap = new Map(nodes.map((node) => [node.id, { ...node }]));
    const childrenMap = new Map();
    const levels = new Map();

    // Build the tree structure and determine levels
    edges.forEach((edge) => {
      if (!childrenMap.has(edge.source)) {
        childrenMap.set(edge.source, []);
      }
      childrenMap
        .get(edge.source)
        .push({ id: edge.target, handle: edge.sourceHandle });
    });

    const determineLevel = (nodeId, level = 0) => {
      levels.set(nodeId, Math.max(level, levels.get(nodeId) || 0));
      const children = childrenMap.get(nodeId) || [];
      children.forEach((child) => determineLevel(child.id, level + 1));
    };

    determineLevel('1'); // Start with the root node

    // Calculate positions
    const NODE_WIDTH = 150;
    const NODE_HEIGHT = 50;
    const HORIZONTAL_SPACING = NODE_WIDTH * 2;
    const VERTICAL_SPACING = NODE_HEIGHT * 2;

    const positionNode = (nodeId, x = 0, y = 0, level = 0) => {
      const node = nodeMap.get(nodeId);
      const children = childrenMap.get(nodeId) || [];

      node.position = { x, y };

      if (children.length === 0) return NODE_HEIGHT;

      let totalHeight = 0;
      children.forEach((child, index) => {
        const childHeight = positionNode(
          child.id,
          x + HORIZONTAL_SPACING,
          y + totalHeight,
          level + 1
        );
        totalHeight += childHeight + VERTICAL_SPACING;
      });

      // Center the parent node vertically relative to its children
      node.position.y += (totalHeight - VERTICAL_SPACING - NODE_HEIGHT) / 2;

      return totalHeight;
    };

    positionNode('1');

    return Array.from(nodeMap.values());
  }, []);

  const applyLayout = useCallback(() => {
    const newNodes = customLayout(nodes, edges);
    setNodes(newNodes);
    setTimeout(() => fitView({ padding: 0.2 }), 50);
  }, [nodes, edges, setNodes, fitView, customLayout]);

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
      const newNodeId = `${nextNodeId}`;
      setNextNodeId(nextNodeId + 1);
      const newNode = {
        id: newNodeId,
        data: {
          label: `Node ${newNodeId}`,
          addNode,
          parentHandle: handleId,
        },
        position: { x: 0, y: 0 }, // Position will be set by layout function
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
    },
    [nextNodeId, setNodes, setEdges]
  );

  return (
    <div
      style={{ width: '100vw', height: '100vh', backgroundColor: '#334155' }}
    >
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
      <div
        style={{
          position: 'absolute',
          right: 10,
          top: 10,
          zIndex: 4,
        }}
      >
        <button
          onClick={applyLayout}
          style={{ padding: '10px', fontSize: '16px' }}
        >
          Auto Arrange
        </button>
      </div>
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
