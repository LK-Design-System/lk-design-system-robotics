import * as React from 'react';

export type TelemetryTone = 'signal' | 'positive' | 'cautionary' | 'negative';

export interface TelemetryThresholds {
  /** 0–100 range percentage where the first boundary begins. */
  low: number;
  /** 0–100 range percentage where the second boundary begins. */
  high: number;
  /** Whether a larger measured value is preferable or less preferable. */
  direction: 'higher-is-better' | 'lower-is-better';
}

export interface TelemetryGaugeFormatContext {
  min: number;
  max: number;
  unit: string;
}

export interface TelemetryGaugeProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  min?: number;
  max?: number;
  /** 중앙 값 lockup의 문자열 단위. 주변 공백을 제거한 뒤 공용 결합 규칙을 적용합니다. */
  unit?: string;
  /** 보이는 라벨. 없으면 `aria-label`을 제공하세요. */
  label?: React.ReactNode;
  /** 지름(px). @default 120 */
  size?: number;
  /** 링 두께(px). @default 10 */
  thickness?: number;
  /**
   * Compatibility threshold inference. New product code should resolve domain
   * severity and pass `tone`; when used, direction is mandatory.
   */
  thresholds?: TelemetryThresholds;
  /** 제품이 판정한 현재 severity. thresholds보다 우선합니다. */
  tone?: TelemetryTone;
  /** tone과 함께 보이는 상태 문구. 미지정 시 tone의 기본 한국어 문구를 사용합니다. */
  statusLabel?: React.ReactNode;
  /** 표시 소수 자릿수. 생략하면 원래 수치의 의미 있는 자릿수를 보존합니다. */
  precision?: number;
  /** 중앙 값 사용자 포맷. `valueText`는 별도로 제공할 수 있습니다. */
  formatter?: (value: number, context: TelemetryGaugeFormatContext) => string | number;
  /** 보조기술이 읽을 사람 친화적 값 텍스트. */
  valueText?: string;
}

/** 알려진 min/max 범위의 텔레메트리 값을 표시하는 접근 가능한 270° meter. */
export function TelemetryGauge(props: TelemetryGaugeProps): React.JSX.Element;
