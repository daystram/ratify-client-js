import { ITokenStorage } from "./ITokenStorage";

export class MemoryStorage implements ITokenStorage {
  private tokens: { [key: string]: string };

  constructor() {
    this.tokens = {};
  }

  getItem(key: string): string | null {
    return this.tokens[key];
  }

  setItem(key: string, value: string): void {
    this.tokens[key] = value;
  }

  removeItem(key: string): void {
    delete this.tokens[key];
  }
}
