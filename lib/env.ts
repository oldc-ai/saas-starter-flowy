import type { SessionStrategy } from 'next-auth';

const env = {
  databaseUrl: `${process.env.DATABASE_URL}`,
  appUrl: process.env.NEXTAUTH_URL || 'http://localhost:4002',
  redirectIfAuthenticated: '/dashboard',

  // SMTP configuration for NextAuth
  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    from: process.env.SMTP_FROM,
  },

  // NextAuth configuration
  nextAuth: {
    secret: process.env.NEXTAUTH_SECRET,
    url: process.env.NEXTAUTH_URL || 'http://localhost:4002',
    sessionStrategy: (process.env.NEXTAUTH_SESSION_STRATEGY || 'database') as SessionStrategy,
  },

  // Svix
  svix: {
    url: `${process.env.SVIX_URL}`,
    apiKey: `${process.env.SVIX_API_KEY}`,
  },

  //Social login: Github
  github: {
    clientId: `${process.env.GITHUB_CLIENT_ID}`,
    clientSecret: `${process.env.GITHUB_CLIENT_SECRET}`,
  },

  //Social login: Google
  google: {
    clientId: `${process.env.GOOGLE_CLIENT_ID}`,
    clientSecret: `${process.env.GOOGLE_CLIENT_SECRET}`,
  },

  // Retraced configuration
  retraced: {
    url: process.env.RETRACED_URL
      ? `${process.env.RETRACED_URL}/auditlog`
      : undefined,
    apiKey: process.env.RETRACED_API_KEY,
    projectId: process.env.RETRACED_PROJECT_ID,
  },

  groupPrefix: process.env.GROUP_PREFIX,

  // SAML Jackson configuration
  jackson: {
    url: process.env.JACKSON_URL,
    externalUrl: process.env.JACKSON_EXTERNAL_URL || process.env.JACKSON_URL,
    apiKey: process.env.JACKSON_API_KEY,
    productId: process.env.JACKSON_PRODUCT_ID || 'boxyhq',
    selfHosted: process.env.JACKSON_URL !== undefined,
    sso: {
      callback: `${process.env.APP_URL}`,
      issuer: 'https://saml.boxyhq.com',
      path: '/api/oauth/saml',
      oidcPath: '/api/oauth/oidc',
      idpLoginPath: '/auth/idp-login',
    },
    dsync: {
      webhook_url: `${process.env.APP_URL}/api/webhooks/dsync`,
      webhook_secret: process.env.JACKSON_WEBHOOK_SECRET,
    },
  },

  // Users will need to confirm their email before accessing the app feature
  confirmEmail: process.env.CONFIRM_EMAIL === 'true',

  // Mixpanel configuration
  mixpanel: {
    token: process.env.NEXT_PUBLIC_MIXPANEL_TOKEN,
  },

  disableNonBusinessEmailSignup:
    process.env.DISABLE_NON_BUSINESS_EMAIL_SIGNUP === 'true',

  authProviders: process.env.AUTH_PROVIDERS || 'github,credentials',

  otel: {
    prefix: process.env.OTEL_PREFIX || 'boxyhq.saas',
  },

  hideLandingPage: process.env.HIDE_LANDING_PAGE === 'true',

  darkModeEnabled: process.env.NEXT_PUBLIC_DARK_MODE !== 'false',

  teamFeatures: {
    sso: process.env.NEXT_PUBLIC_ENABLE_SSO === 'true',
    dsync: process.env.NEXT_PUBLIC_ENABLE_DSYNC === 'true',
    auditLog: process.env.NEXT_PUBLIC_ENABLE_AUDIT_LOG === 'true',
    webhook: process.env.NEXT_PUBLIC_ENABLE_WEBHOOK === 'true',
    apiKey: process.env.NEXT_PUBLIC_ENABLE_API_KEY === 'true',
    payments: process.env.NEXT_PUBLIC_ENABLE_PAYMENTS === 'true',
    deleteTeam: process.env.NEXT_PUBLIC_ENABLE_DELETE_TEAM === 'true',
    square: process.env.NEXT_PUBLIC_ENABLE_SQUARE === 'true',
  },

  recaptcha: {
    siteKey: process.env.RECAPTCHA_SITE_KEY || null,
    secretKey: process.env.RECAPTCHA_SECRET_KEY || null,
  },

  maxLoginAttempts: Number(process.env.MAX_LOGIN_ATTEMPTS) || 5,

  slackWebhookUrl: process.env.SLACK_WEBHOOK_URL,

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },

  // Square Integration
  squareAppId: process.env.SQUARE_APP_ID || '',
  squareAppSecret: process.env.SQUARE_APP_SECRET || '',
  squareUseSandbox: process.env.SQUARE_USE_SANDBOX === 'true',
};

export default env;
