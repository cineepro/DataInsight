//packages/shared/src/types/menuItem.ts
export interface MenuItem {
  $id: string;
  tenant_id: string;
  name: string;
  category?: string; // ex: "Plat", "Boisson", "Dessert" — libre, juste pour trier l'affichage
  active: boolean;
}