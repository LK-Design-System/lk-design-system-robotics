import React from 'react';
import { Map2DCanvas } from '@lk-robotics/lds-product';
import { RobotPoseMarker } from '../src/index.js';
import { storyDescription } from './StoryGuide.shared.jsx';
import { assertContrastBackedFocus, contrastRatio } from './RoboticsNavigationAssert.shared.jsx';

const ROBOT_VARIANTS = [
  {
    key: 'default',
    label: '기본 pose',
    pose: {
      id: 'robot-pose-default',
      label: 'AMR 01',
      mapId: 'L1',
      position: { x: 62, y: 74 },
      headingRad: 0,
      state: 'moving',
    },
  },
  {
    key: 'stopped',
    label: '정지',
    pose: {
      id: 'robot-pose-stopped',
      label: 'AMR 02',
      mapId: 'L1',
      position: { x: 236, y: 74 },
      headingRad: Math.PI / 2,
      state: 'idle',
    },
  },
  {
    key: 'offline',
    label: '통신 끊김',
    pose: {
      id: 'robot-pose-offline',
      label: 'AMR 03',
      mapId: 'L1',
      position: { x: 62, y: 158 },
      headingRad: -Math.PI / 4,
      state: 'offline',
    },
  },
  {
    key: 'fault',
    label: '오류',
    pose: {
      id: 'robot-pose-fault',
      label: 'AMR 04',
      mapId: 'L1',
      position: { x: 236, y: 158 },
      headingRad: Math.PI,
      state: 'fault',
    },
  },
];

const INTERACTION_VARIANTS = [
  {
    key: 'default',
    label: '기본',
    description: '상호작용 없음',
    markerProps: {},
  },
  {
    key: 'selected',
    label: '선택됨',
    description: '지속되는 선택 상태',
    markerProps: { selected: true },
  },
  {
    key: 'focused',
    label: '키보드 포커스',
    description: '현재 키보드 조작 위치',
    markerProps: { focused: true },
  },
  {
    key: 'selected-focused',
    label: '선택 + 포커스',
    description: '두 상태가 동시에 존재',
    markerProps: { selected: true, focused: true },
  },
];

const meta = {
  title: 'LDS Robotics/Navigation/Robot Pose',
  tags: ['autodocs'],
  component: RobotPoseMarker,
  parameters: {
    storyGuide: {
      storyId: 'lds-robotics-navigation-robot-pose--overview',
      eyebrow: 'Robotics / Navigation / Robot Pose',
      title: '로봇의 위치와 실제 heading은 경로 진행률과 분리해 표현합니다',
      description:
        'RobotPoseMarker는 모든 상태에 동일한 본체와 heading을 사용합니다. 이동 중은 약한 펄스로, 나머지 상태는 우측 상단의 단일 배지로 표시해 Route·Trajectory 진행 head와 섞지 않습니다.',
    },
    docs: {
      description: {
        component:
          '2D 지도 안의 로봇 위치와 heading을 표현하는 renderer-neutral SVG 조각입니다. 본체는 상태에 따라 다시 칠하지 않으며, 이동은 LDS StatusIndicator와 동일한 1.7초 주기의 reduced-motion 대응 펄스, 정지·오프라인·오류는 한 개의 교체 가능한 배지 슬롯이 담당합니다.',
      },
    },
  },
};

export default meta;

function PoseMap({ appearance, label }) {
  return (
    <Map2DCanvas
      appearance={appearance}
      label={label}
      grid
      defaultViewport={{ x: 16, y: 20, z: 1 }}
      style={{ height: 260 }}
    >
      {({ viewport }) => (
        <svg
          width="360"
          height="210"
          viewBox="0 0 360 210"
          role="group"
          aria-label={`${label} 로봇 pose 상태`}
          style={{ display: 'block' }}
        >
          <rect
            x="12"
            y="12"
            width="336"
            height="186"
            rx="8"
            fill={appearance === 'dark' ? 'var(--viewer-surface-elevated)' : 'var(--viewer-surface)'}
            stroke="var(--viewer-border)"
            aria-hidden="true"
          />
          {ROBOT_VARIANTS.map(({ key, label: variantLabel, pose, markerProps }) => (
            <RobotPoseMarker
              key={key}
              pose={pose}
              viewportScale={viewport.z}
              aria-label={`${pose.label}, ${variantLabel}, 방향 ${Math.round(pose.headingRad * 180 / Math.PI)}도`}
              {...markerProps}
            />
          ))}
        </svg>
      )}
    </Map2DCanvas>
  );
}

