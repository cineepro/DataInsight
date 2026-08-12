//apps/studio/src/api/menu.ts
import { ID, Query } from 'appwrite';
import { databases } from './appwrite';
import { DATABASE_ID, COLLECTIONS } from '@datainsight/shared';
import type { MenuItem } from '@datainsight/shared';

export async function listMenuItems(tenantId: string): Promise<MenuItem[]> {
  const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.MENU_ITEMS, [
    Query.equal('tenant_id', tenantId),
    Query.orderAsc('name'),
    Query.limit(200),
  ]);
  return response.documents as unknown as MenuItem[];
}

export async function createMenuItem(tenantId: string, name: string, category?: string): Promise<MenuItem> {
  const created = await databases.createDocument(DATABASE_ID, COLLECTIONS.MENU_ITEMS, ID.unique(), {
    tenant_id: tenantId,
    name,
    category: category || undefined,
    active: true,
  });
  return created as unknown as MenuItem;
}

export async function toggleMenuItemActive(itemId: string, active: boolean): Promise<void> {
  await databases.updateDocument(DATABASE_ID, COLLECTIONS.MENU_ITEMS, itemId, { active });
}

export async function deleteMenuItem(itemId: string): Promise<void> {
  await databases.deleteDocument(DATABASE_ID, COLLECTIONS.MENU_ITEMS, itemId);
}