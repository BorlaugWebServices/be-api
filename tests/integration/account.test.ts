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

describe('Account API Integration Tests', () => {
  const mockStore = {
    transaction: {
      getSigners: jest.fn(),
      getTxnByAddress: jest.fn(),
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

  describe('GET /accounts', () => {
    it('should return a list of accounts with balances', async () => {
      const mockSigners = {
        slice: [{signer: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'}],
        total: 1,
      };
      mockStore.transaction.getSigners.mockResolvedValue(mockSigners);
      (harvester.request as jest.Mock).mockResolvedValue({result: '1000'});

      const response = await request(app)
        .get('/accounts')
        .query({page: 1, perPage: 5});

      expect(response.status).toBe(200);
      expect(response.body.total).toBe(1);
      expect(response.body.slice[0].signer).toBe('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY');
      expect(response.body.slice[0].balance).toBe('1000');
    });
  });

  describe('GET /accounts/:address', () => {
    it('should return transactions for an address', async () => {
      const mockTxns = {
        slice: [{hash: '0x123'}],
        total: 1,
      };
      mockStore.transaction.getTxnByAddress.mockResolvedValue(mockTxns);
      mockStore.transaction.get.mockResolvedValue({events: ['event1']});
      mockStore.event.getList.mockResolvedValue([{meta: {name: 'Deposit'}, event: {data: [100]}}]);

      const response = await request(app).get('/accounts/5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY');

      expect(response.status).toBe(200);
      expect(response.body.slice[0].hash).toBe('0x123');
      expect(response.body.slice[0].tx_fee).toBe(100);
    });
  });

  describe('GET /accounts/:address/balance', () => {
    it('should return the balance for an address', async () => {
      (harvester.request as jest.Mock).mockResolvedValue({result: '2000'});

      const response = await request(app).get('/accounts/5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY/balance');

      expect(response.status).toBe(200);
      expect(response.body).toBe('2000');
    });
  });
});
