import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';

const router = Router();

// Schemas de validação
const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  organizationName: z.string().min(2, 'Nome da organização é obrigatório')
});

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória')
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido')
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token é obrigatório'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres')
});

// Função auxiliar para gerar JWT
function generateToken(userId: string): string {
  return jwt.sign(
    { userId },
    process.env['JWT_SECRET'] || 'default-secret',
    { expiresIn: '7d' }
  );
}

// POST /auth/register
router.post('/register', async (req, res, next): Promise<void> => {
  try {
    const { name, email, password, organizationName } = registerSchema.parse(req.body);

    // Verificar se o usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new AppError('Email já está em uso', 409);
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 12);

    // Criar usuário e organização em uma transação
    const result = await prisma.$transaction(async (tx) => {
      // Criar usuário
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          isVerified: true // Por enquanto, auto-verificado
        }
      });

      // Criar organização
      const organization = await tx.organization.create({
        data: {
          name: organizationName,
          apiKey: `sk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }
      });

      // Relacionar usuário com organização como OWNER
      await tx.userOrganization.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          role: 'OWNER',
          permissions: ['ALL']
        }
      });

      return { user, organization };
    });

    // Gerar token
    const token = generateToken(result.user.id);

    logger.info('User registered successfully', {
      userId: result.user.id,
      email: result.user.email,
      organizationId: result.organization.id
    });

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          role: result.user.role
        },
        organization: {
          id: result.organization.id,
          name: result.organization.name,
          apiKey: result.organization.apiKey
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /auth/login
router.post('/login', async (req, res, next): Promise<void> => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // Buscar usuário com organizações
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        organizations: {
          include: {
            organization: true
          }
        }
      }
    });

    if (!user) {
      throw new AppError('Credenciais inválidas', 401);
    }

    if (!user.isActive) {
      throw new AppError('Conta desativada', 401);
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Credenciais inválidas', 401);
    }

    // Atualizar último login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Gerar token
    const token = generateToken(user.id);

    logger.info('User logged in successfully', {
      userId: user.id,
      email: user.email
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar
        },
        organizations: user.organizations.map(uo => ({
          id: uo.organization.id,
          name: uo.organization.name,
          role: uo.role,
          permissions: uo.permissions,
          plan: uo.organization.plan
        })),
        token
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /auth/forgot-password
router.post('/forgot-password', async (req, res, next): Promise<void> => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Por segurança, sempre retorna sucesso mesmo se o email não existir
      res.json({
        success: true,
        message: 'Se o email existir, você receberá as instruções de recuperação'
      });
      return;
    }

    // Gerar token de recuperação
    const resetToken = Math.random().toString(36).substring(2, 15) + 
                      Math.random().toString(36).substring(2, 15);
    const resetExpires = new Date(Date.now() + 3600000); // 1 hora

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires
      }
    });

    // TODO: Enviar email de recuperação
    logger.info('Password reset requested', {
      userId: user.id,
      email: user.email,
      resetToken
    });

    res.json({
      success: true,
      message: 'Se o email existir, você receberá as instruções de recuperação',
      // Em desenvolvimento, retorna o token para facilitar testes
      ...(process.env['NODE_ENV'] === 'development' && { resetToken })
    });
  } catch (error) {
    next(error);
  }
});

// POST /auth/reset-password
router.post('/reset-password', async (req, res, next): Promise<void> => {
  try {
    const { token, password } = resetPasswordSchema.parse(req.body);

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      throw new AppError('Token inválido ou expirado', 400);
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(password, 12);

    // Atualizar senha e limpar tokens
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null
      }
    });

    logger.info('Password reset successfully', {
      userId: user.id,
      email: user.email
    });

    res.json({
      success: true,
      message: 'Senha alterada com sucesso'
    });
  } catch (error) {
    next(error);
  }
});

// GET /auth/me
router.get('/me', async (req, res, next): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      throw new AppError('Token não fornecido', 401);
    }

    const decoded = jwt.verify(token, process.env['JWT_SECRET'] || 'default-secret') as { userId: string };
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        organizations: {
          include: {
            organization: true
          }
        }
      }
    });

    if (!user || !user.isActive) {
      throw new AppError('Usuário não encontrado', 404);
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          isVerified: user.isVerified
        },
        organizations: user.organizations.map(uo => ({
          id: uo.organization.id,
          name: uo.organization.name,
          role: uo.role,
          permissions: uo.permissions,
          plan: uo.organization.plan,
          apiKey: uo.role === 'OWNER' ? uo.organization.apiKey : undefined
        }))
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /auth/logout
router.post('/logout', async (_req, res): Promise<void> => {
  // Com JWT, o logout é apenas client-side
  // Em uma implementação mais robusta, poderia blacklistar o token
  res.json({
    success: true,
    message: 'Logout realizado com sucesso'
  });
});

export default router;