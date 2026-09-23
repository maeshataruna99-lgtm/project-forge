import { z } from 'zod';
import { catalogSchema, type GeneratorCatalog, type ProjectConfig } from '@project-forge/contracts';

const generationPlanSchema = z.strictObject({
  projectName: z.string(),
  profile: z.literal('minimal'),
  files: z.array(z.string()),
  theme: z.strictObject({
    mode: z.enum(['light', 'dark']),
    primary: z.string(),
    accent: z.string(),
  }),
});

export type GenerationPlan = z.infer<typeof generationPlanSchema>;
export type GeneratorApiIssue = { path: string; message: string };

export class GeneratorApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly code?: string,
    public readonly issues?: GeneratorApiIssue[],
    public readonly correlationId?: string,
  ) {
    super(message);
    this.name = 'GeneratorApiError';
  }
}

const errorPayloadSchema = z.object({
  code: z.string().optional(),
  message: z.string().optional(),
  issues: z.array(z.object({ path: z.string(), message: z.string() })).optional(),
  correlationId: z.string().optional(),
});

async function requireSuccess(response: Response): Promise<Response> {
  if (response.ok) return response;
  const body = await response.json().catch(() => null);
  const parsed = errorPayloadSchema.safeParse(body);
  const error = parsed.success ? parsed.data : {};
  const message = error.message || error.issues?.map(issue => issue.message).join('; ') || error.code || `Request failed (${response.status})`;
  throw new GeneratorApiError(message, response.status, error.code, error.issues, error.correlationId);
}

function jsonRequest(config: ProjectConfig): RequestInit {
  return { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(config) };
}

async function request(url: string, init?: RequestInit): Promise<Response> {
  try {
    return await requireSuccess(await (init ? fetch(url, init) : fetch(url)));
  } catch (error) {
    if (error instanceof GeneratorApiError) throw error;
    if (error instanceof Error) throw new GeneratorApiError(error.message);
    throw new GeneratorApiError('Network request failed');
  }
}

export async function fetchCatalog(): Promise<GeneratorCatalog> {
  const response = await request('/generator/catalog');
  return catalogSchema.parse(await response.json());
}

export async function validateConfig(config: ProjectConfig): Promise<GenerationPlan> {
  const response = await request('/generator/validate', jsonRequest(config));
  return generationPlanSchema.parse(await response.json());
}

function archiveFilename(disposition: string | null, fallback: string): string {
  const match = disposition?.match(/(?:^|;)\s*filename\s*=\s*(?:"([^"]*)"|([^;\s]*))/i);
  const filename = match?.[1] ?? match?.[2];
  if (!filename || !/^[a-zA-Z0-9][a-zA-Z0-9._-]*\.zip$/i.test(filename) || filename.includes('..')) return fallback;
  return filename;
}

export async function downloadArchive(config: ProjectConfig): Promise<{ blob: Blob; filename: string }> {
  const response = await request('/generator/archive', jsonRequest(config));
  return {
    blob: await response.blob(),
    filename: archiveFilename(response.headers.get('Content-Disposition'), `${config.project.name}.zip`),
  };
}
