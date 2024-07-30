// Import necessary React and ReactFlow components
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

// Define the initial node
const initialNodes = [
  {
    id: '1', // Unique identifier for the node
    data: {
      label: 'Node 1', // Text displayed on the node
      showModal: null, // Function to show modal (will be set later)
      sourceHandles: ['a'], // Array of source handle identifiers
    },
    position: { x: 0, y: 0 }, // Initial position of the node
    type: 'custom', // Use custom node type
    style: { backgroundColor: '#0f172a', color: '#fff' }, // Node styling
  },
];

// Initialize edges array as empty
const initialEdges = [];

// Custom node component definition
const CustomNode = ({ id, data }) => {
  // Callback function to show modal when adding a new node
  const handleShowModal = useCallback(
    (handleId, event) => {
      event.preventDefault();
      const rect = event.target.getBoundingClientRect();
      const position = { x: rect.left, y: rect.top };
      data.showModal(id, handleId, position);
    },
    [id, data]
  );

  // Calculate node dimensions
  const nodeHeight = Math.max(60, data.sourceHandles.length * 40);
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

// Custom edge component for curved connections
const CustomEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style = {},
  markerEnd,
}) => {
  // Calculate midpoint and add random offset for curve
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

// Define custom edge types
const edgeTypes = {
  custom: CustomEdge,
};

// Define arrow style for edges
const arrowStyle = {
  stroke: '#94a3b8',
  strokeWidth: 1.5,
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: '#94a3b8',
  },
};

// Define custom node types
const nodeTypes = {
  custom: CustomNode,
};

// Modal component for adding new nodes
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

