process.env.JWT_SECRET = 'secret';

const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('../src/config/db', () => ({
  query: jest.fn(),
  connect: jest.fn(),
}));

jest.mock('../src/config/initDb', () => jest.fn());

const pool = require('../src/config/db');
const app = require('../src/index');

const memberToken = jwt.sign({ id: 1, role: 'member' }, 'secret');
const adminToken = jwt.sign({ id: 99, role: 'admin' }, 'secret');
const badToken = jwt.sign({ id: 2, role: 'member' }, 'wrong-secret');

const dbResult = (rows = [], rowCount = rows.length) => ({ rows, rowCount });

function mockQueries(...results) {
  results.forEach((result) => {
    pool.query.mockResolvedValueOnce(result);
  });
}

function mockClient(...results) {
  const client = {
    query: jest.fn(),
    release: jest.fn(),
  };
  results.forEach((result) => client.query.mockResolvedValueOnce(result));
  pool.connect.mockResolvedValue(client);
  return client;
}

beforeEach(() => {
  pool.query.mockReset();
  pool.connect.mockReset();
});

describe('app basics and auth middleware', () => {
  test('GET /health returns service details', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok', service: 'course-trainer-service' });
  });

  test('unknown routes return 404', async () => {
    const res = await request(app).get('/missing');
    expect(res.status).toBe(404);
  });

  test('protected routes reject missing, invalid, and non-admin tokens', async () => {
    let res = await request(app).post('/api/courses').send({});
    expect(res.status).toBe(401);

    res = await request(app).post('/api/courses').set('Authorization', `Bearer ${badToken}`).send({});
    expect(res.status).toBe(403);

    res = await request(app).post('/api/courses').set('Authorization', `Bearer ${memberToken}`).send({});
    expect(res.status).toBe(403);
  });
});

