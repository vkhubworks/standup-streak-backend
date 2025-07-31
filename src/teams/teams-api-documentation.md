# Teams API Documentation

## Admin Onboarding Flow - Complete API Reference

### Base URL
```
http://localhost:3000/teams
```

### Authentication
All endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

---

## 1. Get Onboarding Progress

**Endpoint:** `GET /teams/onboarding/progress`

**Description:** Retrieves the current onboarding progress for the authenticated user.

**Response:**
```json
{
  "success": true,
  "data": {
    "step": 2,
    "data": {
      "name": "Engineering Team",
      "description": "Our awesome engineering team",
      "standupTime": "09:00",
      "timezone": "UTC-8",
      "reminderMinutes": 5,
      "memberEmails": ["john@example.com", "jane@example.com"],
      "punctualityGoal": 90,
      "engagementGoal": 85
    }
  }
}
```

**Notes:**
- `step`: 0-4 (0 = not started, 4 = all phases complete)
- `data`: Contains saved data from previous phases

---

## 2. Phase 1: Team Setup

**Endpoint:** `POST /teams/onboarding/phase1`

**Description:** Saves team name and description.

**Request Body:**
```json
{
  "name": "Engineering Team",
  "description": "Our awesome engineering team"
}
```

**Validation Rules:**
- `name`: Required, 3-50 characters
- `description`: Optional, max 500 characters

**Response:**
```json
{
  "success": true,
  "message": "Team setup saved successfully",
  "data": {
    "teamId": "507f1f77bcf86cd799439011"
  }
}
```

---

## 3. Phase 2: Schedule Configuration

**Endpoint:** `POST /teams/onboarding/phase2`

**Description:** Saves standup schedule configuration.

**Request Body:**
```json
{
  "standupTime": "09:00",
  "timezone": "UTC-8",
  "reminderMinutes": 5
}
```

**Validation Rules:**
- `standupTime`: Required, format "HH:MM"
- `timezone`: Required
- `reminderMinutes`: Required, must be 5, 10, 15, or 30

**Response:**
```json
{
  "success": true,
  "message": "Schedule configuration saved successfully",
  "data": {
    "success": true
  }
}
```

---

## 4. Phase 3: Team Members

**Endpoint:** `POST /teams/onboarding/phase3`

**Description:** Saves team member email addresses.

**Request Body:**
```json
{
  "memberEmails": [
    "john@example.com",
    "jane@example.com",
    "bob@example.com"
  ]
}
```

**Validation Rules:**
- `memberEmails`: Required array, at least 1 email
- Each email must be valid format
- Maximum 50 team members
- No duplicate emails allowed

**Response:**
```json
{
  "success": true,
  "message": "Team members saved successfully",
  "data": {
    "success": true,
    "existingUsers": 2,
    "pendingInvites": 1
  }
}
```

**Notes:**
- `existingUsers`: Number of emails that match existing users
- `pendingInvites`: Number of emails that need invitations

---

## 5. Phase 4: Goals & Targets

**Endpoint:** `POST /teams/onboarding/phase4`

**Description:** Saves team goals and targets.

**Request Body:**
```json
{
  "punctualityGoal": 90,
  "engagementGoal": 85
}
```

**Validation Rules:**
- `punctualityGoal`: Required, 70-100%
- `engagementGoal`: Required, 70-100%

**Response:**
```json
{
  "success": true,
  "message": "Goals and targets saved successfully",
  "data": {
    "success": true
  }
}
```

---

## 6. Complete Onboarding

**Endpoint:** `POST /teams/onboarding/complete`

**Description:** Finalizes the onboarding process and creates the team.

**Request Body:** None required

**Response:**
```json
{
  "success": true,
  "message": "Team setup completed successfully!",
  "data": {
    "teamId": "507f1f77bcf86cd799439011"
  }
}
```

**Notes:**
- All 4 phases must be completed before calling this endpoint
- Clears onboarding progress after successful completion

---

## 7. Get Team Details

**Endpoint:** `GET /teams/:teamId`

**Description:** Retrieves detailed team information.

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Engineering Team",
    "description": "Our awesome engineering team",
    "adminId": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "John Doe",
      "email": "john@example.com",
      "profile_picture": "https://..."
    },
    "members": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Jane Smith",
        "email": "jane@example.com",
        "profile_picture": "https://..."
      }
    ],
    "pendingInvites": ["bob@example.com"],
    "standupTime": "09:00",
    "timezone": "UTC-8",
    "reminderMinutes": 5,
    "punctualityGoal": 90,
    "engagementGoal": 85,
    "onboardingCompleted": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## 8. Get User's Teams

**Endpoint:** `GET /teams`

**Description:** Retrieves all teams where the user is admin or member.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Engineering Team",
      "description": "Our awesome engineering team",
      "adminId": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "onboardingCompleted": true,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

## Error Responses

