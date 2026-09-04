"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Gamepad2,
  Plus,
  MessageSquare,
  Search,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Database,
  Bot,
  ShieldCheck,
  FolderGit2,
  ExternalLink,
  Code2,
  Settings,
  Flame,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppUserButton } from "@/components/auth/auth-provider";

export interface GameProject {
  id: string;
  title: string;
  genre: string;
  engine: string;
  updatedAt: string;
  messagesCount: number;
}

interface StudioSidebarProps {
  projects: GameProject[];
  activeProjectId: string;
  onSelectProject: (id: string) => void;
  onNewProject: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function StudioSidebar({
  projects,
  activeProjectId,
  onSelectProject,
  onNewProject,
  collapsed,
  onToggleCollapse,
}: StudioSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProjects = projects.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside
      className={`h-full border-r border-border/40 bg-[#07090e] transition-all duration-300 flex flex-col justify-between shrink-0 select-none z-20 ${
        collapsed ? "w-16" : "w-64 sm:w-72"
      }`}
    >
      {/* Top Header */}
      <div>
        <div className="h-14 px-3.5 border-b border-border/40 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20 border border-emerald-400/30">
              <Gamepad2 className="w-4 h-4 text-black" />
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-sm tracking-tight text-white truncate">
                  PUNKER AI
                </span>
                <span className="text-[9px] font-mono text-emerald-400 font-semibold uppercase tracking-wider">
                  Game Studio v2
                </span>
              </div>
            )}
          </Link>

          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="h-7 w-7 p-0 text-slate-400 hover:text-slate-100 hover:bg-slate-850"
            title={collapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>

        {/* Action: New Game Project Button */}
        <div className="p-3">
          <Button
            onClick={onNewProject}
            className={`w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-semibold text-xs h-9 shadow-md shadow-emerald-500/20 cursor-pointer rounded-xl flex items-center justify-center transition-all ${
              collapsed ? "p-0" : "px-3"
            }`}
            title="Create New Game Project"
          >
            <Plus className="w-4 h-4 shrink-0" />
            {!collapsed && <span className="ml-2 font-bold truncate">New Game Chat</span>}
          </Button>
        </div>

        {/* Search Input (When expanded) */}
        {!collapsed && (
          <div className="px-3 pb-2">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 absolute left-2.5 text-slate-500 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search games..."
                className="w-full bg-slate-900/80 border border-slate-800 text-slate-200 text-xs rounded-lg pl-8 pr-3 py-1.5 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>
        )}

        {/* Projects List */}
        <div className="px-2 py-2 overflow-y-auto max-h-[calc(100vh-320px)] space-y-1">
          {!collapsed && (
            <div className="px-2 py-1 text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-500 flex items-center justify-between">
              <span>Recent Game Sessions</span>
              <span>{filteredProjects.length}</span>
            </div>
          )}

          {filteredProjects.map((project) => {
            const isActive = project.id === activeProjectId;
            return (
              <button
                key={project.id}
                onClick={() => onSelectProject(project.id)}
                className={`w-full text-left rounded-xl transition-all cursor-pointer flex items-center ${
                  collapsed ? "p-2.5 justify-center" : "px-2.5 py-2"
                } ${
                  isActive
                    ? "bg-slate-900 border border-emerald-500/40 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent"
                }`}
                title={project.title}
              >
                <div
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    isActive ? "bg-emerald-400 shadow-[0_0_8px_#10b981]" : "bg-slate-700"
                  }`}
                />

                {!collapsed && (
                  <div className="ml-2.5 flex flex-col min-w-0 flex-1">
                    <span className="text-xs font-medium truncate text-slate-200">
                      {project.title}
                    </span>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                      <span className="truncate">{project.genre}</span>
                      <span>•</span>
                      <span>{project.engine}</span>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom User & Architecture Status Section */}
      <div className="border-t border-border/40 p-3 bg-slate-950/60">
        {!collapsed && (
          <div className="mb-3 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 text-[11px] space-y-1.5">
            <div className="flex items-center justify-between text-slate-400 font-mono text-[10px]">
              <span className="font-semibold text-slate-300">PLATFORM STACK</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-400">
              <div className="flex items-center gap-1 truncate">
                <Bot className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>Inngest Agent</span>
              </div>
              <div className="flex items-center gap-1 truncate">
                <Database className="w-3 h-3 text-teal-400 shrink-0" />
                <span>Neon Postgres</span>
              </div>
            </div>
          </div>
        )}

        {/* User profile & Clerk integration */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <AppUserButton />
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-slate-200 truncate">
                  Creator Studio
                </span>
                <span className="text-[10px] text-emerald-400 font-mono font-medium">
                  Architect Tier
                </span>
              </div>
            )}
          </div>

          {!collapsed && (
            <Link href="/" title="Back to Home Landing">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-slate-400 hover:text-white"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </aside>
  );
}
