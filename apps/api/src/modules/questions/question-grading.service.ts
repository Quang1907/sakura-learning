import { QuestionType } from '@sakura/shared';

export interface QuestionOptionData {
  id: number;
  content: string;
  isCorrect: boolean;
  orderIndex?: number;
}

export interface QuestionData {
  id: number;
  questionType: QuestionType;
  prompt: string;
  explanationVi: string;
  acceptableAnswers?: string[] | null;
  options: QuestionOptionData[];
}

export interface SubmissionData {
  selectedOptionId?: number | null;
  textAnswer?: string | null;
  durationMs?: number;
}

export interface GradingResult {
  isCorrect: boolean;
  correctOptionId?: number;
  explanation: string;
  expEarned: number;
}

export class QuestionGradingService {
  public static readonly EXP_CORRECT = 10;
  public static readonly EXP_INCORRECT = 0;

  /**
   * Normalizes a string by trimming, applying Unicode NFC normalization,
   * and converting to lower case.
   */
  public normalizeText(text: string): string {
    return text
      .trim()
      .normalize('NFC')
      .toLowerCase()
      .replace(/[\s\u3000]+/g, ' '); // collapse standard & full-width spaces
  }

  /**
   * Strips all spaces for Japanese sentences or phrases where spacing is optional.
   */
  public stripSpaces(text: string): string {
    return text.replace(/[\s\u3000]/g, '');
  }

  /**
   * Grade a learner submission against question definition.
   */
  public gradeAnswer(question: QuestionData, submission: SubmissionData): GradingResult {
    let isCorrect = false;
    let correctOptionId: number | undefined;

    // Find the correct option if available in options list
    const correctOpt = question.options.find((opt) => opt.isCorrect);
    if (correctOpt) {
      correctOptionId = correctOpt.id;
    }

    switch (question.questionType) {
      case 'MULTIPLE_CHOICE':
      case 'MEANING_MATCH': {
        if (
          submission.selectedOptionId !== null &&
          submission.selectedOptionId !== undefined &&
          correctOptionId !== undefined
        ) {
          isCorrect = submission.selectedOptionId === correctOptionId;
        }
        break;
      }

      case 'FILL_IN_BLANK':
      case 'ORDER_WORDS': {
        const submitted = submission.textAnswer ?? '';
        const normalizedSubmitted = this.normalizeText(submitted);
        const strippedSubmitted = this.stripSpaces(normalizedSubmitted);

        const acceptable = question.acceptableAnswers ?? [];
        if (acceptable.length > 0 && strippedSubmitted.length > 0) {
          isCorrect = acceptable.some((ans) => {
            const normalizedAns = this.normalizeText(ans);
            const strippedAns = this.stripSpaces(normalizedAns);
            return (
              normalizedSubmitted === normalizedAns ||
              strippedSubmitted === strippedAns
            );
          });
        }
        break;
      }

      default: {
        isCorrect = false;
      }
    }

    return {
      isCorrect,
      correctOptionId,
      explanation: question.explanationVi,
      expEarned: isCorrect
        ? QuestionGradingService.EXP_CORRECT
        : QuestionGradingService.EXP_INCORRECT,
    };
  }
}

export const questionGradingService = new QuestionGradingService();
