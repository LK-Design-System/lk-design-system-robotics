const config = {
  stories: ['../stories/**/*.stories.@(js|jsx)'],
  staticDirs: [
    { from: '../tokens', to: '/tokens' },
    { from: '../styles.css', to: '/styles.css' },
  ],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  framework: { name: '@storybook/react-vite', options: {} },
  docs: { defaultName: 'Docs' },
  core: { allowedHosts: ['localhost', '127.0.0.1'], disableTelemetry: true },
};

export default config;
