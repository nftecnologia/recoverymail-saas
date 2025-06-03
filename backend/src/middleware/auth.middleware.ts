import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

// Extender o tipo Request para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        role: string;
      };
      organization?: {
        id: string;
        name: string;
        role: string;
        permissions: string[];
      };
    }
  }
}

// Middleware para verificar JWT
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (!token) {
      throw new AppError('Token de acesso não fornecido', 401);
    }

    // Verificar e decodificar token
    const decoded = jwt.verify(
      token,
      process.env['JWT_SECRET'] || 'default-secret'
    ) as { userId: string };

    // Buscar usuário no banco
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        isVerified: true
      }
    });

    if (!user || !user.isActive) {
      throw new AppError('Usuário não encontrado ou inativo', 401);
    }

    // Adicionar usuário à requisição
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('Invalid JWT token', { error: error.message });
      res.status(401).json({ error: 'Token inválido' });
      return;
    }
    next(error);
  }
};

// Middleware para verificar organização
export const authenticateOrganization = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Usuário não autenticado', 401);
    }

    const orgId = req.headers['x-organization-id'] as string;
    
    if (!orgId) {
      throw new AppError('Organization ID é obrigatório', 400);
    }

    // Verificar se o usuário tem acesso à organização
    const userOrg = await prisma.userOrganization.findUnique({
      where: {
        userId_organizationId: {
          userId: req.user.id,
          organizationId: orgId
        }
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            plan: true
          }
        }
      }
    });

    if (!userOrg) {
      throw new AppError('Acesso negado à organização', 403);
    }

    // Adicionar organização à requisição
    req.organization = {
      id: userOrg.organizationId,
      name: userOrg.organization.name,
      role: userOrg.role,
      permissions: userOrg.permissions
    };

    next();
  } catch (error) {
    next(error);
  }
};

// Middleware para verificar permissões específicas
export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.organization) {
      res.status(401).json({ error: 'Organização não autenticada' });
      return;
    }

    const hasPermission = 
      req.organization.permissions.includes('ALL') ||
      req.organization.permissions.includes(permission) ||
      req.organization.role === 'OWNER';

    if (!hasPermission) {
      res.status(403).json({ 
        error: 'Permissão insuficiente',
        required: permission,
        current: req.organization.permissions
      });
      return;
    }

    next();
  };
};

// Middleware para verificar role da organização
export const requireOrgRole = (minRole: 'VIEWER' | 'MEMBER' | 'ADMIN' | 'OWNER') => {
  const roleHierarchy = {
    VIEWER: 0,
    MEMBER: 1,
    ADMIN: 2,
    OWNER: 3
  };

  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.organization) {
      res.status(401).json({ error: 'Organização não autenticada' });
      return;
    }

    const userRoleLevel = roleHierarchy[req.organization.role as keyof typeof roleHierarchy];
    const requiredRoleLevel = roleHierarchy[minRole];

    if (userRoleLevel < requiredRoleLevel) {
      res.status(403).json({ 
        error: 'Role insuficiente',
        required: minRole,
        current: req.organization.role
      });
      return;
    }

    next();
  };
};

// Middleware para verificar role do sistema
export const requireSystemRole = (minRole: 'USER' | 'ADMIN' | 'SUPER_ADMIN') => {
  const roleHierarchy = {
    USER: 0,
    ADMIN: 1,
    SUPER_ADMIN: 2
  };

  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Usuário não autenticado' });
      return;
    }

    const userRoleLevel = roleHierarchy[req.user.role as keyof typeof roleHierarchy];
    const requiredRoleLevel = roleHierarchy[minRole];

    if (userRoleLevel < requiredRoleLevel) {
      res.status(403).json({ 
        error: 'Role de sistema insuficiente',
        required: minRole,
        current: req.user.role
      });
      return;
    }

    next();
  };
};

// Middleware opcional de autenticação (não falha se não tiver token)
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (token) {
      const decoded = jwt.verify(
        token,
        process.env['JWT_SECRET'] || 'default-secret'
      ) as { userId: string };

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true
        }
      });

      if (user && user.isActive) {
        req.user = {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        };
      }
    }

    next();
  } catch (error) {
    // Em autenticação opcional, ignoramos erros de token
    next();
  }
};