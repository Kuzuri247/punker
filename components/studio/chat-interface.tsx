"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Sparkles,
  Bot,
  User,
  ChevronDown,
  ChevronUp,
  Code2,
  Play,
  RotateCcw,
  Copy,
  Check,
  Paperclip,
  Flame,
  Zap,
  Boxes,
  Cpu,
  Columns,
  Maximize2,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  content: string;
  thoughtProcess?: string[];
  codeSnippet?: string;
  timestamp: string;
}

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isGenerating: boolean;
  projectTitle: string;
  viewMode: "split" | "chat" | "canvas";
  onSetViewMode: (mode: "split" | "chat" | "canvas") => void;
}

const STARTER_PROMPTS = [
  "Build a 3D cyberpunk hovercraft runner with neon obstacles and particle trails",
  "Create an isometric dungeon crawler with enemy AI patrol state machine",
  "Design a zero-gravity space dogfight game with 6-DOF physics and plasma lasers",
  "Generate a voxel combat arena where players fire projectiles to shatter blocks",
];

const AI_MODELS = [
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", badge: "GameDev Turbo" },
  { id: "claude-3.5-sonnet", name: "Claude 3.5 Sonnet", badge: "3D Specialist" },
  { id: "gpt-4o", name: "GPT-4o Engine", badge: "Logic & Shaders" },
];

