//apps/studio/src/features/datasets/utils/parseSpreadsheet.ts
import * as XLSX from 'xlsx';

export interface ParsedSpreadsheet {
  headers: string[];
  rows: Record<string, unknown>[]; // clé = en-tête original, valeur brute telle que lue dans le fichier
}

/**
 * Lit un fichier .xlsx/.xls/.csv entièrement dans le navigateur — aucun
 * envoi vers un serveur pour le parsing. Prend uniquement la première
 * feuille du classeur (suffisant pour l'usage prévu : un fichier = un
 * jeu de données ; si besoin de multi-feuilles plus tard, on adaptera).
 */
export async function parseSpreadsheet(file: File): Promise<ParsedSpreadsheet> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });

  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('Le fichier ne contient aucune feuille exploitable.');
  }

  const sheet = workbook.Sheets[firstSheetName];

  // defval: '' évite que des cellules vides fassent disparaître des clés
  // d'un objet à l'autre (SheetJS omet par défaut les cellules vides).
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

  if (rawRows.length === 0) {
    throw new Error('Aucune ligne de données trouvée dans le fichier.');
  }

  // Les en-têtes sont déduits de la première ligne — SheetJS utilise déjà
  // la première ligne du fichier comme clés d'objet par défaut.
  const headers = Object.keys(rawRows[0]);

  return { headers, rows: rawRows };
}