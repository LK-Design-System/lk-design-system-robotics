import * as React from 'react';
import type { ViewerState } from './ViewerFrame';

export interface Map2DViewport {
  /** Content translation from the selected origin, in viewport pixels. */
  x: number;
  /** Content translation from the selected origin, in viewport pixels. */
  y: number;
  /** Content scale where 1 is 100%. */
  z: number;
}

export interface Map2DCanvasProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'onWheel'> {
  /** 함께 변환되는 콘텐츠(맵 이미지 · SVG 오버레이 · canvas/konva 스테이지 등). */
  children?: React.ReactNode | ((context: {
    viewport: Map2DViewport;
    setViewport: (
      viewport: Map2DViewport | ((viewport: Map2DViewport) => Map2DViewport)
    ) => void;
  }) => React.ReactNode);
  /** @default 0.25 */
  minZoom?: number;
  /** @default 8 */
  maxZoom?: number;
  /** 격자 배경. @default true */
  grid?: boolean;
  /** 줌 컨트롤 + 배율 표시. @default true */
  controls?: boolean;
  /** 드래그 팬 사용 여부. false이면 터치 스크롤을 차단하지 않습니다. @default true */
  panEnabled?: boolean;
  /** 포인터 위치를 기준으로 한 wheel/trackpad zoom. @default true */
  wheelZoom?: boolean;
  /** 뷰포트 자체에 포커스했을 때의 키보드 줌/팬 단축키. @default true */
  keyboard?: boolean;
  /**
   * children 좌표의 기준점. 일반 이미지/SVG/canvas는 top-left를 사용하고,
   * 세계 좌표 (0,0)을 뷰포트 중심에 두는 renderer만 center를 명시합니다.
   * @default "top-left"
   */
  contentOrigin?: 'top-left' | 'center';
  /** 제어형 뷰포트 상태. */
  viewport?: Map2DViewport;
  /** 비제어 초기 뷰포트이자 "보기 초기화"의 복귀값. */
  defaultViewport?: Map2DViewport;
  /** 뷰포트 변경 콜백. */
  onViewportChange?: (viewport: Map2DViewport) => void;
  /** Optional fit-to-content command. The application owns bounds calculation. */
  onFit?: () => void;
  /** Optional custom viewport-local toolbar. When supplied it replaces the built-in controls. */
  toolbar?: React.ReactNode;
  /** Native non-passive wheel event fired before built-in pointer-focal zoom handling. */
  onWheel?: (event: WheelEvent) => void;
  /** 뷰포트 위의 passive overlay 슬롯. 포인터 입력은 받지 않습니다. */
  overlay?: React.ReactNode;
  /** 좌하단 상태 표시. 기본은 zoom %. */
  status?: React.ReactNode;
  /** 좌상단 source identity. */
  source?: React.ReactNode;
  /** source 옆 passive badge. */
  badges?: React.ReactNode;
  /** 소수의 필수 viewport readout. */
  hud?: React.ReactNode;
  /** 공통 Viewer 가용성/freshness 상태. @default "ready" */
  state?: ViewerState;
  stateLabel?: React.ReactNode;
  stateDescription?: React.ReactNode;
  stateIcon?: React.ReactNode;
  stateAction?: React.ReactNode;
  /** Perimeter ownership. "embedded" drops the canvas's own border and radius so a parent surface owns one continuous outline. @default "standalone" */
  variant?: 'standalone' | 'embedded';
  /** Theme-stable viewport presentation shared with the other Viewer presets. @default "light" */
  appearance?: 'light' | 'dark';
  /** 접근성 라벨. @default "2D 맵 캔버스" */
  label?: string;
}

/** Renderer-independent 팬/줌 2D viewport shell. */
export function Map2DCanvas(props: Map2DCanvasProps): React.JSX.Element;
