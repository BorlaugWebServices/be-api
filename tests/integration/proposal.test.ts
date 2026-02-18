import request from 'supertest';
import app from '../../server/index';
import {dataStore} from "../../config";

jest.mock('../../config', () => ({
  dataStore: {
    getStore: jest.fn(),
  },
}));

describe('Proposal API Integration Tests', () => {
  const mockStore = {
    proposal: {
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

  describe('GET /proposals/:proposalid', () => {
    it('should return a proposal by ID', async () => {
      const mockProposal = {id: '123', title: 'Test Proposal'};
      mockStore.proposal.get.mockResolvedValue(mockProposal);

      const response = await request(app).get('/proposals/123');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockProposal);
    });

    it('should return 404 for invalid proposal ID format', async () => {
      const response = await request(app).get('/proposals/invalid-id');

      expect(response.status).toBe(404);
      expect(response.body.msg).toBe('Invalid proposal id');
    });
  });

  describe('GET /proposals/:proposalid/activities', () => {
    it('should return activities for a proposal', async () => {
      const mockActivities = [{id: 'act1', type: 'proposal'}];
      mockStore.proposal.getActivities.mockResolvedValue(mockActivities);

      const response = await request(app).get('/proposals/123/activities');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockActivities);
    });

    it('should return 404 for invalid proposal ID format', async () => {
      const response = await request(app).get('/proposals/invalid-id/activities');

      expect(response.status).toBe(404);
      expect(response.body.msg).toBe('Invalid proposal id');
    });
  });
});
