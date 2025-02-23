import {
  Cog6ToothIcon,
  DocumentMagnifyingGlassIcon,
  KeyIcon,
  PaperAirplaneIcon,
  ShieldExclamationIcon,
  UserPlusIcon,
  BanknotesIcon,
  BuildingStorefrontIcon,
} from '@heroicons/react/24/outline';
import type { Team } from '@prisma/client';
import classNames from 'classnames';
import useCanAccess from 'hooks/useCanAccess';
import Link from 'next/link';
import { TeamFeature } from 'types';
import { useRouter } from 'next/router';
import { ForwardRefExoticComponent, SVGProps, RefAttributes } from 'react';

interface TeamTabProps {
  activeTab: string;
  team: Team;
  heading?: string;
  teamFeatures: TeamFeature;
}

const TeamTab = ({ activeTab, team, heading, teamFeatures }: TeamTabProps) => {
  const { canAccess } = useCanAccess();
  const router = useRouter();
  const { onboarding } = router.query;

  type Navigation = {
    name: string;
    href: string;
    active: boolean;
    icon: ForwardRefExoticComponent<Omit<SVGProps<SVGSVGElement>, "ref"> & { title?: string; titleId?: string; } & RefAttributes<SVGSVGElement>>;
  };

  const navigations: Navigation[] = [];

  // Always show Square integration first
  if (canAccess('team_square', ['create', 'update', 'read', 'delete'])) {
    navigations.push({
      name: 'Square Integration',
      href: `/teams/${team.slug}/square${onboarding === 'true' ? '?onboarding=true' : ''}`,
      active: activeTab === 'square',
      icon: BuildingStorefrontIcon,
    });
  }

  // Add settings tab if not in onboarding
  if (onboarding !== 'true') {
    navigations.push({
      name: 'Settings',
      href: `/teams/${team.slug}/settings`,
      active: activeTab === 'settings',
      icon: Cog6ToothIcon,
    });
  }

  // Hide other navigation items during onboarding
  if (onboarding !== 'true') {
    if (canAccess('team_member', ['create', 'update', 'read', 'delete'])) {
      navigations.push({
        name: 'Members',
        href: `/teams/${team.slug}/members`,
        active: activeTab === 'members',
        icon: UserPlusIcon,
      });
    }

    if (
      teamFeatures.sso &&
      canAccess('team_sso', ['create', 'update', 'read', 'delete'])
    ) {
      navigations.push({
        name: 'Single Sign-On',
        href: `/teams/${team.slug}/sso`,
        active: activeTab === 'sso',
        icon: ShieldExclamationIcon,
      });
    }

    if (
      teamFeatures.dsync &&
      canAccess('team_dsync', ['create', 'update', 'read', 'delete'])
    ) {
      navigations.push({
        name: 'Directory Sync',
        href: `/teams/${team.slug}/directory-sync`,
        active: activeTab === 'directory-sync',
        icon: UserPlusIcon,
      });
    }

    if (
      teamFeatures.auditLog &&
      canAccess('team_audit_log', ['create', 'update', 'read', 'delete'])
    ) {
      navigations.push({
        name: 'Audit Logs',
        href: `/teams/${team.slug}/audit-logs`,
        active: activeTab === 'audit-logs',
        icon: DocumentMagnifyingGlassIcon,
      });
    }

    if (
      teamFeatures.payments &&
      canAccess('team_payments', ['create', 'update', 'read', 'delete'])
    ) {
      navigations.push({
        name: 'Billing',
        href: `/teams/${team.slug}/billing`,
        active: activeTab === 'payments',
        icon: BanknotesIcon,
      });
    }

    if (
      teamFeatures.webhook &&
      canAccess('team_webhook', ['create', 'update', 'read', 'delete'])
    ) {
      navigations.push({
        name: 'Webhooks',
        href: `/teams/${team.slug}/webhooks`,
        active: activeTab === 'webhooks',
        icon: PaperAirplaneIcon,
      });
    }

    if (
      teamFeatures.apiKey &&
      canAccess('team_api_key', ['create', 'update', 'read', 'delete'])
    ) {
      navigations.push({
        name: 'API Keys',
        href: `/teams/${team.slug}/api-keys`,
        active: activeTab === 'api-keys',
        icon: KeyIcon,
      });
    }
  }

  return (
    <div className="flex flex-col pb-6">
      <h2 className="text-xl font-semibold mb-2">
        {heading ? heading : team.name}
      </h2>
      <nav
        className="flex flex-wrap border-b border-gray-300"
        aria-label="Tabs"
      >
        {navigations.map((menu) => {
          return (
            <Link
              href={menu.href}
              key={menu.href}
              className={classNames(
                'inline-flex items-center border-b-2 py-2 md-py-4 mr-5 text-sm font-medium',
                menu.active
                  ? 'border-gray-900 text-gray-700 dark:text-gray-100'
                  : 'border-transparent text-gray-500 hover:border-gray-300  hover:text-gray-700 hover:dark:text-gray-100'
              )}
            >
              <menu.icon className="h-4 w-4 mr-2" />
              {menu.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default TeamTab;
