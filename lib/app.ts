import packageInfo from '../package.json';
import env from './env';

const app = {
  version: packageInfo.version,
  name: 'Flowy',
  logoUrl: 'https://boxyhq.com/img/logo.png',
  url: env.appUrl,
};

export default app;
