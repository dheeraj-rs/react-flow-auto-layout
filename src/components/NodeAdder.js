import { useReactFlow, MarkerType } from 'reactflow';
import { arrowStyle } from './utils';

export function useNodeAdder(nodes, edges, setNodes, setEdges, customLayout) {
  const { fitView } = useReactFlow();

  function addNode(modalState, handleCount) {
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

    const LAYOUT_ZOOM_LEVEL = 0.9;
    setTimeout(() => {
      const lastNode = arrangedNodes[arrangedNodes.length - 1];
      fitView({
        nodes: [lastNode],
        duration: 500,
        padding: 0.2,
        minZoom: LAYOUT_ZOOM_LEVEL,
        maxZoom: LAYOUT_ZOOM_LEVEL,
      });
    }, 0);

    return {
      isOpen: false,
      sourceNodeId: null,
      handleId: null,
      position: null,
    };
  }

  return addNode;
}
