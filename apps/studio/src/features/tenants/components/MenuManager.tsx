//apps/studio/src/features/tenants/components/MenuManager.tsx
import { useEffect, useState } from 'react';
import type { MenuItem } from '@datainsight/shared';
import { listMenuItems, createMenuItem, toggleMenuItemActive, deleteMenuItem } from '../../../api/menu';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';

interface MenuManagerProps {
  tenantSlug: string;
}

// Gestion volontairement minimale : un nom, une catégorie facultative,
// actif/inactif. Pas de prix, pas de photo — ce n'est pas un vrai menu
// digital, juste de quoi savoir ce que le client a pris dans son avis.
export default function MenuManager({ tenantSlug }: MenuManagerProps) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [adding, setAdding] = useState(false);

  async function refresh() {
    setLoading(true);
    const data = await listMenuItems(tenantSlug);
    setItems(data);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, [tenantSlug]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    try {
      await createMenuItem(tenantSlug, newName.trim(), newCategory.trim() || undefined);
      setNewName('');
      setNewCategory('');
      await refresh();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'ajout.");
    } finally {
      setAdding(false);
    }
  }

  async function handleToggle(item: MenuItem) {
    await toggleMenuItemActive(item.$id, !item.active);
    refresh();
  }

  async function handleDelete(item: MenuItem) {
    if (!confirm(`Supprimer "${item.name}" du menu ?`)) return;
    await deleteMenuItem(item.$id);
    refresh();
  }

  return (
    <div className="border-t border-neutral-200 pt-4">
      <h3 className="mb-3 font-mono text-[11px] uppercase tracking-wide text-neutral-500">
        Menu — plats proposés dans le formulaire d'avis
      </h3>

      <form onSubmit={handleAdd} className="mb-4 flex gap-2">
        <div className="flex-1">
          <Input placeholder="Nom du plat" value={newName} onChange={(e) => setNewName(e.target.value)} />
        </div>
        <div className="w-32">
          <Input placeholder="Catégorie" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} />
        </div>
        <Button type="submit" variant="secondary" loading={adding}>
          Ajouter
        </Button>
      </form>

      {loading ? (
        <p className="text-sm text-neutral-400">Chargement...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-neutral-400">Aucun plat renseigné pour l'instant.</p>
      ) : (
        <div className="flex flex-col divide-y divide-neutral-100 border border-neutral-200">
          {items.map((item) => (
            <div key={item.$id} className="flex items-center justify-between px-3 py-2">
              <div>
                <span className={`text-sm ${item.active ? 'text-ink' : 'text-neutral-400 line-through'}`}>
                  {item.name}
                </span>
                {item.category && <span className="ml-2 text-xs text-neutral-400">{item.category}</span>}
              </div>
              <div className="flex gap-3">
                <button onClick={() => handleToggle(item)} className="text-xs text-neutral-500 underline">
                  {item.active ? 'Désactiver' : 'Réactiver'}
                </button>
                <button onClick={() => handleDelete(item)} className="text-xs text-brick underline">
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}