export function ChatInterface({
  messages,
  onSendMessage,
  isGenerating,
  projectTitle,
  viewMode,
  onSetViewMode,
}: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState(AI_MODELS[0]);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [expandedThoughts, setExpandedThoughts] = useState<Record<string, boolean>>({});
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGenerating]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isGenerating) return;
    onSendMessage(input.trim());
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInputResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
  };

  const toggleThoughts = (id: string) => {
    setExpandedThoughts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-[#080b12] relative overflow-hidden">
      {/* Studio Top Control Bar */}
      <div className="h-14 px-4 border-b border-border/40 flex items-center justify-between bg-slate-950/70 shrink-0 z-10 backdrop-blur-md">
        {/* Left: Project title & Model selector */}
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-bold text-slate-100 truncate max-w-[200px] sm:max-w-xs">
            {projectTitle}
          </h2>

          {/* Model Selector Pill */}
          <div className="relative">
            <button
              onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-300 hover:text-white hover:border-slate-700 transition-all cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span className="font-medium">{selectedModel.name}</span>
              <span className="hidden sm:inline text-[9px] font-mono px-1 py-0.2 rounded bg-emerald-500/15 text-emerald-400">
                {selectedModel.badge}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-500 ml-0.5" />
            </button>

            {modelDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-56 rounded-xl bg-slate-950 border border-slate-800 p-1.5 shadow-2xl z-50">
                {AI_MODELS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setSelectedModel(m);
                      setModelDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      selectedModel.id === m.id
                        ? "bg-slate-900 text-emerald-400 font-semibold"
                        : "text-slate-300 hover:bg-slate-900/60"
                    }`}
                  >
                    <span>{m.name}</span>
                    <span className="text-[10px] font-mono text-slate-500">{m.badge}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: View Mode Toggle */}
        <div className="flex items-center gap-1 bg-slate-900/90 rounded-lg p-0.5 border border-slate-800 text-xs">
          <button
            onClick={() => onSetViewMode("chat")}
            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
              viewMode === "chat"
                ? "bg-emerald-500/20 text-emerald-300 font-semibold"
                : "text-slate-400 hover:text-slate-200"
            }`}
            title="Chat Only"
          >
            Chat
          </button>
          <button
            onClick={() => onSetViewMode("split")}
            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
              viewMode === "split"
                ? "bg-emerald-500/20 text-emerald-300 font-semibold"
                : "text-slate-400 hover:text-slate-200"
            }`}
            title="Split Dual View (Chat + 3D Viewport)"
          >
            <Columns className="w-3 h-3" />
            <span className="hidden sm:inline">Split</span>
          </button>
          <button
            onClick={() => onSetViewMode("canvas")}
            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
              viewMode === "canvas"
                ? "bg-emerald-500/20 text-emerald-300 font-semibold"
                : "text-slate-400 hover:text-slate-200"
            }`}
            title="Canvas Full View"
          >
            Canvas
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6">
        {messages.length === 0 ? (
          /* Empty Welcome Hero (Gemini style) */
          <div className="max-w-2xl mx-auto text-center my-auto pt-10 pb-6 flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-500 flex items-center justify-center shadow-xl shadow-emerald-500/20 mb-5 border border-emerald-400/40 animate-pulse">
              <Bot className="w-7 h-7 text-black" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              What game would you like to create?
            </h1>

            <p className="text-slate-400 text-xs sm:text-sm mt-2 max-w-md">
              Prompt a game concept, 3D voxel world, or physics simulation. The engine synthesizes Three.js code and launches your game in real time.
            </p>

            {/* Starter Prompts Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full mt-8 text-left">
              {STARTER_PROMPTS.map((promptText, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendMessage(promptText)}
                  className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/90 hover:border-emerald-500/50 hover:bg-slate-900 text-slate-300 hover:text-white transition-all text-xs leading-relaxed group cursor-pointer shadow-sm"
                >
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 font-semibold mb-1">
                    <Sparkles className="w-3 h-3 group-hover:rotate-12 transition-transform" />
                    Prompt Starter
                  </div>
                  {promptText}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Message List */
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3.5 ${
                  msg.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.sender === "assistant" && (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shrink-0 shadow-md text-black mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`flex flex-col gap-2 max-w-[88%] sm:max-w-[80%] ${
                    msg.sender === "user" ? "items-end" : "items-start"
                  }`}
                >
                  {/* Sender & Timestamp */}
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono px-1">
                    <span>{msg.sender === "user" ? "You" : selectedModel.name}</span>
                    <span>•</span>
                    <span>{msg.timestamp}</span>
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                      msg.sender === "user"
                        ? "bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-950/40 rounded-tr-none"
                        : "bg-slate-900/90 border border-slate-800 text-slate-200 shadow-xl rounded-tl-none backdrop-blur-md w-full"
                    }`}
                  >
                    {/* Collapsible Thoughts (Gemini style) */}
                    {msg.sender === "assistant" && msg.thoughtProcess && (
                      <div className="mb-3 rounded-xl bg-slate-950/80 border border-slate-800/80 overflow-hidden">
                        <button
                          onClick={() => toggleThoughts(msg.id)}
                          className="w-full px-3 py-2 text-[11px] font-mono text-emerald-400 flex items-center justify-between hover:bg-slate-900/60 transition-colors cursor-pointer"
                        >
                          <span className="flex items-center gap-1.5 font-semibold">
                            <Sparkles className="w-3.5 h-3.5" />
                            Agent Reasoning & Compilation Steps ({msg.thoughtProcess.length})
                          </span>
                          {expandedThoughts[msg.id] ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {expandedThoughts[msg.id] && (
                          <div className="px-3 pb-2.5 pt-1 space-y-1.5 border-t border-slate-800/60 text-[11px] font-mono text-slate-400">
                            {msg.thoughtProcess.map((step, idx) => (
                              <div key={idx} className="flex items-start gap-2">
                                <span className="text-emerald-400">✓</span>
                                <span>{step}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Content text */}
                    <div className="whitespace-pre-wrap">{msg.content}</div>

                    {/* Embedded Code Snippet */}
                    {msg.codeSnippet && (
                      <div className="mt-3 rounded-xl bg-black/80 border border-slate-800 p-3 font-mono text-xs overflow-hidden">
                        <div className="flex items-center justify-between text-[10px] text-slate-500 pb-2 mb-2 border-b border-slate-800">
                          <span className="flex items-center gap-1 text-slate-400">
                            <Code2 className="w-3 h-3 text-emerald-400" />
                            Three.js Scene Script
                          </span>
                          <button
                            onClick={() => handleCopyCode(msg.id, msg.codeSnippet || "")}
                            className="hover:text-emerald-400 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            {copiedCodeId === msg.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" /> Copied
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" /> Copy
                              </>
                            )}
                          </button>
                        </div>
                        <pre className="text-[11px] text-emerald-300/90 leading-relaxed overflow-x-auto whitespace-pre">
                          {msg.codeSnippet}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>

                {msg.sender === "user" && (
                  <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-slate-300 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {isGenerating && (
              <div className="flex gap-3.5 justify-start">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shrink-0 shadow-md text-black animate-pulse">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-3.5 rounded-2xl rounded-tl-none bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center gap-2.5 shadow-lg">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Agent synthesizing 3D scene & compiling WebGL shaders...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Floating Bottom Prompt Composer (Gemini style) */}
      <div className="p-4 bg-gradient-to-t from-[#080b12] via-[#080b12]/95 to-transparent shrink-0">
        <div className="max-w-3xl mx-auto">
          <form
            onSubmit={handleSubmit}
            className="relative rounded-2xl bg-slate-900/90 border border-slate-800/90 hover:border-slate-700 focus-within:border-emerald-500/50 shadow-2xl backdrop-blur-xl transition-all p-2.5"
          >
            {/* Input Textarea */}
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={handleInputResize}
              onKeyDown={handleKeyDown}
              placeholder="Ask the engine to build, modify, or script your game (e.g. 'Add obstacle collisions and jump mechanics')..."
              className="w-full bg-transparent text-slate-100 placeholder:text-slate-500 text-xs sm:text-sm px-2 py-1.5 resize-none focus:outline-none max-h-44 overflow-y-auto"
            />

            {/* Composer Footer Controls */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 mt-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700/60 flex items-center gap-1">
                  <Boxes className="w-3 h-3 text-emerald-400" />
                  Three.js 3D
                </span>
                <span className="hidden sm:inline text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700/60">
                  Inngest Durable
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 hidden sm:inline font-mono">
                  Press Enter ↵
                </span>
                <Button
                  type="submit"
                  disabled={!input.trim() || isGenerating}
                  className="h-8 w-8 p-0 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black shadow-md shadow-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
                  title="Send message"
                >
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
