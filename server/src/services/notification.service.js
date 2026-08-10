import prisma from '../config/db.js';
import { getIO } from '../socket/index.js';

/**
 * Create a new notification
 */
export async function createNotification(data) {
  try {
    const { companyId, userId, title, message, type, channel, link, metadata } = data;

    const notification = await prisma.notification.create({
      data: {
        companyId,
        userId,
        title,
        message,
        type: type || 'INFO',
        channel: channel || 'IN_APP',
        link,
        metadata,
      },
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    // Emit real-time notification via Socket.io
    const io = getIO();
    io.to(`user:${userId}`).emit('notification:new', notification);

    // Send email if channel includes EMAIL
    if (channel === 'EMAIL' || channel === 'BOTH') {
      await sendEmailNotification(notification);
    }

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

/**
 * Create bulk notifications for multiple users
 */
export async function createBulkNotifications(data) {
  try {
    const { companyId, userIds, title, message, type, channel, link, metadata } = data;

    const notifications = await prisma.notification.createMany({
      data: userIds.map(userId => ({
        companyId,
        userId,
        title,
        message,
        type: type || 'INFO',
        channel: channel || 'IN_APP',
        link,
        metadata,
      })),
    });

    // Emit to all users via Socket.io
    const io = getIO();
    userIds.forEach(userId => {
      io.to(`user:${userId}`).emit('notification:new', {
        companyId,
        userId,
        title,
        message,
        type,
        channel,
        link,
        metadata,
      });
    });

    // Send emails if needed
    if (channel === 'EMAIL' || channel === 'BOTH') {
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, email: true, name: true },
      });

      for (const user of users) {
        await sendEmailNotification({
          title,
          message,
          user: { name: user.name, email: user.email },
        });
      }
    }

    return notifications;
  } catch (error) {
    console.error('Error creating bulk notifications:', error);
    throw error;
  }
}

/**
 * Get notifications for a user
 */
export async function getUserNotifications(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const unreadOnly = req.query.unreadOnly === 'true';

    const where = {
      companyId,
      userId,
      ...(unreadOnly && { isRead: false }),
    };

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notification.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Mark notification as read
 */
export async function markAsRead(req, res, next) {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const notification = await prisma.notification.findFirst({
      where: { id, companyId },
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });

    // Emit update via Socket.io
    const io = getIO();
    io.to(`user:${notification.userId}`).emit('notification:read', {
      notificationId: id,
      readAt: updated.readAt,
    });

    return res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const userId = req.user.id;

    await prisma.notification.updateMany({
      where: {
        companyId,
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    // Emit update via Socket.io
    const io = getIO();
    io.to(`user:${userId}`).emit('notification:all:read', {});

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const userId = req.user.id;

    const count = await prisma.notification.count({
      where: {
        companyId,
        userId,
        isRead: false,
      },
    });

    return res.status(200).json({
      success: true,
      data: { count },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Send email notification (placeholder - integrate with email service)
 */
async function sendEmailNotification(notification) {
  try {
    // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
    console.log(`Email notification sent to ${notification.user?.email || notification.email}`);
    console.log(`Subject: ${notification.title}`);
    console.log(`Body: ${notification.message}`);
  } catch (error) {
    console.error('Error sending email notification:', error);
  }
}

/**
 * Send push notification (placeholder - integrate with push service)
 */
export async function sendPushNotification(userId, title, body, data = {}) {
  try {
    // TODO: Integrate with push notification service (Firebase, OneSignal, etc.)
    const io = getIO();
    io.to(`user:${userId}`).emit('notification:push', {
      title,
      body,
      data,
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending push notification:', error);
    throw error;
  }
}