import request from 'supertest';
import app from '../../server/index';
import {dataStore} from "../../config";

jest.mock('../../config', () => ({
  dataStore: {
    getStore: jest.fn(),
  },
}));

describe('Events API Integration Tests', () => {
  const mockStore = {
    event: {
      get: jest.fn(),
    },
  };

  beforeEach(() => {
    (dataStore.getStore as jest.Mock).mockResolvedValue(mockStore);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /events/:eventid', () => {
    it('should return an event by ID', async () => {
      const mockEvent = {id: '123-456', name: 'Test Event'};
      mockStore.event.get.mockResolvedValue(mockEvent);

      const response = await request(app).get('/events/123-456');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockEvent);
    });

    it('should return 404 for invalid event ID format', async () => {
      const response = await request(app).get('/events/invalid-id');

      expect(response.status).toBe(404);
      expect(response.body.msg).toBe('Invalid event id');
    });

    it('should return 404 if event not found', async () => {
      mockStore.event.get.mockResolvedValue(null);

      const response = await request(app).get('/events/123-456');

      expect(response.status).toBe(404);
      expect(response.body.msg).toBe('Event ID 123-456 not found');
    });
  });
});
