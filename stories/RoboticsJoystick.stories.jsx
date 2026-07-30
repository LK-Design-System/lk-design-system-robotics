import React from 'react';
import { Map2DCanvas } from '@lk-robotics/lds-product';
import { Joystick } from '../src/index.js';
import { JoystickCard as JoystickCardStory } from './RoboticsAndViz.shared.jsx';
import { assertOverlayOpaque, contrastRatio } from './RoboticsNavigationAssert.shared.jsx';

const waitFor = async (predicate, message) => {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new Error(message);
};

const readVector = (fixture) => ({
  x: Number(fixture.dataset.x),
  y: Number(fixture.dataset.y),
});

function ContractFixture({ sticky = false }) {
  const [vector, setVector] = React.useState({ x: 0, y: 0 });
  const [endState, setEndState] = React.useState({ count: 0, reason: '' });
  return (
    <main style={{ display: 'grid', placeItems: 'center', minHeight: 340 }}>
      <section
        data-testid="joystick-contract"
        data-x={vector.x}
        data-y={vector.y}
        data-end-count={endState.count}
        data-end-reason={endState.reason}
      >
        <Joystick
          size={180}
          label="수동 주행"
          sticky={sticky}
          onChange={setVector}
          onEnd={(reason) => setEndState((current) => ({ count: current.count + 1, reason }))}
        />
      </section>
    </main>
  );
}

const assertTextContract = (control) => {
  const document = control.ownerDocument;
  const label = document.getElementById(control.getAttribute('aria-labelledby'));
  const describedNodes = (control.getAttribute('aria-describedby') || '')
    .split(/\s+/)
    .filter(Boolean)
    .map((id) => document.getElementById(id));
  if (label?.textContent !== '수동 주행' || describedNodes.length !== 2 || describedNodes.some((node) => !node)) {
    throw new Error('Joystick must connect its visible label, instructions, and current command to the application control.');
  }
  if (!describedNodes.some((node) => node.textContent.includes('놓으면 정지')) || !describedNodes.some((node) => node.textContent.includes('현재 명령'))) {
    throw new Error('The described text must explain hold-to-run behavior and expose the current command.');
  }
  if (describedNodes.some((node) => node.closest('[aria-live]'))) {
    throw new Error('Continuous command feedback must not be placed in a live region.');
  }
};

const meta = {
  title: 'LDS Robotics/Control/Joystick',
  tags: ['autodocs'],
  component: Joystick,
  parameters: {
    storyGuide: {
      storyId: 'lds-robotics-control-joystick--joystick-control',
      eyebrow: 'Robotics / Joystick',
      title: '조이스틱은 누르는 동안만 명령을 내보내고 놓으면 정지합니다',
      description:
        '연속 아날로그 수동 주행이 필요할 때 적합합니다. 모든 입력 종료 경로에서 0 벡터로 확실히 멈춰야 하며, 단계적 이동에는 Directional Pad를 사용하세요.',
    },
    docs: {
      description: {
        component: '누르는 동안만 수동 조작 벡터를 내보내고, 모든 입력 종료 경로에서 0 벡터로 정지하는 Joystick 패턴입니다.',
      },
    },
  },
};

export default meta;

export const JoystickControl = {
  name: '개요',
  parameters: {
    docs: {
      description: {
        story:
          '기본 조이스틱 한 개를 봅니다. 손을 떼면 즉시 중심으로 복귀하는지, 라벨과 현재 명령이 함께 노출되는지 확인하세요.',
      },
    },
  },
  render: () => (
    <main style={{ display: 'grid', gap: 'var(--space-6)', maxWidth: 720 }}>
      <section style={{ display: 'grid', placeItems: 'center', minHeight: 240 }}>
        <Joystick size={180} label="수동 조작" />
      </section>
    </main>
  ),
};

