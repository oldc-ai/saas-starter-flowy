import { useTranslation } from 'next-i18next';
import { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useState, memo, useRef, useEffect } from 'react';
import { Button } from 'react-daisyui';
import toast from 'react-hot-toast';
import useSWR from 'swr';
import { Table } from '@/components/shared/table/Table';
import { WithLoadingAndError } from '@/components/shared';
import { defaultHeaders } from '@/lib/common';
import ConfirmationDialog from '@/components/shared/ConfirmationDialog';
import Modal from '@/components/shared/Modal';
import { useRouter } from 'next/router';

interface InventoryItem {
  id: string;
  name: string;
  value: number;
  unitType: string;
  createdAt: string;
  updatedAt: string;
}

interface InventoryFormData {
  name: string;
  value: number;
  unitType: string;
}

interface InventoryFormProps {
  formData: InventoryFormData;
  onSubmit: (e: React.FormEvent) => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isEdit: boolean;
}

const InventoryForm = memo(({ formData, onSubmit, onChange, isEdit }: InventoryFormProps) => {
  const { t } = useTranslation('common');
  
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="label">{t('inventory-name')}</label>
        <input
          type="text"
          name="name"
          className="input input-bordered w-full"
          value={formData.name}
          onChange={onChange}
          required
        />
      </div>
      <div>
        <label className="label">{t('inventory-value')}</label>
        <input
          type="number"
          name="value"
          step="0.1"
          className="input input-bordered w-full"
          value={formData.value}
          onChange={onChange}
          required
        />
      </div>
      <div>
        <label className="label">{t('inventory-unit')}</label>
        <input
          type="text"
          name="unitType"
          className="input input-bordered w-full"
          value={formData.unitType}
          onChange={onChange}
          required
        />
      </div>
      <Button type="submit" color="primary" fullWidth>
        {isEdit ? t('edit-inventory') : t('add-inventory')}
      </Button>
    </form>
  );
});

InventoryForm.displayName = 'InventoryForm';

