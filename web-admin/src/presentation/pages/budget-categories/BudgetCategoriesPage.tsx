import { zodResolver } from '@hookform/resolvers/zod';
import { Trans, useLingui } from '@lingui/react/macro';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import type {
  BudgetCategorySchema,
  CreateBudgetCategoryInput,
  UpdateBudgetCategoryInput,
} from '@/domain/models/budget/BudgetCategory';
import {
  createBudgetCategoryInputSchema,
  updateBudgetCategoryInputSchema,
} from '@/domain/models/budget/BudgetCategory';
import type { ICreateCategory } from '@/domain/usecases/budget/ICreateCategory';
import type { IDeleteCategory } from '@/domain/usecases/budget/IDeleteCategory';
import type { IListCategories } from '@/domain/usecases/budget/IListCategories';
import type { IUpdateCategory } from '@/domain/usecases/budget/IUpdateCategory';
import { Button } from '@/presentation/components/Button';
import { Icon } from '@/presentation/components/Icon';
import { TextInput } from '@/presentation/components/TextInput';

type Props = {
  listCategories: IListCategories;
  createCategory: ICreateCategory;
  updateCategory: IUpdateCategory;
  deleteCategory: IDeleteCategory;
};

export function BudgetCategoriesPage({
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
}: Props) {
  const [categories, setCategories] = useState<BudgetCategorySchema[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { t } = useLingui();

  const createForm = useForm<CreateBudgetCategoryInput>({
    resolver: zodResolver(createBudgetCategoryInputSchema),
  });
  const editForm = useForm<UpdateBudgetCategoryInput>({
    resolver: zodResolver(updateBudgetCategoryInputSchema),
  });

  const fetch = useCallback(async () => {
    setLoading(true);
    setCategories(await listCategories.execute());
    setLoading(false);
  }, [listCategories]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const handleCreate = async (data: CreateBudgetCategoryInput) => {
    const created = await createCategory.execute(data);
    setCategories((prev) => [...prev, created]);
    setShowCreate(false);
    createForm.reset();
  };

  const handleEdit = async (data: UpdateBudgetCategoryInput) => {
    if (!editingId) return;
    const updated = await updateCategory.execute(editingId, data);
    setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setEditingId(null);
    editForm.reset();
  };

  const handleDelete = async (id: string) => {
    await deleteCategory.execute(id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setDeletingId(null);
  };

  const startEdit = (cat: BudgetCategorySchema) => {
    setEditingId(cat.id);
    editForm.reset({ name: cat.name, icon: cat.icon });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-headline text-2xl font-bold text-primary">
          <Trans>Budget Categories</Trans>
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
          <TextInput label={t`Icon`} {...createForm.register('icon')} />
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
                <th className="px-6 py-4 font-semibold text-on-surface-variant">{t`Icon`}</th>
                <th className="px-6 py-4 font-semibold text-on-surface-variant">{t`Type`}</th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) =>
                editingId === cat.id ? (
                  <tr key={cat.id} className="border-b border-outline-variant/10">
                    <td className="px-6 py-2">
                      <input
                        className="w-full bg-surface-container-highest rounded-lg px-3 py-2 text-sm outline-none"
                        {...editForm.register('name')}
                      />
                    </td>
                    <td className="px-6 py-2">
                      <input
                        className="w-full bg-surface-container-highest rounded-lg px-3 py-2 text-sm outline-none"
                        {...editForm.register('icon')}
                      />
                    </td>
                    <td className="px-6 py-2" />
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
                    key={cat.id}
                    className="border-b border-outline-variant/10 hover:bg-surface-container-high/50"
                  >
                    <td className="px-6 py-4 text-on-surface">{cat.name}</td>
                    <td className="px-6 py-4 text-on-surface">{cat.icon ?? '-'}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${cat.isSystem ? 'bg-tertiary/20 text-tertiary' : 'bg-secondary/20 text-secondary'}`}
                      >
                        {cat.isSystem ? t`System` : t`Custom`}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex gap-3">
                      <button
                        type="button"
                        onClick={() => startEdit(cat)}
                        className="text-tertiary hover:text-tertiary/70 cursor-pointer"
                      >
                        <Icon name="edit" />
                      </button>
                      {deletingId === cat.id ? (
                        <div className="flex gap-2">
                          <Button size="sm" variant="danger" onClick={() => handleDelete(cat.id)}>
                            <Trans>Confirm</Trans>
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setDeletingId(null)}>
                            <Trans>Cancel</Trans>
                          </Button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeletingId(cat.id)}
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
