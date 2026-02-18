import request from 'supertest';
import app from '../../server/index';
import {dataStore} from "../../config";

jest.mock('../../config', () => ({
  dataStore: {
    getStore: jest.fn(),
  },
}));

describe('Audits API Integration Tests', () => {
  const mockStore = {
    audit: {
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

  describe('GET /audits/:auditid', () => {
    it('should return an audit by ID', async () => {
      const mockAudit = {id: '123', name: 'Test Audit'};
      mockStore.audit.get.mockResolvedValue(mockAudit);

      const response = await request(app).get('/audits/123');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockAudit);
    });

    it('should return 404 for invalid audit ID format', async () => {
      const response = await request(app).get('/audits/invalid-id');

      expect(response.status).toBe(404);
      expect(response.body.msg).toBe('Invalid audit id');
    });
  });

  describe('GET /audits/:auditid/activities', () => {
    it('should return activities for an audit', async () => {
      const mockActivities = [{id: 'act1', type: 'audit'}];
      mockStore.audit.getActivities.mockResolvedValue(mockActivities);

      const response = await request(app).get('/audits/123/activities');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockActivities);
    });

    it('should return 404 for invalid audit ID format', async () => {
      const response = await request(app).get('/audits/invalid-id/activities');

      expect(response.status).toBe(404);
      expect(response.body.msg).toBe('Invalid audit id');
    });
  });
});
