import '@lk-robotics/lds-core/styles.css';
import '@lk-robotics/lds-theme/styles.css';
import '@lk-robotics/lds-product/styles.css';
import '../styles.css';
import React from 'react';
import {
  LdsStorybookDecisionGuide,
  LdsStorybookDocsStyles,
  LdsStorybookGuideLayout,
} from '@lk-robotics/lds-product/storybook';
import {
  Description,
  DocsContext,
  Subtitle,
  Title,
} from '@storybook/addon-docs/blocks';
import { StoryGuide } from '../stories/StoryGuide.shared.jsx';

const canvasShell = (viewMode) => ({
  minHeight: viewMode === 'docs' ? 0 : '100vh',
  boxSizing: 'border-box',
  padding: 'clamp(16px, 5vw, 32px)',
  background: 'var(--color-semantic-background-normal-normal)',
  color: 'var(--color-semantic-label-normal)',
  fontFamily: 'var(--font-sans)',
});

const darkBackgroundNames = new Set(['dark', 'navy', 'inverse']);
const storybookBackgrounds = {
  base: 'var(--color-semantic-background-normal-alternative)',
  card: 'var(--color-semantic-background-elevated-normal)',
  navy: 'color-mix(in srgb, var(--color-semantic-static-black) 88%, var(--color-semantic-primary-normal))',
  dark: 'color-mix(in srgb, var(--color-semantic-static-black) 94%, var(--color-semantic-primary-normal))',
};
const darkBackgroundValues = new Set([storybookBackgrounds.navy, storybookBackgrounds.dark]);

function normalizeBackground(value) {
  if (value == null) return '';
  if (typeof value === 'object' && 'value' in value) return normalizeBackground(value.value);
  return String(value).trim().toLowerCase();
}

function isDarkBackground(value) {
  const background = normalizeBackground(value);
  if (darkBackgroundNames.has(background) || darkBackgroundValues.has(background)) return true;

  const hex = background.match(/^#([0-9a-f]{6})$/i);
  if (!hex) return false;

  const r = Number.parseInt(hex[1].slice(0, 2), 16);
  const g = Number.parseInt(hex[1].slice(2, 4), 16);
  const b = Number.parseInt(hex[1].slice(4, 6), 16);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 110;
}

function getBackgroundValue(context) {
  const backgrounds = context.globals?.backgrounds;
  return typeof backgrounds === 'object' ? backgrounds?.value : backgrounds;
}

function RoboticsGuideDocsPage() {
  const docsContext = React.useContext(DocsContext);
  let guide;
  try {
    const meta = docsContext?.attachedCSFFile?.meta;
    const primaryStory = docsContext?.componentStories?.()?.[0];
    guide = primaryStory?.parameters?.storyGuide ?? meta?.parameters?.storyGuide;
  } catch {
    guide = undefined;
  }

  return (
    <>
      <Title />
      <Subtitle />
      <Description />
      <LdsStorybookDocsStyles />
      {guide ? (
        <LdsStorybookGuideLayout data-story-guide-docs-layout>
          <LdsStorybookDecisionGuide
            title={guide.title}
            description={guide.docsDescription ?? guide.description}
          />
        </LdsStorybookGuideLayout>
      ) : null}
    </>
  );
}

export const decorators = [
  (Story, context) => {
    const guide = context.parameters?.storyGuide;
    const showGuide = guide?.storyId === context.id
      && guide?.hideCanvasHeader !== true
      && context.viewMode !== 'docs';
    const theme = isDarkBackground(getBackgroundValue(context)) ? 'dark' : 'light';
    return (
      <div data-theme={theme} className={`theme-${theme}`} style={canvasShell(context.viewMode)}>
        {showGuide ? (
          <div data-story-guide-layout style={{ display: 'grid', gap: 'var(--space-6)', minWidth: 0 }}>
            <StoryGuide
              eyebrow={guide.eyebrow}
              title={guide.title}
              description={guide.description}
            />
            <div style={{ minWidth: 0 }}>
              <Story />
            </div>
          </div>
        ) : (
          <Story />
        )}
      </div>
    );
  },
];

export const parameters = {
  layout: 'fullscreen',
  backgrounds: {
    default: 'Base',
    values: [
      { name: 'Base', value: storybookBackgrounds.base },
      { name: 'Card', value: storybookBackgrounds.card },
      { name: 'Navy', value: storybookBackgrounds.navy },
      { name: 'Dark', value: storybookBackgrounds.dark },
    ],
  },
  docs: { toc: false, page: RoboticsGuideDocsPage },
  options: {
    storySort: (a, b) => {
      const titleA = a.title.trim().split(/\s*\/\s*/);
      const titleB = b.title.trim().split(/\s*\/\s*/);
      const groupOrder = {
        '': ['LDS Robotics'],
        'LDS Robotics': ['Foundation', 'Assets', 'Control', 'Status', 'Data', 'Navigation', 'Viewer'],
        'LDS Robotics/Foundation': [
          'Codes',
          'Unit Format',
          'Viewer Tokens',
          'State Badge',
          'Marker Pin',
          'Facility Glyph',
          'Hazard Glyph',
          'Vector Glyph',
        ],
        'LDS Robotics/Control': ['Directional Pad', 'Joystick', 'Manual Control Session'],
        'LDS Robotics/Status': ['Robot State'],
        'LDS Robotics/Viewer': ['Navigation Viewer', '2D Map'],
        'LDS Robotics/Viewer/2D Map': ['Occupancy Layer'],
        'LDS Robotics/Navigation': [
          'Waypoint',
          'Robot Pose',
          'Regions',
          'Facility Transition',
          'Hazard Marker',
          'Annotation Layer',
          'Path System',
        ],
        'LDS Robotics/Navigation/Path System': ['Shared Rules', 'Lane', 'Route', 'Trajectory'],
      };

      if (a.title === b.title) {
        const storyOrder = ['개요', '참조 · ', '사용법 · ', '변형·상태 · ', '상호작용 · ', '반응형 · ', '시나리오 · '];
        const storyRank = (name) => {
          const index = storyOrder.findIndex((prefix) => name === prefix.trim() || name.startsWith(prefix));
          return index === -1 ? storyOrder.length : index;
        };
        const rankA = storyRank(a.name);
        const rankB = storyRank(b.name);
        return rankA - rankB || a.name.localeCompare(b.name, 'ko', { numeric: true, sensitivity: 'accent' });
      }

      const depth = Math.max(titleA.length, titleB.length);
      for (let index = 0; index < depth; index += 1) {
        const segmentA = titleA[index];
        const segmentB = titleB[index];
        if (segmentA === segmentB) continue;
        if (segmentA == null) return -1;
        if (segmentB == null) return 1;

        const parent = titleA.slice(0, index).join('/');
        const order = groupOrder[parent] || [];
        const orderA = order.indexOf(segmentA);
        const orderB = order.indexOf(segmentB);
        if (orderA !== -1 || orderB !== -1) {
          return (orderA === -1 ? order.length : orderA) - (orderB === -1 ? order.length : orderB);
        }

        return segmentA.localeCompare(segmentB, 'en', { numeric: true, sensitivity: 'accent' });
      }

      return 0;
    },
  },
};
