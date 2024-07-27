import React, { useCallback, useEffect, useState, useRef } from 'react';
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
      {['a', 'b', 'c', 'd'].map((handleId, index) => (
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
  const midX = (sourceX + targetX) / 2;

  const offset = Math.random() * 20 - 10; // Random offset to avoid overlap
  const path = `M${sourceX},${sourceY} L${midX + offset},${sourceY} L${
    midX + offset
  },${targetY} L${targetX},${targetY}`;

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
  const { fitView, getViewport } = useReactFlow();
  const [shouldArrange, setShouldArrange] = useState(false);
  const layoutAppliedRef = useRef(false);
  const [edgeDragging, setEdgeDragging] = useState(false); // To track if an edge is being dragged

  const sortChildrenMap = useCallback((childrenMap) => {
    const sortedMap = new Map();

    for (const [key, children] of childrenMap.entries()) {
      const sortedChildren = children.sort((a, b) =>
        a.handle.localeCompare(b.handle)
      );
      sortedMap.set(key, sortedChildren);
    }

    return sortedMap;
  }, []);

  const customLayout = useCallback(
    (nodes, edges) => {
      const nodeMap = new Map(nodes.map((node) => [node.id, { ...node }]));
      const childrenMap = new Map();

      edges.forEach((edge) => {
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
        const children = sortedChildrenMap.get(nodeId) || [];
        children.forEach((child) => determineLevel(child.id, level + 1));
      };

      determineLevel('1');

      const NODE_WIDTH = 150;
      const NODE_HEIGHT = 50;
      const HORIZONTAL_SPACING = NODE_WIDTH * 1;
      const VERTICAL_SPACING = NODE_HEIGHT * 1;

      const positionNode = (nodeId, x = 0, y = 0, level = 0) => {
        const node = nodeMap.get(nodeId);
        const children = sortedChildrenMap.get(nodeId) || [];

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

        node.position.y += (totalHeight - VERTICAL_SPACING - NODE_HEIGHT) / 2;

        return totalHeight;
      };

      positionNode('1');

      return Array.from(nodeMap.values());
    },
    [sortChildrenMap]
  );

  const applyLayout = useCallback(() => {
    if (layoutAppliedRef.current) return; // Avoid applying layout if it's already applied

    const newNodes = customLayout(nodes, edges);
    setNodes(newNodes);
    fitView({ padding: 0.2 });
    layoutAppliedRef.current = true; // Mark layout as applied
  }, [nodes, edges, setNodes, fitView, customLayout]);

  useEffect(() => {
    if (shouldArrange) {
      layoutAppliedRef.current = false; // Reset layout applied status
      applyLayout();
      setShouldArrange(false);
    }
  }, [shouldArrange, applyLayout]);

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

      // Schedule layout update after adding nodes and edges
      requestAnimationFrame(() => {
        setShouldArrange(true);
      });

      // Focus the new node
      requestAnimationFrame(() => {
        fitView({ padding: 0.2, nodes: [newNode] });
        // Get viewport to focus on the new node
        const { zoom } = getViewport();
        fitView({ nodes: [newNode], zoom });
      });
    },
    [nodes, setNodes, setEdges, fitView, getViewport]
  );

  const handleAutoArrange = () => {
    setShouldArrange(true);
  };

  const onConnect = useCallback(
    (params) => {
      // Only add valid edges and prevent displaying dragging line
      if (params.source && params.target) {
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
        setEdgeDragging(false); // Edge connection completed
      }
    },
    [setEdges]
  );

  const onConnectStart = useCallback(() => {
    setEdgeDragging(true); // Start edge dragging
  }, []);

  const onConnectEnd = useCallback(() => {
    if (edgeDragging) {
      setEdgeDragging(false); // End edge dragging
    }
  }, [edgeDragging]);

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
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
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