describe('course routes', () => {
  test('lists published courses with filters', async () => {
    mockQueries(dbResult([{ courseID: 1, courseName: 'Yoga' }]));
    const res = await request(app).get('/api/courses?fitnessLevel=beginner&courseType=yoga');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(pool.query.mock.calls[0][1]).toEqual(['beginner', 'yoga']);
  });

  test('lists admin courses', async () => {
    mockQueries(dbResult([{ courseID: 2, status: 'unpublished' }]));
    const res = await request(app)
      .get('/api/courses/admin/all?courseType=spin')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data[0].status).toBe('unpublished');
  });

  test('gets one course and handles not found', async () => {
    mockQueries(dbResult([{ courseID: 1 }]), dbResult([], 0));
    let res = await request(app).get('/api/courses/1');
    expect(res.status).toBe(200);

    res = await request(app).get('/api/courses/999');
    expect(res.status).toBe(404);
  });

  test('creates course and validates required fields', async () => {
    let res = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ courseName: 'Incomplete' });
    expect(res.status).toBe(400);

    mockQueries(dbResult([{ courseID: 10 }]));
    res = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        courseName: 'CrossFit',
        schedule: '2026-05-01 08:00',
        instructor: 'Maria',
        maxAttendees: 12,
        courseType: 'CrossFit',
        fitnessLevel: 'advanced',
      });
    expect(res.status).toBe(201);
    expect(res.body.data.courseID).toBe(10);
  });

  test('updates, deletes, publishes, cancels, and undoes cancellation', async () => {
    mockQueries(
      dbResult([{ exists: 1 }], 1),
      dbResult([], 1),
      dbResult([], 1),
      dbResult([], 1),
      dbResult([], 1),
      dbResult([{ status: 'cancelled' }], 1),
      dbResult([], 1)
    );

    let res = await request(app)
      .put('/api/courses/1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ courseName: 'Yoga', schedule: '2026-05-01', instructor: 'A', maxAttendees: 10, courseType: 'Yoga', fitnessLevel: 'beginner' });
    expect(res.status).toBe(200);

    res = await request(app).delete('/api/courses/1').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);

    res = await request(app).patch('/api/courses/1/publish').set('Authorization', `Bearer ${adminToken}`).send({ status: 'published' });
    expect(res.status).toBe(200);

    res = await request(app).patch('/api/courses/1/cancel').set('Authorization', `Bearer ${adminToken}`).send({ cancelReason: 'Weather' });
    expect(res.status).toBe(200);

    res = await request(app).patch('/api/courses/1/undo-cancel').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  test('handles course admin error branches', async () => {
    mockQueries(dbResult([], 0), dbResult([], 0), dbResult([], 0), dbResult([], 1));

    let res = await request(app).put('/api/courses/404').set('Authorization', `Bearer ${adminToken}`).send({});
    expect(res.status).toBe(404);

    res = await request(app).delete('/api/courses/404').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);

    res = await request(app).patch('/api/courses/1/publish').set('Authorization', `Bearer ${adminToken}`).send({ status: 'bad' });
    expect(res.status).toBe(400);

    res = await request(app).patch('/api/courses/1/cancel').set('Authorization', `Bearer ${adminToken}`).send({});
    expect(res.status).toBe(400);
  });

  test('enrolls, rejects duplicate/full/conflict, cancels enrollment, and lists mine', async () => {
    let client = mockClient(
      dbResult([{ courseID: 1, currentAttendees: 1, maxAttendees: 2, schedule: '2026-05-01 08:00' }], 1),
      dbResult([], 0),
      dbResult([], 0),
      dbResult([], 0),
      dbResult([], 1),
      dbResult([], 1),
      dbResult([], 0)
    );
    let res = await request(app).post('/api/courses/enroll').set('Authorization', `Bearer ${memberToken}`).send({ courseID: 1 });
    expect(res.status).toBe(201);
    expect(client.release).toHaveBeenCalled();

    mockClient(dbResult([], 0));
    res = await request(app).post('/api/courses/enroll').set('Authorization', `Bearer ${memberToken}`).send({ courseID: 999 });
    expect(res.status).toBe(404);

    mockClient(dbResult([{ courseID: 1, currentAttendees: 10, maxAttendees: 10 }], 1));
    res = await request(app).post('/api/courses/enroll').set('Authorization', `Bearer ${memberToken}`).send({ courseID: 1 });
    expect(res.status).toBe(409);

    mockClient(dbResult([{ courseID: 1, currentAttendees: 0, maxAttendees: 10, schedule: '2026-05-01' }], 1), dbResult([{ exists: 1 }], 1));
    res = await request(app).post('/api/courses/enroll').set('Authorization', `Bearer ${memberToken}`).send({ courseID: 1 });
    expect(res.status).toBe(409);

    mockClient(dbResult([{ courseID: 1, currentAttendees: 0, maxAttendees: 10, schedule: '2026-05-01' }], 1), dbResult([], 0), dbResult([{ enrollmentID: 4 }], 1));
    res = await request(app).post('/api/courses/enroll').set('Authorization', `Bearer ${memberToken}`).send({ courseID: 1 });
    expect(res.status).toBe(409);

    client = mockClient(dbResult([{ enrollmentID: 7 }], 1), dbResult([], 0), dbResult([], 1), dbResult([], 1));
    res = await request(app).post('/api/courses/enroll/cancel').set('Authorization', `Bearer ${memberToken}`).send({ courseID: 1 });
    expect(res.status).toBe(200);
    expect(client.query).toHaveBeenCalledWith('COMMIT');

    mockQueries(dbResult([{ enrollmentID: 7, courseName: 'Yoga' }]));
    res = await request(app).get('/api/courses/my/enrollments').set('Authorization', `Bearer ${memberToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data[0].courseName).toBe('Yoga');
  });

  test('returns course attendance report', async () => {
    mockQueries(dbResult([{ enrollmentID: 1 }], 1));
    const res = await request(app).get('/api/courses/1/attendance').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
  });
});

describe('trainer routes', () => {
  test('lists trainers and trainer profile with stats', async () => {
    mockQueries(
      dbResult([{ trainerID: 1, name: 'Alex' }]),
      dbResult([{ dayOfWeek: 'Monday' }]),
      dbResult([{ avgRating: '4.5', reviewCount: 2 }]),
      dbResult([{ trainerID: 1, name: 'Alex' }], 1),
      dbResult([]),
      dbResult([{ avgRating: null, reviewCount: 0 }])
    );

    let res = await request(app).get('/api/trainers?expertise=Yoga');
    expect(res.status).toBe(200);
    expect(res.body.data[0].avgRating).toBe(4.5);

    res = await request(app).get('/api/trainers/1');
    expect(res.status).toBe(200);
    expect(res.body.data.avgRating).toBe(0);
  });

  test('admin trainer CRUD and schedule update', async () => {
    mockQueries(dbResult([{ trainerID: 3 }]), dbResult([], 1), dbResult([], 1));

    let res = await request(app)
      .post('/api/trainers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'New Trainer', expertise: 'Boxing' });
    expect(res.status).toBe(201);

    res = await request(app)
      .put('/api/trainers/3')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Alex', expertise: 'Yoga' });
    expect(res.status).toBe(200);

    res = await request(app).delete('/api/trainers/3').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  test('admin trainer list, not-found branches, and validation', async () => {
    mockQueries(
      dbResult([{ trainerID: 2, name: 'Beth' }]),
      dbResult([{ dayOfWeek: 'Tuesday' }]),
      dbResult([], 0),
      dbResult([], 0),
      dbResult([], 0)
    );

    let res = await request(app)
      .get('/api/trainers/admin/all?expertise=Strength')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data[0].availability).toHaveLength(1);

    res = await request(app).get('/api/trainers/404');
    expect(res.status).toBe(404);

    res = await request(app)
      .post('/api/trainers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ expertise: 'Boxing' });
    expect(res.status).toBe(400);

    res = await request(app)
      .put('/api/trainers/404')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Nope', expertise: 'Boxing' });
    expect(res.status).toBe(404);

    res = await request(app).delete('/api/trainers/404').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });

  test('book trainer success and conflict branches', async () => {
    mockQueries(
      dbResult([{ ok: 1 }], 1),
      dbResult([], 0),
      dbResult([], 0),
      dbResult([{ bookingID: 8 }], 1)
    );
    let res = await request(app)
      .post('/api/trainers/book')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ trainerID: 1, sessionDate: '2026-05-01', sessionTime: '09:00' });
    expect(res.status).toBe(201);

    res = await request(app).post('/api/trainers/book').set('Authorization', `Bearer ${memberToken}`).send({ trainerID: 1 });
    expect(res.status).toBe(400);

    mockQueries(dbResult([], 0));
    res = await request(app)
      .post('/api/trainers/book')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ trainerID: 99, sessionDate: '2026-05-01', sessionTime: '09:00' });
    expect(res.status).toBe(404);

    mockQueries(dbResult([{ ok: 1 }], 1), dbResult([{ bookingID: 1 }], 1));
    res = await request(app)
      .post('/api/trainers/book')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ trainerID: 1, sessionDate: '2026-05-01', sessionTime: '09:00' });
    expect(res.status).toBe(409);

    mockQueries(dbResult([{ ok: 1 }], 1), dbResult([], 0), dbResult([{ bookingID: 2 }], 1));
    res = await request(app)
      .post('/api/trainers/book')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ trainerID: 1, sessionDate: '2026-05-01', sessionTime: '09:00' });
    expect(res.status).toBe(409);
  });

  test('lists my bookings', async () => {
    mockQueries(dbResult([{ bookingID: 1, trainerName: 'Alex' }]));
    const res = await request(app).get('/api/trainers/my/bookings').set('Authorization', `Bearer ${memberToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data[0].trainerName).toBe('Alex');
  });
});

