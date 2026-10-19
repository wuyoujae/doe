import { MODEL_PRESETS, type ModelProvider } from './model-presets';

export type ModelKind = 'text' | 'image';
export type ModelOptions = {
  contextWindow?: number; thresholdPercentage?: number; maxIterations?: number;
  temperature?: number; topP?: number; maxOutputTokens?: number;
  reasoningEffort?: string; toolChoice?: 'auto' | 'none' | 'required';
  parallelToolCalls?: boolean; stream?: boolean;
  connectTimeoutSeconds?: number; readTimeoutSeconds?: number; requestTimeoutSeconds?: number;
  extraParams?: Record<string, unknown>;
};
export type ModelOptionKey = keyof ModelOptions;
export type ModelOptionDraft = Record<ModelOptionKey, string>;
export type ModelEndpointConfig = {
  provider: ModelProvider; baseUrl: string; model: string; hasApiKey: boolean; options: ModelOptions;
};
export type ModelSettings = Record<ModelKind, ModelEndpointConfig>;
export type ModelSettingsSnapshot = { revision: number; settings: ModelSettings };
export type ModelEndpointDraft = Omit<ModelEndpointConfig, 'options'> & {
  apiKey: string; clearApiKey: boolean; options: ModelOptionDraft;
};
export type ModelSettingsDraft = Record<ModelKind, ModelEndpointDraft>;
export type ModelSettingsField = `${ModelKind}.${string}`;
export type ModelSettingsErrorCode = 'read' | 'invalid' | 'write' | 'conflict' | 'unavailable';

export class ModelSettingsError extends Error {
  constructor(public code: ModelSettingsErrorCode, public field?: ModelSettingsField) {
    super(code);
    this.name = 'ModelSettingsError';
  }
}

export const MODEL_OPTION_LIMITS = {
  contextWindow: { min: 1024, max: 1000000, step: 1 },
  thresholdPercentage: { min: .1, max: .98, step: .01 },
  maxIterations: { min: 1, max: 128, step: 1 },
  temperature: { min: 0, max: 2, step: .1 },
  topP: { min: 0, max: 1, step: .01 },
  maxOutputTokens: { min: 1, max: 1000000, step: 1 },
  connectTimeoutSeconds: { min: 1, max: 120, step: 1 },
  readTimeoutSeconds: { min: 30, max: 3600, step: 1 },
  requestTimeoutSeconds: { min: 60, max: 7200, step: 1 },
} as const;

export function emptyOptionDraft(): ModelOptionDraft {
  return { contextWindow: '', thresholdPercentage: '', maxIterations: '', temperature: '', topP: '',
    maxOutputTokens: '', reasoningEffort: '', toolChoice: '', parallelToolCalls: '', stream: '',
    connectTimeoutSeconds: '', readTimeoutSeconds: '', requestTimeoutSeconds: '', extraParams: '' };
}

export function createEmptyModelSettings(): ModelSettings {
  return {
    text: { provider: 'custom', baseUrl: '', model: '', hasApiKey: false, options: {} },
    image: { provider: 'custom', baseUrl: '', model: '', hasApiKey: false, options: {} },
  };
}

export function toModelDraft(settings: ModelSettings): ModelSettingsDraft {
  const endpoint = (value: ModelEndpointConfig): ModelEndpointDraft => {
    const options = emptyOptionDraft();
    for (const key of Object.keys(options) as ModelOptionKey[]) {
      const item = value.options[key];
      if (item !== undefined && item !== null) options[key] = key === 'extraParams' ? JSON.stringify(item, null, 2) : String(item);
    }
    return { ...value, apiKey: '', clearApiKey: false, options };
  };
  return { text: endpoint(settings.text), image: endpoint(settings.image) };
}

