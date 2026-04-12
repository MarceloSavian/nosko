import { zodResolver } from '@hookform/resolvers/zod';
import { Trans, useLingui } from '@lingui/react/macro';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import type {
  CreateInstitutionInput,
  InstitutionSchema,
  UpdateInstitutionInput,
} from '@/domain/models/institution/Institution';
import {
  createInstitutionInputSchema,
  updateInstitutionInputSchema,
} from '@/domain/models/institution/Institution';
import type { ICreateInstitution } from '@/domain/usecases/institution/ICreateInstitution';
import type { IDeleteInstitution } from '@/domain/usecases/institution/IDeleteInstitution';
import type { IListInstitutions } from '@/domain/usecases/institution/IListInstitutions';
import type { IUpdateInstitution } from '@/domain/usecases/institution/IUpdateInstitution';
import { Button } from '@/presentation/components/Button';
import { Icon } from '@/presentation/components/Icon';
import { TextInput } from '@/presentation/components/TextInput';

type Props = {
  listInstitutions: IListInstitutions;
  createInstitution: ICreateInstitution;
  updateInstitution: IUpdateInstitution;
  deleteInstitution: IDeleteInstitution;
};

export function InstitutionsPage({
  listInstitutions,
  createInstitution,
  updateInstitution,
  deleteInstitution,
}: Props) {
  const [institutions, setInstitutions] = useState<InstitutionSchema[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { t } = useLingui();

  const createForm = useForm<CreateInstitutionInput>({
    resolver: zodResolver(createInstitutionInputSchema),
  });

  const editForm = useForm<UpdateInstitutionInput>({
    resolver: zodResolver(updateInstitutionInputSchema),
  });

  const fetch = useCallback(async () => {
    setLoading(true);
    const result = await listInstitutions.execute();
    setInstitutions(result);
    setLoading(false);
  }, [listInstitutions]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const handleCreate = async (data: CreateInstitutionInput) => {
    const created = await createInstitution.execute(data);
    setInstitutions((prev) => [...prev, created]);
    setShowCreate(false);
    createForm.reset();
  };

  const handleEdit = async (data: UpdateInstitutionInput) => {
    if (!editingId) return;
    const updated = await updateInstitution.execute(editingId, data);
    setInstitutions((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    setEditingId(null);
    editForm.reset();
  };

  const handleDelete = async (id: string) => {
    await deleteInstitution.execute(id);
    setInstitutions((prev) => prev.filter((i) => i.id !== id));
    setDeletingId(null);
  };

  const startEdit = (inst: InstitutionSchema) => {
    setEditingId(inst.id);
    editForm.reset({ name: inst.name, countryCode: inst.countryCode, logoUrl: inst.logoUrl });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-headline text-2xl font-bold text-primary">
          <Trans>Institutions</Trans>
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
            label={t`Name`}
            error={createForm.formState.errors.name?.message}
            {...createForm.register('name')}
          />
          <TextInput
            label={t`Country code`}
            maxLength={2}
            error={createForm.formState.errors.countryCode?.message}
            {...createForm.register('countryCode')}
          />
          <TextInput label={t`Logo URL`} {...createForm.register('logoUrl')} />
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
                <th className="px-6 py-4 font-semibold text-on-surface-variant">{t`Name`}</th>
                <th className="px-6 py-4 font-semibold text-on-surface-variant">{t`Country`}</th>
                <th className="px-6 py-4 font-semibold text-on-surface-variant">{t`Logo URL`}</th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody>
              {institutions.map((inst) =>
                editingId === inst.id ? (
                  <tr key={inst.id} className="border-b border-outline-variant/10">
                    <td className="px-6 py-2">
                      <input
                        className="w-full bg-surface-container-highest rounded-lg px-3 py-2 text-sm outline-none"
                        {...editForm.register('name')}
                      />
                    </td>
                    <td className="px-6 py-2">
                      <input
                        className="w-full bg-surface-container-highest rounded-lg px-3 py-2 text-sm outline-none"
                        maxLength={2}
                        {...editForm.register('countryCode')}
                      />
                    </td>
                    <td className="px-6 py-2">
                      <input
                        className="w-full bg-surface-container-highest rounded-lg px-3 py-2 text-sm outline-none"
                        {...editForm.register('logoUrl')}
                      />
                    </td>
                    <td className="px-6 py-2 flex gap-2">
                      <Button size="sm" onClick={editForm.handleSubmit(handleEdit)}>
                        <Trans>Save</Trans>
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                        <Trans>Cancel</Trans>
                      </Button>
                    </td>
                  </tr>
                ) : (
                  <tr
                    key={inst.id}
                    className="border-b border-outline-variant/10 hover:bg-surface-container-high/50"
                  >
                    <td className="px-6 py-4 text-on-surface">{inst.name}</td>
                    <td className="px-6 py-4 text-on-surface">{inst.countryCode}</td>
                    <td className="px-6 py-4 text-on-surface-variant text-xs truncate max-w-[200px]">
                      {inst.logoUrl ?? '-'}
                    </td>
                    <td className="px-6 py-4 flex gap-3">
                      <button
                        type="button"
                        onClick={() => startEdit(inst)}
                        className="text-tertiary hover:text-tertiary/70 cursor-pointer"
                      >
                        <Icon name="edit" />
                      </button>
                      {deletingId === inst.id ? (
                        <div className="flex gap-2">
                          <Button size="sm" variant="danger" onClick={() => handleDelete(inst.id)}>
                            <Trans>Confirm</Trans>
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setDeletingId(null)}>
                            <Trans>Cancel</Trans>
                          </Button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeletingId(inst.id)}
                          className="text-error hover:text-error/70 cursor-pointer"
                        >
                          <Icon name="delete" />
                        </button>
                      )}
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
