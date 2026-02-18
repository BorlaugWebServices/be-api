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

describe('Groups API Integration Tests', () => {
  const mockStore = {
    group: {
      get: jest.fn(),
      getActivities: jest.fn(),
    },
  };

  beforeEach(() => {
    (dataStore.getStore as jest.Mock).mockResolvedValue(mockStore);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /groups/:groupid', () => {
    it('should return a group by ID', async () => {
      const mockGroupDB = {
        blockNumber: 1,
        blockHash: '0xabc',
        extrinsicHash: '0xdef',
        timestamp: 1234567890,
      };
      const mockGroupHarvester = {result: {id: '123', name: 'Test Group'}};
      mockStore.group.get.mockResolvedValue(mockGroupDB);
      (harvester.request as jest.Mock).mockResolvedValue(mockGroupHarvester);

      const response = await request(app).get('/groups/123');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        ...mockGroupHarvester.result,
        ...mockGroupDB,
      });
    });

    it('should return 404 for invalid group ID format', async () => {
      const response = await request(app).get('/groups/invalid-id');

      expect(response.status).toBe(404);
      expect(response.body.msg).toBe('Invalid group id');
    });
  });

  describe('GET /groups/:groupid/activities', () => {
    it('should return activities for a group', async () => {
      const mockActivities = [{id: 'act1', type: 'group'}];
      mockStore.group.getActivities.mockResolvedValue(mockActivities);

      const response = await request(app).get('/groups/123/activities');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockActivities);
    });

    it('should return 404 for invalid group ID format', async () => {
      const response = await request(app).get('/groups/invalid-id/activities');

      expect(response.status).toBe(404);
      expect(response.body.msg).toBe('Invalid group id');
    });
  });
});
