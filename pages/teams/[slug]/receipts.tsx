import { GetServerSidePropsContext } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useRouter } from 'next/router';
import { getServerSession } from 'next-auth';
import toast from 'react-hot-toast';
import Image from 'next/image';

import { getAuthOptions } from '@/lib/nextAuth';
import { Error, Loading } from '@/components/shared';
import useTeam from 'hooks/useTeam';

interface Receipt {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  status: string;
  createdAt: string;
}

const ReceiptUploads = () => {
  const { t } = useTranslation('common');
  const { isLoading, isError, team } = useTeam();
  const [isUploading, setIsUploading] = useState(false);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchReceipts = async () => {
      try {
        const response = await fetch(`/api/teams/${team?.slug}/receipts`);
        const data = await response.json();
        if (response.ok) {
          setReceipts(data);
        } else {
          toast.error('Failed to fetch receipts');
        }
      } catch (error) {
        console.error('Error fetching receipts:', error);
        toast.error('Failed to fetch receipts');
      }
    };

    if (team?.slug) {
      fetchReceipts();
    }
  }, [team?.slug]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsUploading(true);
    const formData = new FormData();
    
    acceptedFiles.forEach((file) => {
      formData.append('files', file);
    });

    try {
      const response = await fetch(`/api/teams/${team?.slug}/receipts/upload`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        throw result.message || 'Upload failed';
      }

      if (result.results && result.results.length > 0) {
        toast.success('Files uploaded successfully');
        router.reload();
      } else {
        toast.error('No files were uploaded');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(typeof error === 'string' ? error : 'Failed to upload files');
    } finally {
      setIsUploading(false);
    }
  }, [team?.slug, router]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/pdf': ['.pdf'],
    },
  });

  if (isLoading) {
    return <Loading />;
  }

  if (isError) {
    return <Error message={isError.message} />;
  }

  if (!team) {
    return <Error message={t('team-not-found')} />;
  }

  return (
    <div className="py-6">
      <div className="mx-auto px-4 sm:px-6 md:px-8">
        <div className="py-4">
          {/* Upload Section */}
          <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium mb-4">Upload Receipts</h2>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
              }`}
            >
              <input {...getInputProps()} />
              <div className="space-y-2">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 14v20c0 4.418 3.582 8 8 8h16c4.418 0 8-3.582 8-8V14m-8-4l-8-8-8 8m8-8v28"
                  />
                </svg>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {isDragActive ? (
                    <p>Drop the files here ...</p>
                  ) : (
                    <p>
                      Drag and drop files here, or click to select files
                      <br />
                      <span className="text-xs">
                        (Supported formats: JPG, PNG, PDF)
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {isUploading && (
              <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
                Uploading files...
              </div>
            )}
          </div>

          {/* Receipts List */}
          <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">Receipt History</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      File Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Upload Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200">
                  {receipts.map((receipt) => (
                    <tr
                      key={receipt.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                      onClick={() => setSelectedReceipt(receipt)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {receipt.fileName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {receipt.fileType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${receipt.status.toLowerCase() === 'accepted' && 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'}
                          ${receipt.status.toLowerCase() === 'pending' && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'}
                          ${receipt.status.toLowerCase() === 'invalid' && 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'}
                        `}>
                          {receipt.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(receipt.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Image Viewing Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">{selectedReceipt.fileName}</h3>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="relative w-full h-[60vh]">
              {selectedReceipt.fileType === 'PDF' ? (
                <iframe
                  src={selectedReceipt.fileUrl}
                  className="w-full h-full"
                  title={selectedReceipt.fileName}
                />
              ) : (
                <div className="relative w-full h-full">
                  <Image
                    src={selectedReceipt.fileUrl}
                    alt={selectedReceipt.fileName}
                    fill
                    className="object-contain"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const getServerSideProps = async (context: GetServerSidePropsContext) => {
  const authOptions = getAuthOptions(context.req, context.res);
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session) {
    return {
      redirect: {
        destination: '/auth/login',
        permanent: false,
      },
    };
  }

  return {
    props: {
      ...(await serverSideTranslations(context.locale!, ['common'])),
    },
  };
};

export default ReceiptUploads; 