import { useState, useEffect } from 'react';
import type { Team } from '@prisma/client';
import { Button } from 'react-daisyui';
import { toast } from 'react-hot-toast';
import { BuildingStorefrontIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/router';

interface SquareIntegrationProps {
  team: Team;
}

const SquareIntegration = ({ team }: SquareIntegrationProps) => {
  const router = useRouter();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Check for success/error params in URL
    const { success, error } = router.query;
    
    if (success === 'true') {
      setIsConnected(true);
      toast.success('Successfully connected to Square');
      // Remove the success parameter from URL
      router.replace(`/teams/${team.slug}/square`, undefined, { shallow: true });
    } else if (error) {
      toast.error(decodeURIComponent(error as string));
      // Remove the error parameter from URL
      router.replace(`/teams/${team.slug}/square`, undefined, { shallow: true });
    }
  }, [router.query, team.slug, router]);

  // Check initial connection status
  useEffect(() => {
    setIsConnected(Boolean(team.squareAccessToken));
  }, [team.squareAccessToken]);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      // Redirect to Square OAuth page
      const response = await fetch(`/api/teams/${team.slug}/square/connect`, {
        method: 'GET',
      });
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message);
      }

      // Redirect to Square's OAuth page
      window.location.href = data.data.url;
    } catch (error: any) {
      toast.error(error.message);
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setIsDisconnecting(true);
      const response = await fetch(`/api/teams/${team.slug}/square/disconnect`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      setIsConnected(false);
      toast.success('Successfully disconnected from Square');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="sm:flex sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center">
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  Square Integration
                </h3>
                {isConnected && (
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Connected
                  </span>
                )}
              </div>
              <div className="mt-2 max-w-xl text-sm text-gray-500">
                <p>
                  Connect your Square account to manage your store's orders, inventory,
                  and payments directly from this dashboard.
                </p>
              </div>
            </div>
            <div className="mt-5 sm:mt-0 sm:ml-6 sm:flex sm:flex-shrink-0 sm:items-center">
              {!isConnected ? (
                <Button
                  color="primary"
                  loading={isConnecting}
                  startIcon={<BuildingStorefrontIcon className="h-5 w-5" />}
                  onClick={handleConnect}
                  size="md"
                >
                  Connect Square Account
                </Button>
              ) : (
                <Button
                  color="error"
                  loading={isDisconnecting}
                  onClick={handleDisconnect}
                  size="md"
                >
                  Disconnect
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SquareIntegration; 