describe('trainer controller direct coverage', () => {
  test('updates trainer schedule with availability slots', async () => {
    const { updateTrainerSchedule } = require('../src/controllers/trainerController');
    const client = mockClient(dbResult([], 0), dbResult([], 0), dbResult([], 1), dbResult([], 0));
    const req = {
      params: { id: '3' },
      body: { availability: [{ dayOfWeek: 'Monday', startTime: '09:00', endTime: '10:00' }] },
    };
    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    await updateTrainerSchedule(req, res);

    expect(client.query).toHaveBeenCalledWith('BEGIN');
    expect(client.query).toHaveBeenCalledWith('COMMIT');
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Schedule updated' });
  });

  test('rolls back trainer schedule update errors', async () => {
    const { updateTrainerSchedule } = require('../src/controllers/trainerController');
    const client = {
      query: jest.fn()
        .mockResolvedValueOnce(dbResult([], 0))
        .mockRejectedValueOnce(new Error('db down'))
        .mockResolvedValueOnce(dbResult([], 0)),
      release: jest.fn(),
    };
    pool.connect.mockResolvedValue(client);
    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    await updateTrainerSchedule({ params: { id: '3' }, body: { availability: [] } }, res);

    expect(client.query).toHaveBeenCalledWith('ROLLBACK');
    expect(res.status).toHaveBeenCalledWith(500);
    expect(client.release).toHaveBeenCalled();
  });
});

