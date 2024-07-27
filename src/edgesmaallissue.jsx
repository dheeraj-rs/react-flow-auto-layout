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
      {['a', 'b', 'c'].map((handleId, index) => (
        <Handle
          key={handleId}
          type="source"
          position={Position.Right}
          id={handleId}
          style={{ top: `${25 + 25 * index}%`, background: '#555' }}
          onMouseDown={(event) => handleAddNode(handleId, event)}
        >
          <div style={{ position: 'absolute', right: -20, top: -10 }}>
            {index + 1}
          </div>
        </Handle>
      ))}
    </div>
  );
};

const CustomEdge = ({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}) => {
  const edgePath = `M${sourceX},${sourceY} L${
    sourceX + (targetX - sourceX) / 2
  },${sourceY} L${
    sourceX + (targetX - sourceX) / 2
  },${targetY} L${targetX},${targetY}`;

  return (
    <path
      id={id}
      style={style}
      className="react-flow__edge-path"
      d={edgePath}
      markerEnd={markerEnd}
    />
  );
};

const edgeTypes = {
  custom: CustomEdge,
};

const arrowStyle = {
  stroke: '#94a3b8',
  strokeWidth: 2,
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
  const [visibleNodes, setVisibleNodes] = useState(new Set(['1']));
  const [visibleEdges, setVisibleEdges] = useState([]);
  const { fitView } = useReactFlow();

  const applyLayout = useCallback(
    (layoutNodes, layoutEdges) => {
      const dagreGraph = new dagre.graphlib.Graph();
      dagreGraph.setDefaultEdgeLabel(() => ({}));

      dagreGraph.setGraph({
        rankdir: 'LR',
        nodesep: 50,
        ranksep: 50,
      });

      layoutNodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: 150, height: 50 });
      });

      layoutEdges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
      });

      dagre.layout(dagreGraph);

      const newNodes = layoutNodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        return {
          ...node,
          position: {
            x: nodeWithPosition.x - 75,
            y: nodeWithPosition.y - 25,
          },
        };
      });

      setNodes(newNodes);
      setEdges(layoutEdges);
      fitView({ padding: 0.2, duration: 800 });
    },
    [setNodes, setEdges, fitView]
  );

  useEffect(() => {
    applyLayout(nodes, edges);
  }, []); // Run once on mount

  useEffect(() => {
    const filteredEdges = edges.filter(
      (edge) => visibleNodes.has(edge.source) && visibleNodes.has(edge.target)
    );
    setVisibleEdges(filteredEdges);
  }, [edges, visibleNodes]);

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
      const sourceNode = nodes.find((node) => node.id === sourceNodeId);
      if (!sourceNode) return;

      const handleOffset = {
        a: { x: 250, y: -100 },
        b: { x: 250, y: 0 },
        c: { x: 250, y: 100 },
      };

      const newNodes = [];
      const newEdges = [];

      Object.keys(handleOffset).forEach((handle, index) => {
        const newNodeId = `node-${nodes.length + 1}`;
        const newNodePosition = {
          x: sourceNode.position.x + handleOffset[handle].x,
          y: sourceNode.position.y + handleOffset[handle].y,
        };

        const newNode = {
          id: newNodeId,
          data: {
            label: `Node ${nodes.length + 1}`,
            addNode,
            parentHandle: handle,
          },
          position: newNodePosition,
          type: 'custom',
          style: { backgroundColor: '#0f172a', color: '#fff' },
          hidden: handle !== handleId,
        };

        const newEdge = {
          id: `e${sourceNodeId}-${newNodeId}`,
          source: sourceNodeId,
          target: newNodeId,
          sourceHandle: handle,
          type: 'custom',
          markerEnd: { type: MarkerType.ArrowClosed },
          style: arrowStyle,
        };

        if (handle === handleId) {
          newNodes.push(newNode);
          newEdges.push(newEdge);
        }
      });

      setNodes((nds) => [...nds, ...newNodes]);
      setEdges((eds) => [...eds, ...newEdges]);

      // Ensure only the clicked node's position is visible
      setVisibleNodes(
        (visible) => new Set([...visible, ...newNodes.map((n) => n.id)])
      );

      // Apply layout after adding new nodes and edges
      setTimeout(() => {
        applyLayout([...nodes, ...newNodes], [...edges, ...newEdges]);
      }, 10);
    },
    [nodes, edges, setNodes, setEdges, applyLayout]
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
          hidden: !visibleNodes.has(node.id),
        }))}
        edges={visibleEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
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
