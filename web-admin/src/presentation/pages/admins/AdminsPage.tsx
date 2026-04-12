import { zodResolver } from '@hookform/resolvers/zod';
import { Trans, useLingui } from '@lingui/react/macro';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import type { AdminSchema, CreateAdminInput } from '@/domain/models/admin/Admin';
import { createAdminInputSchema } from '@/domain/models/admin/Admin';
import type { ICreateAdmin } from '@/domain/usecases/admin/ICreateAdmin';
import type { IDeleteAdmin } from '@/domain/usecases/admin/IDeleteAdmin';
import type { IListAdmins } from '@/domain/usecases/admin/IListAdmins';
import { Button } from '@/presentation/components/Button';
import { Icon } from '@/presentation/components/Icon';
import { TextInput } from '@/presentation/components/TextInput';

type Props = {
  listAdmins: IListAdmins;
  createAdmin: ICreateAdmin;
  deleteAdmin: IDeleteAdmin;
};

export function AdminsPage({ listAdmins, createAdmin, deleteAdmin }: Props) {
  const [admins, setAdmins] = useState<AdminSchema[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { t } = useLingui();

  const createForm = useForm<CreateAdminInput>({ resolver: zodResolver(createAdminInputSchema) });

  const fetch = useCallback(async () => {
    setLoading(true);
    setAdmins(await listAdmins.execute());
    setLoading(false);
  }, [listAdmins]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const handleCreate = async (data: CreateAdminInput) => {
    const created = await createAdmin.execute(data);
    setAdmins((prev) => [...prev, created]);
    setShowCreate(false);
    createForm.reset();
  };

  const handleDelete = async (id: string) => {
    await deleteAdmin.execute(id);
    setAdmins((prev) => prev.filter((a) => a.id !== id));
    setDeletingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-headline text-2xl font-bold text-primary">
          <Trans>Admins</Trans>
        </h1>
        <Button size="sm" onClick={() => setShowCreate(!showCreate)}>
          <Icon name="add" className="mr-1" /> <Trans>Add</Trans>
        </Button>
      </div>

      {showCreate && (
        <form
          onSubmit={createForm.handleSubmit(handleCreate)}
          className="bg-surface-container rounded-2xl p-6 space-y-4 shadow-sm"
        >
          <TextInput
            label={t`Email`}
            type="email"
            error={createForm.formState.errors.email?.message}
            {...createForm.register('email')}
          />
          <TextInput
            label={t`Password`}
            type="password"
            error={createForm.formState.errors.password?.message}
            {...createForm.register('password')}
          />
          <TextInput
            label={t`Name`}
            error={createForm.formState.errors.name?.message}
            {...createForm.register('name')}
          />
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={createForm.formState.isSubmitting}>
              <Trans>Create</Trans>
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowCreate(false);
                createForm.reset();
              }}
            >
              <Trans>Cancel</Trans>
            </Button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-on-surface-variant">
          <Trans>Loading...</Trans>
        </p>
      ) : (
        <div className="bg-surface-container rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-outline-variant/30">
                <th className="px-6 py-4 font-semibold text-on-surface-variant">{t`Email`}</th>
                <th className="px-6 py-4 font-semibold text-on-surface-variant">{t`Name`}</th>
                <th className="px-6 py-4 font-semibold text-on-surface-variant">{t`Created`}</th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <tr
                  key={admin.id}
                  className="border-b border-outline-variant/10 hover:bg-surface-container-high/50"
                >
                  <td className="px-6 py-4 text-on-surface">{admin.email}</td>
                  <td className="px-6 py-4 text-on-surface">{admin.name}</td>
                  <td className="px-6 py-4 text-on-surface-variant">
                    {new Date(admin.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    {deletingId === admin.id ? (
                      <div className="flex gap-2">
                        <Button size="sm" variant="danger" onClick={() => handleDelete(admin.id)}>
                          <Trans>Confirm</Trans>
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setDeletingId(null)}>
                          <Trans>Cancel</Trans>
                        </Button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeletingId(admin.id)}
                        className="text-error hover:text-error/70 cursor-pointer"
                      >
                        <Icon name="delete" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
