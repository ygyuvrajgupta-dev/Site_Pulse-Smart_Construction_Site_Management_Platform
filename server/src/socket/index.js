import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

let io = null;

export function initializeSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  // Authentication middleware for Socket.io
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (error) {
      next(new Error('Invalid authentication token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.email} (${socket.id})`);

    // Join user to their personal room
    socket.join(`user:${socket.user.id}`);

    // Join company room
    if (socket.user.companyId) {
      socket.join(`company:${socket.user.companyId}`);
    }

    // Handle notification acknowledgment
    socket.on('notification:read', (notificationId) => {
      socket.emit('notification:read:success', { notificationId });
    });

    // Handle typing indicators
    socket.on('typing:start', (data) => {
      socket.to(data.room).emit('typing:start', {
        userId: socket.user.id,
        userName: socket.user.name,
      });
    });

    socket.on('typing:stop', (data) => {
      socket.to(data.room).emit('typing:stop', {
        userId: socket.user.id,
      });
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.email} (${socket.id})`);
    });
  });

  return io;
}

export function getIO() {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
}

/**
 * Emit notification to specific user
 */
export function emitToUser(userId, event, data) {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
}

/**
 * Emit notification to entire company
 */
export function emitToCompany(companyId, event, data) {
  if (io) {
    io.to(`company:${companyId}`).emit(event, data);
  }
}

/**
 * Emit notification to specific room
 */
export function emitToRoom(room, event, data) {
  if (io) {
    io.to(room).emit(event, data);
  }
}