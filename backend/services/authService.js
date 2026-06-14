import prisma from '../config/database.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { signToken } from '../utils/jwt.js';
import { AppError } from '../utils/helpers.js';
import { logActivity } from '../utils/movementLogger.js';

export async function registerUser(data) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new AppError('Email already registered', 409);

  const password = await hashPassword(data.password);
  const user = await prisma.user.create({
    data: { email: data.email, password, name: data.name },
    select: { id: true, email: true, name: true, createdAt: true },
  });

  const token = signToken({ userId: user.id });
  return { user, token };
}

export async function loginUser(data) {
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) throw new AppError('Invalid credentials', 401);

  const valid = await comparePassword(data.password, user.password);
  if (!valid) throw new AppError('Invalid credentials', 401);
  if (!user.isActive) throw new AppError('Account is inactive', 403);

  await logActivity({
    userId: user.id,
    action: 'LOGIN',
    module: 'auth',
    details: 'User logged in',
  });

  const token = signToken({ userId: user.id });
  return {
    user: { id: user.id, email: user.email, name: user.name },
    token,
  };
}

export async function getProfile(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, createdAt: true },
  });
  if (!user) throw new AppError('User not found', 404);
  return user;
}
