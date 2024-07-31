// Custom edge component for curved connections
export const CustomEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style = {},
  markerEnd,
}) => {
  // Calculate midpoint and add random offset for curve
  const midX = (sourceX + targetX) / 2;
  const offset = Math.random() * 40 - 10;
  const path = `M${sourceX},${sourceY} L${midX + offset},${sourceY} L${
    midX + offset
  },${targetY} L${targetX},${targetY}`;

  return (
    <path
      id={id}
      style={style}
      className="react-flow__edge-path"
      d={path}
      markerEnd={markerEnd}
    />
  );
};
