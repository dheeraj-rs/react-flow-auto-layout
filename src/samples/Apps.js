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
  Handle,
  Position,
} from 'reactflow';
import dagre from 'dagre';
import 'reactflow/dist/style.css';

const initialNodes = [
  {
    id: '1',
    type: 'special',
    data: { label: 'Node 1' },
    position: { x: 0, y: 0 },
    style: { backgroundColor: '#0f172a', color: '#fff' },
  },
  {
    id: 'sample',
    type: 'sample',
    data: { label: '' },
    position: { x: 300, y: 0 },
    style: { backgroundColor: 'transparent', color: 'transparent' },
    isHidden: true,
  },
];

const initialEdges = [];

const getLayoutedElements = (nodes, edges, direction = 'LR', spacing = 250) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const isHorizontal = direction === 'LR' || direction === 'TB';
  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: spacing,
    ranksep: spacing,
  });

  nodes.forEach((node) => {
    if (!node.isHidden) {
      dagreGraph.setNode(node.id, { width: 150, height: 50 });
    }
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

const sampleLineStyle = {
  ...arrowStyle,
  opacity: 0.5,
  strokeDasharray: '5,5',
};

const NodeWithHandle = ({ id, data, isConnectable }) => {
  const reactFlowInstance = useReactFlow();

  const onSampleLineClick = useCallback(() => {
    const newNodeId = `${parseInt(id) + 1}`;
    const newNode = {
      id: newNodeId,
      type: 'special',
      data: { label: `Node ${newNodeId}` },
      position: { x: 0, y: 0 }, // This will be adjusted by the layout function
      style: { backgroundColor: '#0f172a', color: '#fff' },
    };
    const newEdge = {
      id: `e${id}-${newNodeId}`,
      source: id,
      target: newNodeId,
      type: 'custom',
      style: arrowStyle,
    };

    reactFlowInstance.addNodes(newNode);
    reactFlowInstance.addEdges(newEdge);
  }, [id, reactFlowInstance]);

  return (
    <div style={{ position: 'relative', padding: '10px', width: 150 }}>
      {data.label}
      <Handle
        type="source"
        position={Position.Right}
        id={`${id}-source`}
        style={{
          background: '#fff',
          border: '1px solid #000',
          borderRadius: '50%',
          width: 10,
          height: 10,
        }}
        isConnectable={isConnectable}
      />
      <svg
        style={{
          position: 'absolute',
          right: -75,
          top: '50%',
          transform: 'translateY(-50%)',
          pointerEvents: 'none',
        }}
        width="75"
        height="1"
      >
        <line x1="0" y1="0" x2="75" y2="0" style={sampleLineStyle} />
      </svg>
      <div
        style={{
          position: 'absolute',
          right: -75,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 75,
          height: 20,
          cursor: 'pointer',
        }}
        onClick={onSampleLineClick}
      />
    </div>
  );
};

const SampleNode = () => <div />;

const nodeTypes = {
  special: NodeWithHandle,
  sample: SampleNode,
};

function FlowApp() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [direction, setDirection] = useState('LR');
  const [spacing, setSpacing] = useState(250);
  const { fitView } = useReactFlow();

  const applyLayout = useCallback(
    (newDirection) => {
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
    (params) =>
      setEdges((eds) =>
        addEdge({ ...params, type: 'custom', style: arrowStyle }, eds)
      ),
    [setEdges]
  );

  const resetLayout = () => {
    setNodes(initialNodes);
    setEdges(initialEdges);
    applyLayout(direction);
  };

  const autoReArrange = () => {
    applyLayout(direction);
  };

  useEffect(() => {
    const sampleNode = nodes.find((node) => node.id === 'sample');
    if (sampleNode) {
      setNodes((prevNodes) =>
        prevNodes.map((node) => {
          if (node.id === 'sample') {
            return { ...node, position: { x: 300, y: prevNodes.length * 100 } };
          }
          return node;
        })
      );
    }
  }, [nodes]);

  useEffect(() => {
    setNodes((prevNodes) => {
      const lastNode = prevNodes[prevNodes.length - 2];
      if (lastNode) {
        const sampleEdge = {
          id: `e${lastNode.id}-sample`,
          source: lastNode.id,
          target: 'sample',
          type: 'custom',
          style: arrowStyle,
        };
        setEdges((prevEdges) => [...prevEdges, sampleEdge]);
      }
      return prevNodes;
    });
  }, [nodes]);

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
        fitView
        edgeTypes={edgeTypes}
        nodeTypes={nodeTypes}
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