describe('review routes', () => {
  test('submits, updates, lists, and checks reviews', async () => {
    mockQueries(
      dbResult([{ ok: 1 }], 1),
      dbResult([], 0),
      dbResult([{ reviewID: 5 }], 1),
      dbResult([{ reviewID: 5 }], 1),
      dbResult([{ reviewID: 5 }], 1),
      dbResult([], 1),
      dbResult([{ reviewID: 5, rating: 5 }]),
      dbResult([{ averageRating: '5.0', totalReviews: 1 }]),
      dbResult([{ rating: 5, count: 1 }]),
      dbResult([{ reviewID: 5 }])
    );

    let res = await request(app).post('/api/trainers/1/reviews').set('Authorization', `Bearer ${memberToken}`).send({ rating: 5, comment: 'Great' });
    expect(res.status).toBe(201);

    res = await request(app).post('/api/trainers/1/reviews').set('Authorization', `Bearer ${memberToken}`).send({ rating: 4 });
    expect(res.status).toBe(200);

    res = await request(app).get('/api/trainers/1/reviews');
    expect(res.status).toBe(200);
    expect(res.body.data.totalReviews).toBe(1);

    res = await request(app).get('/api/trainers/1/my-review').set('Authorization', `Bearer ${memberToken}`);
    expect(res.status).toBe(200);
  });

  test('review validation and admin moderation', async () => {
    let res = await request(app).post('/api/trainers/1/reviews').set('Authorization', `Bearer ${memberToken}`).send({});
    expect(res.status).toBe(400);

    res = await request(app).post('/api/trainers/1/reviews').set('Authorization', `Bearer ${memberToken}`).send({ rating: 6 });
    expect(res.status).toBe(400);

    mockQueries(dbResult([], 0));
    res = await request(app).post('/api/trainers/99/reviews').set('Authorization', `Bearer ${memberToken}`).send({ rating: 5 });
    expect(res.status).toBe(404);

    mockQueries(dbResult([{ reviewID: 1 }]), dbResult([], 1), dbResult([], 1), dbResult([], 0));
    res = await request(app).get('/api/trainers/1/reviews/admin').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);

    res = await request(app).delete('/api/trainers/reviews/1').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);

    res = await request(app).patch('/api/trainers/reviews/1/flag').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);

    res = await request(app).delete('/api/trainers/reviews/404').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });
});
