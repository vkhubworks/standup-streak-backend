import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

// Replace these with real values from your test DB/setup
const ADMIN_JWT = 'your_admin_jwt';
const USER_JWT = 'your_user_jwt';
const TEAM_ID = 'your_team_id';
let INVITE_ID = '';
let INVITE_TOKEN = '';

describe('Invite API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('should send invites', async () => {
    const res = await request(app.getHttpServer())
      .post('/invites/send')
      .set('Authorization', `Bearer ${ADMIN_JWT}`)
      .send({
        teamId: TEAM_ID,
        invites: [
          { email: 'invitee1@example.com', role: 'member' },
          { email: 'invitee2@example.com', role: 'admin' },
        ],
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    // Save inviteId/token for next tests
    INVITE_ID = res.body.data.invites[0]?._id || '';
    INVITE_TOKEN = res.body.data.invites[0]?.token || '';
  });

  it('should list team invites', async () => {
    const res = await request(app.getHttpServer())
      .get(`/invites/team/${TEAM_ID}`)
      .set('Authorization', `Bearer ${ADMIN_JWT}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should resend invite', async () => {
    const res = await request(app.getHttpServer())
      .post('/invites/resend')
      .set('Authorization', `Bearer ${ADMIN_JWT}`)
      .send({ inviteId: INVITE_ID });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should verify invite', async () => {
    const res = await request(app.getHttpServer())
      .get(`/invites/verify?token=${INVITE_TOKEN}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should accept invite', async () => {
    const res = await request(app.getHttpServer())
      .post('/invites/accept')
      .set('Authorization', `Bearer ${USER_JWT}`)
      .send({ token: INVITE_TOKEN });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should decline invite', async () => {
    const res = await request(app.getHttpServer())
      .post('/invites/decline')
      .send({ token: INVITE_TOKEN });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should revoke invite', async () => {
    const res = await request(app.getHttpServer())
      .post('/invites/revoke')
      .set('Authorization', `Bearer ${ADMIN_JWT}`)
      .send({ inviteId: INVITE_ID });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  afterAll(async () => {
    await app.close();
  });
});
