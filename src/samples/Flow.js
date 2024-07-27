import React, { useState, useCallback } from 'react';
import ReactFlow, {
  addEdge,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import { tree } from 'd3-hierarchy';
import 'reactflow/dist/style.css';

const initialNodes = [
  { id: '1', data: { label: 'Node 1' }, position: { x: 0, y: 0 } },
  { id: '2', data: { label: 'Node 2' }, position: { x: 0, y: 0 } },
];

const initialEdges = [];

const nodeWidth = 150;
const nodeHeight = 40;

const CustomNode = ({ data }) => {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #222',
        borderRadius: '3px',
        padding: '10px',
        width: `${nodeWidth}px`,
        height: `${nodeHeight}px`,
      }}
    >
      {data.label}
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

function Flow() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState(null);

  const onConnect = useCallback(
    (params) =>
      setEdges((eds) => addEdge({ ...params, arrowHeadType: 'arrow' }, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback(
    (event, node) => {
      if (selectedNode && selectedNode.id !== node.id) {
        const newEdge = {
          id: `e${selectedNode.id}-${node.id}`,
          source: selectedNode.id,
          target: node.id,
          animated: true,
          style: { stroke: '#f6ab6c' },
          arrowHeadType: 'arrow', // Add arrow to the edge
        };
        setEdges((eds) => addEdge(newEdge, eds));
        setSelectedNode(null);
      } else {
        setSelectedNode(node);
      }
    },
    [selectedNode, setEdges]
  );

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const onAddNode = useCallback(() => {
    const newNode = {
      id: `${nodes.length + 1}`,
      data: { label: `Node ${nodes.length + 1}` },
      position: { x: 0, y: 0 },
      type: 'custom',
    };
    setNodes((nds) => [...nds, newNode]);
  }, [nodes, setNodes]);

  const updateLayout = useCallback(() => {
    const hierarchy = tree()
      .nodeSize([nodeWidth * 1.5, nodeHeight * 3])
      .separation(() => 1);

    const root = hierarchy({
      id: 'root',
      children: nodes.map((node) => ({ id: node.id, data: node.data })),
    });

    root.x = 0;
    root.y = 0;

    const treeNodes = root.descendants().slice(1);

    const newNodes = nodes.map((node, i) => ({
      ...node,
      position: {
        x: treeNodes[i].y,
        y: treeNodes[i].x,
      },
    }));

    setNodes(newNodes);
  }, [nodes, setNodes]);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
      >
        <Controls />
        <MiniMap />
        <Background variant="dots" gap={12} size={1} />
      </ReactFlow>
      <div style={{ position: 'absolute', left: 10, top: 10, zIndex: 4 }}>
        <button onClick={onAddNode}>Add Node</button>
        <button onClick={updateLayout}>Update Layout</button>
      </div>
    </div>
  );
}

export default Flow;
