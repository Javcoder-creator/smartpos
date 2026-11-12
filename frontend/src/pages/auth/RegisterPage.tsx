import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Building, Phone, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from '@/i18n';
import api from '@/lib/axios';

export const RegisterPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [formData, setFormData] = useState({
    businessName: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Parollar bir-biriga mos kelmadi');
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post('/auth/register', {
        businessName: formData.businessName,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      });

      const { user, business, tokens } = response.data.data;

      setAuth(
        {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          businessId: user.businessId,
          businessName: business?.name || formData.businessName,
        },
        tokens.accessToken
      );

      toast.success('Muvaffaqiyatli ro‘yxatdan o‘tildi! 14 kunlik sinov boshlandi.');
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Ro‘yxatdan o‘tishda xatolik yuz berdi';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">{t('auth.registerTitle')}</h2>
        <p className="text-xs text-gray-500 mt-1">{t('auth.registerSubtitle')}</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <Input
          label={t('auth.businessName')}
          name="businessName"
          required
          placeholder="Masalan: Omad Supermarket"
          value={formData.businessName}
          onChange={handleChange}
          leftIcon={<Building className="w-4 h-4" />}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label={t('auth.firstName')}
            name="firstName"
            required
            placeholder="Ali"
            value={formData.firstName}
            onChange={handleChange}
            leftIcon={<User className="w-4 h-4" />}
          />
          <Input
            label={t('auth.lastName')}
            name="lastName"
            required
            placeholder="Valiyev"
            value={formData.lastName}
            onChange={handleChange}
          />
        </div>

        <Input
          label={t('auth.email')}
          name="email"
          type="email"
          required
          placeholder="ali@omad.uz"
          value={formData.email}
          onChange={handleChange}
          leftIcon={<Mail className="w-4 h-4" />}
        />

        <Input
          label={t('auth.phone')}
          name="phone"
          placeholder="+998 90 123 45 67"
          value={formData.phone}
          onChange={handleChange}
          leftIcon={<Phone className="w-4 h-4" />}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label={t('auth.password')}
            name="password"
            type="password"
            required
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            leftIcon={<Lock className="w-4 h-4" />}
          />
          <Input
            label={t('auth.confirmPassword')}
            name="confirmPassword"
            type="password"
            required
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={handleChange}
          />
        </div>

        <Button
          type="submit"
          variant="accent"
          size="lg"
          className="w-full mt-3"
          isLoading={isLoading}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          {t('auth.registerBtn')}
        </Button>
      </form>

      <div className="mt-6 text-center text-xs text-gray-500">
        {t('auth.hasAccount')}{' '}
        <Link to="/login" className="font-bold text-[#1e3a5f] hover:text-[#10b981] transition-colors">
          {t('auth.loginBtn')}
        </Link>
      </div>
    </div>
  );
};
