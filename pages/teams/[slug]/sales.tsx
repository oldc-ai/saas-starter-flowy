import { GetServerSidePropsContext } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { format } from 'date-fns';
import { Button } from 'react-daisyui';

import { Error, Loading } from '@/components/shared';
import { Team } from '@prisma/client';
import useTeam from 'hooks/useTeam';
import Modal from '@/components/shared/Modal';

interface Props {
  team: Team;
}

interface DailySale {
  date: string;
  totalSales: number;
  transactionCount: number;
}

interface SaleItem {
  name: string;
  quantity: number;
  unitPrice: number;
}

interface SaleDetail {
  id: string;
  time: string;
  items: SaleItem[];
  total: number;
  paymentType: string;
}

const SalesPage = () => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { isLoading: isLoadingTeam, isError, team } = useTeam();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [dailySales, setDailySales] = useState<DailySale[]>([]);
  const [saleDetails, setSaleDetails] = useState<SaleDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  useEffect(() => {
    if (!team) return;

    const fetchDailySales = async () => {
      try {
        const response = await fetch(`/api/teams/${team?.slug}/sales`);
        if (response.ok) {
          const data = await response.json();
          setDailySales(data);
        }
      } catch (error) {
        console.error('Error fetching sales:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDailySales();
  }, [team?.slug]);

  const handleRowClick = async (date: string) => {
    if (!team) return;
    
    setSelectedDate(date);
    setShowDetailsModal(true);
    setIsLoadingDetails(true);

    try {
      const response = await fetch(
        `/api/teams/${team?.slug}/sales/details?date=${date}`
      );
      if (response.ok) {
        const data = await response.json();
        setSaleDetails(data);
      }
    } catch (error) {
      console.error('Error fetching sale details:', error);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  if (isLoadingTeam) {
    return <Loading />;
  }

  if (isError) {
    return <Error message={isError.message} />;
  }

  if (!team) {
    return <Error message={t('team-not-found')} />;
  }

  return (
    <>
      <div className="py-6">
        <div className="mx-auto px-4 sm:px-6 md:px-8">
          <div className="py-4">
            {isLoading ? (
              <div className="text-center py-10">
                <p className="text-gray-500 dark:text-gray-400">Loading...</p>
              </div>
            ) : dailySales.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-500 dark:text-gray-400">
                  {t('sales-empty')}
                </p>
              </div>
            ) : (
              <div className="mt-8 flex flex-col">
                <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
                  <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                      <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-600">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                          <tr>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                              Date
                            </th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                              Total Sales
                            </th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                              Transactions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-600 bg-white dark:bg-gray-800">
                          {dailySales.map((sale) => (
                            <tr
                              key={sale.date}
                              onClick={() => handleRowClick(sale.date)}
                              className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-white">
                                {format(new Date(sale.date), 'MMM dd, yyyy')}
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-white">
                                ${sale.totalSales.toFixed(2)}
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-white">
                                {sale.transactionCount}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sales Details Modal */}
      <Modal
        open={showDetailsModal}
        close={() => setShowDetailsModal(false)}
      >
        <Modal.Header>{t('sales-details')}</Modal.Header>
        <Modal.Body>
          <div className="space-y-4">
            <h3 className="text-lg font-medium">
              {selectedDate && format(new Date(selectedDate), 'MMMM dd, yyyy')}
            </h3>
            <div className="mt-4">
              {isLoadingDetails ? (
                <div className="text-center py-4">
                  <p className="text-gray-500 dark:text-gray-400">Loading...</p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                  <thead>
                    <tr>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold">Time</th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold">Items</th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold">Total</th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold">Payment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                    {saleDetails.map((sale) => (
                      <tr key={sale.id}>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">{sale.time}</td>
                        <td className="px-3 py-4 text-sm">
                          {sale.items.map((item, index) => (
                            <div key={index}>
                              {item.name} x{item.quantity}
                            </div>
                          ))}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          ${sale.total.toFixed(2)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          {sale.paymentType}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <Modal.Footer>
              <Button onClick={() => setShowDetailsModal(false)}>
                {t('close')}
              </Button>
            </Modal.Footer>
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
};

export const getServerSideProps = async (context: GetServerSidePropsContext) => {
  return {
    props: {
      ...(await serverSideTranslations(context.locale!, ['common'])),
    },
  };
};

export default SalesPage; 