const Inventory = () => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { slug, onboarding } = router.query;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState<InventoryFormData>({
    name: '',
    value: 0,
    unitType: '',
  });
  const [isUploading, setIsUploading] = useState(false);
  const uploadButtonRef = useRef<HTMLButtonElement>(null);
  const [showUploadHint, setShowUploadHint] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipPosition, setTooltipPosition] = useState<'top' | 'bottom'>('bottom');

  const { data: inventory, error, isLoading, mutate: refreshInventory } = useSWR<InventoryItem[]>(
    slug ? `/api/teams/${slug}/inventory` : null,
    async (url) => {
      console.log('Fetching inventory from:', url);
      const response = await fetch(url);
      const data = await response.json();
      console.log('Received inventory data:', data);
      return data;
    }
  );

  const checkTooltipPosition = () => {
    if (tooltipRef.current && uploadButtonRef.current) {
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const buttonRect = uploadButtonRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Only move to top if there's definitely enough space
      const spaceAbove = buttonRect.top;
      const spaceBelow = windowHeight - buttonRect.bottom;
      
      if (spaceAbove > tooltipRect.height + 40) { // Extra buffer
        setTooltipPosition('top');
      } else {
        setTooltipPosition('bottom');
      }
    }
  };

  useEffect(() => {
    if (onboarding === 'true') {
      setShowUploadHint(true);
    }
  }, [onboarding]);

  useEffect(() => {
    if (showUploadHint) {
      // Initial check after DOM update
      const timer = setTimeout(checkTooltipPosition, 100);
      
      // Recheck on resize
      window.addEventListener('resize', checkTooltipPosition);
      
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', checkTooltipPosition);
      };
    }
  }, [showUploadHint]);

  console.log('Current inventory state:', inventory); // Debug log
  console.log('Loading state:', isLoading); // Debug log
  console.log('Error state:', error); // Debug log

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('Submitting form data:', formData); // Debug log
      const response = await fetch(`/api/teams/${slug}/inventory`, {
        method: showEditModal ? 'PUT' : 'POST',
        headers: defaultHeaders,
        body: JSON.stringify(showEditModal ? { ...formData, id: selectedItem?.id } : formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save inventory item');
      }

      const savedItem = await response.json();
      console.log('Saved item:', savedItem); // Debug log

      await refreshInventory();
      toast.success(t(showEditModal ? 'inventory-updated' : 'inventory-created'));
      handleCloseModal();
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(error instanceof Error ? error.message : 'An error occurred');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'value' ? Number(value) : value,
    }));
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/teams/${slug}/inventory/${selectedItem?.id}`, {
        method: 'DELETE',
        headers: defaultHeaders,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete inventory item');
      }

      await refreshInventory();
      toast.success(t('inventory-deleted'));
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error instanceof Error ? error.message : 'An error occurred');
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setSelectedItem(null);
    setFormData({ name: '', value: 0, unitType: '' });
  };

  const handleEdit = (item: InventoryItem) => {
    setSelectedItem(item);
    setFormData({
      name: item.name,
      value: item.value,
      unitType: item.unitType,
    });
    setShowEditModal(true);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('inventoryFile', file);

      const response = await fetch(`/api/teams/${slug}/inventory/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to upload inventory');
      }

      const result = await response.json();
      toast.success(t('inventory-uploaded', { count: result.data.count }));
      await refreshInventory();

      // If in onboarding flow, redirect to square integration
      if (onboarding === 'true') {
        router.push(`/teams/${slug}/square?onboarding=true`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'An error occurred during upload');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <WithLoadingAndError isLoading={isLoading} error={error}>
      <div className="space-y-3 relative">
        {showUploadHint && (
          <>
            <div className="fixed inset-0 bg-gray-500/20 z-40" onClick={() => setShowUploadHint(false)} />
          </>
        )}
        
        <div className="flex justify-between items-center relative">
          <h2 className="text-xl font-medium leading-none tracking-tight">
            {t('all-products')}
          </h2>
          <div className="flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".csv"
              className="hidden"
            />
            <div className="relative z-50">
              <Button 
                ref={uploadButtonRef}
                color="primary"
                className={showUploadHint ? 'relative z-50 bg-blue-600 hover:bg-blue-700' : ''}
                onClick={() => fileInputRef.current?.click()}
                loading={isUploading}
              >
                {t('upload-inventory')}
              </Button>
              {showUploadHint && (
                <div 
                  ref={tooltipRef}
                  className={`absolute z-50 ${
                    tooltipPosition === 'top' 
                      ? 'bottom-full mb-2' 
                      : 'top-full mt-2'
                  } transition-all duration-200`}
                  style={{ left: '50%', transform: 'translateX(-50%)' }}
                >
                  <div className="bg-white text-gray-700 p-4 rounded-lg shadow-lg relative w-[280px]">
                    <p className="text-sm">
                      Upload your inventory CSV file to get started. The file should include columns for name, current level, unit, and count date.
                    </p>
                    <div 
                      className={`absolute w-4 h-4 bg-white transform rotate-45 ${
                        tooltipPosition === 'top' ? '-bottom-2' : '-top-2'
                      }`}
                      style={{ left: '50%', marginLeft: '-0.5rem' }}
                    />
                  </div>
                </div>
              )}
            </div>
            <Button 
              color="primary"
              onClick={() => setShowAddModal(true)}
              className={showUploadHint ? 'opacity-50' : ''}
            >
              {t('add-inventory')}
            </Button>
          </div>
        </div>

        <div className={showUploadHint ? 'opacity-50 pointer-events-none' : ''}>
          {inventory && inventory.length > 0 ? (
            <Table
              cols={[
                t('inventory-name'),
                t('inventory-value'),
                t('inventory-unit'),
                t('actions'),
              ]}
              body={
                inventory.map((item) => ({
                  id: item.id,
                  cells: [
                    { text: item.name },
                    { text: item.value.toString() },
                    { text: item.unitType },
                    {
                      buttons: [
                        {
                          text: t('edit'),
                          onClick: () => handleEdit(item),
                        },
                        {
                          color: 'error',
                          text: t('delete'),
                          onClick: () => {
                            setSelectedItem(item);
                            setShowDeleteModal(true);
                          },
                        },
                      ],
                    },
                  ],
                }))
              }
            />
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500">{t('inventory-empty')}</p>
            </div>
          )}
        </div>

        <Modal
          open={showAddModal || showEditModal}
          close={handleCloseModal}
        >
          <Modal.Header>
            {t(showEditModal ? 'edit-inventory' : 'add-inventory')}
          </Modal.Header>
          <InventoryForm 
            formData={formData}
            onSubmit={handleSubmit}
            onChange={handleInputChange}
            isEdit={showEditModal}
          />
        </Modal>

        <ConfirmationDialog
          visible={showDeleteModal}
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
          title={t('delete-inventory')}
        >
          {t('confirm-delete-inventory')}
        </ConfirmationDialog>
      </div>
    </WithLoadingAndError>
  );
};

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
    },
  };
};

export default Inventory; 