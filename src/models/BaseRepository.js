import getPrisma from '../config/database.js';

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
    const finalWhere = this.tenantId 
      ? { tenantId: this.tenantId, ...where }
      : where;
    
    return this.model.findMany({
      where: finalWhere,
    });
  }

  /**
   * Busca um registro por ID
   */
  async findById(id) {
    const where = this.tenantId
      ? { id, tenantId: this.tenantId }
      : { id };
    
    return this.model.findFirst({ where });
  }

  /**
   * Cria um novo registro
   */
  async create(data) {
    const createData = this.tenantId
      ? { ...data, tenantId: this.tenantId }
      : data;
    
    return this.model.create({
      data: createData,
    });
  }

  /**
   * Atualiza um registro existente
   */
  async update(id, data) {
    const where = this.tenantId
      ? { id, tenantId: this.tenantId }
      : { id };
    
    return this.model.update({
      where,
      data,
    });
  }

  /**
   * Remove um registro
   */
  async delete(id) {
    const where = this.tenantId
      ? { id, tenantId: this.tenantId }
      : { id };
    
    return this.model.delete({ where });
  }

  /**
   * Conta registros do tenant
   */
  async count(where = {}) {
    const finalWhere = this.tenantId
      ? { tenantId: this.tenantId, ...where }
      : where;
    
    return this.model.count({
      where: finalWhere,
    });
  }

  /**
   * Busca paginada
   */
  async findPaginated({ skip = 0, take = 10, orderBy = { createdAt: 'desc' }, where = {} }) {
    const finalWhere = this.tenantId
      ? { tenantId: this.tenantId, ...where }
      : where;
    
    return this.model.findMany({
      where: finalWhere,
      skip,
      take,
      orderBy,
    });
  }
}

export default BaseRepository;
