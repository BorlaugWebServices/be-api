import request from 'supertest';
import app from '../../server/index';
import {dataStore} from "../../config";

jest.mock('../../config', () => ({
  dataStore: {
    getStore: jest.fn(),
  },
}));

describe('Inherents API Integration Tests', () => {
  const mockStore = {
    inherent: {
      get: jest.fn(),
    },
  };

  beforeEach(() => {
    (dataStore.getStore as jest.Mock).mockResolvedValue(mockStore);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /inherents/:inherentid', () => {
    it('should return an inherent by ID', async () => {
      const mockInherent = {id: '123-456', name: 'Test Inherent'};
      mockStore.inherent.get.mockResolvedValue(mockInherent);

      const response = await request(app).get('/inherents/123-456');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockInherent);
    });

    it('should return 404 for invalid inherent ID format', async () => {
      const response = await request(app).get('/inherents/invalid-id');

      expect(response.status).toBe(404);
      expect(response.body.msg).toBe('Invalid inherent id');
    });

    it('should return 404 if inherent not found', async () => {
      mockStore.inherent.get.mockResolvedValue(null);

      const response = await request(app).get('/inherents/123-456');

      expect(response.status).toBe(404);
      expect(response.body.msg).toBe('Inherent id 123-456 not found');
    });
  });
});
