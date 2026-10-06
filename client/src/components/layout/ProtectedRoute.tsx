import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { RoleType } from '../../types';
import { Loader2, ShieldX } from 'lucide-react';

interface ProtectedRouteProps {
  allowedRoles?: RoleType[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-xs text-gray-500 font-medium">Verifying SmartMart POS credentials...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mb-3">
          <ShieldX className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-gray-900">Access Restricted</h2>
        <p className="text-xs text-gray-500 max-w-sm mt-1">
          Your account role (<span className="font-semibold text-gray-700">{user.role}</span>) does not have permission to view this module.
        </p>
      </div>
    );
  }

  return <Outlet />;
};
