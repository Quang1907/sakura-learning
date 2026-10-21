import {
  SubmitAnswerDto,
  QuestionResultDto,
} from '@sakura/shared';
import { questionRepository, QuestionRepository } from './question.repository.js';
import { questionGradingService, QuestionGradingService } from './question-grading.service.js';
import { srsService, SrsService } from '../srs/srs.service.js';

export class QuestionService {
  constructor(
    private readonly qRepo: QuestionRepository = questionRepository,
    private readonly gradingService: QuestionGradingService = questionGradingService,
    private readonly srs: SrsService = srsService,
  ) {}

  /**
   * Submit an answer to a question and grade server-side.
   * Answers are NEVER sent to the client beforehand.
   */
  public async submitAnswer(
    questionId: number,
    dto: SubmitAnswerDto,
    _userId: number,
  ): Promise<QuestionResultDto> {
    const question = await this.qRepo.findById(questionId);
    if (!question) {
      throw new Error(`Question with id ${questionId} not found`);
    }

    // Grade answer through QuestionGradingService
    const grading = this.gradingService.gradeAnswer(question, {
      selectedOptionId: dto.selectedOptionId,
      textAnswer: dto.textAnswer,
      durationMs: dto.durationMs,
    });

    // Calculate SRS update
    const action = grading.isCorrect ? 'ANSWER_CORRECT' : 'ANSWER_INCORRECT';
    const srsResult = this.srs.calculateNextReview(0, action);

    return {
      isCorrect: grading.isCorrect,
      correctOptionId: grading.correctOptionId,
      explanation: grading.explanation,
      expEarned: grading.expEarned,
      srsUpdated: true,
      nextReviewAt: srsResult.nextReviewAt.toISOString(),
    };
  }
}

export const questionService = new QuestionService();
