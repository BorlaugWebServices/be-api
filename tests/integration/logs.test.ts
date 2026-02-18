import request from 'supertest';
import app from '../../server/index';
import {dataStore} from "../../config";

jest.mock('../../config', () => ({
  dataStore: {
    getStore: jest.fn(),
  },
}));

describe('Logs API Integration Tests', () => {
  const mockStore = {
    log: {
      get: jest.fn(),
    },
  };

  beforeEach(() => {
    (dataStore.getStore as jest.Mock).mockResolvedValue(mockStore);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /logs/:logid', () => {
    it('should return a log by ID', async () => {
      const mockLog = {id: '123-456', message: 'Test Log'};
      mockStore.log.get.mockResolvedValue(mockLog);

      const response = await request(app).get('/logs/123-456');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockLog);
    });

    it('should return 404 for invalid log ID format', async () => {
      const response = await request(app).get('/logs/invalid-id');

      expect(response.status).toBe(404);
      expect(response.body.msg).toBe('Invalid log id');
    });

    it('should return 404 if log not found', async () => {
      mockStore.log.get.mockResolvedValue(null);

      const response = await request(app).get('/logs/123-456');

      expect(response.status).toBe(404);
      expect(response.body.msg).toBe('Event ID 123-456 not found');
    });
  });
});
