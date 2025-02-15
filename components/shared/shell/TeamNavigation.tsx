import { Cog6ToothIcon, CodeBracketIcon, ChartBarIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'next-i18next';
import NavigationItems from './NavigationItems';
import { NavigationProps, MenuItem } from './NavigationItems';

interface NavigationItemsProps extends NavigationProps {
  slug: string;
}

const TeamNavigation = ({ slug, activePathname }: NavigationItemsProps) => {
  const { t } = useTranslation('common');

  const menus: MenuItem[] = [
    {
      name: t('all-products'),
      href: `/teams/${slug}/inventory`,
      icon: CodeBracketIcon,
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
      href: `/teams/${slug}/settings`,
      icon: Cog6ToothIcon,
      active: activePathname === `/teams/${slug}/settings`,
    },
  ];

  return <NavigationItems menus={menus} />;
};

export default TeamNavigation;
