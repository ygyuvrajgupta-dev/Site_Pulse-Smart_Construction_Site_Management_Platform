import { response } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';
import prisma from '../config/db.js';

/**
 * Get notes for a lead or client
 */
export async function getNotes(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const { leadId, clientId } = req.query;

    const where = { companyId };

    if (leadId) {
      where.leadId = leadId;
    }

    if (clientId) {
      where.clientId = clientId;
    }

    const notes = await prisma.note.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    return response.success(res, notes);
  } catch (error) {
    next(error);
  }
}

/**
 * Create a note for a lead or client
 */
export async function createNote(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const { content, leadId, clientId, type } = req.body;

    if (!leadId && !clientId) {
      throw new AppError('Either leadId or clientId is required', 400);
    }

    const note = await prisma.note.create({
      data: {
        companyId,
        content,
        leadId,
        clientId,
        authorId: req.user.id,
        type: type || 'GENERAL',
      },
      include: {
        author: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    return response.success(res, note, 'Note created successfully', 201);
  } catch (error) {
    next(error);
  }
}

/**
 * Update a note
 */
export async function updateNote(req, res, next) {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;
    const { content, type } = req.body;

    const note = await prisma.note.findFirst({
      where: { id, companyId },
    });

    if (!note) {
      throw new AppError('Note not found', 404);
    }

    // Only author can update
    if (note.authorId !== req.user.id) {
      throw new AppError('You can only edit your own notes', 403);
    }

    const updatedNote = await prisma.note.update({
      where: { id },
      data: { content, type },
      include: {
        author: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    return response.success(res, updatedNote, 'Note updated successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a note
 */
export async function deleteNote(req, res, next) {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const note = await prisma.note.findFirst({
      where: { id, companyId },
    });

    if (!note) {
      throw new AppError('Note not found', 404);
    }

    // Only author or admin can delete
    if (note.authorId !== req.user.id) {
      throw new AppError('You can only delete your own notes', 403);
    }

    await prisma.note.delete({ where: { id } });

    return response.success(res, null, 'Note deleted successfully');
  } catch (error) {
    next(error);
  }
}