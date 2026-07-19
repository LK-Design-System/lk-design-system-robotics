import React from 'react';
import { LayerPanel } from './lds.js';
import { EditorStoryFrame, editorLayers } from './EditorShell.shared.jsx';
import { storyDescription } from './StoryGuide.shared.jsx';

const meta = {
  title: 'LDS Robotics/Editor/Layer Panel',
  component: LayerPanel,
  parameters: {
    storyGuide: {
      storyId: 'lds-robotics-editor-layer-panel--interactive',
      eyebrow: 'Robotics / Layer Panel',
      title: '레이어 패널은 장면 계층과 표시·잠금 상태를 함께 관리합니다',
      description:
        '운영자가 중첩된 지도·경로·로봇 레이어를 탐색하며 선택과 가용성을 제어할 때 적합합니다. 계층이 없는 단순 옵션이나 일회성 필터에는 Layer Panel 대신 List 또는 Checkbox Group을 사용하세요.',
    },
    docs: {
      description: {
        component:
          'LayerPanel은 실제 레이어 모델의 선택, 표시, 잠금, 상태와 중첩 구조를 관리합니다. 트리 방향키·Home/End·문자 탐색, F2 행 작업 모드와 제어/비제어 확장을 지원합니다.',
      },
    },
  },
};

export default meta;

function PanelFrame({ children }) {
  return (
    <EditorStoryFrame maxWidth={320} height={420}>
      <div
        style={{
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          border: '1px solid var(--color-semantic-line-normal-normal)',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--color-semantic-background-elevated-normal)',
        }}
      >
        {children}
      </div>
    </EditorStoryFrame>
  );
}

export const Interactive = {
  name: '개요',
  parameters: storyDescription(
    '여러 하위 레이어가 펼쳐진 편집 장면에서 활성 레이어를 바꾸는 기본 상황입니다. 부모·자식 깊이와 선택·표시·잠금 제어가 한 행 안에서 혼동 없이 읽히는지 확인하세요.',
  ),
  render: () => (
    <PanelFrame>
      <LayerPanel layers={editorLayers} defaultActiveLayerId="routes" />
    </PanelFrame>
  ),
};

function ControlledExpansionExample() {
  const [expandedIds, setExpandedIds] = React.useState([]);

  return (
    <PanelFrame>
      <LayerPanel
        layers={editorLayers}
        defaultActiveLayerId="geometry"
        expandedLayerIds={expandedIds}
        onExpandedLayerIdsChange={(ids) => setExpandedIds(ids)}
      />
    </PanelFrame>
  );
}

export const ControlledExpansion = {
  name: '상호작용 · 계층 접기와 펼치기',
  parameters: storyDescription(
    '제품 상태가 펼침 목록을 직접 소유하는 제어형 계층 상황입니다. 접힌 초기 상태와 펼침 변경 callback이 일치하고 선택 레이어가 계층 전환 중 유지되는지 확인하세요.',
  ),
  render: () => <ControlledExpansionExample />,
};

export const VisibleStatusLabels = {
  name: '변형·상태 · 색상과 상태 문자',
  parameters: storyDescription(
    '준비·검토 필요 상태가 섞인 레이어를 운영자가 훑는 상황입니다. 색상 tone과 Ready·Review 텍스트가 함께 보여 색을 구분하지 못해도 상태 의미가 유지되는지 확인하세요.',
  ),
  render: () => (
    <PanelFrame>
      <LayerPanel
        defaultActiveLayerId="routes"
        layers={editorLayers.map((layer) => (
          layer.id === 'geometry'
            ? {
                ...layer,
                tone: 'positive',
                toneLabel: 'Ready',
                children: layer.children.map((child) => (
                  child.id === 'regions'
                    ? { ...child, tone: 'cautionary', toneLabel: 'Review' }
                    : child
                )),
              }
            : layer
        ))}
      />
    </PanelFrame>
  ),
};

export const Empty = {
  name: '변형·상태 · 항목 없음',
  parameters: storyDescription(
    '아직 불러온 레이어가 없거나 필터 결과가 비어 있는 상황입니다. 빈 이유가 패널 안에서 읽히고 존재하지 않는 트리 항목이나 조작 버튼이 남지 않는지 확인하세요.',
  ),
  render: () => (
    <PanelFrame>
      <LayerPanel layers={[]} emptyLabel="표시할 레이어가 없습니다." />
    </PanelFrame>
  ),
};

export const Disabled = {
  name: '변형·상태 · 전체 비활성',
  parameters: storyDescription(
    '장면이 읽기 전용이거나 동기화 중이라 모든 레이어 조작이 잠긴 상황입니다. 현재 계층과 선택 맥락은 보존하면서 선택·표시·잠금 입력만 차단되는지 확인하세요.',
  ),
  render: () => (
    <PanelFrame>
      <LayerPanel layers={editorLayers} defaultActiveLayerId="routes" disabled />
    </PanelFrame>
  ),
};

export const MixedAvailability = {
  name: '상호작용 · 첫 행 비활성 · 포커스 이동',
  parameters: storyDescription(
    '첫 레이어만 사용할 수 없고 뒤의 계층은 정상인 혼합 가용성 상황입니다. 비활성 첫 행 때문에 초기 포커스나 방향키 탐색이 막히지 않고 다음 가용 행으로 이동하는지 확인하세요.',
  ),
  render: () => (
    <PanelFrame>
      <LayerPanel
        layers={[
          { id: 'unavailable', label: 'Unavailable reference', tone: 'neutral', disabled: true },
          ...editorLayers,
        ]}
      />
    </PanelFrame>
  ),
};
