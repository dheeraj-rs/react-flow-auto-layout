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
    data: {
      label: 'Node 1',
      showModal: null,
      sourceHandles: ['a'],
    },
    position: { x: 0, y: 0 },
    type: 'custom',
    style: { backgroundColor: '#0f172a', color: '#fff' },
  },
];

const initialEdges = [];

const CustomNode = ({ id, data }) => {
  const handleShowModal = useCallback(
    (handleId, event) => {
      event.preventDefault();
      const rect = event.target.getBoundingClientRect();
      const position = { x: rect.left, y: rect.top };
      data.showModal(id, handleId, position);
    },
    [id, data]
  );

  const nodeHeight = Math.max(60, data.sourceHandles.length * 40); // Minimum height of 60px, 40px per handle
  const nodePadding = 10;
  const handleSize = 24;

  return (
    <div
      style={{
        backgroundColor: '#0f172a',
        color: '#fff',
        padding: nodePadding,
        borderRadius: 5,
        position: 'relative',
        width: '150px',
        height: `${nodeHeight}px`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <div style={{ marginBottom: '10px' }}>{data.label}</div>
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#555', left: '-8px' }}
      />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
        }}
      >
        {data.sourceHandles.map((handleId, index) => (
          <div
            key={handleId}
            style={{
              width: handleSize,
              height: handleSize,
              borderRadius: '50%',
              backgroundColor: '#555',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              cursor: 'pointer',
              margin: '4px 0',
              position: 'relative',
            }}
            onMouseDown={(event) => handleShowModal(handleId, event)}
          >
            <div
              style={{
                fontSize: '18px',
                color: '#fff',
                lineHeight: `${handleSize}px`,
              }}
            >
              +
            </div>
            <Handle
              type="source"
              position={Position.Right}
              id={handleId}
              style={{
                opacity: 0,
                width: '100%',
                height: '100%',
                background: 'transparent',
                border: 'none',
                right: '-8px',
              }}
            />
          </div>
        ))}
      </div>
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
  const offset = Math.random() * 40 - 10;
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

const Modal = ({ isOpen, onClose, onConfirm, position }) => {
  const [handleCount, setHandleCount] = useState(1);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: position.y,
        left: position.x,
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '5px',
        boxShadow: '0 0 10px rgba(0,0,0,0.3)',
        zIndex: 1000,
      }}
    >
      <h2>Add New Node</h2>
      <div>
        <label>
          Number of source handles:
          <input
            type="number"
            min="1"
            max="26"
            value={handleCount}
            onChange={(e) =>
              setHandleCount(
                Math.min(26, Math.max(1, parseInt(e.target.value) || 1))
              )
            }
          />
        </label>
      </div>
      <button onClick={() => onConfirm(handleCount)}>Create</button>
      <button onClick={onClose}>Cancel</button>
    </div>
  );
};

function FlowApp() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { fitView } = useReactFlow();

  const [shouldArrange, setShouldArrange] = useState(false);
  const layoutAppliedRef = useRef(false);
  const [edgeDragging, setEdgeDragging] = useState(false);
  const [modalState, setModalState] = useState({
    isOpen: false,
    sourceNodeId: null,
    handleId: null,
    position: null,
  });

  const ZOOM_LEVEL = 1;

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
      if (!nodes || nodes.length === 0) return [];

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
      const BASE_NODE_HEIGHT = 60;
      const HORIZONTAL_SPACING = NODE_WIDTH * 1.8;
      const VERTICAL_SPACING = 40;

      const getNodeHeight = (node) => {
        return Math.max(
          BASE_NODE_HEIGHT,
          (node.data.sourceHandles?.length || 1) * 40
        );
      };

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

        // Adjust parent node position to be centered relative to its children
        if (children.length > 0) {
          node.position.y += (totalHeight - VERTICAL_SPACING - nodeHeight) / 2;
        }

        return Math.max(totalHeight, nodeHeight);
      };

      positionNode('1');

      return Array.from(nodeMap.values());
    },
    [sortChildrenMap]
  );

  const applyLayout = useCallback(() => {
    if (layoutAppliedRef.current) return;
    const newNodes = customLayout(nodes, edges);
    setNodes(newNodes);
    fitView({ padding: 0.2, minZoom: ZOOM_LEVEL, maxZoom: ZOOM_LEVEL });
    layoutAppliedRef.current = true;
  }, [nodes, edges, setNodes, fitView, customLayout]);

  useEffect(() => {
    if (shouldArrange) {
      layoutAppliedRef.current = false;
      applyLayout();
      setShouldArrange(false);
    }
  }, [shouldArrange, applyLayout]);

  const showModal = useCallback((sourceNodeId, handleId, position) => {
    setModalState({ isOpen: true, sourceNodeId, handleId, position });
  }, []);

  const addNode = useCallback(
    (handleCount) => {
      const { sourceNodeId, handleId } = modalState;
      const newNodeId = `node-${nodes.length + 1}`;
      const sourceHandles = Array.from({ length: handleCount }, (_, i) =>
        String.fromCharCode(97 + i)
      );

      const nodeHeight = Math.max(40, handleCount * 20); // Minimum height of 40px, 20px per handle

      const newNode = {
        id: newNodeId,
        data: {
          label: `Node ${nodes.length + 1}`,
          showModal,
          parentHandle: handleId,
          sourceHandles,
        },
        position: { x: 0, y: 0 },
        type: 'custom',
        style: {
          backgroundColor: '#0f172a',
          color: '#fff',
          height: `${nodeHeight}px`,
        },
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

      const arrangedNodes = customLayout(updatedNodes, updatedEdges);

      setNodes(arrangedNodes);
      setEdges(updatedEdges);

      setModalState({
        isOpen: false,
        sourceNodeId: null,
        handleId: null,
        position: null,
      });

      setTimeout(() => {
        const lastNode = arrangedNodes[arrangedNodes.length - 1];
        fitView({
          nodes: [lastNode],
          duration: 500,
          padding: 0.2,
          minZoom: ZOOM_LEVEL,
          maxZoom: ZOOM_LEVEL,
        });

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

        setTimeout(() => {
          setNodes((nds) =>
            nds.map((node) =>
              node.id === lastNode.id
                ? { ...node, style: { ...node.style, boxShadow: 'none' } }
                : node
            )
          );
        }, 1000);
      }, 0);
    },
    [nodes, edges, setNodes, setEdges, customLayout, fitView, modalState]
  );

  const handleAutoArrange = () => {
    setShouldArrange(true);
  };

  const onConnect = useCallback(
    (params) => {
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
        setEdgeDragging(false);
      }
    },
    [setEdges]
  );

  const onConnectStart = useCallback(() => {
    setEdgeDragging(true);
  }, []);

  const onConnectEnd = useCallback(() => {
    if (edgeDragging) {
      setEdgeDragging(false);
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
      <Modal
        isOpen={modalState.isOpen}
        onClose={() =>
          setModalState({
            isOpen: false,
            sourceNodeId: null,
            handleId: null,
            position: null,
          })
        }
        onConfirm={addNode}
        position={modalState.position || { x: 0, y: 0 }}
      />
      <ReactFlow
        nodes={nodes.map((node) => ({
          ...node,
          data: { ...node.data, showModal },
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
