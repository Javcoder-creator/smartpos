import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UserCheck,
  Plus,
  Shield,
  Phone,
  Mail,
  Store,
  Edit2,
  Trash2,
  Key,
  CheckCircle,
  XCircle,
  Lock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Skeleton, EmptyState } from '@/components/ui/Feedback';
import api from '@/lib/axios';

interface EmployeeItem {
  id: string;
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
  roleId: string;
  branchId?: string;
  isActive: boolean;
  createdAt: string;
  role?: { id: string; name: string; slug: string; description?: string };
  branch?: { id: string; name: string };
}

export const EmployeesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'employees' | 'roles'>('employees');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeItem | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    roleId: '',
    branchId: '',
    password: '',
  });

  // 1. Fetch Employees
  const { data: employees = [], isLoading } = useQuery<EmployeeItem[]>({
    queryKey: ['employees-list'],
    queryFn: async () => {
      const res = await api.get('/employees');
      return res.data.data;
    },
  });

  // 2. Fetch Roles
  const { data: roles = [] } = useQuery({
    queryKey: ['roles-list'],
    queryFn: async () => {
      const res = await api.get('/employees/roles');
      return res.data.data;
    },
  });

  // 3. Fetch Branches
  const { data: branches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await api.get('/branches');
      return res.data.data;
    },
  });

  // 4. Create or Update Mutation
  const saveMutation = useMutation({
    mutationFn: async (payload: typeof formData) => {
      if (editingEmployee) {
        const res = await api.put(`/employees/${editingEmployee.id}`, payload);
        return res.data;
      } else {
        const res = await api.post('/employees', payload);
        return res.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees-list'] });
      toast.success(editingEmployee ? 'Xodim ma’lumotlari yangilandi' : 'Yangi xodim qo‘shildi');
      closeModal();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Xatolik yuz berdi');
    },
  });

  // 5. Deactivate Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/employees/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees-list'] });
      toast.success('Xodim faoliyati to‘xtatildi');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'O‘chirishda xatolik');
    },
  });

  const openCreateModal = () => {
    setEditingEmployee(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      roleId: roles[0]?.id || '',
      branchId: branches[0]?.id || '',
      password: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (emp: EmployeeItem) => {
    setEditingEmployee(emp);
    setFormData({
      firstName: emp.firstName,
      lastName: emp.lastName || '',
      email: emp.email,
      phone: emp.phone || '',
      roleId: emp.roleId,
      branchId: emp.branchId || '',
      password: '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingEmployee(null);
  };

  const getRoleBadgeVariant = (slug: string) => {
    switch (slug) {
      case 'business_owner':
      case 'administrator':
        return 'danger';
      case 'manager':
        return 'info';
      case 'cashier':
        return 'success';
      case 'accountant':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Xodimlar va rollar</h1>
          <p className="text-sm text-gray-500 mt-1">
            Kassirlar, menejerlar va tizim rollari ruxsatnomalari (RBAC) boshqaruvi
          </p>
        </div>
        {activeTab === 'employees' && (
          <Button onClick={openCreateModal} className="flex items-center gap-2 shadow-sm text-xs">
            <Plus className="w-4 h-4" />
            Yangi xodim qo‘shish
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-1">
        <button
          onClick={() => setActiveTab('employees')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
            activeTab === 'employees'
              ? 'bg-[#1e3a5f] text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Xodimlar ro‘yxati ({employees.length})
        </button>
        <button
          onClick={() => setActiveTab('roles')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
            activeTab === 'roles'
              ? 'bg-[#1e3a5f] text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Rollar va ruxsatnomalar ({roles.length})
        </button>
      </div>

      {/* TAB 1: Employees List */}
      {activeTab === 'employees' && (
        <Card className="overflow-hidden border border-gray-100 shadow-sm">
          {isLoading ? (
            <div className="p-6 space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : employees.length === 0 ? (
            <EmptyState
              title="Xodimlar topilmadi"
              description="Hali hech qanday xodim qo‘shilmagan"
              action={
                <Button onClick={openCreateModal} size="sm">
                  + Yangi qo‘shish
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50/75 text-xs uppercase text-gray-500 border-b border-gray-100 font-semibold tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Xodim</th>
                    <th className="py-3.5 px-4">Rol (Vazifasi)</th>
                    <th className="py-3.5 px-4">Filial</th>
                    <th className="py-3.5 px-4">Telefon</th>
                    <th className="py-3.5 px-4 text-center">Holat</th>
                    <th className="py-3.5 px-4">Qo‘shilgan sana</th>
                    <th className="py-3.5 px-4 text-right">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {employees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-gray-900">
                        {emp.firstName} {emp.lastName || ''}
                        <span className="block text-[11px] text-gray-400 font-normal">{emp.email}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={getRoleBadgeVariant(emp.role?.slug || '')}>
                          {emp.role?.name || 'Xodim'}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-gray-700">
                        {emp.branch?.name || 'Barcha filiallar'}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-gray-600 font-mono">
                        {emp.phone || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge variant={emp.isActive ? 'success' : 'default'}>
                          {emp.isActive ? 'Faol' : 'Nofaol'}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-gray-400 font-mono">
                        {new Date(emp.createdAt).toLocaleDateString('uz-UZ')}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(emp)}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Tahrirlash"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`"${emp.firstName}" xodimini to‘xtatmoqchimisiz?`)) {
                                deleteMutation.mutate(emp.id);
                              }
                            }}
                            className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Faoliyatni to‘xtatish"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* TAB 2: Roles & Permissions Matrix */}
      {activeTab === 'roles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((role: any) => (
            <Card key={role.id} className="p-4 border border-gray-100 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={getRoleBadgeVariant(role.slug)}>{role.name}</Badge>
                  <span className="text-[10px] text-gray-400 uppercase font-mono">{role.slug}</span>
                </div>
                <p className="text-xs text-gray-600 mb-4">{role.description || 'Tizim roli'}</p>

                <div className="space-y-1.5 border-t pt-3">
                  <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
                    Biriktirilgan ruxsatnomalar ({role.permissions?.length || 0}):
                  </span>
                  <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                    {role.permissions?.map((perm: any) => (
                      <div key={perm.id} className="flex items-center gap-1.5 text-[11px] text-gray-600">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>{perm.name || perm.slug}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal: Create / Edit Employee */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingEmployee ? 'Xodim ma’lumotlarini tahrirlash' : 'Yangi xodim qo‘shish'}
        size="lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!formData.firstName || !formData.email || !formData.roleId) {
              toast.error('Ism, email va rol tanlanishi shart');
              return;
            }
            saveMutation.mutate(formData);
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Ismi *</label>
              <Input
                placeholder="Masalan: Sardor"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Familiyasi</label>
              <Input
                placeholder="Masalan: Razzoqov"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Email (Login) *</label>
              <Input
                type="email"
                placeholder="xodim@smartpos.uz"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={!!editingEmployee}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Telefon raqam</label>
              <Input
                placeholder="+998 90 123 45 67"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Rol (Lavozimi) *</label>
              <select
                value={formData.roleId}
                onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                className="w-full text-xs rounded-lg border border-gray-300 p-2.5 bg-white outline-none focus:border-blue-500"
                required
              >
                <option value="">Tanlang...</option>
                {roles.map((r: any) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Biriktirilgan filial</label>
              <select
                value={formData.branchId}
                onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                className="w-full text-xs rounded-lg border border-gray-300 p-2.5 bg-white outline-none focus:border-blue-500"
              >
                <option value="">Barcha filiallar</option>
                {branches.map((b: any) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-semibold text-gray-700">
                {editingEmployee ? 'Yangi parol (ixtiyoriy)' : 'Boshlang‘ich parol *'}
              </label>
              <Input
                type="password"
                placeholder={editingEmployee ? 'O‘zgartirish uchun kiriting...' : 'Kamida 8 belgi'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={!editingEmployee}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={closeModal}>
              Bekor qilish
            </Button>
            <Button type="submit" isLoading={saveMutation.isPending}>
              Saqlash
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
