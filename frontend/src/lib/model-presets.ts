import providers from '../../../packages/model-catalog/providers.json';

/** Shared with backend validation; optional parameters remain model-specific. */
export const MODEL_PRESETS = providers;
export type ModelProvider = keyof typeof MODEL_PRESETS;
const PROVIDERS = Object.keys(MODEL_PRESETS) as ModelProvider[];
export const TEXT_MODEL_PROVIDERS = PROVIDERS.filter((id) => MODEL_PRESETS[id].kinds.includes('text'));
export const IMAGE_MODEL_PROVIDERS = PROVIDERS.filter((id) => MODEL_PRESETS[id].kinds.includes('image'));
