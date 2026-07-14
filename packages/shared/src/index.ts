export const API_VERSION = 'v1';

export type HealthStatus = {
  status: 'ok';
  timestamp: string;
  service: 'api';
};

export * from './utils/slug';
export * from './dto/post.dto';
