import { Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { User } from '../models/User.js';

/**
 * GET /api/admin/users
 * Query params: page, limit, search (name or email), role
 */
export const getUsers = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  const search = (req.query.search as string | undefined)?.trim();
  const role = req.query.role as string | undefined;

  const filter: Record<string, any> = {};

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  if (role && ['customer', 'admin', 'vendor'].includes(role)) {
    filter.role = role;
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('name email role isEmailVerified lastLoginAt createdAt avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  res.status(200).json({
    users,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

/**
 * PATCH /api/admin/users/:id/role
 * Body: { role: 'customer' | 'admin' | 'vendor' }
 * Prevents admin from demoting themselves.
 */
export const updateUserRole = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!['customer', 'admin', 'vendor'].includes(role)) {
    res.status(400).json({ message: 'Invalid role. Must be customer, admin, or vendor.' });
    return;
  }

  // Prevent self-demotion
  if (req.user && req.user._id.toString() === id) {
    res.status(403).json({ message: 'You cannot change your own role.' });
    return;
  }

  const user = await User.findByIdAndUpdate(
    id,
    { role },
    { new: true, select: 'name email role isEmailVerified lastLoginAt createdAt' }
  );

  if (!user) {
    res.status(404).json({ message: 'User not found.' });
    return;
  }

  res.status(200).json({ message: `Role updated to ${role}.`, user });
});
