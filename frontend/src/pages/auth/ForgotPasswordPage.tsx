import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useTranslation } from '@/i18n';
import api from '@/lib/axios';

export const ForgotPasswordPage: React.FC = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await api.post('/auth/forgot-password', { email });
      setIsSent(true);
      toast.success('Parolni tiklash bo‘yicha ko‘rsatma yuborildi');
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Xatolik yuz berdi');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">{t('auth.forgotPasswordTitle')}</h2>
        <p className="text-xs text-gray-500 mt-1">{t('auth.forgotPasswordSubtitle')}</p>
      </div>

      {isSent ? (
        <div className="text-center space-y-4 py-4">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <Send className="w-6 h-6" />
          </div>
          <p className="text-xs text-gray-600">
            Agar <strong>{email}</strong> tizimda mavjud bo‘lsa, unga parolni tiklash bo‘yicha havola yuborildi.
          </p>
          <Link to="/login">
            <Button variant="outline" size="md" className="w-full mt-4">
              {t('auth.backToLogin')}
            </Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={t('auth.email')}
            type="email"
            required
            placeholder="admin@smartpos.uz"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4" />}
          />

          <Button
            type="submit"
            variant="accent"
            size="lg"
            className="w-full"
            isLoading={isLoading}
            leftIcon={<Send className="w-4 h-4" />}
          >
            {t('auth.sendResetLink')}
          </Button>

          <div className="text-center pt-2">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs text-gray-600 hover:text-[#1e3a5f] font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {t('auth.backToLogin')}
            </Link>
          </div>
        </form>
      )}
    </div>
  );
};
