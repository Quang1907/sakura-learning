import {
  CreateKanjiDto,
  UpdateKanjiDto,
  KanjiDetailDto,
  KanjiListQueryDto,
} from '@sakura/shared';
import { kanjiRepository, KanjiRepository } from './kanji.repository.js';

export interface PaginatedKanjiResult {
  items: KanjiDetailDto[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class KanjiService {
  constructor(private readonly repo: KanjiRepository = kanjiRepository) {}

  /**
   * List Kanji with search, filter, and pagination
   */
  public async listKanji(query: KanjiListQueryDto): Promise<PaginatedKanjiResult> {
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
   * Get Kanji details by ID
   */
  public async getKanjiById(id: number): Promise<KanjiDetailDto> {
    const kanji = await this.repo.findById(id);
    if (!kanji) {
      throw new Error(`Không tìm thấy chữ Kanji với ID: ${id}`);
    }
    return kanji;
  }

  /**
   * Create a new Kanji (Admin)
   */
  public async createKanji(data: CreateKanjiDto): Promise<KanjiDetailDto> {
    // Check uniqueness of character
    const existing = await this.repo.findByCharacter(data.character);
    if (existing) {
      throw new Error(`Chữ Kanji "${data.character}" đã tồn tại trong hệ thống.`);
    }

    return this.repo.create(data);
  }

  /**
   * Update an existing Kanji (Admin)
   */
  public async updateKanji(id: number, data: UpdateKanjiDto): Promise<KanjiDetailDto> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new Error(`Không tìm thấy chữ Kanji với ID: ${id}`);
    }

    // If character is being changed, check uniqueness
    if (data.character && data.character !== existing.character) {
      const duplicate = await this.repo.findByCharacter(data.character);
      if (duplicate && duplicate.id !== id) {
        throw new Error(`Chữ Kanji "${data.character}" đã tồn tại trong hệ thống.`);
      }
    }

    const updated = await this.repo.update(id, data);
    if (!updated) {
      throw new Error(`Cập nhật chữ Kanji ID ${id} thất bại.`);
    }
    return updated;
  }

  /**
   * Soft delete a Kanji (Admin)
   */
  public async deleteKanji(id: number): Promise<void> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new Error(`Không tìm thấy chữ Kanji với ID: ${id}`);
    }

    const success = await this.repo.softDelete(id);
    if (!success) {
      throw new Error(`Xóa chữ Kanji ID ${id} thất bại.`);
    }
  }
}

export const kanjiService = new KanjiService();