// Main FlowApp component
function FlowApp() {
  // State for nodes and edges
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { fitView } = useReactFlow();

  // State for auto-arrange, edge dragging, and modal
  const [shouldArrange, setShouldArrange] = useState(false);
  const [edgeDragging, setEdgeDragging] = useState(false);
  const [modalState, setModalState] = useState({
    isOpen: false,
    sourceNodeId: null,
    handleId: null,
    position: null,
  });

  const ZOOM_LEVEL = 0.5;

  // Sort children map for consistent layout
  const sortChildrenMap = useCallback((childrenMap) => {
    const sortedMap = new Map();

    for (const [key, children] of childrenMap.entries()) {
      const sortedChildren = children.sort(
        (a, b) => parseInt(a.handle) - parseInt(b.handle)
      );
      sortedMap.set(key, sortedChildren);
    }

    return sortedMap;
  }, []);

  // Custom layout function
  const customLayout = useCallback(
    (nodes, edges) => {
      // If there are no nodes, return an empty array
      if (!nodes || nodes.length === 0) return [];

      // Create a map of nodes for quick access
      const nodeMap = new Map(nodes.map((node) => [node.id, { ...node }]));

      // Create a map to store children of each node
      const childrenMap = new Map();

      // Populate the childrenMap based on edges
      edges.forEach((edge) => {
        if (!childrenMap.has(edge.source)) {
          childrenMap.set(edge.source, []);
        }
        childrenMap
          .get(edge.source)
          .push({ id: edge.target, handle: edge.sourceHandle });
      });

      // Sort the children map for consistent layout
      const sortedChildrenMap = sortChildrenMap(childrenMap);

      // Create a map to store the level of each node
      const levels = new Map();

      // Recursive function to determine the level of each node
      const determineLevel = (nodeId, level = 0) => {
        // Set the level for the current node
        levels.set(nodeId, Math.max(level, levels.get(nodeId) || 0));
        // Get children of the current node
        const children = sortedChildrenMap.get(nodeId) || [];
        // Recursively determine level for each child
        children.forEach((child) => determineLevel(child.id, level + 1));
      };

      // Start determining levels from the root node (id: '1')
      determineLevel('1');

      // Define layout constants
      const NODE_WIDTH = 150;
      const BASE_NODE_HEIGHT = 60;
      const HORIZONTAL_SPACING = NODE_WIDTH * 1.8;
      const VERTICAL_SPACING = 40;

      // Function to calculate node height based on number of handles
      const getNodeHeight = (node) => {
        return Math.max(
          BASE_NODE_HEIGHT,
          (node.data.sourceHandles?.length || 1) * 40
        );
      };

      // Recursive function to position nodes
      const positionNode = (nodeId, x = 0, y = 0) => {
        const node = nodeMap.get(nodeId);
        if (!node) return 0;

        const children = sortedChildrenMap.get(nodeId) || [];
        const nodeHeight = getNodeHeight(node);

        // Set node position
        node.position = { x, y };

        // If node has no children, return its height
        if (children.length === 0) return nodeHeight;

        let totalHeight = 0;
        // Position each child and calculate total height
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

        // Center the node vertically relative to its children
        if (children.length > 0) {
          node.position.y += (totalHeight - VERTICAL_SPACING - nodeHeight) / 2;
        }

        // Return the total height of this node and its subtree
        return Math.max(totalHeight, nodeHeight);
      };

      // Start positioning from the root node
      positionNode('1');

      // Return the array of positioned nodes
      return Array.from(nodeMap.values());
    },
    [sortChildrenMap] // Dependency array for useCallback
  );

  // Apply layout to nodes
  const applyLayout = useCallback(() => {
    const newNodes = customLayout(nodes, edges);
    setNodes(newNodes);
    fitView({ padding: 0.2, minZoom: ZOOM_LEVEL, maxZoom: ZOOM_LEVEL });
  }, [nodes, edges, setNodes, fitView, customLayout]);

  // Effect to trigger layout when shouldArrange is true
  useEffect(() => {
    if (shouldArrange) {
      applyLayout();
      setShouldArrange(false);
    }
  }, [shouldArrange, applyLayout]);

  // Show modal for adding new node
  const showModal = useCallback((sourceNodeId, handleId, position) => {
    setModalState({ isOpen: true, sourceNodeId, handleId, position });
  }, []);

  // Add new node to the graph
  const addNode = useCallback(
    (handleCount) => {
      // Extract source node ID and handle ID from modal state
      const { sourceNodeId, handleId } = modalState;

      // Generate a new unique node ID
      const newNodeId = `node-${nodes.length + 1}`;

      // Create an array of source handles (1, 2, 3, ...) based on handleCount
      const sourceHandles = Array.from({ length: handleCount }, (_, i) =>
        (i + 1).toString()
      );

      // Calculate node height based on handle count (minimum 40px)
      const nodeHeight = Math.max(40, handleCount * 20);

      // Create the new node object
      const newNode = {
        id: newNodeId,
        data: {
          label: `Node ${nodes.length + 1}`,
          showModal, // Function to show modal
          parentHandle: handleId,
          sourceHandles, // Array of handle IDs
        },
        position: { x: 0, y: 0 }, // Initial position (will be adjusted by layout)
        type: 'custom', // Use custom node type
        style: {
          backgroundColor: '#0f172a',
          color: '#fff',
          height: `${nodeHeight}px`,
        },
      };

      // Create a new edge connecting the source node to the new node
      const newEdge = {
        id: `e${sourceNodeId}-${newNodeId}`,
        source: sourceNodeId,
        target: newNodeId,
        sourceHandle: handleId,
        type: 'custom',
        markerEnd: { type: MarkerType.ArrowClosed },
        style: arrowStyle,
      };

      // Create updated arrays of nodes and edges
      const updatedNodes = [...nodes, newNode];
      const updatedEdges = [...edges, newEdge];

      // Apply custom layout to the updated nodes
      const arrangedNodes = customLayout(updatedNodes, updatedEdges);

      // Update the state with new nodes and edges
      setNodes(arrangedNodes);
      setEdges(updatedEdges);

      // Reset the modal state
      setModalState({
        isOpen: false,
        sourceNodeId: null,
        handleId: null,
        position: null,
      });

      // Define zoom level for focusing on the new node
      const LAYOUT_ZOOM_LEVEL = 0.9;

      // Use setTimeout to ensure the DOM has updated before fitting view
      setTimeout(() => {
        // Get the last node (which is the newly added node)
        const lastNode = arrangedNodes[arrangedNodes.length - 1];
        // Fit the view to focus on the new node
        fitView({
          nodes: [lastNode],
          duration: 500, // Animation duration in milliseconds
          padding: 0.2, // Padding around the focused node
          minZoom: LAYOUT_ZOOM_LEVEL,
          maxZoom: LAYOUT_ZOOM_LEVEL,
        });
      }, 0);
    },
    [
      modalState,
      nodes,
      showModal,
      edges,
      customLayout,
      setNodes,
      setEdges,
      fitView,
    ]
  );
  // Handle auto-arrange button click
  const handleAutoArrange = () => {
    setShouldArrange(true);
  };

  // Handle new edge connection
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

  // Set edge dragging state when connection starts
  const onConnectStart = useCallback(() => {
    setEdgeDragging(true);
  }, []);

  // Reset edge dragging state when connection ends
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

// Wrap FlowApp with ReactFlowProvider
function App() {
  return (
    <ReactFlowProvider>
      <FlowApp />
    </ReactFlowProvider>
  );
}

export default App;
