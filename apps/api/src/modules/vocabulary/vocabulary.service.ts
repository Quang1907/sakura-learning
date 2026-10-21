import {
  CreateVocabularyDto,
  UpdateVocabularyDto,
  VocabularyDetailDto,
  VocabularyListQueryDto,
} from '@sakura/shared';
import { vocabularyRepository, VocabularyRepository } from './vocabulary.repository.js';

export interface PaginatedVocabularyResult {
  items: VocabularyDetailDto[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class VocabularyService {
  constructor(private readonly repo: VocabularyRepository = vocabularyRepository) {}

  /**
   * List Vocabulary with search, filter, and pagination
   */
  public async listVocabulary(query: VocabularyListQueryDto): Promise<PaginatedVocabularyResult> {
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
   * Get Vocabulary details by ID
   */
  public async getVocabularyById(id: number): Promise<VocabularyDetailDto> {
    const vocab = await this.repo.findById(id);
    if (!vocab) {
      throw new Error(`Không tìm thấy từ vựng với ID: ${id}`);
    }
    return vocab;
  }

  /**
   * Create a new Vocabulary (Admin)
   */
  public async createVocabulary(data: CreateVocabularyDto): Promise<VocabularyDetailDto> {
    const existing = await this.repo.findByWord(data.word);
    if (existing) {
      throw new Error(`Từ vựng "${data.word}" đã tồn tại trong hệ thống.`);
    }

    return this.repo.create(data);
  }

  /**
   * Update an existing Vocabulary (Admin)
   */
  public async updateVocabulary(
    id: number,
    data: UpdateVocabularyDto,
  ): Promise<VocabularyDetailDto> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new Error(`Không tìm thấy từ vựng với ID: ${id}`);
    }

    if (data.word && data.word !== existing.word) {
      const duplicate = await this.repo.findByWord(data.word);
      if (duplicate && duplicate.id !== id) {
        throw new Error(`Từ vựng "${data.word}" đã tồn tại trong hệ thống.`);
      }
    }

    const updated = await this.repo.update(id, data);
    if (!updated) {
      throw new Error(`Cập nhật từ vựng ID ${id} thất bại.`);
    }
    return updated;
  }

  /**
   * Soft delete a Vocabulary (Admin)
   */
  public async deleteVocabulary(id: number): Promise<void> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new Error(`Không tìm thấy từ vựng với ID: ${id}`);
    }

    const success = await this.repo.softDelete(id);
    if (!success) {
      throw new Error(`Xóa từ vựng ID ${id} thất bại.`);
    }
  }
}

export const vocabularyService = new VocabularyService();
