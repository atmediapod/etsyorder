
export interface ParseResult {
  id: string;
  originalText: string;
  blocks: {
    tabData: string;
    validation: string;
  }[];
  timestamp: Date;
}
