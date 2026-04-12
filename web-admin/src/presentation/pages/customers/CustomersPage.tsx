import { Trans, useLingui } from '@lingui/react/macro';
import { useCallback, useEffect, useState } from 'react';
import type { CustomerSchema } from '@/domain/models/customer/Customer';
import type { IDeleteCustomer } from '@/domain/usecases/customer/IDeleteCustomer';
import type { IListCustomers } from '@/domain/usecases/customer/IListCustomers';
import { Button } from '@/presentation/components/Button';
import { Icon } from '@/presentation/components/Icon';

type Props = {
  listCustomers: IListCustomers;
  deleteCustomer: IDeleteCustomer;
};

const PAGE_SIZE = 20;

export function CustomersPage({ listCustomers, deleteCustomer }: Props) {
  const [customers, setCustomers] = useState<CustomerSchema[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { t } = useLingui();

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    const result = await listCustomers.execute(PAGE_SIZE, offset);
    setCustomers(result.customers);
    setTotal(result.total);
    setLoading(false);
  }, [listCustomers, offset]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleDelete = async (id: string) => {
    await deleteCustomer.execute(id);
    setDeletingId(null);
    fetchCustomers();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-headline text-2xl font-bold text-primary">
          <Trans>Customers</Trans>
        </h1>
        <span className="text-on-surface-variant text-sm">
          {total} <Trans>total</Trans>
        </span>
      </div>

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
                <th className="px-6 py-4 font-semibold text-on-surface-variant">{t`Language`}</th>
                <th className="px-6 py-4 font-semibold text-on-surface-variant">{t`Verified`}</th>
                <th className="px-6 py-4 font-semibold text-on-surface-variant">{t`Created`}</th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-outline-variant/10 hover:bg-surface-container-high/50"
                >
                  <td className="px-6 py-4 text-on-surface">{c.email}</td>
                  <td className="px-6 py-4 text-on-surface">{c.name ?? '-'}</td>
                  <td className="px-6 py-4 text-on-surface">{c.language}</td>
                  <td className="px-6 py-4">
                    {c.verifiedAt ? (
                      <Icon name="check_circle" className="text-tertiary text-lg" filled />
                    ) : (
                      <Icon name="cancel" className="text-error text-lg" />
                    )}
                  </td>
                  <td className="px-6 py-4 text-on-surface-variant">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    {deletingId === c.id ? (
                      <div className="flex gap-2">
                        <Button size="sm" variant="danger" onClick={() => handleDelete(c.id)}>
                          <Trans>Confirm</Trans>
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setDeletingId(null)}>
                          <Trans>Cancel</Trans>
                        </Button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeletingId(c.id)}
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

      <div className="flex justify-between items-center">
        <Button
          size="sm"
          variant="ghost"
          disabled={offset === 0}
          onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
        >
          <Trans>Previous</Trans>
        </Button>
        <span className="text-on-surface-variant text-sm">
          {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} / {total}
        </span>
        <Button
          size="sm"
          variant="ghost"
          disabled={offset + PAGE_SIZE >= total}
          onClick={() => setOffset(offset + PAGE_SIZE)}
        >
          <Trans>Next</Trans>
        </Button>
      </div>
    </div>
  );
}
