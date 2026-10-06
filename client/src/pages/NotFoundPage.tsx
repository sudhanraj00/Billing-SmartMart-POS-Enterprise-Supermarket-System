import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { ShoppingCart, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mb-4">
        <ShoppingCart className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-black text-gray-900 tracking-tight">404 - Page Not Found</h1>
      <p className="text-xs text-gray-500 max-w-sm mt-1 mb-6">
        The requested screen or module does not exist or has been relocated in the SmartMart POS system.
      </p>
      <Link to="/pos">
        <Button variant="primary" size="md" icon={<ArrowLeft className="w-4 h-4" />}>
          Return to POS Terminal
        </Button>
      </Link>
    </div>
  );
};
