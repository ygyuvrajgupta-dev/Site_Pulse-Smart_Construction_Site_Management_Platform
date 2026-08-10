import { useState, useEffect, useRef } from 'react';
import { createChatSession, listChatSessions, getChatSession, sendChatMessage, deleteChatSession } from '@/services/aiService';
import { FiSend, FiPlus, FiTrash2, FiMessageSquare } from 'react-icons/fi';

export default function AiChat() {
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  async function loadSessions() {
    try {
      const res = await listChatSessions();
      setSessions(res.data || []);
    } catch (err) {
      console.error('Failed to load sessions', err);
    }
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function handleNewSession() {
    try {
      const res = await createChatSession({ title: 'New Chat' });
      const session = res.data;
      setSessions([session, ...sessions]);
      setActiveSession(session);
      setMessages([]);
    } catch (err) {
      console.error('Failed to create session', err);
    }
  }

  async function handleSelectSession(sessionId) {
    try {
      setLoading(true);
      const res = await getChatSession(sessionId);
      setActiveSession(res.data);
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error('Failed to load session', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteSession(sessionId) {
    try {
      await deleteChatSession(sessionId);
      setSessions(sessions.filter((s) => s.id !== sessionId));
      if (activeSession?.id === sessionId) {
        setActiveSession(null);
        setMessages([]);
      }
    } catch (err) {
      console.error('Failed to delete session', err);
    }
  }

  async function handleSend() {
    if (!input.trim() || !activeSession || sending) return;

    const userMessage = { role: 'USER', content: input, createdAt: new Date().toISOString() };
    setMessages([...messages, userMessage]);
    setInput('');
    setSending(true);

    try {
      const res = await sendChatMessage(activeSession.id, { content: input });
      setMessages([...messages, userMessage, res.data.aiMessage]);
    } catch (err) {
      console.error('Failed to send message', err);
      setMessages([...messages, userMessage, {
        role: 'ASSISTANT',
        content: 'Sorry, I encountered an error. Please try again.',
        createdAt: new Date().toISOString(),
      }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sessions Sidebar */}
      <div className="w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={handleNewSession}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 font-medium transition-colors"
          >
            <FiPlus size={18} />
            New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer mb-1 transition-colors ${
                activeSession?.id === session.id
                  ? 'bg-blue-100 dark:bg-blue-900/30'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              onClick={() => handleSelectSession(session.id)}
            >
              <div className="flex items-center gap-2 min-w-0">
                <FiMessageSquare className="text-gray-400 shrink-0" size={16} />
                <span className="truncate text-sm text-gray-700 dark:text-gray-300">
                  {session.title}
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteSession(session.id);
                }}
                className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 p-1"
              >
                <FiTrash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-800">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            {activeSession?.title || 'AI Chat'}
          </h2>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!activeSession && (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <FiMessageSquare size={48} className="mx-auto mb-4" />
                <p>Select a session or start a new chat</p>
              </div>
            </div>
          )}

          {loading && (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'USER' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg px-4 py-2 ${
                  msg.role === 'USER'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder={activeSession ? 'Type your message...' : 'Start a new chat first'}
              disabled={!activeSession || sending}
              className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={!activeSession || sending || !input.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 disabled:opacity-50 transition-colors"
            >
              <FiSend size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}