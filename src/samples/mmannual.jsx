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
      const { clientX, clientY } = event;
      data.addNode(id, handleId, clientX, clientY);
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
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
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
  const [visibleNodes, setVisibleNodes] = useState(new Set(['1']));
  const [visibleEdges, setVisibleEdges] = useState([]);
  const { fitView } = useReactFlow();

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
    const HORIZONTAL_SPACING = 300;
    const VERTICAL_SPACING = 150;
    const HANDLE_OFFSET = 50;

    const positionNode = (nodeId, parentX = 0, parentY = 0, handle = 'b') => {
      const node = nodeMap.get(nodeId);
      const level = levels.get(nodeId);
      const children = childrenMap.get(nodeId) || [];

      // Calculate horizontal position
      const x = parentX + HORIZONTAL_SPACING;

      // Calculate vertical position
      let y = parentY;
      if (handle === 'a') y -= HANDLE_OFFSET;
      if (handle === 'c') y += HANDLE_OFFSET;

      node.position = { x, y };

      // Position children
      children.forEach((child, index) => {
        positionNode(child.id, x, y, child.handle);
      });
    };

    positionNode('1'); // Start with the root node

    return Array.from(nodeMap.values());
  }, []);

  const applyLayout = useCallback(
    (layoutNodes, layoutEdges) => {
      const newNodes = customLayout(layoutNodes, layoutEdges);
      setNodes(newNodes);
      setEdges(layoutEdges);
      fitView({ padding: 0.2, duration: 800 });
    },
    [setNodes, setEdges, fitView, customLayout]
  );

  useEffect(() => {
    applyLayout(nodes, edges);
  }, []); // Run once on mount

  useEffect(() => {
    const filteredEdges = edges.filter(
      (edge) => visibleNodes.has(edge.source) && visibleNodes.has(edge.target)
    );
    setVisibleEdges(filteredEdges);
  }, [edges, visibleNodes]);

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
    (sourceNodeId, handleId, clientX, clientY) => {
      const sourceNode = nodes.find((node) => node.id === sourceNodeId);
      if (!sourceNode) return;

      const newNodeId = `node-${nodes.length + 1}`;
      const newNode = {
        id: newNodeId,
        data: {
          label: `Node ${nodes.length + 1}`,
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

      setVisibleNodes((visible) => new Set([...visible, newNodeId]));

      // Apply layout after adding new node and edge
      setTimeout(() => {
        applyLayout([...nodes, newNode], [...edges, newEdge]);
      }, 10);
    },
    [nodes, edges, setNodes, setEdges, applyLayout]
  );

  const autoReArrange = useCallback(() => {
    applyLayout(nodes, edges);
  }, [nodes, edges, applyLayout]);

  return (
    <div
      style={{ width: '100vw', height: '100vh', backgroundColor: '#334155' }}
    >
      <ReactFlow
        nodes={nodes.map((node) => ({
          ...node,
          data: { ...node.data, addNode },
          hidden: !visibleNodes.has(node.id),
        }))}
        edges={visibleEdges}
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
          backgroundColor: 'white',
          padding: '10px',
          borderRadius: '5px',
          boxShadow: '0 0 10px rgba(0,0,0,0.3)',
        }}
      >
        <button onClick={autoReArrange}>Auto arrange</button>
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
