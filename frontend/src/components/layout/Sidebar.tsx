import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  Boxes,
  PackageCheck,
  Box,
  ShieldCheck,
  AlertTriangle,
  Truck,
  BarChart3,
  Bot,
  Zap,
  Activity,
  Layers,
} from 'lucide-react';

interface SidebarProps {
  onOpenCopilot: () => void;
  onOpenSimulation: () => void;
  role: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onOpenCopilot,
  onOpenSimulation,
  role,
}) => {
  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['ALL'] },
    { label: 'Orders', path: '/orders', icon: ShoppingBag, roles: ['ALL'] },
    { label: 'Inventory', path: '/inventory', icon: Boxes, roles: ['ADMIN', 'WAREHOUSE_MANAGER'] },
    { label: 'Picking', path: '/picking', icon: PackageCheck, roles: ['ADMIN', 'WAREHOUSE_MANAGER', 'PICKER'] },
    { label: 'Packing', path: '/packing', icon: Box, roles: ['ADMIN', 'WAREHOUSE_MANAGER', 'PACKER'] },
    { label: 'Quality Control', path: '/qc', icon: ShieldCheck, roles: ['ADMIN', 'WAREHOUSE_MANAGER', 'QUALITY_INSPECTOR'] },
    { label: 'Exceptions', path: '/exceptions', icon: AlertTriangle, badge: 'CRITICAL', roles: ['ALL'] },
    { label: 'Dispatch', path: '/dispatch', icon: Truck, roles: ['ALL'] },
    { label: 'Analytics', path: '/analytics', icon: BarChart3, roles: ['ADMIN', 'WAREHOUSE_MANAGER'] },
  ];

  const filteredNavItems = navItems.filter(
    (item) => item.roles.includes('ALL') || item.roles.includes(role)
  );

  return (
    <aside className="w-64 bg-[#0d1320] border-r border-[rgba(59,130,246,0.15)] flex flex-col justify-between h-screen sticky top-0 z-30 select-none shadow-2xl">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-[rgba(59,130,246,0.15)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-lg tracking-tight text-white">WareMind</span>
                <span className="text-[10px] bg-gradient-to-r from-blue-500/30 to-indigo-500/30 text-blue-300 font-extrabold px-1.5 py-0.5 rounded-md border border-blue-400/30">
                  AI
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide">Fulfillment Decision Engine</p>
            </div>
          </div>
        </div>

        {/* Live Status Pill */}
        <div className="px-4 py-3 mx-3 my-3 rounded-xl bg-blue-950/30 border border-blue-500/20 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[11px] font-bold text-slate-200">ENGINE ONLINE</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 font-bold">100% SLA</span>
        </div>

        {/* Navigation Menu */}
        <nav className="p-3 space-y-1">
          <div className="px-3 py-1.5 text-[10px] font-extrabold tracking-wider text-slate-500 uppercase">
            Operations Platform
          </div>

          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  isActive ? 'nav-item-active' : 'nav-item'
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="font-semibold flex-1 text-xs">{item.label}</span>
                {item.badge && (
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-sm shadow-red-500" />
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* AI Triggers Footer */}
      <div className="p-3 border-t border-[rgba(59,130,246,0.15)] space-y-2 bg-slate-950/50">
        <div className="px-3 text-[10px] font-extrabold tracking-wider text-slate-500 uppercase">
          Decision Intelligence
        </div>

        <button
          onClick={onOpenCopilot}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-purple-600/10 hover:from-blue-600/30 hover:to-indigo-600/30 text-blue-300 border border-blue-500/30 text-xs font-bold transition-all shadow-md group cursor-pointer"
        >
          <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 group-hover:scale-110 transition-transform">
            <Bot className="w-4 h-4" />
          </div>
          <div className="text-left flex-1">
            <div className="text-white font-bold text-xs">WareMind Copilot</div>
            <div className="text-[10px] text-blue-300/70 font-normal">Ask Operational AI</div>
          </div>
        </button>

        <button
          onClick={onOpenSimulation}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/15 to-orange-500/10 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all shadow-md group cursor-pointer"
        >
          <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 group-hover:rotate-12 transition-transform">
            <Zap className="w-4 h-4" />
          </div>
          <div className="text-left flex-1">
            <div className="text-white font-bold text-xs">Demo Simulation</div>
            <div className="text-[10px] text-amber-300/70 font-normal">Crisis & Priority Simulation</div>
          </div>
        </button>
      </div>
    </aside>
  );
};
