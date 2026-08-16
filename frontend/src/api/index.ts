import apiClient from './client';
import type { HealthResponse } from '@/types';

export const healthApi = {
  ping: async (): Promise<HealthResponse> => {
    const res = await apiClient.get<HealthResponse>('/health');
    return res.data;
  },
};

export { default as apiClient } from './client';
export * from './mutualFunds';
export * from './portfolio';
export * from './stocks';