function parseOptions(kind: ModelKind, draft: ModelOptionDraft): ModelOptions {
  const options: Record<string, unknown> = {};
  for (const key of Object.keys(MODEL_OPTION_LIMITS) as Array<keyof typeof MODEL_OPTION_LIMITS>) {
    const raw = draft[key].trim();
    if (!raw) continue;
    const value = Number(raw);
    const { min, max, step } = MODEL_OPTION_LIMITS[key];
    if (!Number.isFinite(value) || value < min || value > max || (step === 1 && !Number.isInteger(value))) {
      throw new ModelSettingsError('invalid', `${kind}.options.${key}`);
    }
    options[key] = value;
  }
  for (const key of ['reasoningEffort', 'toolChoice'] as const) if (draft[key]) options[key] = draft[key];
  for (const key of ['parallelToolCalls', 'stream'] as const) if (draft[key]) options[key] = draft[key] === 'true';
  if (draft.extraParams.trim()) {
    try {
      const value: unknown = JSON.parse(draft.extraParams);
      if (value === null || typeof value !== 'object' || Array.isArray(value)) throw new Error('Not an object');
      options.extraParams = value;
    } catch { throw new ModelSettingsError('invalid', `${kind}.options.extraParams`); }
  }
  const timeout = (options.requestTimeoutSeconds as number | undefined) ?? 900;
  for (const [key, fallback] of [['connectTimeoutSeconds', 15], ['readTimeoutSeconds', 300]] as const) {
    if (((options[key] as number | undefined) ?? fallback) > timeout) throw new ModelSettingsError('invalid', `${kind}.options.${key}`);
  }
  return options as ModelOptions;
}

export function modelSettingsPayload(draft: ModelSettingsDraft) {
  const endpoint = (kind: ModelKind) => {
    const value = draft[kind];
    const baseUrl = (value.provider === 'custom' ? value.baseUrl : MODEL_PRESETS[value.provider].baseUrl).trim().replace(/\/+$/, '');
    const model = value.model.trim();
    const apiKey = value.apiKey.trim();
    if (baseUrl || model || apiKey || value.hasApiKey && !value.clearApiKey) {
      try {
        const url = new URL(baseUrl);
        if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash || baseUrl.length > 2048) throw new Error('Invalid URL');
      } catch { throw new ModelSettingsError('invalid', `${kind}.baseUrl`); }
      if (!model || model.length > 256) throw new ModelSettingsError('invalid', `${kind}.model`);
    }
    if (apiKey.length > 8192) throw new ModelSettingsError('invalid', `${kind}.apiKey`);
    return { provider: value.provider, baseUrl, model, options: parseOptions(kind, value.options),
      ...(apiKey ? { apiKey } : value.clearApiKey ? { apiKey: '' } : {}) };
  };
  return { text: endpoint('text'), image: endpoint('image') };
}

async function requestSettings(init: RequestInit, failure: 'read' | 'write'): Promise<ModelSettingsSnapshot> {
  let response: Response;
  try { response = await fetch('/api/v1/model-settings', { ...init, cache: 'no-store', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', ...init.headers } }); }
  catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ModelSettingsError(failure === 'read' ? 'unavailable' : 'write');
  }
  let result: unknown;
  try { result = await response.json(); } catch { throw new ModelSettingsError(failure === 'read' ? 'unavailable' : 'write'); }
  if (!response.ok) {
    const error = (result as { error?: { code?: string; field?: ModelSettingsField } })?.error;
    throw new ModelSettingsError(response.status === 409 ? 'conflict' : response.status === 400 || response.status === 413 ? 'invalid' : failure, error?.field);
  }
  const snapshot = result as ModelSettingsSnapshot;
  if (!Number.isSafeInteger(snapshot?.revision) || !snapshot.settings?.text || !snapshot.settings?.image) throw new ModelSettingsError(failure);
  return snapshot;
}

export const readModelSettings = (signal?: AbortSignal) => requestSettings({ method: 'GET', signal }, 'read');
export const saveModelSettings = (draft: ModelSettingsDraft, revision: number, signal?: AbortSignal) =>
  requestSettings({ method: 'PUT', body: JSON.stringify({ revision, settings: modelSettingsPayload(draft) }), signal }, 'write');

const LEGACY_STORAGE_KEY = 'yrkie-open-source:model-settings';
export type LegacyModelSettings = { raw: string; draft: ModelSettingsDraft };
export function readLegacyModelSettings(): LegacyModelSettings | null {
  const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!raw) return null;
  const stored = JSON.parse(raw);
  if (stored?.version !== 1 || !stored.settings) throw new ModelSettingsError('read');
  const draft = toModelDraft(createEmptyModelSettings());
  for (const kind of ['text', 'image'] as const) {
    for (const key of ['baseUrl', 'model', 'apiKey'] as const) {
      if (typeof stored.settings[kind]?.[key] !== 'string') throw new ModelSettingsError('read');
      draft[kind][key] = stored.settings[kind][key];
    }
  }
  return Object.values(draft).some(value => value.baseUrl || value.model || value.apiKey) ? { raw, draft } : null;
}

export function removeImportedLegacySettings(legacy: LegacyModelSettings): boolean {
  try {
    if (localStorage.getItem(LEGACY_STORAGE_KEY) !== legacy.raw) return false;
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    return true;
  } catch { return false; }
}
