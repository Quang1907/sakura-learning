export interface VocabularyEntity {
  id: number;
  word: string;
  reading: string;
  romaji?: string | null;
  partOfSpeech: string;
  meaningVi: string;
  jlptLevels: string[];
}
