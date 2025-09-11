import React, { useState, useRef, useEffect } from 'react';
import ChatIcon from './ChatIcon';
import useChatBot, { ChatMessage } from './useChatBot';

interface ChatWidgetProps {
  title?: string;
  placeholder?: string;
  suggestedQuestions?: string[];
  botType?: 'school' | 'department';
  department?: string;
  course?: string;
}

export default function ChatWidget({
  title = '학교 안내 봇',
  placeholder = '무엇이든 질문해 보세요 (예: 해부생리 근수축 원리)',
  suggestedQuestions = ['슬라이딩 필라멘트 이론 설명', 'ATP의 역할은?', '근수축과 칼슘의 상호작용은?'],
  botType = 'school',
  department,
  course,
}: ChatWidgetProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const { messages, loading, send, setMessages } = useChatBot({ botType, department, course });
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;
    await send(input.trim());
    setInput('');
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!open && (
        <button
          aria-label="Open chat"
          onClick={() => setOpen(true)}
          className="shadow-lg rounded-full p-4 bg-blue-600 text-white hover:bg-blue-700 transition"
        >
          <ChatIcon className="w-6 h-6" />
        </button>
      )}

      {open && (
        <div ref={panelRef} className="w-[360px] max-w-[90vw] h-[520px] bg-white rounded-xl shadow-2xl border flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-blue-600 text-white rounded-t-xl">
            <div className="flex items-center gap-2">
              <ChatIcon className="w-5 h-5" />
              <span className="font-semibold">{title}</span>
            </div>
            <button onClick={() => setOpen(false)} className="opacity-80 hover:opacity-100">×</button>
          </div>

          <div className="flex-1 overflow-auto p-3 space-y-3 bg-gray-50">
            {messages.length === 0 && (
              <div className="text-sm text-gray-600">
                아래 예시로 바로 시작해보세요:
                <div className="mt-2 flex flex-wrap gap-2">
                  {suggestedQuestions.map((q) => (
                    <button key={q} onClick={() => setInput(q)} className="text-xs bg-white border rounded px-2 py-1 hover:bg-gray-100">
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m: ChatMessage, idx: number) => (
              <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border text-gray-800'}`}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && <div className="text-xs text-gray-500">답변을 불러오는 중…</div>}
          </div>

          <div className="p-3 border-t bg-white">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
                placeholder={placeholder}
                className="flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <button onClick={handleSend} disabled={loading} className="px-3 py-2 bg-blue-600 text-white rounded disabled:opacity-50">
                전송
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