export const OnViewerSurface = {
  name: '뷰어 표면 위',
  parameters: {
    docs: {
      description: {
        story:
          '아날로그 주행 조작은 카메라·지도 프레임을 보면서 이뤄지므로 조이스틱도 그 프레임 위에 얹힙니다. on-dark는 원판을 반투명 스크림(+blur)으로 바꾸고 라벨·안내 텍스트에 밝은 잉크와 그림자 바닥을 줍니다 — DirectionalPad·ViewerToolbar와 같은 오버레이 계열입니다. 스크림이 반투명이라 조작 중에도 발밑 영상이 계속 읽혀야 합니다.',
      },
    },
  },
  render: () => (
    <main style={{ maxWidth: 640 }}>
      <div style={{ position: 'relative', width: '100%' }}>
        <Map2DCanvas
          appearance="dark"
          label="주행 카메라 프레임"
          controls={false}
          panEnabled={false}
          wheelZoom={false}
          keyboard={false}
          defaultViewport={{ x: 0, y: 0, z: 1 }}
          style={{ width: '100%', aspectRatio: '16 / 10' }}
        />
        <div style={{ position: 'absolute', right: 'var(--space-4)', bottom: 'var(--space-4)' }}>
          <Joystick appearance="on-dark" size={132} label="수동 주행" showValue={false} instructions={null} />
        </div>
      </div>
    </main>
  ),
  play: async ({ canvasElement }) => {
    const disc = canvasElement.querySelector('[role="application"][data-appearance="on-dark"]');
    if (!disc) throw new Error('The overlay joystick must declare data-appearance="on-dark".');
    const view = canvasElement.ownerDocument.defaultView;
    const styles = view.getComputedStyle(disc);
    // Crosshair hairlines are the only ink drawn ON the disc; they must clear
    // the scrim's own tone. assertOverlayOpaque throws if the disc lost its
    // scrim entirely (the page-theme fill regression this story blocks).
    const scrim = assertOverlayOpaque(styles.backgroundColor);
    const hairline = disc.querySelector('span[aria-hidden="true"]');
    const hairlineTone = assertOverlayOpaque(view.getComputedStyle(hairline).backgroundColor);
    if (contrastRatio(hairlineTone, scrim) < 1.2) {
      throw new Error('Crosshair hairlines must remain distinguishable on the scrim.');
    }
    const label = canvasElement.ownerDocument.getElementById(disc.getAttribute('aria-labelledby'));
    const labelStyles = view.getComputedStyle(label);
    if (labelStyles.textShadow === 'none') {
      throw new Error('Overlay label text sits on raw footage and must keep its shadow floor.');
    }
  },
};

export const KeyboardHoldAndRelease = {
  name: '상호작용 · 키보드 누름과 떼기',
  parameters: {
    docs: {
      description: {
        story:
          '방향키를 누르는 동안 명령이 나가고 키를 떼면 0 벡터로 한 번 정지하는지 자동 검증합니다. 키보드 입력의 "놓으면 정지"를 확인하는 계약입니다.',
      },
    },
  },
  render: () => <ContractFixture />,
  play: async ({ canvasElement }) => {
    const fixture = canvasElement.querySelector('[data-testid="joystick-contract"]');
    const control = fixture?.querySelector('[role="application"]');
    if (!fixture || !control) throw new Error('Joystick contract fixture did not render.');
    assertTextContract(control);

    control.focus();
    const KeyboardEvent = control.ownerDocument.defaultView.KeyboardEvent;
    control.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }));
    await waitFor(() => readVector(fixture).x > 0 && control.dataset.active === 'true', 'Arrow keydown must start a non-zero command.');

    control.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowRight', bubbles: true, cancelable: true }));
    await waitFor(() => {
      const vector = readVector(fixture);
      return vector.x === 0 && vector.y === 0 && fixture.dataset.endCount === '1';
    }, 'Arrow keyup must emit one zero vector and end the command.');
    if (fixture.dataset.endReason !== 'keyboard-release' || control.dataset.active !== 'false') {
      throw new Error('Keyboard release must expose the keyboard-release reason and clear active state.');
    }
  },
};

