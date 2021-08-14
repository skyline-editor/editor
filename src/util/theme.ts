export interface Theme {
  id: string;
  label: string;

  colors: {
    background?: string;
    lineNumber?: string;
    selection?: string;
    cursor?: string;

    tokens?: {
      string?: string,
      number?: string,
      operator?: string,
      boolean?: string,
      static?: string,
      keyword?: string,
      variable?: string,
      property?: string,
      comment?: string,
      normal?: string
    }
  }
}