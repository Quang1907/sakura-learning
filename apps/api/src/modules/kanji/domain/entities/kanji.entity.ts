export interface KanjiEntity {
  id: number;
  character: string;
  hanViet: string;
  onyomi: string;
  kunyomi: string;
  strokeCount: number;
  radical?: string | null;
  meaningVi: string;
  jlptLevels: string[];
}
