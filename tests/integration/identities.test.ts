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

describe('Identities API Integration Tests', () => {
  const mockStore = {
    identity: {
      get: jest.fn(),
      getActivities: jest.fn(),
      get_catalog: jest.fn(),
      getCatalogActivities: jest.fn(),
    },
  };

  beforeEach(() => {
    (dataStore.getStore as jest.Mock).mockResolvedValue(mockStore);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /identities/:did', () => {
    it('should return an identity by DID', async () => {
      const mockIdentity = {did: 'did:bws:123', name: 'Test Identity'};
      const mockDocument = {result: {doc: 'some doc'}};
      mockStore.identity.get.mockResolvedValue(mockIdentity);
      (harvester.request as jest.Mock).mockResolvedValue(mockDocument);

      const response = await request(app).get('/identities/did:bws:123');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        ...mockIdentity,
        ...mockDocument.result,
      });
    });

    it('should return 404 for invalid DID format', async () => {
      const response = await request(app).get('/identities/invalid-did');

      expect(response.status).toBe(404);
      expect(response.body.msg).toBe('Invalid did');
    });
  });

  describe('GET /identities/:did/activities', () => {
    it('should return activities for an identity', async () => {
      const mockActivities = [{id: 'act1', type: 'identity'}];
      mockStore.identity.getActivities.mockResolvedValue(mockActivities);

      const response = await request(app).get('/identities/did:bws:123/activities');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockActivities);
    });

    it('should return 404 for invalid DID format', async () => {
      const response = await request(app).get('/identities/invalid-did/activities');

      expect(response.status).toBe(404);
      expect(response.body.msg).toBe('Invalid did');
    });
  });

  describe('GET /identities/catalogs/:catalogid', () => {
    it('should return a catalog by ID', async () => {
      const mockCatalog = {id: 'cat1', name: 'Test Catalog'};
      mockStore.identity.get_catalog.mockResolvedValue(mockCatalog);

      const response = await request(app).get('/identities/catalogs/cat1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockCatalog);
    });
  });

  describe('GET /identities/catalogs/:catalogid/activities', () => {
    it('should return activities for a catalog', async () => {
      const mockActivities = [{id: 'act1', type: 'catalog'}];
      mockStore.identity.getCatalogActivities.mockResolvedValue(mockActivities);

      const response = await request(app).get('/identities/catalogs/cat1/activities');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockActivities);
    });
  });
});
