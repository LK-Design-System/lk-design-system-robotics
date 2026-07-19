import '@lk-robotics/lds-core/styles.css';
import '@lk-robotics/lds-theme/styles.css';
import '@lk-robotics/lds-product/styles.css';
import '../styles.css';
import React from 'react';
import { StoryGuide } from '../stories/StoryGuide.shared.jsx';

export const decorators = [
  (Story, context) => {
    const guide = context.parameters?.storyGuide;
    const showGuide = guide?.storyId === context.id;
    return (
      <div data-theme="light" className="theme-light" style={{ minHeight: '100vh', boxSizing: 'border-box', padding: 'clamp(16px, 5vw, 32px)', background: 'var(--color-semantic-background-normal-normal)', color: 'var(--color-semantic-label-normal)', fontFamily: 'var(--font-sans)' }}>
        {showGuide ? <div style={{ display: 'grid', gap: 'var(--space-6)', minWidth: 0 }}><StoryGuide {...guide} /><Story /></div> : <Story />}
      </div>
    );
  },
];

export const parameters = {
  layout: 'fullscreen',
  docs: { toc: true },
  options: { storySort: (a, b) => a.title.localeCompare(b.title, 'en') || a.name.localeCompare(b.name, 'ko') },
};
