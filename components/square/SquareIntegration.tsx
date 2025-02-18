import { useState, useEffect } from 'react';
import type { Team } from '@prisma/client';
import { Button } from 'react-daisyui';
import { toast } from 'react-hot-toast';
import { BuildingStorefrontIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/router';

interface Location {
  id: string;
  name: string;
  address: {
    address_line_1?: string;
    locality?: string;
  } | null;
  isSelected: boolean;
}

interface SquareIntegrationProps {
  team: Team;
}

const SquareIntegration = ({ team }: SquareIntegrationProps) => {
  const router = useRouter();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [isSavingLocation, setIsSavingLocation] = useState(false);

  useEffect(() => {
    // Check for success/error params in URL
    const { success, error } = router.query;
    
    if (success === 'true') {
      setIsConnected(true);
      toast.success('Successfully connected to Square');
      // Remove the success parameter from URL
      router.replace(`/teams/${team.slug}/settings`, undefined, { shallow: true });
    } else if (error) {
      toast.error(decodeURIComponent(error as string));
      // Remove the error parameter from URL
      router.replace(`/teams/${team.slug}/settings`, undefined, { shallow: true });
    }
  }, [router.query, team.slug, router]);

  // Check initial connection status and load locations if connected
  useEffect(() => {
    const isSquareConnected = Boolean(team.squareAccessToken);
    setIsConnected(isSquareConnected);
    
    if (isSquareConnected) {
      fetchLocations();
    }
  }, [team.squareAccessToken, team.slug]);

  const fetchLocations = async () => {
    try {
      setIsLoadingLocations(true);
      const response = await fetch(`/api/teams/${team.slug}/square/locations`);
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      setLocations(data.data.locations);
      const selectedLocation = data.data.locations.find((loc: Location) => loc.isSelected);
      setSelectedLocationId(selectedLocation?.id || null);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoadingLocations(false);
    }
  };

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
      setLocations([]);
      setSelectedLocationId(null);
      toast.success('Successfully disconnected from Square');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleLocationSelect = async (locationId: string) => {
    try {
      setIsSavingLocation(true);
      const response = await fetch(`/api/teams/${team.slug}/square/location`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ locationId }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      setSelectedLocationId(locationId);
      toast.success('Successfully updated Square location');
      await fetchLocations(); // Refresh locations to update UI
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSavingLocation(false);
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
                  Connect your Square account to manage your store&apos;s orders, inventory,
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

          {/* Location Selection */}
          {isConnected && (
            <div className="mt-8">
              <h4 className="text-sm font-medium text-gray-900">Select Store Location</h4>
              <p className="mt-1 text-sm text-gray-500">
                Choose which Square location you want to connect to this team.
              </p>
              
              {isLoadingLocations ? (
                <div className="mt-4 flex justify-center">
                  <div className="loading loading-spinner loading-md"></div>
                </div>
              ) : locations.length > 0 ? (
                <div className="mt-4 space-y-4">
                  {locations.map((location) => (
                    <div
                      key={location.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        location.id === selectedLocationId
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-primary/50'
                      }`}
                      onClick={() => !isSavingLocation && handleLocationSelect(location.id)}
                    >
                      <div className="flex items-start">
                        <input
                          type="radio"
                          className="radio radio-primary mt-1"
                          checked={location.id === selectedLocationId}
                          onChange={() => !isSavingLocation && handleLocationSelect(location.id)}
                          disabled={isSavingLocation}
                        />
                        <div className="ml-3">
                          <h4 className="text-sm font-medium text-gray-900">
                            {location.name}
                          </h4>
                          {location.address && (
                            <p className="text-sm text-gray-500">
                              {location.address.address_line_1}
                              {location.address.locality && `, ${location.address.locality}`}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-gray-500">
                  No locations found in your Square account.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SquareIntegration; 