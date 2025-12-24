
import React, { useState } from 'react';
import { Copy, Check, Trash2, Edit2, CheckCircle2, X, ClipboardList } from 'lucide-react';

interface ResultCardProps {
  id: string;
  blocks: { tabData: string; validation: string }[];
  timestamp: Date;
  onDelete: (id: string) => void;
  onUpdate: (newBlocks: { tabData: string; validation: string }[]) => void;
}

const ResultCard: React.FC<ResultCardProps> = ({ id, blocks, timestamp, onDelete, onUpdate }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [allCopied, setAllCopied] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopyAll = () => {
    const allText = blocks.map(b => b.tabData).join('\n');
    navigator.clipboard.writeText(allText);
    setAllCopied(true);
    setTimeout(() => setAllCopied(null as any), 2000);
  };

  const startEditing = (index: number) => {
    setEditValue(blocks[index].tabData);
    setEditingIndex(index);
  };

  const saveEdit = (index: number) => {
    const newBlocks = [...blocks];
    newBlocks[index] = { ...newBlocks[index], tabData: editValue };
    onUpdate(newBlocks);
    setEditingIndex(null);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all hover:shadow-lg hover:border-indigo-200 animate-in fade-in slide-in-from-bottom-2">
      <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex justify-between items-center">
        <div className="flex items-center gap-3">
           <span className="text-[10px] font-black bg-slate-200 text-slate-600 px-2 py-0.5 rounded uppercase tracking-tighter">
             Order Log
           </span>
           <span className="text-[11px] font-bold text-slate-400">
             {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
           </span>
        </div>
        
        <div className="flex items-center gap-3">
          {blocks.length > 1 && (
            <button 
              onClick={handleCopyAll}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                allCopied 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
              }`}
            >
              {allCopied ? <CheckCircle2 size={12} /> : <ClipboardList size={12} />}
              {allCopied ? 'Copied All' : 'Copy All Rows'}
            </button>
          )}
          <button 
            onClick={() => onDelete(id)}
            className="p-1.5 text-slate-300 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      
      <div className="p-5 space-y-6">
        {blocks.map((block, idx) => {
          const isSuspicious = block.validation.includes('⚠️');
          return (
            <div key={idx} className={`space-y-2 group ${idx !== 0 ? 'pt-6 border-t border-slate-100' : ''}`}>
              <div className="flex justify-between items-end mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded">
                    Product {blocks.length > 1 ? idx + 1 : ''}
                  </span>
                  {isSuspicious && (
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded animate-pulse">
                      Review Needed
                    </span>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => editingIndex === idx ? saveEdit(idx) : startEditing(idx)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      editingIndex === idx 
                        ? 'bg-green-600 text-white shadow-md' 
                        : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {editingIndex === idx ? <CheckCircle2 size={13} /> : <Edit2 size={13} />}
                    {editingIndex === idx ? 'Save' : 'Edit'}
                  </button>
                  
                  <button
                    onClick={() => handleCopy(block.tabData, idx)}
                    disabled={editingIndex === idx}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      copiedIndex === idx 
                        ? 'bg-green-100 text-green-700 shadow-sm' 
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-100 disabled:bg-slate-200'
                    }`}
                  >
                    {copiedIndex === idx ? <Check size={13} /> : <Copy size={13} />}
                    {copiedIndex === idx ? 'Copied' : 'Copy Row'}
                  </button>
                </div>
              </div>
              
              <div className="relative">
                {editingIndex === idx ? (
                  <div className="relative">
                    <textarea
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-full bg-slate-900 text-green-400 p-4 rounded-xl text-xs font-mono border-2 border-green-500 focus:outline-none min-h-[60px]"
                    />
                    <button 
                      onClick={() => setEditingIndex(null)}
                      className="absolute top-2 right-2 text-slate-400 hover:text-white"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <pre className={`bg-slate-900 text-slate-200 p-4 rounded-xl text-xs font-mono overflow-x-auto whitespace-pre border border-slate-800 scrollbar-hide transition-all ${isSuspicious ? 'border-l-4 border-l-amber-500' : 'border-l-4 border-l-indigo-500'}`}>
                    {block.tabData}
                  </pre>
                )}
              </div>
              
              <p className={`text-xs font-bold flex items-center gap-1.5 px-3 py-2 rounded-lg ${
                !isSuspicious ? 'text-green-600 bg-green-50' : 'text-amber-700 bg-amber-50'
              }`}>
                {block.validation}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ResultCard;
