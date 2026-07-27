import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { hashPassword, comparePassword } from '../utils/hashPassword.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/generateToken.js';
import { AppError } from '../middleware/errorHandler.js';
import prisma from '../config/db.js';
import sendEmail from '../utils/sendEmail.js';

/**
 * @typedef {Object} AuthTokens
 * @property {string} accessToken
 * @property {string} refreshToken
 */

export async function login(email, password, rememberMe = false) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: true, employee: true },
  });

  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401);
  }

  if (user.status === 'PENDING_VERIFICATION') {
    throw new AppError('Please verify your email before logging in', 401);
  }
  if (user.status === 'SUSPENDED') {
    throw new AppError('Your account has been suspended', 401);
  }
  if (user.status === 'INACTIVE') {
    throw new AppError('Your account is inactive', 401);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const tokens = generateTokens(user);

  return {
    user: {
      id: user.id,
      companyId: user.companyId,
      email: user.email,
      name: user.name,
      role: user.role,
      employee: user.employee,
    },
    tokens,
  };
}

export async function loginPlatformOwner(email, password, rememberMe = false) {
  const platformOwner = await prisma.platformOwner.findUnique({
    where: { email },
  });

  if (!platformOwner) {
    throw new AppError('Invalid email or password', 401);
  }

  const isPasswordValid = await comparePassword(password, platformOwner.password);
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401);
  }

  if (!platformOwner.isActive) {
    throw new AppError('Your account has been deactivated', 401);
  }

  await prisma.platformOwner.update({
    where: { id: platformOwner.id },
    data: { lastLoginAt: new Date() },
  });

  const tokens = {
    accessToken: jwt.sign(
      { id: platformOwner.id, type: 'access', isPlatformOwner: true },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    ),
    refreshToken: jwt.sign(
      { id: platformOwner.id, type: 'refresh', isPlatformOwner: true },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    ),
  };

  return {
    user: {
      id: platformOwner.id,
      email: platformOwner.email,
      name: platformOwner.name,
      isPlatformOwner: true,
    },
    tokens,
  };
}

export async function register(userData) {
  const { email, password, name, companyId, roleId } = userData;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new AppError('User with this email already exists', 409);
  }

  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) {
    throw new AppError('Company not found', 404);
  }

  const hashedPassword = await hashPassword(password);

  const role = await prisma.role.findFirst({
    where: { companyId, slug: 'employee' },
  });

  const finalRoleId = roleId || role?.id;

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      companyId,
      roleId: finalRoleId,
      status: 'PENDING_VERIFICATION',
    },
    include: { role: true },
  });

  const tokens = generateTokens(user);

  // Send verification email asynchronously
  try {
    const verificationToken = crypto.randomBytes(32).toString('hex');
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken: verificationToken },
    });
    await sendEmail.sendEmailVerification(user.email, verificationToken);
  } catch (emailError) {
    console.error('Failed to send verification email:', emailError);
  }

  return {
    user: {
      id: user.id,
      companyId: user.companyId,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    tokens,
  };
}

function generateTokens(user) {
  const accessToken = generateAccessToken(user.id, user.companyId, user.role?.slug);
  const refreshToken = generateRefreshToken(user.id);
  return { accessToken, refreshToken };
}

export async function refreshTokens(refreshToken) {
  try {
    const decoded = verifyRefreshToken(refreshToken);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { role: true },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new AppError('Invalid refresh token', 401);
    }

    return generateTokens(user);
  } catch (error) {
    throw new AppError('Invalid or expired refresh token', 401);
  }
}

export async function logout() {
  return;
}

export async function forgotPassword(email) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { company: true },
  });

  if (!user) {
    return { resetToken: null };
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: resetToken,
      passwordResetExpires: resetTokenExpiry,
    },
  });

  // Send password reset email
  try {
    await sendEmail.sendPasswordResetEmail(user.email, resetToken);
  } catch (emailError) {
    console.error('Failed to send password reset email:', emailError);
  }

  return { resetToken, user };
}

export async function resetPassword(token, newPassword) {
  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: token,
      passwordResetExpires: { gt: new Date() },
    },
  });

  if (!user) {
    throw new AppError('Invalid or expired reset token', 400);
  }

  const hashedPassword = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null,
    },
  });
}

export async function changePassword(userId, currentPassword, newPassword) {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const isCurrentPasswordValid = await comparePassword(currentPassword, user.password);
  if (!isCurrentPasswordValid) {
    throw new AppError('Current password is incorrect', 400);
  }

  const hashedPassword = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });
}

export async function verifyEmail(token) {
  const user = await prisma.user.findFirst({
    where: { passwordResetToken: token },
  });

  if (!user) {
    throw new AppError('Invalid verification token', 400);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      status: 'ACTIVE',
      emailVerified: true,
      passwordResetToken: null,
      passwordResetExpires: null,
    },
  });
}