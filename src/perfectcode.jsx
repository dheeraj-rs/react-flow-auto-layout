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
  const edgePath = `M${sourceX},${sourceY} L${targetX},${targetY}`;

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
      const sourceNode = nodes.find((node) => node.id === sourceNodeId);
      if (!sourceNode) return;

      // Calculate the position based on the handle
      const handleOffset = {
        a: { x: 250, y: -100 },
        b: { x: 250, y: 0 },
        c: { x: 250, y: 100 },
      };

      const newNodePosition = {
        x: sourceNode.position.x + handleOffset[handleId].x,
        y: sourceNode.position.y + handleOffset[handleId].y,
      };

      const newNode = {
        id: newNodeId,
        data: {
          label: `Node ${nodes.length + 1}`,
          addNode,
          parentHandle: handleId,
        },
        position: newNodePosition,
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

      // Apply layout after adding new node and edge
      setTimeout(() => {
        applyLayout([...nodes, newNode], [...edges, newEdge]);
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
        }))}
        edges={edges}
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
