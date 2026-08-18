import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'diix-whatsapp-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * Controller de Autenticação
 * Gerencia login, logout e registro de usuários
 */

export const authController = {
  /**
   * Login de usuário
   * POST /api/v1/auth/login
   */
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Email e senha são obrigatórios.',
        });
      }

      // Buscar usuário por email
      const user = await prisma.user.findUnique({
        where: { email },
        include: { tenant: true },
      });

      if (!user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Email ou senha inválidos.',
        });
      }

      // Verificar senha
      const passwordValid = await bcrypt.compare(password, user.password);

      if (!passwordValid) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Email ou senha inválidos.',
        });
      }

      // Verificar status do usuário
      if (user.status !== 'active') {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Usuário inativo ou bloqueado.',
        });
      }

      // Atualizar último login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });

      // Gerar token JWT
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      // Retornar dados do usuário (sem senha)
      const { password: _, ...userWithoutPassword } = user;

      res.status(200).json({
        success: true,
        data: {
          token,
          user: {
            ...userWithoutPassword,
            tenant: user.tenant,
          },
        },
      });
    } catch (error) {
      console.error('Erro no login:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Erro interno ao realizar login.',
      });
    }
  },

  /**
   * Registro de novo usuário (apenas para TENANT_ADMIN criar usuários em seu tenant)
   * POST /api/v1/auth/register
   */
  register: async (req, res) => {
    try {
      const { email, password, name, role, tenantId } = req.body;

      // Validações básicas
      if (!email || !password || !name) {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Email, senha e nome são obrigatórios.',
        });
      }

      // Verificar se email já existe
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res.status(409).json({
          error: 'Conflict',
          message: 'Email já cadastrado.',
        });
      }

      // Hash da senha
      const hashedPassword = await bcrypt.hash(password, 10);

      // Criar usuário
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: role || 'VIEWER',
          tenantId: tenantId || null,
        },
        include: { tenant: true },
      });

      // Remover senha da resposta
      const { password: _, ...userWithoutPassword } = user;

      res.status(201).json({
        success: true,
        data: userWithoutPassword,
      });
    } catch (error) {
      console.error('Erro no registro:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Erro interno ao registrar usuário.',
      });
    }
  },

  /**
   * Obter dados do usuário autenticado
   * GET /api/v1/auth/me
   */
  getMe: async (req, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: { tenant: true },
      });

      if (!user) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Usuário não encontrado.',
        });
      }

      const { password: _, ...userWithoutPassword } = user;

      res.status(200).json({
        success: true,
        data: userWithoutPassword,
      });
    } catch (error) {
      console.error('Erro ao obter usuário:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Erro interno ao obter dados do usuário.',
      });
    }
  },

  /**
   * Atualizar perfil do usuário
   * PUT /api/v1/auth/profile
   */
  updateProfile: async (req, res) => {
    try {
      const { name, email } = req.body;

      const updateData = {};
      if (name) updateData.name = name;
      if (email) updateData.email = email;

      const user = await prisma.user.update({
        where: { id: req.user.id },
        data: updateData,
        include: { tenant: true },
      });

      const { password: _, ...userWithoutPassword } = user;

      res.status(200).json({
        success: true,
        data: userWithoutPassword,
      });
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Erro interno ao atualizar perfil.',
      });
    }
  },

  /**
   * Alterar senha
   * PUT /api/v1/auth/change-password
   */
  changePassword: async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Senha atual e nova senha são obrigatórias.',
        });
      }

      // Buscar usuário
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
      });

      // Verificar senha atual
      const passwordValid = await bcrypt.compare(currentPassword, user.password);

      if (!passwordValid) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Senha atual incorreta.',
        });
      }

      // Hash da nova senha
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Atualizar senha
      await prisma.user.update({
        where: { id: req.user.id },
        data: { password: hashedPassword },
      });

      res.status(200).json({
        success: true,
        message: 'Senha alterada com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Erro interno ao alterar senha.',
      });
    }
  },
};
