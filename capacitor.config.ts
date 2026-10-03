// Kept dependency-free so web builds do not require native SDK packages.
const config = {
  appId: "xyz.colormerge.app",
  appName: "Color Merge",
  webDir: "dist/public",
  server: { androidScheme: "https" },
  ios: { contentInset: "automatic" },
};
export default config;
