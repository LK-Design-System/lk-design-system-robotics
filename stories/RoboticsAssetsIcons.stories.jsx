import React from 'react';
import { ICON_NAMES, Icon } from '@lk-design-system/lds-core';
import { storyDescription } from './StoryGuide.shared.jsx';

/* Curated by hand — deliberately NOT the registry's extension tail. The
   upstream ICON_NAMES appends every late addition to one block, including
   `apple` (an iOS platform glyph for brand badges), and mirroring that tail
   verbatim put a fruit logo on the robotics-concept page. Only names that
   answer to this page's own definition — equipment, space, and viewer-control
   concepts — belong here. */
const LDS_EXTENSION_NAMES = [
  'robot',
  'joystick',
  'waypoint',
  'route',
  'zone',
  'layers',
  'lidar',
  'battery',
  'battery-charging',
  'gauge',
  'signal',
  'crosshair',
  'map',
  'cpu',
  'volume-x',
  'maximize',
  'volume-2',
];

const roboticsExtensionIconNames = LDS_EXTENSION_NAMES.filter((name) => ICON_NAMES.includes(name));

const meta = {
  title: 'LDS Robotics/Assets/Icons',
  tags: ['autodocs'],
  parameters: {
    storyGuide: {
      storyId: 'lds-robotics-assets-icons--robotics-extension-icons',
      eyebrow: 'Robotics / Icons',
      title: '로보틱스 아이콘은 장비와 공간 개념을 같은 시각 언어로 연결합니다',
      description:
        '로봇·경로·센서처럼 일반 제품 아이콘에 없는 로보틱스 개념을 표시할 때 적합합니다. 이미 LDS Core 아이콘으로 표현 가능한 일반 작업에는 확장 아이콘을 새로 만들지 말고 기존 아이콘을 사용하세요.',
    },
    docs: {
      description: {
        component:
          '도메인 전용 컨트롤을 위한 LK ROBOTICS 확장 아이콘 세트입니다. 공유 아이콘 컴포넌트와 레지스트리를 그대로 쓰며, 기본 아이콘 세트는 LDS Core/Foundation의 아이콘 페이지를 참고하세요.',
      },
    },
  },
};

export default meta;

function IconTile({ name }) {
  return (
    <div
      style={{
        display: 'grid',
        placeItems: 'center',
        gap: 9,
        minHeight: 104,
        padding: 14,
        border: '1px solid var(--color-semantic-line-normal-normal)',
        borderRadius: 'var(--radius-md)',
        background: 'var(--color-semantic-background-elevated-normal)',
        color: 'var(--color-semantic-label-normal)',
      }}
    >
      <Icon name={name} size={24} />
      <code style={{ fontSize: 11, color: 'var(--color-semantic-label-neutral)', textAlign: 'center', lineHeight: 1.35 }}>
        {name}
      </code>
      <span style={{ fontSize: 10, color: 'var(--color-semantic-label-alternative)', textAlign: 'center' }}>LDS 확장</span>
    </div>
  );
}

export const RoboticsExtensionIcons = {
  name: '개요',
  parameters: storyDescription(
    '로봇·경로·센서·배터리 등 Robotics 확장 아이콘 전체를 한 격자에서 비교합니다. 이름과 도형이 운영 개념에 일관되게 대응하고 작은 크기에서도 서로 구분되는지 확인하세요.',
  ),
  render: () => {
    return (
      <main style={{ width: 'min(920px, 100%)', display: 'grid', gap: 16 }}>
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(144px, 1fr))', gap: 10 }}>
          {roboticsExtensionIconNames.map((name) => (
            <IconTile key={name} name={name} />
          ))}
        </section>
      </main>
    );
  },
};
