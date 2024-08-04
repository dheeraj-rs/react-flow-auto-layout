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

// // utils.js
// import { MarkerType } from 'reactflow';

// // Define the initial nodes with adjusted sizes and positions
// export const initialNodes = [
//   {
//     id: '1', // Unique identifier for the first node
//     data: {
//       label: 'Node 1', // Text displayed on the first node
//       showModal: null, // Function to show modal (will be set later)
//       sourceHandles: ['1'], // Array of source handle identifiers for the first node
//     },
//     position: { x: 50, y: 50 }, // Initial position of the first node
//     type: 'custom', // Use custom node type
//     style: {
//       backgroundColor: '#0f172a',
//       color: '#fff',
//       width: '150px',
//       height: '60px',
//     }, // Node styling with size
//   },
//   {
//     id: '2', // Unique identifier for the second node
//     data: {
//       label: 'Node 2', // Text displayed on the second node
//       showModal: null, // Function to show modal (will be set later)
//       sourceHandles: ['1'], // Array of source handle identifiers for the second node
//     },
//     position: { x: 300, y: 50 }, // Initial position of the second node
//     type: 'custom', // Use custom node type
//     style: {
//       backgroundColor: '#0f172a',
//       color: '#fff',
//       width: '150px',
//       height: '60px',
//     }, // Node styling with size
//   },
// ];

// // Define initial edges connecting the two nodes
// export const initialEdges = [
//   {
//     id: 'e1-2', // Unique identifier for the edge
//     source: '1', // ID of the source node
//     target: '2', // ID of the target node
//     sourceHandle: '1', // Handle ID of the source
//     type: 'custom', // Use custom edge type
//     style: {
//       stroke: '#94a3b8',
//       strokeWidth: 1.5,
//     },
//     markerEnd: {
//       type: MarkerType.ArrowClosed,
//       color: '#94a3b8',
//     },
//   },
// ];

// // Define a zoom level constant to fit the nodes well on the screen
// export const ZOOM_LEVEL = 0.5; // Adjust this value as needed

// // Define arrow style for edges
// export const arrowStyle = {
//   stroke: '#94a3b8',
//   strokeWidth: 1.5,
//   markerEnd: {
//     type: MarkerType.ArrowClosed,
//     color: '#94a3b8',
//   },
// };
