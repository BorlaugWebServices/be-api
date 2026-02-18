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

describe('Provenances API Integration Tests', () => {
  const mockStore = {
    provenance: {
      get: jest.fn(),
      getActivities: jest.fn(),
      getRegistry: jest.fn(),
      getRegistryActivities: jest.fn(),
      getDefinition: jest.fn(),
      getDefinitionActivities: jest.fn(),
    },
  };

  beforeEach(() => {
    (dataStore.getStore as jest.Mock).mockResolvedValue(mockStore);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /sequences/:sequenceid', () => {
    it('should return a sequence by ID', async () => {
      const mockSequence = {id: '123', registry: 'reg1', template: 'temp1'};
      const mockTemplateSteps = {result: [{name: 'step1'}]};
      const mockSequenceSteps = {result: [{status: 'done'}]};
      mockStore.provenance.get.mockResolvedValue(mockSequence);
      (harvester.request as jest.Mock)
        .mockResolvedValueOnce(mockTemplateSteps)
        .mockResolvedValueOnce(mockSequenceSteps);

      const response = await request(app).get('/sequences/123');

      expect(response.status).toBe(200);
      expect(response.body.id).toBe('123');
      expect(response.body.steps[0].status).toBe('ATTESTED');
    });

    it('should return 404 for invalid sequence ID format', async () => {
      const response = await request(app).get('/sequences/invalid-id');

      expect(response.status).toBe(404);
      expect(response.body.msg).toBe('Invalid sequence id');
    });
  });

  describe('GET /sequences/:sequenceid/activities', () => {
    it('should return activities for a sequence', async () => {
      const mockActivities = [{id: 'act1', type: 'sequence'}];
      mockStore.provenance.getActivities.mockResolvedValue(mockActivities);

      const response = await request(app).get('/sequences/123/activities');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockActivities);
    });

    it('should return 404 for invalid sequence ID format', async () => {
      const response = await request(app).get('/sequences/invalid-id/activities');

      expect(response.status).toBe(404);
      expect(response.body.msg).toBe('Invalid sequence id');
    });
  });

  describe('GET /sequences/registries/:registryid', () => {
    it('should return a registry by ID', async () => {
      const mockRegistry = {id: 'reg1', name: 'Test Registry'};
      mockStore.provenance.getRegistry.mockResolvedValue(mockRegistry);

      const response = await request(app).get('/sequences/registries/reg1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockRegistry);
    });
  });

  describe('GET /sequences/registries/:registryid/activities', () => {
    it('should return activities for a registry', async () => {
      const mockActivities = [{id: 'act1', type: 'registry'}];
      mockStore.provenance.getRegistryActivities.mockResolvedValue(mockActivities);

      const response = await request(app).get('/sequences/registries/reg1/activities');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockActivities);
    });
  });

  describe('GET /sequences/definitions/:definitionid', () => {
    it('should return a definition by ID', async () => {
      const mockDefinition = {id: 'def1', name: 'Test Definition'};
      mockStore.provenance.getDefinition.mockResolvedValue(mockDefinition);

      const response = await request(app).get('/sequences/definitions/def1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockDefinition);
    });
  });

  describe('GET /sequences/definitions/:definitionid/activities', () => {
    it('should return activities for a definition', async () => {
      const mockActivities = [{id: 'act1', type: 'definition'}];
      mockStore.provenance.getDefinitionActivities.mockResolvedValue(mockActivities);

      const response = await request(app).get('/sequences/definitions/def1/activities');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockActivities);
    });
  });
});
