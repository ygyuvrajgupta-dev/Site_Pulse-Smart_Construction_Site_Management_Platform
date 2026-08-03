import { response } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';
import prisma from '../config/db.js';

/**
 * Get files for a lead or client
 */
export async function getFiles(req, res, next) {
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

    const files = await prisma.file.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        uploadedBy: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    return response.success(res, files);
  } catch (error) {
    next(error);
  }
}

/**
 * Upload a file for a lead or client
 * Note: This expects the file URL to be provided (e.g., from S3/Cloudinary upload)
 */
export async function uploadFile(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const { name, url, type, size, leadId, clientId } = req.body;

    if (!leadId && !clientId) {
      throw new AppError('Either leadId or clientId is required', 400);
    }

    if (!url || !name) {
      throw new AppError('File name and URL are required', 400);
    }

    const file = await prisma.file.create({
      data: {
        companyId,
        name,
        url,
        type: type || 'file',
        size: size ? parseInt(size) : null,
        leadId,
        clientId,
        uploadedById: req.user.id,
      },
      include: {
        uploadedBy: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    return response.success(res, file, 'File uploaded successfully', 201);
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a file
 */
export async function deleteFile(req, res, next) {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const file = await prisma.file.findFirst({
      where: { id, companyId },
    });

    if (!file) {
      throw new AppError('File not found', 404);
    }

    await prisma.file.delete({ where: { id } });

    return response.success(res, null, 'File deleted successfully');
  } catch (error) {
    next(error);
  }
}