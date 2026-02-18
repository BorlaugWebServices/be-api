import request from 'supertest';
import app from '../../server/index';


describe('Health Check API', () => {
  it('should return 200 status', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
  });
});

describe('Blocks API Integration Tests', () => {

  it('GET /blocks should return a list of blocks', async () => {
    const response = await request(app)
      .get('/blocks')
      .query({page: 1, perPage: 5});

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('total');
    expect(response.body).toHaveProperty('slice');
    expect(Array.isArray(response.body.slice)).toBe(true);
  });

  it('GET /blocks/:numberOrHash should return 404 for invalid format', async () => {
    const response = await request(app).get('/blocks/not-a-hash');

    expect(response.status).toBe(404);
    expect(response.body.msg).toBe('Invalid block number or hash');
  });

  it('GET /blocks/:numberOrHash should return an expanded block', async () => {
    const response = await request(app).get('/blocks/61804');

    expect(response.status).toBe(200);

    const block = response.body;

    expect(block).toMatchObject({
      number: expect.any(Number),
      hash: expect.stringMatching(/^0x[A-Fa-f0-9]{64}$/),
      parentHash: expect.toSatisfy((val) => typeof val === 'string' || val === null),
      stateRoot: expect.any(String),
      extrinsicsRoot: expect.any(String),
      timestamp: expect.any(Number),
      significant: expect.any(Boolean)
    });

    expect(Array.isArray(block.transactions)).toBe(true);
    block.transactions.forEach((tx: any) => {
      expect(tx).toMatchObject({
        hash: expect.stringMatching(/^0x/),
        id: expect.any(String),
        blockNumber: block.number,
        signer: expect.toSatisfy((v: any) => typeof v === 'string' || v === null),
        isSigned: expect.any(Boolean),
        timestamp: expect.any(Number)
      });
    });


    expect(Array.isArray(block.inherents)).toBe(true);
    block.inherents.forEach((inherent: any) => {

      expect(inherent).toMatchObject({
        id: expect.any(String),
        blockNumber: block.number,
        isSigned: expect.any(Boolean),
        method: expect.anything(), // JsonValue
        timestamp: expect.any(Number)
      });
    });

    expect(Array.isArray(block.events)).toBe(true);
    block.events.forEach((event: any) => {
      expect(event).toMatchObject({
        id: expect.any(String),
        blockNumber: block.number,
        event: expect.anything(), // JsonValue
        timestamp: expect.any(Number)
      });
    });


    expect(Array.isArray(block.logs)).toBe(true);
    block.logs.forEach((log: any) => {
      expect(log).toMatchObject({
        id: expect.any(String),
        blockNumber: block.number,
        log: expect.anything(), // JsonValue
        timestamp: expect.any(Number)
      });
    });
  });
});