import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4 text-center">
      <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center text-4xl font-black text-[#1e3a5f] mb-4">
        404
      </div>
      <h2 className="text-xl font-bold text-gray-900">Sahifa topilmadi</h2>
      <p className="text-xs text-gray-500 mt-1 max-w-sm">
        Siz qidirayotgan sahifa mavjud emas yoki boshqa manzilga ko‘chirilgan.
      </p>
      <Link to="/dashboard" className="mt-6">
        <Button variant="primary" size="md" leftIcon={<Home className="w-4 h-4" />}>
          Boshqaruv paneliga qaytish
        </Button>
      </Link>
    </div>
  );
};
