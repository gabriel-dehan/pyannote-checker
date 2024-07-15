export const getConfig = () => ({
  port: process.env.PORT || 3000,
  authSecret: process.env.AUTH_SECRET || '',
});

export const getEnv = () => {
  const env = process.env?.NODE_ENV;
  if (typeof env === 'undefined') {
    console.warn('ENV is not set!');
  }

  return process.env.NODE_ENV;
};

export const isProd = () => getEnv() === 'production';
export const isDev = () => getEnv() === 'development';
export const isTest = () => getEnv() === 'test';
