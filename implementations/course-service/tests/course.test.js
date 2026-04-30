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

// Helper: make db.prepare().get/all/run return mock values
const mockPrepare = (returnVal, method = 'get') => {
  const stmt = { get: jest.fn(), all: jest.fn(), run: jest.fn() };
  stmt[method].mockReturnValue(returnVal);
  db.prepare.mockReturnValue(stmt);
  return stmt;
};

beforeEach(() => jest.clearAllMocks());

// ─────────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────────
describe('GET /health', () => {
  test('returns ok with Postgres info', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.db).toBe('Postgres (Supabase)');
  });
});

// ─────────────────────────────────────────────
// COURSES
// ─────────────────────────────────────────────
describe('GET /api/courses', () => {
  test('returns published courses', async () => {
    const stmt = { all: jest.fn().mockReturnValue([{ courseID: 1, courseName: 'Yoga', status: 'published' }]) };
    db.prepare.mockReturnValue(stmt);

    const res = await request(app).get('/api/courses');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
  });
});

describe('GET /api/courses/:id', () => {
  test('returns course by ID', async () => {
    mockPrepare({ courseID: 1, courseName: 'Yoga' }, 'get');
    const res = await request(app).get('/api/courses/1');
    expect(res.status).toBe(200);
    expect(res.body.data.courseID).toBe(1);
  });

  test('returns 404 when not found', async () => {
    mockPrepare(undefined, 'get');
    const res = await request(app).get('/api/courses/999');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/courses (admin)', () => {
  test('creates course successfully', async () => {
    const stmt = { run: jest.fn().mockReturnValue({ lastInsertRowid: 5 }) };
    db.prepare.mockReturnValue(stmt);

    const res = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ courseName: 'CrossFit', schedule: '2026-04-01 08:00', instructor: 'Maria', maxAttendees: 12, courseType: 'CrossFit', fitnessLevel: 'advanced' });

    expect(res.status).toBe(201);
    expect(res.body.data.courseID).toBe(5);
  });

  test('rejects missing fields', async () => {
    const res = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ courseName: 'Incomplete' });
    expect(res.status).toBe(400);
  });

  test('rejects non-admin', async () => {
    const res = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({});
    expect(res.status).toBe(403);
  });

  test('rejects unauthenticated', async () => {
    const res = await request(app).post('/api/courses').send({});
    expect(res.status).toBe(401);
  });
});

describe('PATCH /api/courses/:id/cancel — req 1.6.6', () => {
  test('cancels course with reason', async () => {
    const getStmt = { get: jest.fn().mockReturnValue({ courseID: 1 }) };
    const runStmt = { run: jest.fn() };
    db.prepare.mockReturnValueOnce(getStmt).mockReturnValueOnce(runStmt);

    const res = await request(app)
      .patch('/api/courses/1/cancel')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ cancelReason: 'Instructor sick' });
    expect(res.status).toBe(200);
  });

  test('rejects cancellation without reason — req 1.6.6', async () => {
    const res = await request(app)
      .patch('/api/courses/1/cancel')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/reason/i);
  });
});

describe('POST /api/courses/enroll', () => {
  test('requires authentication', async () => {
    const res = await request(app).post('/api/courses/enroll').send({ courseID: 1 });
    expect(res.status).toBe(401);
  });

  test('returns 404 when course not found', async () => {
    mockPrepare(undefined, 'get');
    const res = await request(app)
      .post('/api/courses/enroll')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ courseID: 999 });
    expect(res.status).toBe(404);
  });

  test('returns 409 when course is full — req 2.3.6', async () => {
    mockPrepare({ courseID: 1, maxAttendees: 10, currentAttendees: 10, schedule: '2026-04-05 07:00' }, 'get');
    const res = await request(app)
      .post('/api/courses/enroll')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ courseID: 1 });
    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/full/i);
  });
});

// ─────────────────────────────────────────────
// TRAINERS
// ─────────────────────────────────────────────
describe('GET /api/trainers', () => {
  test('returns active trainers', async () => {
    const allStmt = { all: jest.fn().mockReturnValue([{ trainerID: 1, name: 'Alex' }]) };
    const availStmt = { all: jest.fn().mockReturnValue([]) };
    db.prepare.mockReturnValueOnce(allStmt).mockReturnValue(availStmt);

    const res = await request(app).get('/api/trainers');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });
});

describe('GET /api/trainers/:id', () => {
  test('returns trainer with availability', async () => {
    const getStmt  = { get: jest.fn().mockReturnValue({ trainerID: 1, name: 'Alex' }) };
    const availStmt = { all: jest.fn().mockReturnValue([{ dayOfWeek: 'Monday' }]) };
    db.prepare.mockReturnValueOnce(getStmt).mockReturnValueOnce(availStmt);

    const res = await request(app).get('/api/trainers/1');
    expect(res.status).toBe(200);
    expect(res.body.data.availability).toHaveLength(1);
  });
});

describe('POST /api/trainers (admin)', () => {
  test('creates trainer', async () => {
    const stmt = { run: jest.fn().mockReturnValue({ lastInsertRowid: 4 }) };
    db.prepare.mockReturnValue(stmt);

    const res = await request(app)
      .post('/api/trainers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'New Trainer', expertise: 'Boxing' });
    expect(res.status).toBe(201);
  });

  test('rejects missing name', async () => {
    const res = await request(app)
      .post('/api/trainers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ expertise: 'Boxing' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/trainers/book', () => {
  test('requires authentication', async () => {
    const res = await request(app).post('/api/trainers/book')
      .send({ trainerID: 1, sessionDate: '2026-04-01', sessionTime: '09:00' });
    expect(res.status).toBe(401);
  });

  test('returns 400 when fields missing', async () => {
    const res = await request(app)
      .post('/api/trainers/book')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ trainerID: 1 });
    expect(res.status).toBe(400);
  });
});
