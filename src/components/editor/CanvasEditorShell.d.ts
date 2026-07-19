import * as React from 'react';

export interface CanvasEditorShellProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /** 문서/워크스페이스 제목. */
  title?: React.ReactNode;
  /** 제목 아래의 짧은 상태 또는 문서 메타데이터. */
  description?: React.ReactNode;
  /** 제목 앞의 뒤로가기 또는 프레임 구조 제어. */
  headerStart?: React.ReactNode;
  /** 헤더 오른쪽의 문서 단위 명령. */
  toolbar?: React.ReactNode;
  /** 헤더 아래에서 전체 편집 모드를 바꾸는 탭/필터. */
  subheader?: React.ReactNode;
  /** 좁은 화면에서 canvas/layers/panel 사이를 전환하는 전용 탐색. 편집 모드용 `subheader`와 구분합니다. */
  responsiveNavigation?: React.ReactNode;
  /** 좌측 편집 도구 레일. */
  tools?: React.ReactNode;
  /** 실제 레이어/디스플레이 구조가 있을 때만 쓰는 좌측 패널. */
  layers?: React.ReactNode;
  /** 중앙 캔버스 또는 워크플로우 본문. */
  children?: React.ReactNode;
  /** 우측 속성/설정 패널. */
  panel?: React.ReactNode;
  /** `drawer`는 중앙 영역 위에 겹치며 열고 닫을 때 전환됩니다. @default 'docked' */
  panelMode?: 'docked' | 'drawer';
  /** 우측 패널 표시 여부. 생략하면 내부 상태를 사용합니다. */
  panelOpen?: boolean;
  /** 비제어 우측 패널 초기 표시 여부. @default true */
  defaultPanelOpen?: boolean;
  /** 패널 handle 또는 Escape로 표시 상태가 바뀔 때 호출됩니다. */
  onPanelOpenChange?: (open: boolean, reason: 'toggle' | 'escape') => void;
  /** 좌측 레이어 패널 표시 여부. 생략하면 내부 상태를 사용합니다. */
  layersOpen?: boolean;
  /** 비제어 레이어 패널 초기 표시 여부. @default true */
  defaultLayersOpen?: boolean;
  /** 레이어 패널 handle 또는 Escape로 표시 상태가 바뀔 때 호출됩니다. */
  onLayersOpenChange?: (open: boolean, reason: 'toggle' | 'escape') => void;
  /** 선택적인 하단 수동 상태 표시줄. */
  status?: React.ReactNode;
  /** 우측 패널 폭(px). @default 280 */
  panelWidth?: number;
  /** 우측 패널 최소 폭(px). @default 240 */
  panelMinWidth?: number;
  /** 우측 패널 최대 폭(px). @default 420 */
  panelMaxWidth?: number;
  onPanelWidthChange?: (width: number) => void;
  /** 좌측 레이어 패널 폭(px). @default 236 */
  layerPanelWidth?: number;
  /** 좌측 레이어 패널 최소 폭(px). @default 200 */
  layerPanelMinWidth?: number;
  /** 좌측 레이어 패널 최대 폭(px). @default 360 */
  layerPanelMaxWidth?: number;
  onLayerPanelWidthChange?: (width: number) => void;
  /** 데스크톱에서 좌우 패널 경계를 포인터와 키보드로 조절합니다. @default true */
  resizablePanels?: boolean;
  /** 좁은 화면에서 한 번에 표시할 주 작업 영역. drawer 패널은 기존 overlay 동작을 유지합니다. @default 'canvas' */
  mobileActiveRegion?: 'canvas' | 'layers' | 'panel';
  toolsLabel?: string;
  layersLabel?: string;
  canvasLabel?: string;
  panelLabel?: string;
  statusLabel?: string;
}

/** 캔버스 에디터의 공통 프레임. 도메인별 워크플로우와 패널 내용은 각 슬롯의 소유자가 구성합니다. */
export function CanvasEditorShell(props: CanvasEditorShellProps): React.JSX.Element;
