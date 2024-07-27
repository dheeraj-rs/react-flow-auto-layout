import React from 'react';
import { Handle, Position } from 'reactflow';

const CustomNode = ({ data }) => {
  return (
    <div
      style={{
        padding: '10px',
        border: '1px solid #777',
        borderRadius: '5px',
        backgroundColor: '#0f172a',
        color: '#fff',
      }}
    >
      <div>{data.label}</div>
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#555' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#555' }}
      />
    </div>
  );
};

export default CustomNode;
