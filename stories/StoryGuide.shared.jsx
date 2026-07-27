import React from 'react';
import { PageHeader } from '@lk-robotics/lds-product';

/**
 * Keep the Robotics canvas masthead on the same LDS Product page-header
 * contract used by the main LDS Storybook. Storybook chrome is part of the
 * design-system surface, so it must not maintain a private heading treatment.
 */
export function StoryGuide({
  eyebrow,
  title,
  description,
  headingLevel = 1,
  size = 'md',
}) {
  return (
    <PageHeader
      data-story-guide
      headingLevel={headingLevel}
      size={size}
      eyebrow={eyebrow}
      title={title}
      description={description}
    />
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
