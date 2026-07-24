import React from 'react';
import { userEvent, waitFor } from 'storybook/test';
import { Button, ConfirmDialog, SelectionInspector } from './lds.js';
import { EditorStoryFrame, inspectorItem, inspectorSections } from './EditorShell.shared.jsx';
import { storyDescription } from './StoryGuide.shared.jsx';

const meta = {
  title: 'LDS Robotics/Editor/Selection Inspector',
  component: SelectionInspector,
  parameters: {
    storyGuide: {
      storyId: 'lds-robotics-editor-selection-inspector--selected-object',
      eyebrow: 'Robotics / Selection Inspector',
      title: '선택 인스펙터는 현재 객체의 정체와 편집 가능한 속성을 한 흐름으로 읽게 합니다',
      description:
        '운영자가 캔버스에서 고른 객체의 상태·속성·객체 범위 작업을 확인할 때 적합합니다. 전역 설정이나 선택과 무관한 폼에는 Selection Inspector 대신 일반 Form 또는 Settings 패널을 사용하세요.',
    },
    docs: {
      description: {
        component:
          'SelectionInspector는 선택된 캔버스 객체의 식별 정보, 상태, 속성 그룹과 객체 범위 액션을 표시합니다.',
      },
    },
  },
};

export default meta;

function InspectorFrame({ children, width = 340 }) {
  return (
    <EditorStoryFrame maxWidth={width} height={460}>
      <div
        data-testid="inspector-frame"
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

function ActionFooterFixture() {
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  return (
    <>
      <InspectorFrame>
        <SelectionInspector
          item={inspectorItem}
          sections={inspectorSections.slice(0, 1)}
          actions={(
            <>
              <Button data-testid="inspector-delete" variant="danger" onClick={() => setDeleteOpen(true)}>삭제</Button>
              <Button style={{ marginInlineStart: 'auto' }}>적용</Button>
            </>
          )}
        />
      </InspectorFrame>
      <ConfirmDialog
        open={deleteOpen}
        tone="danger"
        title="선택 객체를 삭제할까요?"
        confirmLabel="객체 삭제"
        cancelLabel="취소"
        onConfirm={() => setDeleteOpen(false)}
        onCancel={() => setDeleteOpen(false)}
      >
        이 객체와 연결된 편집 정보가 제거되며 실행 취소 기록에 남습니다.
      </ConfirmDialog>
    </>
  );
}

export const SelectedObject = {
  name: '개요',
  parameters: storyDescription(
    '캔버스에서 하나의 객체를 선택해 식별 정보와 속성 그룹을 확인하는 기본 상황입니다. 객체 이름·종류·상태가 속성보다 먼저 읽히고 선택 해제 동작이 명확한지 확인하세요.',
  ),
  render: () => (
    <InspectorFrame>
      <SelectionInspector item={inspectorItem} sections={inspectorSections} onClearSelection={() => {}} />
    </InspectorFrame>
  ),
};

export const EmptySelection = {
  name: '변형·상태 · 선택 객체 없음',
  parameters: storyDescription(
    '캔버스에서 선택한 객체가 없는 초기 상태입니다. 인스펙터가 빈 패널처럼 보이지 않고 다음 행동을 안내하며 이전 객체의 속성이 남지 않는지 확인하세요.',
  ),
  render: () => (
    <InspectorFrame>
      <SelectionInspector item={null} emptyLabel="캔버스에서 객체를 선택하세요." />
    </InspectorFrame>
  ),
};

export const ActionFooter = {
  name: '시나리오 · 선택 객체 작업',
  parameters: storyDescription(
    '선택 객체의 변경 적용과 삭제 작업을 인스펙터 하단에서 제공하는 상황입니다. 파괴적 액션이 danger 표현으로 구분되고 기본 적용 버튼과 떨어져 있으며 실행 전에 확인 단계를 거치는지 확인하세요.',
  ),
  render: () => <ActionFooterFixture />,
  play: async ({ canvasElement }) => {
    const trigger = canvasElement.querySelector('[data-testid="inspector-delete"]');
    if (!trigger) throw new Error('SelectionInspector destructive action must have a visible trigger.');
    await userEvent.click(trigger);
    await waitFor(() => {
      const dialog = canvasElement.querySelector('[role="dialog"]');
      if (!dialog?.textContent?.includes('선택 객체를 삭제할까요?')) throw new Error('Destructive action must open ConfirmDialog.');
      return dialog;
    });
    await userEvent.keyboard('{Escape}');
    await waitFor(() => {
      if (canvasElement.querySelector('[role="dialog"]')) throw new Error('Escape must close the destructive confirmation.');
    });
  },
};

export const PrimitiveValues = {
  name: '0·false·빈 값 보존',
  tags: ['!dev'],
  parameters: storyDescription(
    '0·false·빈 문자열처럼 값은 존재하지만 쉽게 누락될 수 있는 원시 값을 표시합니다. falsy 값이 대시나 미정 값으로 잘못 치환되지 않고 각 필드 의미대로 읽히는지 확인하세요.',
  ),
  render: () => (
    <InspectorFrame>
      <SelectionInspector
        item={{ label: 'Primitive values', kind: 'Evidence' }}
        sections={[{
          title: 'Values',
          fields: [
            { label: 'Count', value: 0 },
            { label: 'Enabled', value: false },
            { label: 'Optional', value: '' },
            { label: 'Custom zero', valueNode: 0 },
            { label: 'Custom false', valueNode: false },
          ],
        }]}
      />
    </InspectorFrame>
  ),
};

export const UnitFormattingAt320 = {
  name: '반응형 · 320px 단위 결합',
  parameters: storyDescription(
    '320px 속성 패널에서 0·기호 단위·SI·복합 단위와 사용자 정의 valueNode를 함께 확인합니다. 표준 scalar 필드는 공용 단위 결합 규칙을 따르고 valueNode는 소비자가 텍스트와 접근성을 직접 소유하며 패널은 가로 overflow를 만들지 않아야 합니다.',
  ),
  render: () => (
    <InspectorFrame width={320}>
      <SelectionInspector
        item={{ label: 'Drive module', kind: 'Component' }}
        sections={[{
          title: 'Measurements',
          fields: [
            { label: 'Battery', value: ' 18 ', unit: ' % ' },
            { label: 'Slip', value: 2, unit: ' ‰ ' },
            { label: 'Heading', value: 90, unit: ' ° ' },
            { label: 'Temperature', value: 64, unit: ' °C ' },
            { label: 'Speed', value: 1.4, unit: ' m/s ' },
            { label: 'Torque', value: 12, unit: ' N·m ' },
            { label: 'Custom', valueNode: <span aria-label="사용자 지정 값">사용자 지정</span> },
          ],
        }]}
      />
    </InspectorFrame>
  ),
  play: async ({ canvasElement }) => {
    const frame = canvasElement.querySelector('[data-testid="inspector-frame"]');
    const values = [...canvasElement.querySelectorAll('[data-selection-inspector-value]')];
    const expectedValues = ['18%', '2‰', '90°', '64 °C', '1.4 m/s', '12 N·m'];
    if (!frame || values.length !== expectedValues.length) throw new Error('SelectionInspector 320px unit fixture is incomplete.');
    if (values.some((value, index) => value.textContent !== expectedValues[index])) {
      throw new Error(`SelectionInspector unit text is inconsistent: ${values.map((value) => value.textContent).join(' | ')}`);
    }
    if (!canvasElement.querySelector('[aria-label="사용자 지정 값"]')) throw new Error('SelectionInspector valueNode escape must preserve consumer-owned accessibility text.');
    if (frame.scrollWidth > frame.clientWidth) {
      throw new Error(`SelectionInspector overflowed 320px: ${frame.scrollWidth}px > ${frame.clientWidth}px.`);
    }
  },
};

export const SectionHeadingStructureContract = {
  name: '섹션 제목 heading 구조 계약',
  tags: ['!dev'],
  parameters: storyDescription(
    '접이식 섹션 제목이 실제 heading으로 렌더되어 문서 구조가 보조기술에 전달되는지 고정하는 fixture입니다(WCAG 1.3.1). 접이식 제목이 heading 안의 disclosure 버튼(접근 이름·aria-expanded)으로, 정적 제목도 같은 레벨 heading으로 노출되고 토글이 콘텐츠 표시를 바꾸는지 확인하세요.',
  ),
  render: () => (
    <InspectorFrame>
      <SelectionInspector
        item={{ label: 'Zone A-03', kind: 'Polygon', status: 'Draft', statusTone: 'signal' }}
        sections={[
          { title: 'Geometry', fields: [{ label: 'Vertices', value: 6 }, { label: 'Area', value: 24.8, unit: 'm²' }] },
          { title: 'Behavior', fields: [{ label: 'Mode', value: 'Restricted' }] },
          { title: 'Static section', collapsible: false, fields: [{ label: 'Layer', value: 'Regions' }] },
        ]}
        onClearSelection={() => {}}
      />
    </InspectorFrame>
  ),
  play: async ({ canvasElement }) => {
    const scope = canvasElement.querySelector('[data-testid="inspector-frame"]') || canvasElement;
    const disclosure = Array.from(scope.querySelectorAll('button[aria-expanded]'))
      .find((button) => (button.textContent || '').includes('Geometry'));
    if (!disclosure) throw new Error('A collapsible section must expose a disclosure button.');

    const heading = disclosure.closest('h1,h2,h3,h4,h5,h6');
    if (!heading || heading.tagName !== 'H4') {
      throw new Error('A collapsible section title must render as an h4 heading wrapping the disclosure control (WCAG 1.3.1).');
    }
    if (!(disclosure.textContent || '').includes('Geometry') || !disclosure.hasAttribute('aria-expanded')) {
      throw new Error('The disclosure control must keep its accessible name and aria-expanded state.');
    }
    const staticHeading = Array.from(scope.querySelectorAll('h4')).find((node) => (node.textContent || '').includes('Static section'));
    if (!staticHeading) throw new Error('A non-collapsible section title must also render as an h4 heading.');

    const controls = document.getElementById(disclosure.getAttribute('aria-controls'));
    if (disclosure.getAttribute('aria-expanded') !== 'true' || !controls || controls.hidden) {
      throw new Error('An expanded section must reveal the region it controls.');
    }
    await userEvent.click(disclosure);
    await waitFor(() => {
      const now = Array.from(scope.querySelectorAll('button[aria-expanded]')).find((button) => (button.textContent || '').includes('Geometry'));
      if (now.getAttribute('aria-expanded') !== 'false' || !document.getElementById(now.getAttribute('aria-controls')).hidden) {
        throw new Error('Toggling the disclosure must collapse and hide its content region.');
      }
    });
    await userEvent.click(Array.from(scope.querySelectorAll('button[aria-expanded]')).find((button) => (button.textContent || '').includes('Geometry')));
    document.activeElement?.blur?.();
  },
};

export const MixedSelection = {
  name: '사용법 · 다중 선택 공통 속성',
  parameters: storyDescription(
    '세 객체를 함께 선택해 공통 값과 서로 다른 값을 비교하는 상황입니다. 선택 수와 mixed 상태가 구체 값과 구분되고 단위가 불확정 값에 잘못 붙지 않는지 확인하세요.',
  ),
  render: () => (
    <InspectorFrame>
      <SelectionInspector
        item={{ label: 'Regions', kind: 'Region', status: '3 selected', statusTone: 'signal' }}
        selectionCount={3}
        sections={[
          {
            title: 'Geometry',
            fields: [
              { label: 'Layer', value: 'Regions' },
              { label: 'Vertices', mixed: true },
              { label: 'Area', mixed: true, unit: 'm²' },
            ],
          },
          {
            title: 'Behavior',
            fields: [
              { label: 'Mode', value: 'Restricted' },
              { label: 'Speed', mixed: true, unit: 'm/s' },
            ],
          },
        ]}
        onClearSelection={() => {}}
      />
    </InspectorFrame>
  ),
};
