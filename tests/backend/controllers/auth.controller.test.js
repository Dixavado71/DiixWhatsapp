/**
 * Testes de Integração - Auth Controller
 * Testa as operações de autenticação e gestão de usuários
 */

import request from 'supertest';
import app from '../../src/app.js';
import { initializeDatabase, disconnectDatabase } from '../../src/config/database.js';

// Mock do Prisma para testes
const mockUsers = [];
let testUserId = null;

const mockPrismaClient = {
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
  },
  tenant: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
  },
  $connect: jest.fn().mockResolvedValue(undefined),
  $disconnect: jest.fn().mockResolvedValue(undefined),
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrismaClient),
}));

describe('Auth Controller - Integration Tests', () => {
  beforeAll(async () => {
    await initializeDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUsers.length = 0;
  });

  describe('POST /api/v1/auth/register', () => {
    it('deve registrar um novo usuário com sucesso', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        phone: '+5511999999999',
      };

      mockPrismaClient.user.findFirst.mockResolvedValue(null);
      mockPrismaClient.user.create.mockResolvedValue({
        id: 'user-123',
        ...userData,
        role: 'TENANT_ADMIN',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('email', userData.email);
      expect(response.body.user.role).toBe('TENANT_ADMIN');
    });

    it('deve retornar erro se email já existir', async () => {
      const userData = {
        name: 'Test User',
        email: 'existing@example.com',
        password: 'password123',
      };

      mockPrismaClient.user.findFirst.mockResolvedValue({
        id: 'existing-user',
        email: userData.email,
      });

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('já existe');
    });

    it('deve retornar erro se dados estiverem incompletos', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({ name: 'Incomplete' });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('deve fazer login com credenciais válidas', async () => {
      const credentials = {
        email: 'admin@diixwhatsapp.com',
        password: 'admin123',
      };

      const mockUser = {
        id: 'admin-123',
        email: credentials.email,
        password: '$2a$10$hashedpassword',
        role: 'SUPER_ADMIN',
        name: 'Admin',
      };

      mockPrismaClient.user.findFirst.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(credentials);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('role', 'SUPER_ADMIN');
    });

    it('deve retornar erro para credenciais inválidas', async () => {
      mockPrismaClient.user.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'invalid@example.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('inválidas');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('deve retornar dados do usuário autenticado', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        name: 'Test User',
        role: 'TENANT_ADMIN',
        phone: '+5511999999999',
      };

      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.user).toEqual(expect.objectContaining({
        email: mockUser.email,
        name: mockUser.name,
      }));
    });

    it('deve retornar erro se token for inválido', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/v1/auth/profile', () => {
    it('deve atualizar perfil do usuário', async () => {
      const updateData = {
        name: 'Updated Name',
        phone: '+5511888888888',
      };

      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        ...updateData,
        role: 'TENANT_ADMIN',
      };

      mockPrismaClient.user.update.mockResolvedValue(mockUser);

      const response = await request(app)
        .put('/api/v1/auth/profile')
        .set('Authorization', 'Bearer valid-token')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.user.name).toBe(updateData.name);
    });
  });

  describe('PUT /api/v1/auth/change-password', () => {
    it('deve alterar senha com sucesso', async () => {
      const passwordData = {
        currentPassword: 'oldpass123',
        newPassword: 'newpass456',
      };

      mockPrismaClient.user.findUnique.mockResolvedValue({
        id: 'user-123',
        password: '$2a$10$hashedoldpass',
      });

      mockPrismaClient.user.update.mockResolvedValue({
        id: 'user-123',
        email: 'user@example.com',
      });

      const response = await request(app)
        .put('/api/v1/auth/change-password')
        .set('Authorization', 'Bearer valid-token')
        .send(passwordData);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('alterada');
    });

    it('deve retornar erro se senha atual estiver incorreta', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue({
        id: 'user-123',
        password: '$2a$10$hashedoldpass',
      });

      const response = await request(app)
        .put('/api/v1/auth/change-password')
        .set('Authorization', 'Bearer valid-token')
        .send({
          currentPassword: 'wrongpass',
          newPassword: 'newpass456',
        });

      expect(response.status).toBe(401);
    });
  });
});
