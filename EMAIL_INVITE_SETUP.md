# Email Invite Feature: Setup, Testing, and Production Guide

## 1. Overview
This document details the invite system implementation, configuration, API flows, and integration instructions for the standup-backend project. It covers both admin and member/invitee scenarios, with honest, complete guidance for frontend and developer onboarding.

---

## 2. What Has Been Implemented
- **Invite Model & Service:**
  - Mongoose schema for invites (team, email, role, status, token, etc.)
  - Service logic for sending, resending, tracking, accepting, and declining invites
- **Provider-based Email System:**
  - Nodemailer provider for SMTP (Mailtrap for local/testing)
  - Easily swappable for other providers (SendGrid, SES, etc.)
- **Controller & API Endpoints:**
  - Admin endpoints (JWT protected): send, list, resend, revoke
  - Public endpoints: verify, accept, decline (no JWT required)
- **JWT Authentication:**
  - JWT guard for admin endpoints only
- **.env Configuration:**
  - All SMTP and app settings in `.env` for easy management
- **Testing Support:**
  - Mailtrap setup for safe local email testing
  - Fallback userId for local testing if JWT is not present

---

## 3. API Flows, Curl Examples, and Responses

### 1. Send Invites (Admin Only)
**Purpose:** Admin sends invites to users.
```
curl -X POST http://localhost:3000/invites/send \

  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_JWT>" \
  -d '{
    "teamId": "<TEAM_ID>",
    "invites": [
      { "email": "invitee1@example.com", "role": "member" },
      { "email": "invitee2@example.com", "role": "admin" }
    ]
  }'
```
**Response:**
```json
{
  "success": true,
  "data": { "sent": 2, "failed": [] }
}
```
If any invite fails:
```json
{
  "success": true,
  "data": { "sent": 1, "failed": ["invitee2@example.com: Already a team member"] }
}
```

---

### 2. List Team Invites (Admin Only)
**Purpose:** Admin lists all invites for their team.
```
curl -X GET http://localhost:3000/invites/team/<TEAM_ID> \
  -H "Authorization: Bearer <ADMIN_JWT>"
```
**Response:**
```json
{
  "success": true,
  "data": [
    { "email": "invitee1@example.com", "role": "member", "status": "PENDING", ... },
    { "email": "invitee2@example.com", "role": "admin", "status": "ACCEPTED", ... }
  ]
}
```

---

### 3. Resend Invite (Admin Only)
**Purpose:** Admin resends an invite email.
```
curl -X POST http://localhost:3000/invites/resend \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_JWT>" \
  -d '{ "inviteId": "<INVITE_ID>" }'
```
**Response:**
```json
{ "success": true }
```

---

### 4. Revoke Invite (Admin Only)
**Purpose:** Admin revokes an invite.
```
curl -X POST http://localhost:3000/invites/revoke \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_JWT>" \
  -d '{ "inviteId": "<INVITE_ID>" }'
```
**Response:**
```json
{ "success": true }
```

---

### 5. Verify Invite (User/Invitee)
**Purpose:** Invitee checks if their invite is valid (public, no JWT required).
```
curl -X GET "http://localhost:3000/invites/verify?token=<INVITE_TOKEN>"
```
**Response:**
```json
{
  "success": true,
  "data": { "email": "invitee1@example.com", "role": "member", "status": "PENDING", ... }
}
```
If token is invalid/expired:
```json
{ "success": false, "message": "Invalid or expired invite token." }
```

---

### 6. Accept Invite (User/Invitee)
**Purpose:** Invitee accepts the invite (public, no JWT required).
```
curl -X POST http://localhost:3000/invites/accept \
  -H "Content-Type: application/json" \
  -d '{ "token": "<INVITE_TOKEN>" }'
```
**Response:**
```json
{ "success": true, "message": "Invite accepted. Please create an account." }
```
If token is invalid/expired:
```json
{ "success": false, "message": "Invalid or expired invite token." }
```

---

### 7. Decline Invite (User/Invitee)
**Purpose:** Invitee declines the invite (public, no JWT required).
```
curl -X POST http://localhost:3000/invites/decline \
  -H "Content-Type: application/json" \
  -d '{ "token": "<INVITE_TOKEN>" }'
```
**Response:**
```json
{ "success": true }
```
If token is invalid/expired:
```json
{ "success": false, "message": "Invalid or expired invite token." }
```

---

## 4. Local Testing Instructions
- Use Mailtrap credentials in `.env`:
  ```
  EMAIL_HOST=sandbox.smtp.mailtrap.io
  EMAIL_PORT=2525
  EMAIL_USER=<your_mailtrap_username>
  EMAIL_PASS=<your_mailtrap_password>
  EMAIL_FROM=<yourname@demomailtrap.co>
  APP_NAME=standup-backend
  FRONTEND_URL=http://localhost:3001
  ```
- Start backend and send invites via API or Postman/curl.
- Check Mailtrap inbox for received emails.
- For local testing without JWT, fallback userId is used for admin endpoints.

---

## 5. Frontend Integration Instructions
- **Admin Actions:** Require JWT in the `Authorization` header.
- **Invitee Actions:** Accept/decline/verify endpoints are public; only the invite token is needed.
- **Account Creation:** After accepting an invite, prompt the user to create an account. Once created, associate the invite with the new user.
- **Error Handling:** Always check for `success: false` and display the `message` to the user.

---

## 6. Security Notes
- Only admins can manage invites for their teams.
- Invite tokens are unique and expire after a set period (e.g., 7 days).
- Public endpoints validate tokens and do not expose sensitive data.

---

## 7. Contact/Support
For further help, contact the backend maintainer or refer to this doc for setup and troubleshooting.
