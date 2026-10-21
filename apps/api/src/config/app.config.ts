import { config } from './env.js';

export const appConfig = {
  env: config.env,
  port: config.port,
  corsOrigins: config.cors.origins,
  jwt: config.jwt,
};

export default appConfig;
