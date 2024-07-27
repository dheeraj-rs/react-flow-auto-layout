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
  SmoothStepEdge,
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

  // Use a larger offset to avoid overlap
  // const offset = Math.random() * 40 - 20; // Larger offset range
  // const path = `M${sourceX},${sourceY} Q${midX + offset},${
  //   (sourceY + targetY) / 2
  // },${targetX},${targetY}`;

  const offset = Math.random() * 40 - 10; // Random offset to avoid overlap
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
  custom: SmoothStepEdge,
  //   custom: CustomEdge,
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
  const layoutAppliedRef = useRef(false);
  const [edgeDragging, setEdgeDragging] = useState(false); // To track if an edge is being dragged

  const ZOOM_LEVEL = 1; // Adjust this value as needed

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
      const NODE_HEIGHT = 40;
      const HORIZONTAL_SPACING = NODE_WIDTH * 1.5; // Increased spacing
      const VERTICAL_SPACING = NODE_HEIGHT * 1; // Increased spacing

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
    const ZOOM_LEVEL = 0.7; // Adjust this value as needed

    if (layoutAppliedRef.current) return;
    const newNodes = customLayout(nodes, edges);
    setNodes(newNodes);
    fitView({ padding: 0.2, minZoom: ZOOM_LEVEL, maxZoom: ZOOM_LEVEL });
    layoutAppliedRef.current = true;
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

      const updatedNodes = [...nodes, newNode];
      const updatedEdges = [...edges, newEdge];

      // Apply layout immediately
      const arrangedNodes = customLayout(updatedNodes, updatedEdges);

      setNodes(arrangedNodes);
      setEdges(updatedEdges);

      // Highlight and focus on the new node
      setTimeout(() => {
        const lastNode = arrangedNodes[arrangedNodes.length - 1];
        fitView({
          nodes: [lastNode],
          duration: 500,
          padding: 0.2,
          minZoom: ZOOM_LEVEL,
          maxZoom: ZOOM_LEVEL,
        });

        // Optionally, you can add a visual highlight to the new node
        setNodes((nds) =>
          nds.map((node) =>
            node.id === lastNode.id
              ? {
                  ...node,
                  style: { ...node.style, boxShadow: '0 0 10px #ff0' },
                }
              : node
          )
        );

        // Remove the highlight after a short delay
        setTimeout(() => {
          setNodes((nds) =>
            nds.map((node) =>
              node.id === lastNode.id
                ? { ...node, style: { ...node.style, boxShadow: 'none' } }
                : node
            )
          );
        }, 1000); // Remove highlight after 1 second
      }, 0);
    },
    [nodes, edges, setNodes, setEdges, customLayout, fitView]
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