export const Overview = {
  name: '개요',
  parameters: storyDescription(
    '이동 펄스·정지·통신 끊김·오류를 Light/Dark 지도에서 비교합니다. 본체와 heading은 완전히 동일하고, 이동은 펄스 하나로, 나머지 상태는 우측 상단 배지 하나로 전달합니다.',
  ),
  render: () => (
    <main
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(360px, 100%), 1fr))',
        gap: 'var(--space-4)',
        width: '100%',
        maxWidth: 900,
      }}
    >
      <PoseMap appearance="light" label="Light 로봇 pose 지도" />
      <PoseMap appearance="dark" label="Dark 로봇 pose 지도" />
    </main>
  ),
  play: async ({ canvasElement }) => {
    const markers = [...canvasElement.querySelectorAll('[data-robot-pose-marker]')];
    if (markers.length !== ROBOT_VARIANTS.length * 2) {
      throw new Error(`RobotPoseMarker variant coverage is incomplete: ${markers.length}`);
    }
    const renderedStates = new Set(markers.map((marker) => marker.dataset.robotState));
    ROBOT_VARIANTS.forEach(({ pose }) => {
      if (!renderedStates.has(pose.state)) {
        throw new Error(`RobotPoseMarker variant is missing: ${pose.state}`);
      }
    });
    markers.forEach((marker) => {
      const screenSpace = marker.querySelector('[data-robot-pose-screen-space]');
      const hitArea = marker.querySelector('[data-robot-pose-hit-area]');
      const heading = marker.querySelector('[data-robot-pose-heading]');
      if (!screenSpace || !hitArea || !heading) {
        throw new Error('RobotPoseMarker anatomy is incomplete.');
      }
      if (hitArea.dataset.screenTargetSize !== '24') {
        throw new Error('RobotPoseMarker must expose the shared 24px target-size contract.');
      }
      if (heading.getAttribute('stroke') !== null) {
        throw new Error('RobotPoseMarker heading must use a solid fill without an outline.');
      }
    });
    const lightMarkers = [...canvasElement.querySelectorAll('[data-viewer-appearance="light"] [data-robot-pose-marker]')];
    const bodyFills = markers
      .map((marker) => marker.querySelector('[data-robot-pose-body] circle')?.getAttribute('fill'));
    if (new Set(bodyFills).size !== 1) {
      throw new Error('Robot state or viewer appearance must not recolor the pose body.');
    }
    const moving = canvasElement.querySelector('[data-robot-id="robot-pose-default"]');
    const stopped = canvasElement.querySelector('[data-robot-id="robot-pose-stopped"]');
    const offline = canvasElement.querySelector('[data-robot-id="robot-pose-offline"]');
    const fault = canvasElement.querySelector('[data-robot-id="robot-pose-fault"]');
    if (moving?.querySelector('[data-robot-pose-status-badge]')) {
      throw new Error('Moving robot must not render a status badge.');
    }
    if (!moving?.querySelector('[data-robot-pose-motion-indicator]')) {
      throw new Error('Moving robot must render the motion pulse.');
    }
    if (stopped?.querySelector('[data-robot-pose-status-badge]')?.dataset.statusBadgeKind !== 'idle') {
      throw new Error('Stopped robot must use the idle badge.');
    }
    if (offline?.querySelector('[data-robot-pose-status-badge]')?.dataset.statusBadgeKind !== 'offline') {
      throw new Error('Offline robot must use the offline badge.');
    }
    if (fault?.querySelector('[data-robot-pose-status-badge]')?.dataset.statusBadgeKind !== 'fault') {
      throw new Error('Fault robot must use the fault badge.');
    }
    if (lightMarkers.some((marker) => marker.querySelectorAll('[data-robot-pose-status-badge]').length > 1)) {
      throw new Error('RobotPoseMarker must render at most one status badge.');
    }
    if (lightMarkers.filter((marker) => marker.querySelector('[data-robot-pose-motion-indicator]')).length !== 1) {
      throw new Error('Only the moving robot may render a motion pulse.');
    }
    const darkNeutralBadges = [
      ...canvasElement.querySelectorAll(
        '[data-viewer-appearance="dark"] [data-robot-pose-status-badge][data-status-badge-kind="idle"],'
        + '[data-viewer-appearance="dark"] [data-robot-pose-status-badge][data-status-badge-kind="offline"]',
      ),
    ];
    darkNeutralBadges.forEach((badge) => {
      const surface = badge.querySelector('circle');
      const glyph = badge.querySelector('rect, path');
      const glyphColor = glyph?.tagName === 'rect'
        ? getComputedStyle(glyph).fill
        : getComputedStyle(glyph).stroke;
      const ratio = contrastRatio(glyphColor, getComputedStyle(surface).fill);
      if (ratio < 3) {
        throw new Error(`Dark neutral robot badge glyph contrast failed: ${ratio.toFixed(2)}:1.`);
      }
    });
  },
};

