import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from './app.js';
import { createMemoryStore } from './store.js';

let app;

beforeEach(() => {
  app = createApp({ store: createMemoryStore() });
});

describe('GET /health', () => {
  it('answers 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

describe('POST /api/students', () => {
    it('creates a student with no scores', async () => {
        const res = await request(app)
        .post('/api/students')
        .send({name: 'Ada'});

        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({ name: 'Ada', scores: [] });
        expect(res.body).toHaveProperty('id');

    });
});

describe('GET /api/students', () => {
    it('starts with no students', async () => {
        const res = await request(app).get('/api/students');
        expect(res.body).toEqual([]);
    });
});

describe('GET /api/students/:id', () => {
    it('reports the average and the letter', async () => {
        const created = await request(app).post('/api/students').send({ name: 'Ada' });
        const id = created.body.id;

        await request(app).post(`/api/students/${id}/scores`).send({ score: 90 });
        await request(app).post(`/api/students/${id}/scores`).send({ score: 85 });
        await request(app).post(`/api/students/${id}/scores`).send({ score: 88 });

        const res = await request(app).get(`/api/students/${id}`);
        expect(res.status).toBe(200);
        expect(res.body.scores).toEqual([90, 85, 88]);
        expect(res.body.average).toBeCloseTo(87.67, 2);
        expect(res.body.letter).toBe('B');
    });
});

describe('error responses', () => {
    it('refuses a score over 100', async () => {
        const created = await request(app).post('/api/students').send({ name: 'Ada' });

        const res = await request(app)
            .post(`/api/students/${created.body.id}/scores`)
            .send({ score: 105 });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error');
    });

