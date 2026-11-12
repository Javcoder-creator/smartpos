import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Store, Plus, MapPin, Phone, Warehouse, Users, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Skeleton, EmptyState } from '@/components/ui/Feedback';
import api from '@/lib/axios';

export const BranchesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<any>(null);

  const initialForm = {
    name: '',
    address: '',
    city: 'Toshkent',
    phone: '',
    email: '',
    isMain: false,
  };
  const [formData, setFormData] = useState(initialForm);

  // 1. Fetch branches
  const { data: branches = [], isLoading } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await api.get('/branches');
      return res.data.data;
    },
  });

  // 2. Create mutation
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/branches', payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Yangi filial yaratildi va unga avtomatik ombor biriktirildi');
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      setIsCreateOpen(false);
      setFormData(initialForm);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Filial yaratishda xatolik');
    },
  });

  // 3. Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      const res = await api.put(`/branches/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Filial yangilandi');
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      setEditingBranch(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Yangilashda xatolik');
    },
  });

  // 4. Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/branches/${id}`);
    },
    onSuccess: () => {
      toast.success('Filial o‘chirildi');
      queryClient.invalidateQueries({ queryKey: ['branches'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Filialni o‘chirib bo‘lmadi');
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      id: editingBranch.id,
      payload: {
        name: editingBranch.name,
        address: editingBranch.address,
        city: editingBranch.city,
        phone: editingBranch.phone,
        email: editingBranch.email,
        isMain: editingBranch.isMain,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Filiallar boshqaruvi</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Do‘kon filiallari, ularning manzillari, omborlari va xodimlari
          </p>
        </div>

        <Button
          variant="accent"
          size="sm"
          onClick={() => setIsCreateOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Yangi filial
        </Button>
      </div>

      {/* Grid of Branches */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-44 w-full" />
          <Skeleton className="h-44 w-full" />
          <Skeleton className="h-44 w-full" />
        </div>
      ) : branches.length === 0 ? (
        <EmptyState
          icon={<Store className="w-10 h-10" />}
          title="Filiallar topilmadi"
          action={
            <Button variant="accent" size="sm" onClick={() => setIsCreateOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
              Filial qo‘shish
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {branches.map((b: any) => (
            <Card key={b.id} className="relative overflow-hidden">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1e3a5f] flex items-center justify-center font-bold">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-gray-900">{b.name}</h4>
                    <p className="text-xs text-gray-400">{b.city || 'Toshkent'}</p>
                  </div>
                </div>

                {b.isMain ? (
                  <Badge variant="success" size="sm">
                    Asosiy filial
                  </Badge>
                ) : (
                  <Badge variant="default" size="sm">
                    Filial
                  </Badge>
                )}
              </div>

              <div className="mt-4 space-y-2 text-xs text-gray-600 border-t border-gray-100 pt-3">
                {b.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="truncate">{b.address}</span>
                  </div>
                )}
                {b.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span>{b.phone}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-1 text-[11px] text-gray-500">
                  <span className="flex items-center gap-1">
                    <Warehouse className="w-3.5 h-3.5 text-emerald-600" />
                    <strong>{b.warehouses?.length || 0}</strong> ta ombor
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                    <strong>{b.users?.length || 0}</strong> nafar xodim
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingBranch(b)}
                  leftIcon={<Edit className="w-3.5 h-3.5 text-blue-600" />}
                >
                  Tahrirlash
                </Button>
                {!b.isMain && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (window.confirm('Haqiqatan ham ushbu filialni o‘chirmoqchimisiz?')) {
                        deleteMutation.mutate(b.id);
                      }
                    }}
                    leftIcon={<Trash2 className="w-3.5 h-3.5 text-red-600" />}
                  >
                    O‘chirish
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* CREATE MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Yangi filial ochish"
        subtitle="Filial ma’lumotlarini kiriting"
        size="md"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-3.5">
          <Input
            label="Filial nomi *"
            required
            placeholder="Masalan: Yunusobod filiali"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <Input
            label="Manzil"
            placeholder="Amir Temur ko‘chasi, 45-uy"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Shahar"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
            <Input
              label="Telefon"
              placeholder="+998 71 200 11 22"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isMainCheckbox"
              checked={formData.isMain}
              onChange={(e) => setFormData({ ...formData, isMain: e.target.checked })}
              className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="isMainCheckbox" className="text-xs font-semibold text-gray-700 cursor-pointer">
              Asosiy filial sifatida belgilash
            </label>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100">
            <Button variant="secondary" size="md" type="button" onClick={() => setIsCreateOpen(false)}>
              Bekor qilish
            </Button>
            <Button variant="accent" size="md" type="submit" isLoading={createMutation.isPending}>
              Yaratish
            </Button>
          </div>
        </form>
      </Modal>

      {/* EDIT MODAL */}
      {editingBranch && (
        <Modal
          isOpen={!!editingBranch}
          onClose={() => setEditingBranch(null)}
          title="Filialni tahrirlash"
          subtitle={editingBranch.name}
          size="md"
        >
          <form onSubmit={handleEditSubmit} className="space-y-3.5">
            <Input
              label="Filial nomi *"
              required
              value={editingBranch.name}
              onChange={(e) => setEditingBranch({ ...editingBranch, name: e.target.value })}
            />
            <Input
              label="Manzil"
              value={editingBranch.address || ''}
              onChange={(e) => setEditingBranch({ ...editingBranch, address: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Shahar"
                value={editingBranch.city || ''}
                onChange={(e) => setEditingBranch({ ...editingBranch, city: e.target.value })}
              />
              <Input
                label="Telefon"
                value={editingBranch.phone || ''}
                onChange={(e) => setEditingBranch({ ...editingBranch, phone: e.target.value })}
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="editMainCheckbox"
                checked={editingBranch.isMain}
                onChange={(e) => setEditingBranch({ ...editingBranch, isMain: e.target.checked })}
                className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
              />
              <label htmlFor="editMainCheckbox" className="text-xs font-semibold text-gray-700 cursor-pointer">
                Asosiy filial sifatida belgilash
              </label>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100">
              <Button variant="secondary" size="md" type="button" onClick={() => setEditingBranch(null)}>
                Bekor qilish
              </Button>
              <Button variant="accent" size="md" type="submit" isLoading={updateMutation.isPending}>
                Saqlash
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