export const InteractionStates = {
  name: '상호작용 · 선택·포커스',
  parameters: storyDescription(
    '선택은 pose 본체의 1.15배 정적 확대, 키보드 포커스는 바깥의 고대비 이중 링입니다. 기본·선택·포커스·조합 상태를 비교해 두 상호작용 축이 독립적임을 보여줍니다.',
  ),
  render: () => (
    <main
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
        gap: 'var(--space-4)',
        width: '100%',
        maxWidth: 920,
      }}
    >
      {INTERACTION_VARIANTS.map(({ key, label, description, markerProps }) => (
        <section key={key} style={{ display: 'grid', gap: 'var(--space-2)', minWidth: 0 }}>
          <header style={{ display: 'grid', gap: 'var(--space-1)' }}>
            <strong style={{ color: 'var(--color-semantic-label-strong)', fontSize: 'var(--body2-size)' }}>{label}</strong>
            <span style={{ color: 'var(--color-semantic-label-alternative)', fontSize: 'var(--caption1-size)' }}>{description}</span>
          </header>
          <Map2DCanvas
            label={`${label} 로봇 pose 지도`}
            controls={false}
            panEnabled={false}
            wheelZoom={false}
            keyboard={false}
            style={{ width: '100%', height: 150 }}
          >
            <svg width="100%" height="150" viewBox="0 0 210 150" role="group" aria-label={`${label} 로봇 pose 예시`}>
              <RobotPoseMarker
                pose={{
                  ...ROBOT_VARIANTS[0].pose,
                  id: `robot-pose-${key}`,
                  position: { x: 105, y: 75 },
                }}
                showLabel={false}
                aria-label={`AMR 01, ${label}`}
                {...markerProps}
              />
            </svg>
          </Map2DCanvas>
        </section>
      ))}
    </main>
  ),
  play: async ({ canvasElement }) => {
    const defaultMarker = canvasElement.querySelector('[data-robot-id="robot-pose-default"]');
    const selected = canvasElement.querySelector('[data-robot-id="robot-pose-selected"]');
    const focused = canvasElement.querySelector('[data-robot-id="robot-pose-focused"]');
    const selectedFocused = canvasElement.querySelector('[data-robot-id="robot-pose-selected-focused"]');
    if (
      defaultMarker?.querySelector('[data-robot-pose-selected-scale]')
      || defaultMarker?.querySelector('[data-robot-pose-focus-indicator]')
    ) {
      throw new Error('Default interaction example must not render selection or focus.');
    }
    if (!selected?.querySelector('[data-robot-pose-selected-scale="1.15"]')) {
      throw new Error('Selected interaction example is missing its 1.15x body enlargement.');
    }
    if (selected?.querySelector('[data-robot-pose-focus-indicator]')) {
      throw new Error('Selected-only example must not render keyboard focus.');
    }
    if (!focused?.querySelector('[data-robot-pose-focus-indicator]')) {
      throw new Error('Focused interaction example is missing its ring.');
    }
    if (
      !focused?.querySelector('[data-robot-pose-focus-contrast]')
      || !focused?.querySelector('[data-robot-pose-focus-ring]')
    ) {
      throw new Error('Keyboard focus must use the two-layer contrast ring.');
    }
    assertContrastBackedFocus(
      focused,
      '[data-robot-pose-focus-contrast]',
      '[data-robot-pose-focus-ring]',
      'Robot pose',
    );
    if (focused?.querySelector('[data-robot-pose-selected-scale]')) {
      throw new Error('Focused-only example must not render selection.');
    }
    if (
      !selectedFocused?.querySelector('[data-robot-pose-selected-scale="1.15"]')
      || !selectedFocused?.querySelector('[data-robot-pose-focus-indicator]')
    ) {
      throw new Error('Combined interaction example must render selection and focus together.');
    }
    if (canvasElement.querySelector('[data-robot-pose-status-badge]')) {
      throw new Error('Moving interaction examples must not render a status badge.');
    }
  },
};
