import request from 'supertest';
import app from '../../server/index';
import {dataStore} from "../../config";

jest.mock('../../config', () => ({
  dataStore: {
    getStore: jest.fn(),
  },
}));

describe('Transactions API Integration Tests', () => {
  const mockStore = {
    transaction: {
      getPage: jest.fn(),
      get: jest.fn(),
    },
    event: {
      getList: jest.fn(),
    },
  };

  beforeEach(() => {
    (dataStore.getStore as jest.Mock).mockResolvedValue(mockStore);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /transactions', () => {
    it('should return a list of transactions', async () => {
      const mockTxns = {
        slice: [{hash: '0x123', events: ['evt1']}],
        total: 1,
      };
      mockStore.transaction.getPage.mockResolvedValue(mockTxns);
      mockStore.transaction.get.mockResolvedValue({hash: '0x123', events: ['evt1']});
      mockStore.event.getList.mockResolvedValue([
        {meta: {name: 'Deposit'}, event: {data: [100]}},
        {meta: {name: 'ExtrinsicSuccess'}, event: {data: [{weight: 200}]}},
      ]);

      const response = await request(app)
        .get('/transactions')
        .query({page: 1, perPage: 5});

      expect(response.status).toBe(200);
      expect(response.body.total).toBe(1);
      expect(response.body.slice[0].tx_fee).toBe(100);
      expect(response.body.slice[0].weight).toBe(200);
    });
  });

  describe('GET /transactions/:txhash', () => {
    it('should return a transaction by hash', async () => {
      const mockTx = {hash: '0x1234567890123456789012345678901234567890123456789012345678901234', events: ['evt1']};
      mockStore.transaction.get.mockResolvedValue(mockTx);
      mockStore.event.getList.mockResolvedValue([{meta: {name: 'SomeEvent'}}]);

      const response = await request(app).get('/transactions/0x1234567890123456789012345678901234567890123456789012345678901234');

      expect(response.status).toBe(200);
      expect(response.body.hash).toBe(mockTx.hash);
      expect(response.body.events[0].meta.name).toBe('SomeEvent');
    });

    it('should return 404 for invalid transaction hash format', async () => {
      const response = await request(app).get('/transactions/invalid-hash');

      expect(response.status).toBe(404);
      expect(response.body.msg).toBe('Invalid tx hash');
    });

    it('should return 404 if transaction not found', async () => {
      mockStore.transaction.get.mockResolvedValue(null);

      const response = await request(app).get('/transactions/0x1234567890123456789012345678901234567890123456789012345678901234');

      expect(response.status).toBe(404);
      expect(response.body.msg).toBe('Tx hash 0x1234567890123456789012345678901234567890123456789012345678901234 not found');
    });
  });
});