### Validation Errors (400 Bad Request)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "name",
      "message": "Team name must be at least 3 characters long"
    }
  ]
}
```

### Not Found (404)
```json
{
  "success": false,
  "message": "Team not found"
}
```

### Unauthorized (401)
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

---

## Frontend Integration Guide

### 1. Resume Flow
```javascript
// Check if user has existing progress
const response = await fetch('/teams/onboarding/progress', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const { data } = await response.json();

if (data.step > 0) {
  // Resume from saved step
  setCurrentStep(data.step);
  setFormData(data.data);
}
```

### 2. Save Progress
```javascript
// Save each phase as user progresses
const savePhase = async (phase, data) => {
  const response = await fetch(`/teams/onboarding/phase${phase}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  return response.json();
};
```

### 3. Complete Setup
```javascript
// Finalize onboarding
const completeSetup = async () => {
  const response = await fetch('/teams/onboarding/complete', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const result = await response.json();
  
  if (result.success) {
    // Redirect to dashboard
    router.push('/dashboard');
  }
};
```

---

## Testing Examples

### Complete cURL Commands for All APIs

#### 1. Get Onboarding Progress
```bash
curl -X GET http://localhost:3000/teams/onboarding/progress \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "step": 2,
    "data": {
      "name": "Engineering Team",
      "description": "Our awesome engineering team",
      "standupTime": "09:00",
      "timezone": "UTC-8",
      "reminderMinutes": 5,
      "memberEmails": ["john@example.com", "jane@example.com"],
      "punctualityGoal": 90,
      "engagementGoal": 85
    }
  }
}
```

#### 2. Phase 1: Team Setup
```bash
curl -X POST http://localhost:3000/teams/onboarding/phase1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Engineering Team",
    "description": "Our awesome engineering team"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Team setup saved successfully",
  "data": {
    "teamId": "507f1f77bcf86cd799439011"
  }
}
```

#### 3. Phase 2: Schedule Configuration
```bash
curl -X POST http://localhost:3000/teams/onboarding/phase2 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "standupTime": "09:00",
    "timezone": "UTC-8",
    "reminderMinutes": 5
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Schedule configuration saved successfully",
  "data": {
    "success": true
  }
}
```

#### 4. Phase 3: Team Members
```bash
curl -X POST http://localhost:3000/teams/onboarding/phase3 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "memberEmails": [
      "john@example.com",
      "jane@example.com",
      "bob@example.com"
    ]
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Team members saved successfully",
  "data": {
    "success": true,
    "existingUsers": 2,
    "pendingInvites": 1
  }
}
```

#### 5. Phase 4: Goals & Targets
```bash
curl -X POST http://localhost:3000/teams/onboarding/phase4 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "punctualityGoal": 90,
    "engagementGoal": 85
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Goals and targets saved successfully",
  "data": {
    "success": true
  }
}
```

#### 6. Complete Onboarding
```bash
curl -X POST http://localhost:3000/teams/onboarding/complete \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "success": true,
  "message": "Team setup completed successfully!",
  "data": {
    "teamId": "507f1f77bcf86cd799439011"
  }
}
```

#### 7. Get User's Teams
```bash
curl -X GET http://localhost:3000/teams \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Engineering Team",
      "description": "Our awesome engineering team",
      "adminId": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "onboardingCompleted": true,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

#### 8. Get Team Details
```bash
curl -X GET http://localhost:3000/teams/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Engineering Team",
    "description": "Our awesome engineering team",
    "adminId": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "John Doe",
      "email": "john@example.com",
      "profile_picture": "https://..."
    },
    "members": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Jane Smith",
        "email": "jane@example.com",
        "profile_picture": "https://..."
      }
    ],
    "pendingInvites": ["bob@example.com"],
    "standupTime": "09:00",
    "timezone": "UTC-8",
    "reminderMinutes": 5,
    "punctualityGoal": 90,
    "engagementGoal": 85,
    "onboardingCompleted": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Error Response Examples

#### Validation Error (400 Bad Request)
```bash
curl -X POST http://localhost:3000/teams/onboarding/phase1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ab",
    "description": "Test"
  }'
```

**Response:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "name",
      "message": "Team name must be at least 3 characters long"
    }
  ]
}
```

#### Unauthorized (401)
```bash
curl -X GET http://localhost:3000/teams/onboarding/progress \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

#### Not Found (404)
```bash
curl -X GET http://localhost:3000/teams/nonexistent-id \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "success": false,
  "message": "Team not found"
}
```

### Complete Flow Example

Here's a complete example of the entire onboarding flow:

```bash
# 1. Get initial progress
curl -X GET http://localhost:3000/teams/onboarding/progress \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 2. Save Phase 1
curl -X POST http://localhost:3000/teams/onboarding/phase1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Engineering Team", "description": "Our team"}'

# 3. Save Phase 2
curl -X POST http://localhost:3000/teams/onboarding/phase2 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"standupTime": "09:00", "timezone": "UTC-8", "reminderMinutes": 5}'

# 4. Save Phase 3
curl -X POST http://localhost:3000/teams/onboarding/phase3 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"memberEmails": ["john@example.com", "jane@example.com"]}'

# 5. Save Phase 4
curl -X POST http://localhost:3000/teams/onboarding/phase4 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"punctualityGoal": 90, "engagementGoal": 85}'

# 6. Complete onboarding
curl -X POST http://localhost:3000/teams/onboarding/complete \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 7. Get the created team
curl -X GET http://localhost:3000/teams \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

This completes the end-to-end admin onboarding flow with all necessary APIs! 🚀 