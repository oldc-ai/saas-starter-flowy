import { Cog6ToothIcon, ArchiveBoxIcon, ChartBarIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'next-i18next';
import NavigationItems from './NavigationItems';
import { NavigationProps, MenuItem } from './NavigationItems';

interface NavigationItemsProps extends NavigationProps {
  slug: string;
  setSidebarOpen?: (open: boolean) => void;
}

const TeamNavigation = ({ slug, activePathname, setSidebarOpen }: NavigationItemsProps) => {
  const { t } = useTranslation('common');

  const menus: MenuItem[] = [
    {
      name: t('all-products'),
      href: `/teams/${slug}/inventory`,
      icon: ArchiveBoxIcon ,
      active: activePathname === `/teams/${slug}/inventory`,
    },
    {
      name: t('sales'),
      href: `/teams/${slug}/sales`,
      icon: ChartBarIcon,
      active: activePathname === `/teams/${slug}/sales`,
    },
    {
      name: t('receipt-uploads'),
      href: `/teams/${slug}/receipts`,
      icon: DocumentTextIcon,
      active: activePathname === `/teams/${slug}/receipts`,
    },
    {
      name: t('settings'),
      href: `/teams/${slug}/square`,
      icon: Cog6ToothIcon,
      active: ['/settings', '/square', '/members'].some(path => activePathname === `/teams/${slug}${path}`),
    },
  ];

  return <NavigationItems menus={menus} setSidebarOpen={setSidebarOpen} />;
};

export default TeamNavigation;
