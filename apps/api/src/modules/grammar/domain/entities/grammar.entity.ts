export interface GrammarEntity {
  id: number;
  title: string;
  pattern: string;
  meaningVi: string;
  jlptLevel: string;
  explanation?: string | null;
}
