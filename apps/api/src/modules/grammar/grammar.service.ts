import {
  CreateGrammarDto,
  UpdateGrammarDto,
  GrammarDetailDto,
  GrammarListQueryDto,
} from '@sakura/shared';
import { grammarRepository, GrammarRepository } from './grammar.repository.js';

export interface PaginatedGrammarResult {
  items: GrammarDetailDto[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class GrammarService {
  constructor(private readonly repo: GrammarRepository = grammarRepository) {}

  /**
   * List Grammar with search, filter, and pagination
   */
  public async listGrammar(query: GrammarListQueryDto): Promise<PaginatedGrammarResult> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const { items, total } = await this.repo.findAll(query);
    const totalPages = Math.ceil(total / limit);

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Get Grammar details by ID
   */
  public async getGrammarById(id: number): Promise<GrammarDetailDto> {
    const grammar = await this.repo.findById(id);
    if (!grammar) {
      throw new Error(`Không tìm thấy mẫu ngữ pháp với ID: ${id}`);
    }
    return grammar;
  }

  /**
   * Create a new Grammar (Admin)
   */
  public async createGrammar(data: CreateGrammarDto): Promise<GrammarDetailDto> {
    const existing = await this.repo.findByTitle(data.title);
    if (existing) {
      throw new Error(`Mẫu ngữ pháp "${data.title}" đã tồn tại trong hệ thống.`);
    }

    return this.repo.create(data);
  }

  /**
   * Update an existing Grammar (Admin)
   */
  public async updateGrammar(id: number, data: UpdateGrammarDto): Promise<GrammarDetailDto> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new Error(`Không tìm thấy mẫu ngữ pháp với ID: ${id}`);
    }

    if (data.title && data.title !== existing.title) {
      const duplicate = await this.repo.findByTitle(data.title);
      if (duplicate && duplicate.id !== id) {
        throw new Error(`Mẫu ngữ pháp "${data.title}" đã tồn tại trong hệ thống.`);
      }
    }

    const updated = await this.repo.update(id, data);
    if (!updated) {
      throw new Error(`Cập nhật mẫu ngữ pháp ID ${id} thất bại.`);
    }
    return updated;
  }

  /**
   * Soft delete a Grammar (Admin)
   */
  public async deleteGrammar(id: number): Promise<void> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new Error(`Không tìm thấy mẫu ngữ pháp với ID: ${id}`);
    }

    const success = await this.repo.softDelete(id);
    if (!success) {
      throw new Error(`Xóa mẫu ngữ pháp ID ${id} thất bại.`);
    }
  }
}

export const grammarService = new GrammarService();
