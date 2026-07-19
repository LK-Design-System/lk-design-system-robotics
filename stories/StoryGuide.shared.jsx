import React from 'react';

export function StoryGuide({ eyebrow, title, description, maxWidth = 760 }) {
  return (
    <header data-story-guide style={{ display: 'grid', gap: 'var(--space-2)' }}>
      <p className="lk-overline lk-overline--signal" style={{ margin: 0 }}>
        {eyebrow}
      </p>
      <h1
        style={{
          margin: 0,
          color: 'var(--color-semantic-label-strong)',
          fontSize: 'var(--title2-size)',
          lineHeight: 'var(--title2-line)',
        }}
      >
        {title}
      </h1>
      <p
        style={{
          margin: 0,
          maxWidth,
          color: 'var(--color-semantic-label-neutral)',
          lineHeight: 1.7,
        }}
      >
        {description}
      </p>
    </header>
  );
}

export function storyDescription(story) {
  return {
    docs: {
      description: {
        story,
      },
    },
  };
}
