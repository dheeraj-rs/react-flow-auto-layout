import React, { useCallback, useEffect } from 'react';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  ReactFlowProvider,
  Handle,
  Position,
  SmoothStepEdge,
  MarkerType,
  useReactFlow,
} from 'reactflow';
import dagre from 'dagre';
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

const getLayoutedElements = (nodes, edges, spacing = 50) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  dagreGraph.setGraph({
    rankdir: 'LR',
    nodesep: spacing,
    ranksep: spacing,
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 150, height: 50 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.position = {
      x: nodeWithPosition.x - 75, // Center the node
      y: nodeWithPosition.y - 25, // Center the node
    };

    return node;
  });

  return { nodes, edges };
};

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
      <Handle
        type="source"
        position={Position.Right}
        id="a"
        style={{ top: '25%', background: '#555' }}
        onMouseDown={(event) => handleAddNode('a', event)}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="b"
        style={{ top: '50%', background: '#555' }}
        onMouseDown={(event) => handleAddNode('b', event)}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="c"
        style={{ top: '75%', background: '#555' }}
        onMouseDown={(event) => handleAddNode('c', event)}
      />
    </div>
  );
};

const edgeTypes = {
  custom: SmoothStepEdge,
};

const arrowStyle = {
  stroke: '#94a3b8',
  strokeWidth: 2,
  markerEnd: {
    type: MarkerType.Arrow,
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

  const applyLayout = useCallback(
    (nodes, edges) => {
      const { nodes: layoutedNodes, edges: layoutedEdges } =
        getLayoutedElements(nodes, edges);
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
      fitView({ padding: 0.2 });
    },
    [setNodes, setEdges, fitView]
  );

  useEffect(() => {
    applyLayout(nodes, edges);
  }, []); // Run once on mount

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
      const newNodeId = `node-${nodes.length + 1}`;

      // Find the source node
      const sourceNode = nodes.find((node) => node.id === sourceNodeId);
      if (!sourceNode) return;

      // Calculate the new node position based on source handle
      const handleOffsets = {
        a: { x: 200, y: -100 },
        b: { x: 200, y: 0 },
        c: { x: 200, y: 100 },
      };

      const offset = handleOffsets[handleId] || { x: 200, y: 0 };
      const newNodePosition = {
        x: sourceNode.position.x + offset.x,
        y: sourceNode.position.y + offset.y,
      };

      // Create the new node
      const newNode = {
        id: newNodeId,
        data: { label: `Node ${nodes.length + 1}`, addNode },
        position: newNodePosition,
        type: 'custom',
        style: { backgroundColor: '#0f172a', color: '#fff' },
      };

      // Create the new edge
      const newEdge = {
        id: `e${sourceNodeId}-${newNodeId}`,
        source: sourceNodeId,
        target: newNodeId,
        sourceHandle: handleId,
        type: 'custom',
        markerEnd: { type: MarkerType.ArrowClosed },
        style: arrowStyle,
      };

      // Update nodes and edges
      const newNodes = [...nodes, newNode];
      const newEdges = [...edges, newEdge];

      // Reapply the layout to avoid overlap
      const { nodes: layoutedNodes, edges: layoutedEdges } =
        getLayoutedElements(newNodes, newEdges);

      setNodes(layoutedNodes);
      setEdges(layoutedEdges);

      // Highlight the last added node
      setTimeout(() => {
        const lastNode = layoutedNodes[layoutedNodes.length - 1];
        fitView({
          nodes: [lastNode],
          duration: 500,
          padding: 0.2,
        });
      }, 0);
    },
    [nodes, edges, setNodes, setEdges, fitView]
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
        }))}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        edgeTypes={edgeTypes}
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
