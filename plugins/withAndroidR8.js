const {
  withAppBuildGradle,
  withGradleProperties,
} = require('expo/config-plugins');

/**
 * Enables AGP 8.12 optimized resource shrinking and switches the default
 * ProGuard file to proguard-android-optimize.txt so R8 actually optimizes.
 */
function withAndroidR8(config) {
  config = withGradleProperties(config, (config) => {
    const key = 'android.r8.optimizedResourceShrinking';
    const existing = config.modResults.find(
      (item) => item.type === 'property' && item.key === key
    );
    if (existing) {
      existing.value = 'true';
    } else {
      config.modResults.push({
        type: 'property',
        key,
        value: 'true',
      });
    }
    return config;
  });

  config = withAppBuildGradle(config, (config) => {
    if (config.modResults.language !== 'groovy') {
      throw new Error(
        'withAndroidR8: expected groovy app/build.gradle, got ' +
          config.modResults.language
      );
    }

    const contents = config.modResults.contents;
    if (!contents.includes('proguard-android.txt')) {
      throw new Error(
        'withAndroidR8: could not find proguard-android.txt in app/build.gradle'
      );
    }

    config.modResults.contents = contents.replace(
      'proguard-android.txt',
      'proguard-android-optimize.txt'
    );
    return config;
  });

  return config;
}

module.exports = withAndroidR8;
