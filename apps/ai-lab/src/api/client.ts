//apps/ai-lab/src/api/client.ts
import { Client, Functions, Account, Databases } from 'appwrite';

const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

export const functions = new Functions(client);
export const account = new Account(client);
export const databases = new Databases(client);
export default client;