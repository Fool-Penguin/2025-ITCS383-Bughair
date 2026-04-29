const request = require('supertest');

// Mock better-sqlite3 before requiring app
jest.mock('../src/config/db', () => {
  const mockDb = {
    pragma: jest.fn(),
    exec: jest.fn(),
    prepare: jest.fn(),
    transaction: jest.fn(fn => fn),
  };
  return mockDb;
});

jest.mock('../src/config/initDb', () => jest.fn());

const db = require('../src/config/db');
const app = require('../src/index');
const jwt = require('jsonwebtoken');

const TEST_SECRET = 'test_jwt_secret';
const memberToken = jwt.sign({ id: 1, role: 'member' }, TEST_SECRET);
const adminToken  = jwt.sign({ id: 99, role: 'admin' }, TEST_SECRET);

const mockPrepare = (returnVal, method = 'get') => {
  const stmt = { get: jest.fn(), all: jest.fn(), run: jest.fn() };
  if (returnVal !== undefined) stmt[method].mockReturnValue(returnVal);
  db.prepare.mockReturnValue(stmt);
  return stmt;
};

beforeEach(() => jest.clearAllMocks());

describe('Feature 2: Trainer Reviews', () => {
  
  describe('POST /api/trainers/:id/reviews', () => {
    test('requires authentication', async () => {
      const res = await request(app).post('/api/trainers/1/reviews').send({ bookingID: 1, rating: 5 });
      expect(res.status).toBe(401);
    });

    test('rejects missing fields', async () => {
      const res = await request(app).post('/api/trainers/1/reviews')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ rating: 5 });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/bookingID/i);
    });

    test('rejects if booking is not completed or does not exist', async () => {
      mockPrepare(undefined, 'get'); // No booking found
      const res = await request(app).post('/api/trainers/1/reviews')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ bookingID: 1, rating: 5 });
      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/completed bookings/i);
    });

    test('rejects duplicate review for same booking', async () => {
      // Mock completed booking exists
      const stmt1 = { get: jest.fn().mockReturnValue({ bookingID: 1, status: 'completed' }) };
      // Mock review already exists
      const stmt2 = { get: jest.fn().mockReturnValue({ reviewID: 100 }) };
      db.prepare.mockReturnValueOnce(stmt1).mockReturnValueOnce(stmt2);

      const res = await request(app).post('/api/trainers/1/reviews')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ bookingID: 1, rating: 5 });
      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/already exists/i);
    });

    test('successfully submits review', async () => {
      // Mock completed booking exists
      const stmt1 = { get: jest.fn().mockReturnValue({ bookingID: 1, status: 'completed' }) };
      // Mock no existing review
      const stmt2 = { get: jest.fn().mockReturnValue(undefined) };
      // Mock insert review
      const stmt3 = { run: jest.fn().mockReturnValue({ lastInsertRowid: 100 }) };
      
      db.prepare.mockReturnValueOnce(stmt1).mockReturnValueOnce(stmt2).mockReturnValueOnce(stmt3);

      const res = await request(app).post('/api/trainers/1/reviews')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ bookingID: 1, rating: 5, reviewText: 'Great!' });
      expect(res.status).toBe(201);
      expect(res.body.data.reviewID).toBe(100);
    });
  });

  describe('GET /api/trainers/:id/reviews', () => {
    test('returns approved reviews', async () => {
      mockPrepare([{ reviewID: 1, rating: 5, status: 'approved' }], 'all');
      
      const res = await request(app).get('/api/trainers/1/reviews');
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.total).toBe(1);
    });
  });

  describe('PATCH /api/trainers/reviews/:reviewID/moderate', () => {
    test('requires admin', async () => {
      const res = await request(app).patch('/api/trainers/reviews/1/moderate')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ status: 'hidden' });
      expect(res.status).toBe(403);
    });

    test('updates review status', async () => {
      // Mock find review
      const stmt1 = { get: jest.fn().mockReturnValue({ reviewID: 1 }) };
      // Mock update
      const stmt2 = { run: jest.fn() };
      db.prepare.mockReturnValueOnce(stmt1).mockReturnValueOnce(stmt2);

      const res = await request(app).patch('/api/trainers/reviews/1/moderate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'hidden' });
      expect(res.status).toBe(200);
    });
  });
});
