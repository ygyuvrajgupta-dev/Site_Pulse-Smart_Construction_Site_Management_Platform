import jwt from 'jsonwebtoken';

/**
 * Generate a JWT access token.
 * Short-lived (15 minutes) for API authentication.
 *
 * @param {string} userId - User ID to encode in token
 * @param {string} companyId - Company ID for tenant scoping
 * @param {string} role - User role slug
 * @returns {string} Signed JWT token
 */
export function generateAccessToken(userId, companyId, role) {
  return jwt.sign(
    { id: userId, companyId, role, type: 'access' },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
}

/**
 * Generate a JWT refresh token.
 * Long-lived (7 days) stored in database and secure cookie.
 *
 * @param {string} userId - User ID to encode in token
 * @returns {string} Signed JWT refresh token
 */
export function generateRefreshToken(userId) {
  return jwt.sign(
    { id: userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * Verify and decode an access token.
 *
 * @param {string} token - JWT token to verify
 * @returns {object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
export function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

/**
 * Verify and decode a refresh token.
 *
 * @param {string} token - JWT refresh token to verify
 * @returns {object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
export function verifyRefreshToken(token) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
}