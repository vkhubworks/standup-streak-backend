import { Invite, InviteSchema, InviteStatus } from './invite.model';
import { Types, model, Model } from 'mongoose';

describe('Invite Model', () => {
  let InviteModel: Model<Invite>;

  beforeAll(() => {
    InviteModel = model<Invite>('Invite', InviteSchema);
  });

  it('should create an invite with required fields', () => {
    const invite = new InviteModel({
      teamId: new Types.ObjectId(),
      invitedBy: new Types.ObjectId(),
      email: 'test@example.com',
      token: 'sometoken',
      status: InviteStatus.PENDING,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
    });
    expect(invite.email).toBe('test@example.com');
    expect(invite.status).toBe(InviteStatus.PENDING);
    expect(invite.token).toBe('sometoken');
    expect(invite.teamId).toBeDefined();
    expect(invite.invitedBy).toBeDefined();
    expect(invite.expiresAt).toBeInstanceOf(Date);
  });

  it('should default status to PENDING', () => {
    const invite = new InviteModel({
      teamId: new Types.ObjectId(),
      invitedBy: new Types.ObjectId(),
      email: 'test2@example.com',
      token: 'othertoken',
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
    });
    expect(invite.status).toBe(InviteStatus.PENDING);
  });

  it('should require email, token, teamId, invitedBy, expiresAt', () => {
    const invite = new InviteModel({});
    const error = invite.validateSync();
    expect(error).not.toBeNull();
    if (error) {
      expect(error.errors['email']).toBeDefined();
      expect(error.errors['token']).toBeDefined();
      expect(error.errors['teamId']).toBeDefined();
      expect(error.errors['invitedBy']).toBeDefined();
      expect(error.errors['expiresAt']).toBeDefined();
    }
  });
});
