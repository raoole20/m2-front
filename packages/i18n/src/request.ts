import { defaultLocale, type Locale } from "./config";
import { sharedMessages } from "./messages";

type MessageRecord = Record<string, unknown>;

type RequestConfigOptions = {
  locale: Locale;
  appMessages?: MessageRecord;
};

function deepMerge(base: MessageRecord, overrides: MessageRecord): MessageRecord {
  const output: MessageRecord = { ...base };

  for (const [key, value] of Object.entries(overrides)) {
    if (
      typeof value === "object" &&
      value !== null &&
      !Array.isArray(value) &&
      typeof output[key] === "object" &&
      output[key] !== null &&
      !Array.isArray(output[key])
    ) {
      output[key] = deepMerge(output[key] as MessageRecord, value as MessageRecord);
      continue;
    }

    output[key] = value;
  }

  return output;
}

export function getRequestConfig({ locale, appMessages = {} }: RequestConfigOptions) {
  const requestedLocale = locale in sharedMessages ? locale : defaultLocale;
  const fallback = sharedMessages[defaultLocale] as unknown as MessageRecord;
  const shared = sharedMessages[requestedLocale] as unknown as MessageRecord;
  const merged = deepMerge(deepMerge(fallback, shared), appMessages);
  const nodeEnv = (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process?.env
    ?.NODE_ENV;
  const isProduction = nodeEnv === "production";

  return {
    locale: requestedLocale,
    messages: merged,
    onError: (error: { code?: string; originalMessage?: string }) => {
      if (!isProduction) {
        const missingKey = error.code === "MISSING_MESSAGE";
        if (missingKey && error.originalMessage) {
          console.warn(`missing translation: ${requestedLocale}.${error.originalMessage}`);
        }
      }
    },
  };
}
