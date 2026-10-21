import {
  FeedResponseDto,
  FeedCardDto,
  NextFeedBodyDto,
} from '@sakura/shared';
import { feedEngineService, FeedEngineService, FeedCandidatePool } from './feed-engine.service.js';
import { contentRepository, ContentRepository } from '../content/content.repository.js';
import { questionRepository, QuestionRepository } from '../questions/question.repository.js';

export class FeedService {
  constructor(
    private readonly contentRepo: ContentRepository = contentRepository,
    private readonly questionRepo: QuestionRepository = questionRepository,
    private readonly engine: FeedEngineService = feedEngineService,
  ) {}

  /**
   * Assemble a personalized swipe feed for user
   */
  public async getFeed(
    _userId: number,
    dto: NextFeedBodyDto,
  ): Promise<FeedResponseDto> {
    const limit = dto.limit ?? 10;
    const currentCardIds = dto.currentCardIds ?? [];
    const targetJlpt = dto.jlpt ?? 'N5';

    // 1. Fetch new content candidates
    const newItems = await this.contentRepo.findCandidates(
      targetJlpt,
      limit * 2,
      currentCardIds,
      dto.contentType,
    );

    // 2. Fetch question candidates
    const rawQuestions = await this.questionRepo.findRandomActive(limit);
    const questionItems: FeedCardDto[] = rawQuestions.map((q) => ({
      cardId: `question_${q.id}`,
      cardType: 'QUESTION',
      content: {
        id: q.id,
        questionType: q.questionType,
        prompt: q.prompt,
        // Options for learners must NOT expose isCorrect
        options: q.options.map((opt) => ({
          id: opt.id,
          content: opt.content,
        })),
      },
    }));

    // 3. For review items: in this initial implementation, if review items exist in pool use them
    const reviewItems: FeedCardDto[] = [];

    const pool: FeedCandidatePool = {
      newItems,
      reviewItems,
      questionItems,
    };

    // 4. Assemble using FeedEngineService respecting 60/30/10, anti-repetition, and anti-fatigue
    const assembled = this.engine.assembleFeed(pool, {
      limit,
      currentCardIds,
    });

    return {
      items: assembled.items,
      remainingCount: Math.max(0, newItems.length + reviewItems.length - assembled.items.length),
    };
  }
}

export const feedService = new FeedService();
