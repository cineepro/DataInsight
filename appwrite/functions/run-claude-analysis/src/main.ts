//appwrite/functions/run-claude-analysis/src/main.ts
interface RequestPayload {
  prompt: string;
}

interface ClaudeContentBlock {
  type: string;
  text?: string;
}

interface ClaudeResponse {
  content: ClaudeContentBlock[];
}

/**
 * Reçoit { prompt } depuis apps/studio (appel authentifié : team:admins ou
 * team:analysts uniquement). Appelle l'API Claude côté serveur — la clé
 * ANTHROPIC_API_KEY ne quitte jamais cette Function, jamais exposée au navigateur.
 */
export default async ({ req, res, log, error }: any) => {
  let body: RequestPayload;

  try {
    body = JSON.parse(req.bodyText || '{}');
  } catch {
    return res.json({ error: 'Corps de requête invalide.' }, 400);
  }

  if (!body.prompt) {
    return res.json({ error: 'Paramètre "prompt" manquant.' }, 400);
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 1000,
        messages: [{ role: 'user', content: body.prompt }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      error('Erreur API Claude: ' + errorText);
      return res.json({ error: "Erreur lors de l'appel à l'IA." }, 502);
    }

    const data = (await response.json()) as ClaudeResponse;
    const directives = data.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('\n');

    return res.json({ directives }, 200);
  } catch (err) {
    error('Erreur run-claude-analysis: ' + (err as Error).message);
    return res.json({ error: 'Erreur serveur.' }, 500);
  }
};