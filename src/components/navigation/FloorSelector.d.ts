import * as React from 'react';

export type Floor = string | { value: string; label: React.ReactNode };

export interface FloorSelectorProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** 층 목록 — 문자열 또는 `{ value, label }`(위→아래 순서대로). */
  floors: Floor[];
  /** 제어되는 현재 층. */
  value?: string;
  /** 비제어 초기 층(기본 첫 항목). */
  defaultValue?: string;
  onChange?: (value: string) => void;
}

/** 층/레벨 선택기(빌딩 내비) — 단일 선택, 활성 층은 시그널 잉크. */
export function FloorSelector(props: FloorSelectorProps): React.JSX.Element;
