#!/usr/bin/env node
/**
 * Runs on EAS Build before installing dependencies (the `eas-build-pre-install` script).
 *
 * A production build must get the real RevenueCat store key from the EAS "production"
 * environment. Without it, Expo falls back to the Test Store key in .env, which the app ignores
 * in release builds (the SDK would crash on it), so billing would be off and every Pro feature
 * free. Stop the build early with a clear message rather than ship that.
 */
const profile = process.env.EAS_BUILD_PROFILE;
const platform = process.env.EAS_BUILD_PLATFORM;

if (profile === 'production' && (platform === 'android' || platform === 'ios')) {
  const name = platform === 'android' ? 'EXPO_PUBLIC_REVENUECAT_ANDROID_KEY' : 'EXPO_PUBLIC_REVENUECAT_IOS_KEY';
  const prefix = platform === 'android' ? 'goog_' : 'appl_';
  const key = process.env[name] ?? '';
  if (!key.startsWith(prefix)) {
    console.error(
      `\n✗ ${name} is ${key ? `set to a key that doesn't start with "${prefix}"` : 'not set'} for this production build.\n` +
        `  Add the ${platform === 'android' ? 'Google Play' : 'App Store'} public SDK key from RevenueCat (Project settings → API keys)\n` +
        `  as a "production" environment variable on expo.dev (Project → Environment variables), or run:\n` +
        `  npx eas-cli env:create --environment production --name ${name} --value ${prefix}... --visibility plaintext\n`,
    );
    process.exit(1);
  }
}
