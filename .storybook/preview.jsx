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
  options: {
    storySort: (a, b) => {
      const titleA = a.title.trim().split(/\s*\/\s*/);
      const titleB = b.title.trim().split(/\s*\/\s*/);
      const groupOrder = {
        '': ['LDS Robotics'],
        'LDS Robotics': ['Foundation', 'Assets', 'Control', 'Status', 'Data', 'Editor', 'Viewer', 'Navigation'],
        'LDS Robotics/Foundation': [
          'State Badge',
          'Marker Pin',
          'Facility Glyph',
          'Hazard Glyph',
          'Vector Glyph',
          'Codes',
          'Unit Format',
          'Viewer Tokens',
        ],
        'LDS Robotics/Navigation': [
          'Waypoint',
          'Lane',
          'Route',
          'Trajectory',
          'Regions',
          'Facility Transition',
          'Hazard Marker',
          'Annotation Layer',
        ],
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
