
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Layout, Send, Eraser, Github, Layers, History, ClipboardCheck, Zap, Download } from 'lucide-react';
import { parseOrder } from './geminiService';
import { ParseResult } from './types';
import ResultCard from './components/ResultCard';

const App: React.FC = () => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<ParseResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [autoParse, setAutoParse] = useState(true);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('etsy_parser_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setResults(parsed.map((r: any) => ({ ...r, timestamp: new Date(r.timestamp) })));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('etsy_parser_history', JSON.stringify(results));
  }, [results]);

  const handleParse = useCallback(async (textToParse: string = input) => {
    const trimmedInput = textToParse.trim();
    if (!trimmedInput || isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const blocks = await parseOrder(trimmedInput);
      if (blocks.length === 0) {
        throw new Error("Không thể phân tích dữ liệu. Vui lòng kiểm tra lại định dạng input.");
      }
      
      const newResult: ParseResult = {
        id: crypto.randomUUID(),
        originalText: trimmedInput,
        blocks,
        timestamp: new Date(),
      };
      
      setResults(prev => [newResult, ...prev]);
      setInput('');
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra trong quá trình xử lý.');
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading]);

  const handlePaste = (e: React.ClipboardEvent) => {
    if (autoParse) {
      const pastedText = e.clipboardData.getData('text');
      if (pastedText) {
        handleParse(pastedText);
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        handleParse();
      }
      if (e.key === 'Escape') {
        setInput('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleParse]);

  const exportToCSV = () => {
    if (results.length === 0) return;

    // Create CSV content
    // Note: CSV format is tricky with TAB data, so we'll export the individual columns
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Time,Name,Address1,City,State,Zip,Country,Phone,ColorSize,Quantity\n";

    results.forEach(res => {
      res.blocks.forEach(block => {
        // Splitting the tabData to extract columns
        const cols = block.tabData.split('\t');
        // Cols: 0=A, 1=B, 2=C, 3=Name, 4=E, 5=Addr, 6=City, 7=State, 8=Zip, 9=Country, 10=Phone, 11=ColorSize, 12=Qty
        const row = [
          res.timestamp.toLocaleString(),
          `"${cols[3] || ''}"`,
          `"${cols[5] || ''}"`,
          `"${cols[6] || ''}"`,
          `"${cols[7] || ''}"`,
          `"${cols[8] || ''}"`,
          `"${cols[9] || ''}"`,
          `"${cols[10] || ''}"`,
          `"${cols[11] || ''}"`,
          `"${cols[12] || ''}"`
        ].join(",");
        csvContent += row + "\n";
      });
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `etsy_orders_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const deleteResult = (id: string) => {
    setResults(prev => prev.filter(r => r.id !== id));
  };

  const clearHistory = () => {
    if (confirm('Xóa toàn bộ lịch sử?')) {
      setResults([]);
      localStorage.removeItem('etsy_parser_history');
    }
  };

  const updateResultBlocks = (id: string, newBlocks: any[]) => {
    setResults(prev => prev.map(r => r.id === id ? { ...r, blocks: newBlocks } : r));
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-100">
              <Layers size={22} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-none">TEN ETSY</h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Order Parser v2.1</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 sm:gap-6">
             <div className="hidden sm:flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                <button 
                  onClick={() => setAutoParse(!autoParse)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                    autoParse ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  <Zap size={14} fill={autoParse ? "currentColor" : "none"} />
                  Auto-Parse: {autoParse ? 'ON' : 'OFF'}
                </button>
             </div>
             <a href="https://github.com" target="_blank" className="text-slate-400 hover:text-slate-600 transition-colors">
               <Github size={20} />
             </a>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold flex items-center gap-2 text-slate-800">
                <ClipboardCheck size={18} className="text-indigo-600" />
                Dán Đơn Hàng
              </h2>
              <button 
                onClick={() => setInput('')}
                className="text-slate-400 hover:text-red-500 text-xs font-bold flex items-center gap-1 transition-colors"
              >
                <Eraser size={14} />
                Xóa Ô Nhập
              </button>
            </div>
            
            <div className="relative">
              <textarea
                ref={inputRef}
                value={input}
                onPaste={handlePaste}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Dán nội dung đơn hàng Etsy..."
                className="w-full h-80 p-5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none resize-none text-sm leading-relaxed transition-all placeholder:text-slate-400 font-medium"
              />
              <div className="absolute bottom-4 right-4 text-[10px] text-slate-400 font-mono pointer-events-none">
                {autoParse ? '⚡ Lightning Active' : 'Manual Mode'}
              </div>
            </div>
            
            {error && (
              <div className="bg-red-50 text-red-700 text-xs p-3.5 rounded-xl border border-red-100 flex items-start gap-2">
                <span className="mt-0.5">⚠️</span>
                {error}
              </div>
            )}
            
            <button
              onClick={() => handleParse()}
              disabled={isLoading || !input.trim()}
              className={`w-full py-4 px-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] ${
                isLoading || !input.trim()
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang Xử Lý...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Phân Tích
                </>
              )}
            </button>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
               Hỗ trợ Hosting
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Ứng dụng này đã được tối ưu để chạy trên <b>Vercel, Netlify hoặc GitHub Pages</b>. Chỉ cần upload mã nguồn và cấu hình API Key trong mục Environment Variables là xong.
            </p>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold flex items-center gap-2 text-slate-800">
              <History size={18} className="text-indigo-600" />
              Lịch Sử Xử Lý
            </h2>
            <div className="flex gap-2">
              {results.length > 0 && (
                <>
                  <button 
                    onClick={exportToCSV}
                    className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 transition-colors bg-indigo-50 px-3 py-1.5 rounded-full flex items-center gap-1.5"
                  >
                    <Download size={14} />
                    Xuất CSV
                  </button>
                  <button 
                    onClick={clearHistory}
                    className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-700 transition-colors bg-red-50 px-3 py-1.5 rounded-full"
                  >
                    Xóa Hết
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="space-y-5 pb-10">
            {results.length === 0 ? (
              <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-16 text-center">
                <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                  <Layout size={40} />
                </div>
                <h3 className="text-slate-800 font-bold text-lg">Chưa có dữ liệu</h3>
                <p className="text-slate-400 text-sm max-w-[280px] mx-auto mt-2 font-medium">
                  Kết quả phân tích sẽ xuất hiện tại đây.
                </p>
              </div>
            ) : (
              results.map((result) => (
                <ResultCard
                  key={result.id}
                  id={result.id}
                  blocks={result.blocks}
                  timestamp={result.timestamp}
                  onDelete={deleteResult}
                  onUpdate={(newBlocks) => updateResultBlocks(result.id, newBlocks)}
                />
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
