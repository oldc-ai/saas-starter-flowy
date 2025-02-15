import packageInfo from '../package.json';
import env from './env';

const app = {
  version: packageInfo.version,
  name: 'Flowy',
  logoUrl: '/vercel.svg',
  url: env.appUrl,
};

export default app;
