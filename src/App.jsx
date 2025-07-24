import React, { useState, useCallback, useRef } from 'react';
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { MessageSquare, Save, Settings } from 'lucide-react';

const TextNode = ({ data, selected }) => {
  return (
    <div
      className={`px-4 py-3 shadow-lg rounded-lg bg-white border-2 min-w-[200px] ${
        selected ? 'border-blue-500' : 'border-gray-300'
      }`}
    >
      {/* Incoming connection handle */}
      <Handle
        id="target"
        type="target"
        position={Position.Top}
        style={{
          background: '#6b7280',
          width: 16,
          height: 16,
          borderRadius: '50%',
          border: '2px solid white',
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        }}
      />

      {/* Node header */}
      <div className="flex items-center gap-2 mb-2">
        <MessageSquare size={16} className="text-blue-500" />
        <span className="text-sm font-medium text-gray-600">Message</span>
      </div>

      {/* Node body content */}
      <div className="text-sm text-gray-800 break-words">
        {data.message || 'Enter your message...'}
      </div>

      {/* Outgoing connection handle */}
      <Handle
        id="source"
        type="source"
        position={Position.Bottom}
        style={{
          background: '#3b82f6',
          width: 16,
          height: 16,
          borderRadius: '50%',
          border: '2px solid white',
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        }}
      />
    </div>
  );
};

const nodeTypes = { textNode: TextNode };

const NodesPanel = ({ onDragStart }) => {
  const availableNodes = [
    { type: 'textNode', label: 'Message', icon: MessageSquare, description: 'Send a text message' }
  ];
  return (
    <div className="w-64 bg-white border-l border-gray-200 p-4">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Nodes Panel</h3>
      <div className="space-y-2">
        {availableNodes.map((node) => {
          const IconComponent = node.icon;
          return (
            <div
              key={node.type}
              className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-grab hover:border-blue-400 hover:bg-blue-50 transition-colors"
              draggable
              onDragStart={(e) => onDragStart(e, node.type)}
            >
              <IconComponent size={20} className="text-blue-500" />
              <div>
                <div className="font-medium text-gray-800">{node.label}</div>
                <div className="text-xs text-gray-500">{node.description}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const SettingsPanel = ({ selectedNode, onNodeUpdate, onClose }) => {
  const [message, setMessage] = useState(selectedNode?.data?.message || '');
  const handleSave = () => { onNodeUpdate(selectedNode.id, { message }); };
  return (
    <div className="w-64 bg-white border-l border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Settings size={20} /> Settings
        </h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl leading-none">×</button>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Message Text</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onBlur={handleSave}
            className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={4}
            placeholder="Enter your message here..."
          />
        </div>
        <div className="text-xs text-gray-500">
          This message will be sent to users when they reach this node in the conversation flow.
        </div>
      </div>
    </div>
  );
};

const FlowBuilder = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [nodeIdCounter, setNodeIdCounter] = useState(1);
  const reactFlowWrapper = useRef(null);

  const onDragStart = (e, type) => {
    e.dataTransfer.setData('application/reactflow', type);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    const bounds = reactFlowWrapper.current.getBoundingClientRect();
    const type = e.dataTransfer.getData('application/reactflow');
    if (!type) return;
    const position = { x: e.clientX - bounds.left - 100, y: e.clientY - bounds.top - 50 };
    const newNode = { id: `node_${nodeIdCounter}`, type, position, data: { message: 'New message' } };
    setNodes((nds) => nds.concat(newNode));
    setNodeIdCounter((id) => id + 1);
  }, [nodeIdCounter, setNodes]);

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, type: 'smoothstep', animated: true, style: { stroke: '#3b82f6', strokeWidth: 2 } }, eds)),
    []
  );

  const onNodeClick = useCallback((_, node) => { setSelectedNode(node); }, []);
  const onNodeUpdate = useCallback((id, data) => { setNodes((nds) => nds.map((n) => n.id === id ? { ...n, data: { ...n.data, ...data } } : n)); }, [setNodes]);
  const closeSettings = useCallback(() => { setSelectedNode(null); }, []);
  const onPaneClick = useCallback(() => { setSelectedNode(null); }, []);

  const handleSave = useCallback(() => {
    if (nodes.length <= 1) return alert('Flow saved successfully!');
    const disconnected = nodes.filter(n => !edges.some(e => e.target === n.id));
    if (disconnected.length > 1) return alert('Error: Multiple unconnected nodes.');
    alert('Flow saved successfully!');
    console.log('Saved flow:', { nodes, edges });
  }, [nodes, edges]);

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="flex-1 relative">
        <div className="absolute top-4 left-4 z-10">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-lg"
          >
            <Save size={16} /> Save Changes
          </button>
        </div>
        <div ref={reactFlowWrapper} className="w-full h-full">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            connectionLineStyle={{ stroke: '#3b82f6', strokeWidth: 2 }}
            defaultViewport={{ x: 0, y: 0, zoom: 1 }}
            attributionPosition="bottom-left"
          >
            <Background color="#e5e7eb" gap={20} />
            <Controls />
            <MiniMap
              nodeColor={(n) => n.type === 'textNode' ? '#3b82f6' : '#64748b'}
              className="bg-white border border-gray-300"
            />
          </ReactFlow>
        </div>
      </div>
      {selectedNode ? (
        <SettingsPanel selectedNode={selectedNode} onNodeUpdate={onNodeUpdate} onClose={closeSettings} />
      ) : (
        <NodesPanel onDragStart={onDragStart} />
      )}
    </div>
  );
};

const App = () => (
  <ReactFlowProvider>
    <div className="w-full h-screen">
      <FlowBuilder />
    </div>
  </ReactFlowProvider>
);

export default App;
