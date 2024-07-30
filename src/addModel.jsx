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
} from 'reactflow';
import 'reactflow/dist/style.css';

const initialNodes = [
  {
    id: '1',
    data: { label: 'Node 1', handles: [{ id: 'a', label: 'A' }] },
    position: { x: 0, y: 0 },
    type: 'custom',
    width: 150,
    height: 100,
  },
];

const initialEdges = [];

const CustomNode = ({ id, data }) => {
  const nodeHeight = Math.max(80, 40 + data.handles.length * 20);

  return (
    <div
      style={{
        backgroundColor: '#0f172a',
        color: '#fff',
        padding: 10,
        borderRadius: 5,
        width: 150,
        height: nodeHeight,
        position: 'relative',
      }}
    >
      {data.label}
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#555' }}
      />
      {data.handles.map((handle, index) => (
        <Handle
          key={handle.id}
          type="source"
          position={Position.Right}
          id={handle.id}
          style={{
            top: `${(index + 1) * (100 / (data.handles.length + 1))}%`,
            background: '#555',
          }}
          data-nodeid={id}
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
  const offset = Math.random() * 40 - 20;
  const path = `M${sourceX},${sourceY} C${midX + offset},${sourceY} ${
    midX - offset
  },${targetY} ${targetX},${targetY}`;

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

const HandleCountModal = ({ isOpen, onClose, onSave }) => {
  const [count, setCount] = useState(1);

  const handleSave = () => {
    onSave(count);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal">
      <h2>Set Handle Count</h2>
      <input
        type="number"
        value={count}
        onChange={(e) =>
          setCount(Math.max(1, Math.min(26, parseInt(e.target.value))))
        }
        min="1"
        max="26"
      />
      <button onClick={handleSave}>Create Node</button>
      <button onClick={onClose}>Cancel</button>
    </div>
  );
};

function FlowApp() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [handleCountModalOpen, setHandleCountModalOpen] = useState(false);
  const [selectedSourceInfo, setSelectedSourceInfo] = useState(null);

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

  const onConnectStart = useCallback((_, { nodeId, handleId }) => {
    setSelectedSourceInfo({ nodeId, handleId });
    setHandleCountModalOpen(true);
  }, []);

  const autoArrange = () => {
    const levelNodes = {};
    const rootNodeId = '1';

    const arrangeNodes = (nodeId, level = 0) => {
      if (!levelNodes[level]) {
        levelNodes[level] = [];
      }

      levelNodes[level].push(nodeId);

      const connectedEdges = edges.filter((edge) => edge.source === nodeId);
      connectedEdges.forEach((edge) => arrangeNodes(edge.target, level + 1));
    };

    arrangeNodes(rootNodeId);

    const updatedNodes = nodes.map((node) => {
      const level = Object.keys(levelNodes).find((level) =>
        levelNodes[level].includes(node.id)
      );
      const index = levelNodes[level].indexOf(node.id);

      return {
        ...node,
        position: {
          x: level * 200,
          y: index * 150,
        },
      };
    });

    setNodes(updatedNodes);
  };

  const getNewNodePosition = (existingNodes, sourceNode, handleId) => {
    const yOffset = 150; // Vertical offset between nodes
    const xOffset = 200; // Horizontal offset between nodes
    let maxY = sourceNode.position.y + sourceNode.height;

    existingNodes.forEach((node) => {
      if (
        node.position.x === sourceNode.position.x + xOffset &&
        node.position.y >= maxY
      ) {
        maxY = node.position.y + yOffset;
      }
    });

    return { x: sourceNode.position.x + xOffset, y: maxY };
  };

  const handleCreateNewNode = useCallback(
    (handleCount) => {
      if (!selectedSourceInfo) return;

      const { nodeId: sourceNodeId, handleId: sourceHandleId } =
        selectedSourceInfo;
      const sourceNode = nodes.find((node) => node.id === sourceNodeId);
      if (!sourceNode) return;

      const handles = Array.from({ length: handleCount }, (_, i) => ({
        id: String.fromCharCode(97 + i),
        label: String.fromCharCode(97 + i).toUpperCase(),
      }));

      const newNodeId = `node-${nodes.length + 1}`;
      const newNodePosition = getNewNodePosition(
        nodes,
        sourceNode,
        sourceHandleId
      );
      const newNode = {
        id: newNodeId,
        data: { label: `Node ${nodes.length + 1}`, handles },
        position: newNodePosition,
        type: 'custom',
        height: Math.max(80, 40 + handles.length * 20),
        width: 150,
      };

      const newEdge = {
        id: `e${sourceNodeId}-${newNodeId}`,
        source: sourceNodeId,
        target: newNodeId,
        sourceHandle: sourceHandleId,
        targetHandle: handles[0].id,
        type: 'custom',
        markerEnd: { type: MarkerType.ArrowClosed },
        style: arrowStyle,
      };

      setNodes((nds) => [...nds, newNode]);
      setEdges((eds) => [...eds, newEdge]);

      setHandleCountModalOpen(false);
      setSelectedSourceInfo(null);
    },
    [nodes, selectedSourceInfo, setNodes, setEdges]
  );

  return (
    <div
      style={{ width: '100vw', height: '100vh', backgroundColor: '#334155' }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onConnectStart={onConnectStart}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
      >
        <Controls />
        <Background color="#333" gap={16} />
      </ReactFlow>
      <HandleCountModal
        isOpen={handleCountModalOpen}
        onClose={() => setHandleCountModalOpen(false)}
        onSave={handleCreateNewNode}
      />
      <button
        onClick={autoArrange}
        style={{
          position: 'absolute',
          top: 10,
          left: 10,
          zIndex: 10,
          padding: '10px 20px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
        }}
      >
        Auto Arrange
      </button>
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
