const config = {
  stories: ['../stories/**/*.stories.@(js|jsx)'],
  // styles.css is imported as a module from preview.jsx; serving it as a
  // static file on the same /styles.css URL shadows Vite's module transform
  // in dev mode and breaks the preview bootstrap.
  staticDirs: [
    { from: '../tokens', to: '/tokens' },
    { from: './public-docs', to: '/' },
  ],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  framework: { name: '@storybook/react-vite', options: {} },
  docs: { defaultName: 'Docs' },
  features: {
    // Robotics consumers need the domain navigation, not Storybook's product tutorial.
    sidebarOnboardingChecklist: false,
    menuOnboardingChecklist: false,
  },
  core: { allowedHosts: ['localhost', '127.0.0.1'], disableTelemetry: true },
  viteFinal: async (config) => {
    const allowedHosts = config.server?.allowedHosts === true
      ? true
      : Array.from(new Set([...(config.server?.allowedHosts || []), 'localhost', '127.0.0.1']));

    return {
      ...config,
      // Keep the licenses of every dependency bundled into the public static
      // Storybook artifact alongside the hand-curated source notices.
      build: {
        ...config.build,
        license: { fileName: 'licenses/BUNDLED_DEPENDENCIES.md' },
      },
      // A sibling-checkout LDS core linked via file:/link: brings its own React
      // copy; dedupe keeps every import on this repository's single instance.
      resolve: {
        ...config.resolve,
        dedupe: Array.from(new Set([...(config.resolve?.dedupe || []), 'react', 'react-dom'])),
      },
      server: {
        ...config.server,
        allowedHosts,
      },
    };
  },
};

export default config;
