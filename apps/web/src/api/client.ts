import {
  KanjiDetailDto,
  KanjiListQueryDto,
  VocabularyDetailDto,
  VocabularyListQueryDto,
  GrammarDetailDto,
  GrammarListQueryDto,
  FeedResponseDto,
  ProgressEventDto,
  ProgressEventResponseDto,
  SubmitAnswerDto,
  QuestionResultDto,
  UserStatsDto,
  BatchProgressResponseDto,
  OfflinePackageDataDto,
  JlptLevel,
  ApiResponse,
} from '@sakura/shared';

const API_BASE = '/api/v1';

export class ApiClient {
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

  async getKanjiById(id: number): Promise<KanjiDetailDto> {
    const res = await fetch(`${API_BASE}/kanji/${id}`, {
      headers: this.getHeaders(),
    });
    const json: ApiResponse<KanjiDetailDto> = await res.json();
    if (!json.success || !json.data) {
      throw new Error(json.error?.message ?? 'Failed to fetch Kanji');
    }
    return json.data;
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

  async getVocabularyById(id: number): Promise<VocabularyDetailDto> {
    const res = await fetch(`${API_BASE}/vocabulary/${id}`, {
      headers: this.getHeaders(),
    });
    const json: ApiResponse<VocabularyDetailDto> = await res.json();
    if (!json.success || !json.data) {
      throw new Error(json.error?.message ?? 'Failed to fetch Vocabulary');
    }
    return json.data;
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

  async getGrammarById(id: number): Promise<GrammarDetailDto> {
    const res = await fetch(`${API_BASE}/grammar/${id}`, {
      headers: this.getHeaders(),
    });
    const json: ApiResponse<GrammarDetailDto> = await res.json();
    if (!json.success || !json.data) {
      throw new Error(json.error?.message ?? 'Failed to fetch Grammar');
    }
    return json.data;
  }

  // Feed with JLPT & Content Type filters
  async getFeed(
    limit = 10,
    currentCardIds: string[] = [],
    jlpt?: JlptLevel,
    contentType?: 'ALL' | 'KANJI' | 'VOCABULARY' | 'GRAMMAR',
  ): Promise<FeedResponseDto> {
    const res = await fetch(`${API_BASE}/feed`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ limit, currentCardIds, jlpt, contentType }),
    });
    const json: ApiResponse<FeedResponseDto> = await res.json();
    if (!json.success || !json.data) {
      throw new Error(json.error?.message ?? 'Failed to fetch feed');
    }
    return json.data;
  }

  // Learning Progress & Stats
  async recordProgressEvent(event: ProgressEventDto): Promise<ProgressEventResponseDto> {
    const res = await fetch(`${API_BASE}/progress/event`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(event),
    });
    const json: ApiResponse<ProgressEventResponseDto> = await res.json();
    if (!json.success || !json.data) {
      throw new Error(json.error?.message ?? 'Failed to record event');
    }
    return json.data;
  }

  async getUserStats(): Promise<UserStatsDto> {
    const res = await fetch(`${API_BASE}/progress/stats`, {
      headers: this.getHeaders(),
    });
    const json: ApiResponse<UserStatsDto> = await res.json();
    if (!json.success || !json.data) {
      throw new Error(json.error?.message ?? 'Failed to fetch stats');
    }
    return json.data;
  }

  // Questions
  async submitQuestionAnswer(
    questionId: number,
    submission: SubmitAnswerDto,
  ): Promise<QuestionResultDto> {
    const res = await fetch(`${API_BASE}/questions/${questionId}/submit`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(submission),
    });
    const json: ApiResponse<QuestionResultDto> = await res.json();
    if (!json.success || !json.data) {
      throw new Error(json.error?.message ?? 'Failed to submit answer');
    }
    return json.data;
  }

  // Batch Sync for Offline Learning Events
  async syncBatchEvents(events: ProgressEventDto[]): Promise<BatchProgressResponseDto> {
    const res = await fetch(`${API_BASE}/progress/batch`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ events }),
    });
    const json: ApiResponse<BatchProgressResponseDto> = await res.json();
    if (!json.success || !json.data) {
      throw new Error(json.error?.message ?? 'Failed to synchronize batch events');
    }
    return json.data;
  }

  // Offline Content Packages
  async downloadPackage(level: JlptLevel): Promise<OfflinePackageDataDto> {
    const res = await fetch(`${API_BASE}/packages/jlpt/${level}`, {
      headers: this.getHeaders(),
    });
    const json: ApiResponse<OfflinePackageDataDto> = await res.json();
    if (!json.success || !json.data) {
      throw new Error(json.error?.message ?? `Failed to download offline package for ${level}`);
    }
    return json.data;
  }
}

export const apiClient = new ApiClient();
