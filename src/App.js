import React, { useCallback, useState, useEffect } from 'react';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  ReactFlowProvider,
  MarkerType,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { arrowStyle, initialEdges, initialNodes } from './components/utils';
import { CustomNode } from './components/CustomNode';
import { CustomEdge } from './components/CustomEdge';
import { Modal } from './components/Modal';
import { useAutoArrange, AutoArrangeButton } from './components/AutoArrange';

const edgeTypes = {
  custom: CustomEdge,
};

const nodeTypes = {
  custom: CustomNode,
};

function FlowApp() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { fitView } = useReactFlow();

  const [modalState, setModalState] = useState({
    isOpen: false,
    sourceNodeId: null,
    handleId: null,
    position: null,
  });

  const { applyLayout, customLayout } = useAutoArrange(nodes, edges, setNodes);

  const showModal = useCallback((sourceNodeId, handleId, position) => {
    setModalState({ isOpen: true, sourceNodeId, handleId, position });
  }, []);

  useEffect(() => {
    const handleShowModal = (event) => {
      const { sourceNodeId, handleId, position } = event.detail;
      showModal(sourceNodeId, handleId, position);
    };

    window.addEventListener('showModal', handleShowModal);

    return () => {
      window.removeEventListener('showModal', handleShowModal);
    };
  }, [showModal]);

  const addNode = useCallback(
    (handleCount) => {
      const { sourceNodeId, handleId } = modalState;
      const newNodeId = `node-${nodes.length + 1}`;
      const sourceHandles = Array.from({ length: handleCount }, (_, i) =>
        (i + 1).toString()
      );
      const nodeHeight = Math.max(40, handleCount * 20);

      const newNode = {
        id: newNodeId,
        data: {
          label: `Node ${nodes.length + 1}`,
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
        const LAYOUT_ZOOM_LEVEL = 0.9;
        const lastNode = arrangedNodes[arrangedNodes.length - 1];
        fitView({
          nodes: [lastNode],
          duration: 500,
          padding: 0.2,
          minZoom: LAYOUT_ZOOM_LEVEL,
          maxZoom: LAYOUT_ZOOM_LEVEL,
        });
      }, 0);
    },
    [modalState, nodes, edges, setNodes, setEdges, fitView, customLayout]
  );

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
      }
    },
    [setEdges]
  );

  useEffect(() => {
    console.log('nodes : ', nodes);
  }, [nodes]);

  return (
    <div
      style={{ width: '100vw', height: '100vh', backgroundColor: '#334155' }}
    >
      <AutoArrangeButton onClick={applyLayout} />
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
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
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
