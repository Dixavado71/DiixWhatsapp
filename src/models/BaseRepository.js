import prisma from '../config/database.js';

/**
 * Repository base para operações comuns
 * Implementa o padrão Repository com escopo multi-tenant
 */
export class BaseRepository {
  constructor(model, tenantId) {
    this.model = model;
    this.tenantId = tenantId;
  }

  /**
   * Busca todos os registros do tenant
   */
  async findAll(where = {}) {
    return this.model.findMany({
      where: {
        tenantId: this.tenantId,
        ...where,
      },
    });
  }

  /**
   * Busca um registro por ID
   */
  async findById(id) {
    return this.model.findFirst({
      where: {
        id,
        tenantId: this.tenantId,
      },
    });
  }

  /**
   * Cria um novo registro
   */
  async create(data) {
    return this.model.create({
      data: {
        ...data,
        tenantId: this.tenantId,
      },
    });
  }

  /**
   * Atualiza um registro existente
   */
  async update(id, data) {
    return this.model.update({
      where: {
        id,
        tenantId: this.tenantId,
      },
      data,
    });
  }

  /**
   * Remove um registro
   */
  async delete(id) {
    return this.model.delete({
      where: {
        id,
        tenantId: this.tenantId,
      },
    });
  }

  /**
   * Conta registros do tenant
   */
  async count(where = {}) {
    return this.model.count({
      where: {
        tenantId: this.tenantId,
        ...where,
      },
    });
  }

  /**
   * Busca paginada
   */
  async findPaginated({ skip = 0, take = 10, orderBy = { createdAt: 'desc' }, where = {} }) {
    return this.model.findMany({
      where: {
        tenantId: this.tenantId,
        ...where,
      },
      skip,
      take,
      orderBy,
    });
  }
}

export default BaseRepository;