export const KeyboardChordRelease = {
  name: '복수 화살표 키 해제',
  tags: ['!dev'],
  parameters: {
    docs: {
      description: {
        story:
          '두 방향키 동시 입력의 대각선 명령과, 한 키만 뗐을 때의 재계산·최종 정지를 자동 검증합니다. chord 입력이 중간에 끊겨도 안전하게 수렴하는지 확인하는 계약입니다.',
      },
    },
  },
  render: () => <ContractFixture />,
  play: async ({ canvasElement }) => {
    const fixture = canvasElement.querySelector('[data-testid="joystick-contract"]');
    const control = fixture?.querySelector('[role="application"]');
    if (!fixture || !control) throw new Error('Joystick chord fixture did not render.');
    const KeyboardEvent = control.ownerDocument.defaultView.KeyboardEvent;
    const key = (type, value, repeat = false) => control.dispatchEvent(new KeyboardEvent(type, { key: value, repeat, bubbles: true, cancelable: true }));

    control.focus();
    key('keydown', 'ArrowUp');
    key('keydown', 'ArrowRight');
    await waitFor(() => {
      const vector = readVector(fixture);
      return vector.x > 0 && vector.y > 0;
    }, 'Two held arrow keys must produce a diagonal command.');

    key('keyup', 'ArrowRight');
    await waitFor(() => {
      const vector = readVector(fixture);
      return vector.x === 0 && vector.y > 0 && fixture.dataset.endCount === '0';
    }, 'Releasing one key must recompute from the key that remains held without ending.');

    key('keydown', 'ArrowUp', true);
    await waitFor(() => readVector(fixture).y > 0 && fixture.dataset.endCount === '0', 'Key repeat must not restart a released chord.');
    key('keyup', 'ArrowUp');
    await waitFor(() => {
      const vector = readVector(fixture);
      return vector.x === 0 && vector.y === 0 && fixture.dataset.endCount === '1';
    }, 'The final key release must emit one zero vector and end the command.');
  },
};

export const StickyVisualState = {
  name: '변형·상태 · 고정 손잡이와 명령 원점',
  parameters: {
    docs: {
      description: {
        story:
          'sticky 모드에서 시각 위치는 남기되 논리 명령은 0에서 다시 시작하는 분리를 자동 검증합니다. 남은 시각 위치가 잘못된 명령으로 새지 않는지 확인하는 계약입니다.',
      },
    },
  },
  render: () => <ContractFixture sticky />,
  play: async ({ canvasElement }) => {
    const fixture = canvasElement.querySelector('[data-testid="joystick-contract"]');
    const control = fixture?.querySelector('[role="application"]');
    if (!fixture || !control) throw new Error('Sticky Joystick fixture did not render.');
    const KeyboardEvent = control.ownerDocument.defaultView.KeyboardEvent;
    const key = (type, value) => control.dispatchEvent(new KeyboardEvent(type, { key: value, bubbles: true, cancelable: true }));

    control.focus();
    key('keydown', 'ArrowRight');
    key('keyup', 'ArrowRight');
    await waitFor(() => readVector(fixture).x === 0 && Number(control.dataset.positionX) > 0, 'Sticky release must keep only the visual position.');

    key('keydown', 'ArrowUp');
    await waitFor(() => {
      const vector = readVector(fixture);
      return vector.x === 0 && vector.y > 0;
    }, 'The next sticky keyboard command must start from a zero logical origin.');
    key('keyup', 'ArrowUp');
    await waitFor(() => fixture.dataset.endCount === '2' && Number(control.dataset.positionY) < 0, 'The second release must preserve its new visual position.');

    key('keydown', ' ');
    await waitFor(() => Number(control.dataset.positionX) === 0 && Number(control.dataset.positionY) === 0, 'Space must explicitly center a stale sticky visual position.');
    if (fixture.dataset.endCount !== '2') throw new Error('Centering an already stopped sticky control must not emit a duplicate end event.');
  },
};

