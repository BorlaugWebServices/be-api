import request from 'supertest';
import app from '../../server/index';
import {dataStore, harvester} from "../../config";

jest.mock('../../config', () => ({
  dataStore: {
    getStore: jest.fn(),
  },
  harvester: {
    request: jest.fn(),
  },
}));

describe('Leases API Integration Tests', () => {
  const mockStore = {
    lease: {
      getRegistry: jest.fn(),
      getAsset: jest.fn(),
      getLeaseActivities: jest.fn(),
    },
  };

  beforeEach(() => {
    (dataStore.getStore as jest.Mock).mockResolvedValue(mockStore);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /assetregistry/registries/:registryid', () => {
    it('should return a registry by ID', async () => {
      const mockRegistry = {id: '123', name: 'Test Registry'};
      mockStore.lease.getRegistry.mockResolvedValue(mockRegistry);

      const response = await request(app).get('/assetregistry/registries/123');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockRegistry);
    });

    it('should return 404 for invalid registry ID format', async () => {
      const response = await request(app).get('/assetregistry/registries/invalid-id');

      expect(response.status).toBe(404);
      expect(response.body.msg).toBe('Invalid registry id');
    });
  });

  describe('GET /assetregistry/assets/:assetid', () => {
    it('should return an asset by ID', async () => {
      const mockAsset = {id: '456', registry_id: '123', name: 'Test Asset'};
      const mockAssetRPC = {result: {rpc_data: 'some data'}};
      mockStore.lease.getAsset.mockResolvedValue(mockAsset);
      (harvester.request as jest.Mock).mockResolvedValue(mockAssetRPC);

      const response = await request(app).get('/assetregistry/assets/456');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        ...mockAsset,
        ...mockAssetRPC.result,
      });
    });

    it('should return 404 for invalid asset ID format', async () => {
      const response = await request(app).get('/assetregistry/assets/invalid-id');

      expect(response.status).toBe(404);
      expect(response.body.msg).toBe('Invalid asset id');
    });
  });

  describe('GET /assetregistry/leases/:leaseid/activities', () => {
    it('should return activities for a lease', async () => {
      const mockActivities = [{id: 'act1', type: 'lease'}];
      mockStore.lease.getLeaseActivities.mockResolvedValue(mockActivities);

      const response = await request(app).get('/assetregistry/leases/789/activities');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockActivities);
    });
  });
});
