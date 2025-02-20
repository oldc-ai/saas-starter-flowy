import { Error, Loading } from '@/components/shared';
import { TeamTab } from '@/components/team';
import useTeam from 'hooks/useTeam';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import type { GetServerSidePropsContext } from 'next';
import env from '@/lib/env';
import type { TeamFeature } from 'types';
import { SquareIntegration } from '@/components/square';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

const SquarePage = ({ teamFeatures }: { teamFeatures: TeamFeature }) => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { onboarding } = router.query;
  const [showConnectHint, setShowConnectHint] = useState(false);
  const { isLoading, isError, team } = useTeam();

  useEffect(() => {
    if (onboarding === 'true') {
      setShowConnectHint(true);
    }
  }, [onboarding]);

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
    <>
      <TeamTab activeTab="square" team={team} teamFeatures={teamFeatures} />
      <SquareIntegration team={team} showConnectHint={showConnectHint} />
    </>
  );
};

export async function getServerSideProps({
  locale,
}: GetServerSidePropsContext) {
  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
      teamFeatures: env.teamFeatures,
    },
  };
}

export default SquarePage; 