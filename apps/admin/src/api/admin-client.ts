import {
  CreateKanjiDto,
  UpdateKanjiDto,
  KanjiDetailDto,
  KanjiListQueryDto,
  CreateVocabularyDto,
  UpdateVocabularyDto,
  VocabularyDetailDto,
  VocabularyListQueryDto,
  CreateGrammarDto,
  UpdateGrammarDto,
  GrammarDetailDto,
  GrammarListQueryDto,
  ApiResponse,
} from '@sakura/shared';

const API_BASE = '/api/v1';

export class AdminApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  // Kanji
  async getKanjiList(
    query: Partial<KanjiListQueryDto> = {},
  ): Promise<{ items: KanjiDetailDto[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
    const params = new URLSearchParams();
    if (query.jlpt) params.set('jlpt', query.jlpt);
    if (query.search) params.set('search', query.search);
    if (query.page) params.set('page', String(query.page));
    if (query.limit) params.set('limit', String(query.limit));

    const res = await fetch(`${API_BASE}/kanji?${params.toString()}`, {
      headers: this.getHeaders(),
    });
    const json: ApiResponse<KanjiDetailDto[]> = await res.json();
    return {
      items: json.data ?? [],
      meta: {
        page: json.meta?.page ?? 1,
        limit: json.meta?.limit ?? 20,
        total: json.meta?.total ?? 0,
        totalPages: json.meta?.totalPages ?? 1,
      },
    };
  }

  async createKanji(data: CreateKanjiDto): Promise<KanjiDetailDto> {
    const res = await fetch(`${API_BASE}/admin/kanji`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    const json: ApiResponse<KanjiDetailDto> = await res.json();
    if (!json.success || !json.data) {
      throw new Error(json.error?.message ?? 'Tạo chữ Kanji thất bại');
    }
    return json.data;
  }

  async updateKanji(id: number, data: UpdateKanjiDto): Promise<KanjiDetailDto> {
    const res = await fetch(`${API_BASE}/admin/kanji/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    const json: ApiResponse<KanjiDetailDto> = await res.json();
    if (!json.success || !json.data) {
      throw new Error(json.error?.message ?? 'Cập nhật chữ Kanji thất bại');
    }
    return json.data;
  }

  async deleteKanji(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/admin/kanji/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    const json: ApiResponse<{ deleted: boolean }> = await res.json();
    if (!json.success) {
      throw new Error(json.error?.message ?? 'Xóa chữ Kanji thất bại');
    }
  }

  // Vocabulary
  async getVocabularyList(
    query: Partial<VocabularyListQueryDto> = {},
  ): Promise<{ items: VocabularyDetailDto[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
    const params = new URLSearchParams();
    if (query.jlpt) params.set('jlpt', query.jlpt);
    if (query.partOfSpeech) params.set('partOfSpeech', query.partOfSpeech);
    if (query.search) params.set('search', query.search);
    if (query.page) params.set('page', String(query.page));
    if (query.limit) params.set('limit', String(query.limit));

    const res = await fetch(`${API_BASE}/vocabulary?${params.toString()}`, {
      headers: this.getHeaders(),
    });
    const json: ApiResponse<VocabularyDetailDto[]> = await res.json();
    return {
      items: json.data ?? [],
      meta: {
        page: json.meta?.page ?? 1,
        limit: json.meta?.limit ?? 20,
        total: json.meta?.total ?? 0,
        totalPages: json.meta?.totalPages ?? 1,
      },
    };
  }

  async createVocabulary(data: CreateVocabularyDto): Promise<VocabularyDetailDto> {
    const res = await fetch(`${API_BASE}/admin/vocabulary`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    const json: ApiResponse<VocabularyDetailDto> = await res.json();
    if (!json.success || !json.data) {
      throw new Error(json.error?.message ?? 'Tạo từ vựng thất bại');
    }
    return json.data;
  }

  async updateVocabulary(id: number, data: UpdateVocabularyDto): Promise<VocabularyDetailDto> {
    const res = await fetch(`${API_BASE}/admin/vocabulary/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    const json: ApiResponse<VocabularyDetailDto> = await res.json();
    if (!json.success || !json.data) {
      throw new Error(json.error?.message ?? 'Cập nhật từ vựng thất bại');
    }
    return json.data;
  }

  async deleteVocabulary(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/admin/vocabulary/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    const json: ApiResponse<{ deleted: boolean }> = await res.json();
    if (!json.success) {
      throw new Error(json.error?.message ?? 'Xóa từ vựng thất bại');
    }
  }

  // Grammar
  async getGrammarList(
    query: Partial<GrammarListQueryDto> = {},
  ): Promise<{ items: GrammarDetailDto[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
    const params = new URLSearchParams();
    if (query.jlpt) params.set('jlpt', query.jlpt);
    if (query.search) params.set('search', query.search);
    if (query.page) params.set('page', String(query.page));
    if (query.limit) params.set('limit', String(query.limit));

    const res = await fetch(`${API_BASE}/grammar?${params.toString()}`, {
      headers: this.getHeaders(),
    });
    const json: ApiResponse<GrammarDetailDto[]> = await res.json();
    return {
      items: json.data ?? [],
      meta: {
        page: json.meta?.page ?? 1,
        limit: json.meta?.limit ?? 20,
        total: json.meta?.total ?? 0,
        totalPages: json.meta?.totalPages ?? 1,
      },
    };
  }

  async createGrammar(data: CreateGrammarDto): Promise<GrammarDetailDto> {
    const res = await fetch(`${API_BASE}/admin/grammar`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    const json: ApiResponse<GrammarDetailDto> = await res.json();
    if (!json.success || !json.data) {
      throw new Error(json.error?.message ?? 'Tạo mẫu ngữ pháp thất bại');
    }
    return json.data;
  }

  async updateGrammar(id: number, data: UpdateGrammarDto): Promise<GrammarDetailDto> {
    const res = await fetch(`${API_BASE}/admin/grammar/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    const json: ApiResponse<GrammarDetailDto> = await res.json();
    if (!json.success || !json.data) {
      throw new Error(json.error?.message ?? 'Cập nhật mẫu ngữ pháp thất bại');
    }
    return json.data;
  }

  async deleteGrammar(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/admin/grammar/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    const json: ApiResponse<{ deleted: boolean }> = await res.json();
    if (!json.success) {
      throw new Error(json.error?.message ?? 'Xóa mẫu ngữ pháp thất bại');
    }
  }
}

export const adminApiClient = new AdminApiClient();
