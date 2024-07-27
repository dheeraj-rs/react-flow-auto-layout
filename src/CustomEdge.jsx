import React from 'react';
import { getSmoothStepPath } from 'reactflow';

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

export default CustomEdge;
