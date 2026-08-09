// apps/collect/src/api/client.ts
import { Client, Functions, Databases } from 'appwrite';

const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

export const functions = new Functions(client);
export const databases = new Databases(client); // utilisé uniquement pour createDocument (scans), jamais pour lire `tenants`
export default client;