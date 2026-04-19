function loadDesignPreset() {
  try {
    const imported = require("@m2/design/tailwind-preset.cjs");
    return imported.tailwindPreset || imported.default || imported;
  } catch {
    return {
      theme: {
        extend: {},
      },
      plugins: [],
    };
  }
}

module.exports = loadDesignPreset();
