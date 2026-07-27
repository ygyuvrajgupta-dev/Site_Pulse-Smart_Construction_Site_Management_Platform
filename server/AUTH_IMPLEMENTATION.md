# Site Pulse — Authentication Implementation

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Authentication Flow                     │
└─────────────────────────────────────────────────────────────┘

1. Login
   POST /api/v1/auth/login
   Body: { email, password, rememberMe? }
   → Validates credentials
   → Returns tokens in HTTP-only cookies
   → Sets accessToken (15min) + refreshToken (7d)

2. Token Refresh
   POST /api/v1/auth/refresh
   Cookie: refreshToken
   → Validates refresh token
   → Issues new access + refresh tokens
   → Updates cookies

3. Protected Request
   Authorization: Bearer <accessToken>
   OR Cookie: accessToken
   → Middleware validates token
   → Attaches user to req.user
   → Proceeds to controller

4. Logout
   POST /api/v1/auth/logout
   → Clears cookies
   → Client discards tokens
```

## Security Features

### Passwords
- **Hashing**: bcrypt with salt rounds = 12
- **Storage**: Never store plain text passwords
- **Validation**: Minimum 8 characters

### JWT Tokens
- **Access Token**: 15 minutes expiry
- **Refresh Token**: 7 days expiry
- **Secrets**: Separate secrets for access and refresh tokens
- **Payload**: `{ id, companyId, role, type, isPlatformOwner }`

### Cookies
- **HTTP-only**: Prevents XSS attacks
- **Secure**: HTTPS only in production
- **SameSite**: Strict mode
- **MaxAge**: Matches token expiry

### Session Management
- **Remember Me**: Extends refresh token to 30 days
- **Last Login**: Tracked on successful authentication
- **Status Checks**: PENDING_VERIFICATION, SUSPENDED, INACTIVE blocked

### Password Reset
- **Token**: 32-byte crypto random hex
- **Expiry**: 1 hour
- **Storage**: User.passwordResetToken + passwordResetExpires
- **Email**: Sent via nodemailer (async, non-blocking)

### Email Verification
- **Token**: Same as password reset flow
- **Status**: PENDING_VERIFICATION → ACTIVE
- **Email**: Sent on registration (async)

## Middleware

### protect
```
Usage: router.get('/profile', protect, controller)
```
- Extracts token from header or cookie
- Verifies JWT signature
- Loads user from database
- Attaches `req.user` with full user object
- Handles both regular users and platform owners

### optionalAuth
```
Usage: router.get('/public', optionalAuth, controller)
```
- Silently fails if no token
- Attaches user if valid
- Does not block request

### validateRefreshToken
```
Usage: router.post('/refresh', validateRefreshToken, controller)
```
- Validates refresh token from cookie
- Checks user is still active
- Attaches `req.user`

### authorize(...allowedRoles)
```
Usage: router.get('/admin', protect, authorize('admin', 'owner'), controller)
```
- Checks user role slug
- Platform owners bypass role checks
- Throws 403 if unauthorized

### requirePermission(...requiredPermissions)
```
Usage: router.post('/projects', protect, requirePermission('project:create'), controller)
```
- Loads user's role with permissions
- Checks all required permissions present
- Attaches `req.permissions` array

### resourceOwner
```
Usage: router.put('/companies/:id', protect, resourceOwner, controller)
```
- Ensures user from `req.user.companyId` matches resource
- Platform owners bypass
- Admins bypass

## API Endpoints

### Public Routes
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/auth/register` | POST | Register company + owner |
| `/api/v1/auth/login` | POST | Login user/platform owner |
| `/api/v1/auth/forgot-password` | POST | Request password reset |
| `/api/v1/auth/reset-password` | POST | Reset password with token |
| `/api/v1/auth/verify-email/:token` | GET | Verify email address |

