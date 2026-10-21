// Unlinking an AI provider ("إلغاء الربط").
//
// The settings page could store a key and change it, but never remove one: once
// a provider was linked the owner had no way to disconnect it. Dropping the key
// is not enough on its own — the feature must not be left switched on pointing
// at a provider that can no longer answer, or every AI button would fail.

import { AI_PROVIDERS } from "../Config/ai.mjs";

const other = (provider) => AI_PROVIDERS.find((p) => p !== provider);

const hasKey = (settings, provider) =>
    Boolean(provider && settings?.[`${provider}_api_key`]);

/**
 * The columns to write when unlinking `provider`.
 *
 * - the provider's key and model are cleared
 * - if it was the active one and the other provider is linked, that one takes over
 * - if nothing is linked any more, the whole feature is switched off
 *
 * @returns {object} a patch for AiSetting.update
 */
export const disconnectPatch = (settings, provider) => {
    const patch = {
        [`${provider}_api_key`]: null,
        [`${provider}_model`]: null,
    };

    const fallback = other(provider);
    const fallbackLinked = hasKey(settings, fallback);

    if (settings?.active_provider === provider && fallbackLinked) {
        patch.active_provider = fallback;
    }

    // Nothing left to talk to → do not leave the feature "on".
    if (!fallbackLinked) {
        patch.enabled = false;
    }

    return patch;
};