export const PointerPressAndRelease = {
  name: '상호작용 · 포인터 누름과 떼기',
  parameters: {
    docs: {
      description: {
        story:
          '포인터를 누른 지점에서 즉시 명령이 나가고, 떼면 0 벡터로 정지하는지 자동 검증합니다. 포인터 입력의 "놓으면 정지"를 확인하는 계약입니다.',
      },
    },
  },
  render: () => <ContractFixture />,
  play: async ({ canvasElement }) => {
    const fixture = canvasElement.querySelector('[data-testid="joystick-contract"]');
    const control = fixture?.querySelector('[role="application"]');
    if (!fixture || !control) throw new Error('Joystick contract fixture did not render.');
    const bounds = control.getBoundingClientRect();
    const PointerEvent = control.ownerDocument.defaultView.PointerEvent;
    const pointer = {
      pointerId: 7,
      pointerType: 'mouse',
      isPrimary: true,
      button: 0,
      buttons: 1,
      clientX: bounds.left + bounds.width * 0.78,
      clientY: bounds.top + bounds.height / 2,
      bubbles: true,
      cancelable: true,
    };

    control.dispatchEvent(new PointerEvent('pointerdown', pointer));
    await waitFor(() => readVector(fixture).x > 0, 'Pointer down at an offset must emit a vector without requiring a drag.');

    control.dispatchEvent(new PointerEvent('pointerup', { ...pointer, buttons: 0 }));
    await waitFor(() => {
      const vector = readVector(fixture);
      return vector.x === 0 && vector.y === 0 && fixture.dataset.endCount === '1';
    }, 'Pointer up must emit one zero vector and end the command.');
    if (fixture.dataset.endReason !== 'pointer-release' || control.dataset.active !== 'false') {
      throw new Error('Pointer release must expose the pointer-release reason and clear active state.');
    }
  },
};

export const PointerCaptureFallbackContract = {
  name: '포인터 캡처 실패 후 정지 보장',
  tags: ['!dev'],
  parameters: {
    docs: {
      description: {
        story:
          '포인터 캡처가 붙지 않는 입력(synthetic·일부 장치)에서 요소 밖에서 손을 떼도 명령이 0으로 정지하는지 검증하는 안전 계약입니다.',
      },
    },
  },
  render: () => <ContractFixture />,
  play: async ({ canvasElement }) => {
    const fixture = canvasElement.querySelector('[data-testid="joystick-contract"]');
    const control = fixture?.querySelector('[role="application"]');
    if (!fixture || !control) throw new Error('Joystick contract fixture did not render.');
    const view = control.ownerDocument.defaultView;
    const PointerEvent = view.PointerEvent;
    const bounds = control.getBoundingClientRect();

    // A pointerId that is not a real active pointer makes setPointerCapture
    // throw/no-op, so hasPointerCapture stays false — the exact path where the
    // element would otherwise never receive the release. The engagement must
    // fall back to the window so a release anywhere still stops the command.
    const pointerId = 999;
    control.dispatchEvent(new PointerEvent('pointerdown', {
      pointerId, pointerType: 'touch', isPrimary: true,
      clientX: bounds.left + bounds.width * 0.8, clientY: bounds.top + bounds.height / 2,
      bubbles: true, cancelable: true,
    }));
    await waitFor(() => readVector(fixture).x > 0, 'Pointer down must emit a command even when capture does not take.');
    if (control.hasPointerCapture?.(pointerId)) {
      throw new Error('This contract requires the capture to have failed; the fixture unexpectedly captured the pointer.');
    }

    // Release on the window, far outside the control bounds.
    view.dispatchEvent(new PointerEvent('pointerup', {
      pointerId, pointerType: 'touch',
      clientX: bounds.left - 400, clientY: bounds.top - 400,
      bubbles: true, cancelable: true,
    }));
    await waitFor(() => {
      const vector = readVector(fixture);
      return vector.x === 0 && vector.y === 0 && fixture.dataset.endCount === '1';
    }, 'A release outside the element must still emit one zero vector and end the command.');
    if (control.dataset.active !== 'false') {
      throw new Error('The joystick must clear its active state after the window fallback release.');
    }
  },
};

export const JoystickCard = { ...JoystickCardStory, name: 'Joystick card parity', tags: ['!dev', 'visual-parity'] };
