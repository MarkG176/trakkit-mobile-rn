const fs = require('fs');
const path = require('path');
const appJson = require('./app.json');

/**
 * EAS Build only uploads git-tracked files. Prefer an EAS file env var
 * (GOOGLE_SERVICES_JSON); fall back to a local google-services.json for
 * `expo run:android` / local prebuild.
 */
function resolveGoogleServicesFile() {
  if (process.env.GOOGLE_SERVICES_JSON) {
    return process.env.GOOGLE_SERVICES_JSON;
  }
  const localPath = path.join(__dirname, 'google-services.json');
  if (fs.existsSync(localPath)) {
    return './google-services.json';
  }
  return undefined;
}

module.exports = () => {
  const googleServicesFile = resolveGoogleServicesFile();

  return {
    ...appJson.expo,
    android: {
      ...appJson.expo.android,
      ...(googleServicesFile ? { googleServicesFile } : {}),
    },
  };
};
