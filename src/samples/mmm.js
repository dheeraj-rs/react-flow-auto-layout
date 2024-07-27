import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  ReactFlowProvider,
  useReactFlow,
  SmoothStepEdge,
  MarkerType,
} from 'reactflow';
import dagre from 'dagre';
import 'reactflow/dist/style.css';

const initialNodes = [
  {
    id: '1',
    data: { label: 'Node 1' },
    position: { x: 0, y: 0 },
    style: { backgroundColor: '#0f172a', color: '#fff' },
  },
];

const initialEdges = [];

const getLayoutedElements = (nodes, edges, direction = 'LR', spacing = 50) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const isHorizontal = direction === 'LR' || direction === 'TB';
  dagreGraph.setGraph({
    rankdir: direction,
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
    node.targetPosition = isHorizontal ? 'left' : 'top';
    node.sourcePosition = isHorizontal ? 'right' : 'bottom';

    node.position = {
      x: nodeWithPosition.x - 75,
      y: nodeWithPosition.y - 25,
    };

    return node;
  });

  return { nodes, edges };
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

function FlowApp() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [direction, setDirection] = useState('LR');
  const [spacing, setSpacing] = useState(50);
  const { fitView } = useReactFlow();

  const applyLayout = useCallback(
    (newDirection) => {
      console.log('newDirection :', newDirection);
      const { nodes: layoutedNodes, edges: layoutedEdges } =
        getLayoutedElements(nodes, edges, newDirection, spacing);
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
      setDirection(newDirection);
      fitView({ padding: 0.2 });
    },
    [nodes, edges, spacing, fitView]
  );

  useEffect(() => {
    applyLayout(direction);
  }, []);

  const onConnect = useCallback(
    (params) => {
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: 'custom',
            style: arrowStyle,
          },
          eds
        )
      );
    },
    [setEdges]
  );

  const onNodeClick = useCallback(
    (event, node) => {
      const newNodeId = (nodes.length + 1).toString();
      const newNode = {
        id: newNodeId,
        data: { label: `Node ${newNodeId}` },
        position: { x: 0, y: 0 },
        style: { backgroundColor: '#0f172a', color: '#fff' },
      };
      const newEdge = {
        id: `e${node.id}-${newNodeId}`,
        source: node.id,
        target: newNodeId,
        type: 'custom',
        style: arrowStyle,
      };

      const newNodes = [...nodes, newNode];
      const newEdges = [...edges, newEdge];

      const { nodes: layoutedNodes, edges: layoutedEdges } =
        getLayoutedElements(newNodes, newEdges, direction, spacing);

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
    [nodes, edges, direction, spacing, fitView]
  );

  const resetLayout = () => {
    setNodes(initialNodes);
    setEdges(initialEdges);
    applyLayout(direction);
  };

  const autoReArrange = () => {
    applyLayout(direction);
  };

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
        onNodeClick={onNodeClick}
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
        <h4>Settings</h4>
        <button onClick={() => applyLayout('TB')}>Vertical Layout</button>
        <button onClick={() => applyLayout('LR')}>Horizontal Layout</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label>Spacing:</label>
          <input
            type="number"
            value={spacing}
            onChange={(e) => setSpacing(Number(e.target.value))}
            style={{ marginTop: '10px', marginBottom: '10px', width: '100%' }}
          />
        </div>
        <button onClick={resetLayout}>Reset Layout</button>
        <button onClick={autoReArrange}>Auto Re-arrange</button>
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
