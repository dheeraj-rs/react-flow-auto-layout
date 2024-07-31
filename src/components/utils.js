// utils.js
import { MarkerType } from 'reactflow';

// Define the initial node
export const initialNodes = [
  {
    id: '1', // Unique identifier for the node
    data: {
      label: 'Node 1', // Text displayed on the node
      showModal: null, // Function to show modal (will be set later)
      sourceHandles: ['1'], // Array of source handle identifiers
    },
    position: { x: 0, y: 0 }, // Initial position of the node
    type: 'custom', // Use custom node type
    style: { backgroundColor: '#0f172a', color: '#fff' }, // Node styling
  },
];

// Initialize edges array as empty
export const initialEdges = [];

// Define arrow style for edges
export const arrowStyle = {
  stroke: '#94a3b8',
  strokeWidth: 1.5,
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: '#94a3b8',
  },
};

export const ZOOM_LEVEL = 0.5;