### Protected Routes
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/auth/logout` | POST | Logout (clear cookies) |
| `/api/v1/auth/refresh` | POST | Refresh access token |
| `/api/v1/auth/change-password` | POST | Change password |
| `/api/v1/auth/me` | GET | Get current user profile |

## Role-Based Access Control

### Platform Owner
- `isPlatformOwner: true`
- Bypasses role checks
- Global access to all companies

### Company Roles
| Role | Slug | Permissions |
|------|------|-------------|
| Owner | owner | Full company access |
| Admin | admin | Manage users, projects, settings |
| Manager | manager | Create/edit projects, tasks |
| Employee | employee | View assigned work |
| Viewer | viewer | Read-only access |

### Permission Structure
```
permissions
  ├── project:create
  ├── project:read
  ├── project:update
  ├── project:delete
  ├── lead:create
  ├── lead:read
  ├── lead:update
  ├── lead:delete
  ├── client:create
  ├── client:read
  ├── client:update
  ├── client:delete
  ├── employee:create
  ├── employee:read
  ├── employee:update
  ├── employee:delete
  └── settings:manage
```

## Database Schema

### User Model Additions
```prisma
model User {
  passwordResetToken   String?
  passwordResetExpires DateTime?
}
```

### Platform Owner Model
```prisma
model PlatformOwner {
  id           String   @id @default(cuid())
  email        String   @unique
  password     String
  name         String
  phone        String?
  avatar       String?
  isActive     Boolean  @default(true)
  lastLoginAt  DateTime?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

## Configuration

### Environment Variables
```env
# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_REFRESH_EXPIRES_IN=7d

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@sitepulse.com

# Frontend
FRONTEND_URL=http://localhost:5173
```

### Package Dependencies
```json
{
  "dependencies": {
    "bcrypt": "^6.0.0",
    "jsonwebtoken": "^9.0.3",
    "express-validator": "^7.0.0",
    "nodemailer": "^7.0.0",
    "cookie-parser": "^1.4.7"
  }
}
```

## Error Handling

### Authentication Errors
| Status | Error | Description |
|--------|-------|-------------|
| 401 | `Not authorized` | Missing/invalid token |
| 401 | `Invalid email or password` | Login failed |
| 401 | `User not found or inactive` | Account status issue |
| 401 | `Please verify email` | PENDING_VERIFICATION |
| 401 | `Account suspended` | SUSPENDED status |
| 401 | `Invalid refresh token` | Refresh token expired/invalid |
| 403 | `No role assigned` | User has no role |
| 403 | `Insufficient permissions` | Role check failed |
| 400 | `Invalid reset token` | Password reset token invalid |

## Frontend Integration

### Login Request
```javascript
const response = await axios.post('/api/v1/auth/login', {
  email: 'user@example.com',
  password: 'password123',
  rememberMe: true
}, { withCredentials: true });

// Tokens automatically stored in HTTP-only cookies
const { user, tokens } = response.data;
```

### Authenticated Request
```javascript
// Option 1: With credentials (cookies)
axios.get('/api/v1/auth/me', { withCredentials: true });

// Option 2: With Bearer header
axios.get('/api/v1/users', {
  headers: { Authorization: `Bearer ${accessToken}` }
});
```

### Refresh Token
```javascript
// Auto-called by axios interceptor on 401
const response = await axios.post('/api/v1/auth/refresh', {}, { withCredentials: true });
const { accessToken } = response.data;
```

## Production Checklist

- [ ] Use strong JWT_SECRET (32+ random characters)
- [ ] Use separate JWT_REFRESH_SECRET
- [ ] Enable HTTPS (cookies secure)
- [ ] Configure email service (Gmail, SendGrid, etc.)
- [ ] Set NODE_ENV=production
- [ ] Enable rate limiting on auth routes
- [ ] Implement token blacklisting (Redis) for logout
- [ ] Add 2FA/MFA for enhanced security
- [ ] Monitor failed login attempts
- [ ] Set up password strength meter
- [ ] Implement account lockout after N failed attempts
- [ ] Add CORS whitelist for production domains
- [ ] Enable Helmet security headers
- [ ] Log all authentication events
- [ ] Implement CSRF protection