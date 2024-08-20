export interface Rule {
  name: string;
  rules: string[] | (() => Promise<string[]>);
}
