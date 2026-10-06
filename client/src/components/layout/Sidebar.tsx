import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Layers,
  Boxes,
  Truck,
  Users,
  FileText,
  RotateCcw,
  BarChart3,
  UserCheck,
  Settings,
  ShieldCheck,
  ClipboardList,
} from 'lucide-react';
import { clsx } from 'clsx';

interface NavItem {
  name: string;
  to: string;
  icon: React.ReactNode;
  roles: Array<'ADMIN' | 'CASHIER' | 'INVENTORY_MANAGER'>;
  badge?: string;
}

export const Sidebar: React.FC = () => {
  const { user } = useAuthStore();
  const role = user?.role || 'CASHIER';

  const navItems: NavItem[] = [
    {
      name: 'POS Terminal',
      to: '/pos',
      icon: <ShoppingCart className="w-4 h-4" />,
      roles: ['ADMIN', 'CASHIER'],
      badge: 'F1',
    },
    {
      name: 'Dashboard',
      to: '/dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
      roles: ['ADMIN'],
    },
    {
      name: 'Sales Invoices',
      to: '/invoices',
      icon: <FileText className="w-4 h-4" />,
      roles: ['ADMIN', 'CASHIER', 'INVENTORY_MANAGER'],
    },
    {
      name: 'Returns & Voids',
      to: '/returns',
      icon: <RotateCcw className="w-4 h-4" />,
      roles: ['ADMIN', 'CASHIER', 'INVENTORY_MANAGER'],
    },
    {
      name: 'Customers & Credit',
      to: '/customers',
      icon: <Users className="w-4 h-4" />,
      roles: ['ADMIN', 'CASHIER', 'INVENTORY_MANAGER'],
    },
    {
      name: 'Products & Pricing',
      to: '/products',
      icon: <Package className="w-4 h-4" />,
      roles: ['ADMIN', 'INVENTORY_MANAGER'],
    },
    {
      name: 'Categories & Brands',
      to: '/categories',
      icon: <Layers className="w-4 h-4" />,
      roles: ['ADMIN', 'INVENTORY_MANAGER'],
    },
    {
      name: 'Inventory & Stock',
      to: '/inventory',
      icon: <Boxes className="w-4 h-4" />,
      roles: ['ADMIN', 'INVENTORY_MANAGER'],
    },
    {
      name: 'Purchase Stock-In',
      to: '/purchases',
      icon: <ClipboardList className="w-4 h-4" />,
      roles: ['ADMIN', 'INVENTORY_MANAGER'],
    },
    {
      name: 'Suppliers CRM',
      to: '/suppliers',
      icon: <Truck className="w-4 h-4" />,
      roles: ['ADMIN', 'INVENTORY_MANAGER'],
    },
    {
      name: 'Reports & Analytics',
      to: '/reports',
      icon: <BarChart3 className="w-4 h-4" />,
      roles: ['ADMIN'],
    },
    {
      name: 'Users & Roles',
      to: '/users',
      icon: <UserCheck className="w-4 h-4" />,
      roles: ['ADMIN'],
    },
    {
      name: 'Store Settings',
      to: '/settings',
      icon: <Settings className="w-4 h-4" />,
      roles: ['ADMIN'],
    },
    {
      name: 'Audit Trail',
      to: '/audit-logs',
      icon: <ShieldCheck className="w-4 h-4" />,
      roles: ['ADMIN'],
    },
  ];

  const allowedItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="w-60 bg-slate-900 border-r border-slate-800 flex flex-col flex-shrink-0 select-none text-slate-300">
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Navigation
        </div>
        {allowedItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              clsx(
                'flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all group',
                isActive
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )
            }
          >
            <div className="flex items-center gap-3">
              <span className="text-current opacity-90 group-hover:scale-105 transition-transform">
                {item.icon}
              </span>
              <span>{item.name}</span>
            </div>
            {item.badge && (
              <span className="text-[10px] bg-emerald-700/60 text-white font-mono px-1.5 py-0.5 rounded">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </div>

      {/* Counter Tag */}
      <div className="p-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
        <span>Counter 01</span>
        <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Online
        </span>
      </div>
    </aside>
  );
};
