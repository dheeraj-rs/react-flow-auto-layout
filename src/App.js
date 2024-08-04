import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactFlow, {
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  ReactFlowProvider,
  MarkerType,
  useReactFlow,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { arrowStyle, initialEdges, initialNodes } from './components/utils';
import { CustomNode } from './components/CustomNode';
import { CustomEdge } from './components/CustomEdge';
import { Modal } from './components/Modal';
import { useAutoArrange } from './components/AutoArrange';
import {
  FaExpandArrowsAlt,
  FaSitemap,
  FaUndo,
  FaRedo,
  FaSearchPlus,
  FaSearchMinus,
} from 'react-icons/fa';
import { MdZoomOutMap } from 'react-icons/md';

const edgeTypes = {
  custom: CustomEdge,
};

const nodeTypes = {
  custom: CustomNode,
};

const INITIAL_ZOOM = 1;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.1;

function FlowApp() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { fitView, zoomTo, setViewport, getViewport } = useReactFlow();
  const [savedZoom, setSavedZoom] = useState(INITIAL_ZOOM);
  const [history, setHistory] = useState({ past: [], future: [] });
  const lastZoomRef = useRef(INITIAL_ZOOM);
  const lastViewportRef = useRef({ x: 0, y: 0, zoom: INITIAL_ZOOM });

  const [modalState, setModalState] = useState({
    isOpen: false,
    sourceNodeId: null,
    handleId: null,
    position: null,
  });

  const { applyLayout, customLayout } = useAutoArrange(nodes, edges, setNodes);

  const pushToHistory = useCallback(() => {
    setHistory((h) => ({
      past: [...h.past, { nodes, edges }],
      future: [],
    }));
  }, [nodes, edges]);

  const handleFitView = useCallback(() => {
    fitView({ duration: 800, padding: 0.2, maxZoom: 1 });
    lastZoomRef.current = getViewport().zoom;
  }, [fitView, getViewport]);

  const handleAutoArrange = useCallback(() => {
    pushToHistory();
    applyLayout();

    // Retain the current zoom level and viewport position
    const { x, y, zoom } = getViewport();
    setViewport({ x, y, zoom }, { duration: 0 });
  }, [applyLayout, pushToHistory, getViewport, setViewport]);

  const handleResetZoom = useCallback(() => {
    const { x, y, zoom } = lastViewportRef.current;
    setViewport({ x, y, zoom: savedZoom }, { duration: 800 });
    lastZoomRef.current = savedZoom;
  }, [setViewport, savedZoom]);

  const handleZoomIn = useCallback(() => {
    const newZoom = Math.min(lastZoomRef.current + ZOOM_STEP, MAX_ZOOM);
    zoomTo(newZoom, { duration: 300 });
    lastZoomRef.current = newZoom;
  }, [zoomTo]);

  const handleZoomOut = useCallback(() => {
    const newZoom = Math.max(lastZoomRef.current - ZOOM_STEP, MIN_ZOOM);
    zoomTo(newZoom, { duration: 300 });
    lastZoomRef.current = newZoom;
  }, [zoomTo]);

  const handleUndo = useCallback(() => {
    setHistory((h) => {
      if (h.past.length === 0) return h;
      const newPast = h.past.slice(0, -1);
      const { nodes: undoNodes, edges: undoEdges } = h.past[h.past.length - 1];
      setNodes(undoNodes);
      setEdges(undoEdges);
      return {
        past: newPast,
        future: [{ nodes, edges }, ...h.future],
      };
    });
  }, [history, nodes, edges, setNodes, setEdges]);

  const handleRedo = useCallback(() => {
    setHistory((h) => {
      if (h.future.length === 0) return h;
      const [nextState, ...newFuture] = h.future;
      setNodes(nextState.nodes);
      setEdges(nextState.edges);
      return {
        past: [...h.past, { nodes, edges }],
        future: newFuture,
      };
    });
  }, [history, nodes, edges, setNodes, setEdges]);

  function showModal(sourceNodeId, handleId, position) {
    setModalState({ isOpen: true, sourceNodeId, handleId, position });
  }

  useEffect(() => {
    function handleShowModal(event) {
      const { sourceNodeId, handleId, position } = event.detail;
      showModal(sourceNodeId, handleId, position);
    }

    window.addEventListener('showModal', handleShowModal);

    return () => {
      window.removeEventListener('showModal', handleShowModal);
    };
  }, []);

  function addNode(handleCount) {
    pushToHistory();
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

    // Get the current viewport
    const { zoom, x, y } = getViewport();
    lastViewportRef.current = { x, y, zoom };

    // Find the last added node (which should be the newly added one)
    const lastNode = arrangedNodes[arrangedNodes.length - 1];

    // Use setTimeout to ensure the DOM has updated before we try to focus on the new node
    setTimeout(() => {
      // Center the view on the last added node while maintaining the current zoom level
      setViewport(
        {
          x: -lastNode.position.x * zoom + window.innerWidth / 2,
          y: -lastNode.position.y * zoom + window.innerHeight / 2,
          zoom: zoom,
        },
        { duration: 300 }
      );
    }, 50);
  }

  // Helper function to calculate the bounding box of all nodes
  // function getNodesBoundingBox(nodes) {
  //   if (nodes.length === 0) return { x: 0, y: 0, width: 0, height: 0 };

  //   let minX = Infinity,
  //     minY = Infinity,
  //     maxX = -Infinity,
  //     maxY = -Infinity;

  //   nodes.forEach((node) => {
  //     minX = Math.min(minX, node.position.x);
  //     minY = Math.min(minY, node.position.y);
  //     maxX = Math.max(maxX, node.position.x + (node.width || 0));
  //     maxY = Math.max(maxY, node.position.y + (node.height || 0));
  //   });

  //   return {
  //     x: minX,
  //     y: minY,
  //     width: maxX - minX,
  //     height: maxY - minY,
  //   };
  // }

  function onConnect(params) {
    pushToHistory();
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
  }

  useEffect(() => {
    console.log('nodes : ', nodes);
  }, [nodes]);

  return (
    <div
      style={{ width: '100vw', height: '100vh', backgroundColor: '#334155' }}
    >
      <Panel position="top-left" style={{ display: 'flex', gap: '10px' }}>
        <button onClick={handleFitView} title="Fit Screen">
          <FaExpandArrowsAlt />
        </button>
        <button onClick={handleAutoArrange} title="Auto Arrange">
          <FaSitemap />
        </button>
        <button onClick={handleResetZoom} title="Reset Zoom">
          <MdZoomOutMap />
        </button>
        <button
          onClick={handleUndo}
          title="Undo"
          disabled={history.past.length === 0}
        >
          <FaUndo />
        </button>
        <button
          onClick={handleRedo}
          title="Redo"
          disabled={history.future.length === 0}
        >
          <FaRedo />
        </button>
        <button onClick={handleZoomIn} title="Zoom In">
          <FaSearchPlus />
        </button>
        <button onClick={handleZoomOut} title="Zoom Out">
          <FaSearchMinus />
        </button>
      </Panel>
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
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        onZoomChange={(zoom) => {
          lastZoomRef.current = zoom;
        }}
      >
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
