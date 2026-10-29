import React, { useState, useEffect, useRef } from 'react';
import { Send, X, MessageSquare, Users } from 'lucide-react';

export default function ChatDrawer({
  isOpen,
  onClose,
  projectId,
  currentUser,
  activeUsers = []
}) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const fetchMessages = async () => {
    if (!projectId) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/chat`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (isOpen) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 2500);
      return () => clearInterval(interval);
    }
  }, [isOpen, projectId]);

  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || sending) return;

    setSending(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: currentUser?.name || 'Guest',
          color: currentUser?.color || '#3b82f6',
          text: text.trim()
        })
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data.message]);
        setText('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="w-80 bg-gray-900 border-l border-gray-800 flex flex-col h-full shadow-2xl z-30 select-none">
      {/* Chat Header */}
      <div className="h-12 px-4 bg-gray-950 border-b border-gray-800 flex items-center justify-between text-xs font-semibold text-gray-300">
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-4 h-4 text-indigo-400" />
          <span>Team Discussion ({activeUsers.length})</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Online Collaborators quick bar */}
      <div className="px-3 py-2 bg-gray-950/60 border-b border-gray-800/80 flex items-center space-x-1.5 overflow-x-auto text-[11px] text-gray-400">
        <Users className="w-3 h-3 text-gray-500 shrink-0" />
        <span className="shrink-0 text-gray-500">Online:</span>
        <div className="flex items-center space-x-1">
          {activeUsers.map((u, i) => (
            <span
              key={i}
              className="px-1.5 py-0.5 rounded text-[10px] font-medium text-white shrink-0"
              style={{ backgroundColor: u.color || '#6366f1' }}
            >
              {u.name}
            </span>
          ))}
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 select-text text-xs">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-10">
            No messages yet. Say hello to your collaborators!
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.sender === currentUser?.name;
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center space-x-1.5 mb-1 text-[10px] text-gray-500">
                  <span
                    className="font-semibold"
                    style={{ color: m.color || '#818cf8' }}
                  >
                    {m.sender}
                  </span>
                  <span>•</span>
                  <span>{m.timestamp}</span>
                </div>
                <div
                  className={`p-2.5 rounded-lg max-w-[85%] break-words leading-relaxed ${
                    isMe
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-gray-800 text-gray-200 border border-gray-700/60 rounded-bl-none'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Chat Input */}
      <form onSubmit={handleSend} className="p-3 bg-gray-950 border-t border-gray-800 flex items-center space-x-2">
        <input
          type="text"
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-100 focus:outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 text-white rounded-lg transition"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}

