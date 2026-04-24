import { storage } from 'wxt/storage';

const TOKEN_KEY = 'github-token';

export async function getGithubToken(): Promise<string> {
  const token = await storage.getItem<string>(`local:${TOKEN_KEY}`);
  return token?.trim() ?? '';
}

export async function setGithubToken(token: string): Promise<void> {
  await storage.setItem(`local:${TOKEN_KEY}`, token.trim());
}
