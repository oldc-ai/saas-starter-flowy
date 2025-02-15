import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import TeamNavigation from './TeamNavigation';
import UserNavigation from './UserNavigation';

interface NavigationProps {
  setSidebarOpen?: (open: boolean) => void;
}

const Navigation = ({ setSidebarOpen }: NavigationProps) => {
  const { asPath, isReady, query } = useRouter();
  const [activePathname, setActivePathname] = useState<null | string>(null);

  const { slug } = query as { slug: string };

  useEffect(() => {
    if (isReady && asPath) {
      const activePathname = new URL(asPath, location.href).pathname;
      setActivePathname(activePathname);
    }
  }, [asPath, isReady]);

  const Navigation = () => {
    if (slug) {
      return <TeamNavigation activePathname={activePathname} slug={slug} setSidebarOpen={setSidebarOpen} />;
    } else {
      return <UserNavigation activePathname={activePathname} setSidebarOpen={setSidebarOpen} />;
    }
  };

  return (
    <nav className="flex flex-1 flex-col">
      <Navigation />
    </nav>
  );
};

export default Navigation;
