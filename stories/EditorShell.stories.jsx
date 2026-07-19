import React from 'react';
import { CanvasEditorShellEditorToolbarHistoryToolbarCard as CanvasEditorShellEditorToolbarHistoryToolbarCardStory } from './RoboticsAndViz.shared.jsx';
import { BasicShellExample, CanvasEditorShellMobileExample, ContextDrawerExample, WorkspaceRegionsExample } from './EditorShell.shared.jsx';
import { storyDescription } from './StoryGuide.shared.jsx';

const meta = {
  title: 'LDS Robotics/Editor/Canvas Shell',
  parameters: {
    storyGuide: {
      storyId: 'lds-robotics-editor-canvas-shell--basic',
      eyebrow: 'Robotics / Canvas Shell',
      title: '캔버스 셸은 문서 명령과 편집 영역의 읽기 순서를 안정적으로 묶습니다',
      description:
        '계층·도구·뷰포트·속성 패널이 함께 작동하는 로보틱스 편집 화면을 구성할 때 적합합니다. 단일 캔버스나 읽기 전용 뷰어에는 전체 셸 대신 필요한 Viewer 또는 개별 패널만 사용하세요.',
    },
    docs: {
      description: {
        component:
          'CanvasEditorShell은 문서 명령, 편집 도구, 계층, 중앙 뷰포트, 선택 속성, 수동 상태의 관계를 소유하는 LK Robotics 확장 프레임입니다. 좌우 패널은 접기·복원·키보드 리사이즈를 지원하며 제품 워크플로 자체는 포함하지 않습니다.',
      },
    },
  },
};

export default meta;

export const Basic = {
  name: '개요',
  parameters: storyDescription(
    '문서 명령·도구·레이어·뷰포트·속성 패널이 배치된 기본 편집 셸입니다. 운영자의 시선과 키보드 이동이 문서 수준 명령에서 작업 영역과 선택 정보 순으로 이어지는지 확인하세요.',
  ),
  render: () => <BasicShellExample />,
};

export const WorkspaceRegions = {
  name: '시나리오 · 통합 편집 작업공간',
  parameters: storyDescription(
    '여러 편집 영역을 동시에 사용하는 넓은 워크스페이스 상황입니다. 좌우 패널과 중앙 캔버스가 같은 작업 단위로 읽히고 각 영역의 크기 조절 경계가 분명한지 확인하세요.',
  ),
  render: () => <WorkspaceRegionsExample />,
};

export const ContextDrawer = {
  name: '시나리오 · 화면 위 속성 패널',
  parameters: storyDescription(
    '선택 객체의 세부 정보를 중앙 뷰포트 위 임시 패널로 확인하는 상황입니다. 오버레이가 장면 맥락을 과도하게 가리지 않고 닫은 뒤 포커스가 안정적으로 복귀하는지 확인하세요.',
  ),
  render: () => <ContextDrawerExample />,
};

export const MobileActiveRegion = {
  name: '반응형 · 좁은 화면 · 영역 전환',
  parameters: storyDescription(
    '390px 폭에서 캔버스와 보조 영역을 한 번에 하나씩 전환하는 상황입니다. 활성 영역이 명확하고 숨겨진 패널이 키보드 순서나 가로 overflow에 남지 않는지 확인하세요.',
  ),
  render: () => {
    const [region, setRegion] = React.useState('canvas');
    return (
      <div style={{ width: 390, maxWidth: '100%', height: 620, margin: '0 auto' }}>
        <CanvasEditorShellMobileExample region={region} onRegionChange={setRegion} />
      </div>
    );
  },
};

export const CanvasEditorShellEditorToolbarHistoryToolbarCard = {
  ...CanvasEditorShellEditorToolbarHistoryToolbarCardStory,
  name: 'CanvasEditorShell · EditorToolbar · HistoryToolbar card parity',
  tags: ['!dev', 'visual-parity'],
};
