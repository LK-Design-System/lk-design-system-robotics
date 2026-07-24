import React from 'react';
import { userEvent, waitFor } from 'storybook/test';
import { Button, DirectionalPad, Joystick, ManualControlSession } from './lds.js';
import { storyDescription } from './StoryGuide.shared.jsx';

const RELEASE_LABEL_STYLE = {
  color: 'var(--color-semantic-label-neutral)',
  fontSize: 'var(--label1-size)',
  lineHeight: 'var(--label1-line)',
};

function ControlSurface({ interactionEnabled, joystickLabel = '이동', joystickSize = 144, padSize = 44 }) {
  const [lastJog, setLastJog] = React.useState('없음');
  const jogLabels = { up: '앞으로', down: '뒤로', left: '왼쪽으로', right: '오른쪽으로' };

  return (
    <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 'var(--space-6)' }}>
      <Joystick size={joystickSize} disabled={!interactionEnabled} label={joystickLabel} />
      <section aria-label="비드래그 정밀 이동" style={{ display: 'grid', justifyItems: 'center', gap: 'var(--space-2)', minWidth: 0 }}>
        <strong style={{ color: 'var(--color-semantic-label-strong)', fontSize: 'var(--label1-size)', lineHeight: 'var(--label1-line)' }}>정밀 이동</strong>
        <span style={{ color: 'var(--color-semantic-label-neutral)', fontSize: 'var(--caption1-size)', lineHeight: 'var(--caption1-line)', textAlign: 'center' }}>한 번 누를 때 한 단계 이동</span>
        <DirectionalPad
          size={padSize}
          disabled={!interactionEnabled}
          label="정밀 이동 방향"
          onStep={(direction) => setLastJog(jogLabels[direction] || direction)}
        />
        <output style={{ color: 'var(--color-semantic-label-alternative)', fontSize: 'var(--caption1-size)', lineHeight: 'var(--caption1-line)' }}>최근 단계: {lastJog}</output>
      </section>
    </div>
  );
}

export default {
  title: 'LDS Robotics/Control/Manual Control Session',
  component: ManualControlSession,
  parameters: {
    layout: 'centered',
    storyGuide: {
      storyId: 'lds-robotics-control-manual-control-session--authorized-session',
      eyebrow: 'Robotics / Manual Control Session',
      title: '수동 제어 세션은 권한 확인부터 안전 해제까지 한 경계에서 관리합니다',
      description:
        '운영자가 로봇을 직접 움직이기 전에 연결·권한·활성화 조건을 확인하고 모든 종료 경로에서 정지를 보장해야 할 때 적합합니다. 단순 방향 입력만 필요하거나 제품이 세션 안전 수명주기를 이미 소유한다면 Joystick 또는 Directional Pad를 직접 사용하세요.',
    },
    docs: {
      description: {
        component: '연결·권한·UI arm·외부 활성화 입력·focus와 운행 정지 요청 lifecycle을 분리하고 safe-release를 계약하는 LK Robotics session boundary입니다.',
      },
    },
  },
};

export const AuthorizedSession = {
  name: '개요',
  parameters: storyDescription(
    '연결과 제어 권한이 준비된 뒤 운영자가 수동 제어를 활성화하는 기본 세션입니다. 권한 보유와 UI arm 상태가 분리되어 보이고 활성화 전에는 이동 입력이 차단되는지 확인하세요.',
  ),
  render: function Example() {
    const [armed, setArmed] = React.useState(false);
    const [stopRequestState, setStopRequestState] = React.useState('idle');
    const [lastRelease, setLastRelease] = React.useState('없음');

    const reset = () => {
      setArmed(false);
      setStopRequestState('idle');
      setLastRelease('없음');
    };

    return (
      <div style={{ display: 'grid', gap: 'var(--space-3)', width: 620, maxWidth: 'calc(100vw - 48px)' }}>
        <ManualControlSession
          data-testid="authorized-session"
          title="AMR 수동 주행"
          linkState="ready"
          authority="granted"
          armed={armed}
          deadmanRequired={false}
          controlMode="hybrid"
          sessionMeta="설정된 제어 한도 0.4 m/s"
          stopRequestState={stopRequestState}
          onArmedChange={setArmed}
          onSafetyReleaseRequest={setLastRelease}
          onStopRequest={() => setStopRequestState('requesting')}
        >
          {({ interactionEnabled }) => <ControlSurface interactionEnabled={interactionEnabled} />}
        </ManualControlSession>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <output data-testid="authorized-release-output" style={RELEASE_LABEL_STYLE}>최근 release 요청: {lastRelease}</output>
          <Button data-testid="reset-session" size="sm" variant="ghost" onClick={reset}>예제 초기화</Button>
        </div>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const session = canvasElement.querySelector('[data-testid="authorized-session"]');
    if (!session) throw new Error('ManualControlSession root is missing.');

    const heading = session.querySelector('h2');
    if (!heading?.id || session.getAttribute('aria-labelledby') !== heading.id || heading.textContent?.trim() !== 'AMR 수동 주행') {
      throw new Error('ManualControlSession must expose its title as the section heading.');
    }

    const connection = session.querySelector('[data-status="ready"]');
    if (connection?.textContent?.trim() !== '연결 준비됨') {
      throw new Error('A ready transport prerequisite must use the non-green ready state.');
    }
    const authorityGranted = Array.from(session.querySelectorAll('span'))
      .some((element) => element.textContent?.trim() === '권한 부여됨');
    if (!authorityGranted) throw new Error('The granted authority prerequisite must remain text-labelled.');

    const stopButton = Array.from(session.querySelectorAll('button'))
      .find((button) => button.textContent?.includes('운행 정지 요청'));
    const stopZone = stopButton?.parentElement;
    if (!stopButton || stopButton.disabled || stopButton.getBoundingClientRect().height < 40 || parseFloat(getComputedStyle(stopZone).borderLeftWidth) === 0) {
      throw new Error('The stop request must be a 40px-or-larger action separated from passive prerequisites.');
    }
    const header = session.querySelector('header');
    const identity = header?.firstElementChild;
    const trailing = header?.lastElementChild;
    const centerY = (element) => element.getBoundingClientRect().top + element.getBoundingClientRect().height / 2;
    if (!header || !identity || !trailing || header.getBoundingClientRect().height > 88 || Math.abs(centerY(identity) - centerY(trailing)) > 4) {
      throw new Error('At the 620px target width, identity, prerequisites, and stop action must share one visual header row.');
    }

    const guardBanner = session.querySelector('[data-banner-variant="embedded"]');
    if (guardBanner?.getAttribute('role') !== 'status' || !guardBanner.textContent?.includes('수동 제어 잠김')) {
      throw new Error('A safe unarmed session must use the compact embedded status Banner.');
    }
    const armButton = session.querySelector('button[aria-pressed="false"]');
    const blockedControls = session.querySelector('[data-interaction-enabled="false"]');
    if (!armButton || armButton.textContent?.trim() !== '수동 제어 준비' || armButton.disabled) {
      throw new Error('An authorized session must expose an enabled prepare-control action.');
    }
    if (!blockedControls?.hasAttribute('inert') || blockedControls.getAttribute('aria-disabled') !== 'true' || getComputedStyle(blockedControls).opacity !== '1') {
      throw new Error('Blocked controls must be inert without compounding child disabled opacity.');
    }

    await userEvent.click(armButton);
    await waitFor(() => {
      const armedButton = session.querySelector('button[aria-pressed="true"]');
      const activeControls = session.querySelector('[data-interaction-enabled="true"]');
      const joystick = session.querySelector('[role="application"]');
      const padButton = session.querySelector('[aria-label="정밀 이동 방향"] button');
      if (!armedButton || armedButton.textContent?.trim() !== '수동 제어 해제' || !activeControls || joystick?.getAttribute('tabindex') !== '0' || padButton?.disabled) {
        throw new Error('Arming must enable both hold-to-run and non-drag control alternatives.');
      }
      if (!session.querySelector('[data-banner-variant="embedded"]')?.textContent?.includes('수동 제어 가능')) {
        throw new Error('Only the aggregate ready state may use the positive ready Banner.');
      }
    });

    await userEvent.click(stopButton);
    await waitFor(() => {
      const output = canvasElement.querySelector('[data-testid="authorized-release-output"]');
      const requestingButton = Array.from(session.querySelectorAll('button'))
        .find((button) => button.textContent?.includes('정지 요청 전송 중'));
      const stoppedControls = session.querySelector('[data-interaction-enabled="false"]');
      if (requestingButton?.getAttribute('aria-disabled') !== 'true' || requestingButton.disabled || requestingButton.getAttribute('aria-busy') !== 'true') {
        throw new Error('A pending stop request must block via aria-disabled (focus-preserving), not native disabled, while exposing progress.');
      }
      if (!session.querySelector('[data-banner-variant="embedded"]')?.textContent?.includes('운행 정지 요청 전송 중')) {
        throw new Error('A stop request must not be presented as an already confirmed stop.');
      }
      if (!stoppedControls?.hasAttribute('inert') || !output?.textContent?.includes('stop-requested') || !session.querySelector('button[aria-pressed="false"]')) {
        throw new Error('A stop request must immediately release, disarm, and block local controls.');
      }
    });

    await userEvent.click(canvasElement.querySelector('[data-testid="reset-session"]'));
    await waitFor(() => {
      if (!session.querySelector('[data-banner-variant="embedded"]')?.textContent?.includes('수동 제어 잠김')) {
        throw new Error('The fixture must return to its unarmed baseline.');
      }
    });
  },
};

export const StopRequestLifecycle = {
  name: '상호작용 · 운행 정지 요청과 완료',
  parameters: storyDescription(
    '운영자가 운행 정지를 요청하고 요청 중·완료·실패 응답을 받는 상황입니다. 중복 요청이 막히고 각 단계의 상태와 다음 가능한 동작이 명확히 전달되는지 확인하세요.',
  ),
  render: function Example() {
    const [state, setState] = React.useState('idle');
    const [armed, setArmed] = React.useState(true);
    return (
      <div style={{ display: 'grid', gap: 'var(--space-3)', width: 620, maxWidth: 'calc(100vw - 48px)' }}>
        <div aria-label="정지 요청 상태 시뮬레이션" style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <Button size="sm" variant="ghost" onClick={() => setState('acknowledged')}>ACK 표시</Button>
          <Button size="sm" variant="ghost" onClick={() => setState('stopped')}>실제 정지 확인</Button>
          <Button size="sm" variant="ghost" onClick={() => setState('failed')}>실패 표시</Button>
          <Button size="sm" variant="ghost" onClick={() => setState('idle')}>초기화</Button>
          <Button size="sm" variant="ghost" onClick={() => setArmed(false)}>요청된 disarm 반영</Button>
        </div>
        <ManualControlSession
          data-testid="stop-lifecycle-session"
          title="AMR 수동 주행"
          linkState="ready"
          authority="granted"
          armed={armed}
          deadmanRequired={false}
          stopRequestState={state}
          onArmedChange={(next) => { if (next) setArmed(true); }}
          onStopRequest={() => setState('requesting')}
        >
          {({ interactionEnabled }) => <Joystick disabled={!interactionEnabled} label="이동" />}
        </ManualControlSession>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const session = canvasElement.querySelector('[data-testid="stop-lifecycle-session"]');
    const stateButtons = Array.from(canvasElement.querySelectorAll('[aria-label="정지 요청 상태 시뮬레이션"] button'));
    const byText = (text) => stateButtons.find((button) => button.textContent?.trim() === text);
    if (!session || !byText('실패 표시')) throw new Error('Stop lifecycle fixture is incomplete.');

    await userEvent.click(byText('실패 표시'));
    await waitFor(() => {
      const banner = session.querySelector('[data-banner-variant="embedded"]');
      const retry = Array.from(session.querySelectorAll('button')).find((button) => button.textContent?.includes('다시 요청'));
      if (banner?.getAttribute('role') !== 'alert' || !banner.textContent?.includes('요청 실패') || !retry || retry.disabled) {
        throw new Error('A failed request must be an assertive, retryable state without claiming a stop.');
      }
    });

    const retry = Array.from(session.querySelectorAll('button')).find((button) => button.textContent?.includes('다시 요청'));
    await userEvent.click(retry);
    await waitFor(() => {
      const banner = session.querySelector('[data-banner-variant="embedded"]');
      if (banner?.getAttribute('role') !== 'status' || !banner.textContent?.includes('전송 중')) {
        throw new Error('Retry must return to a polite pending state.');
      }
    });

    await userEvent.click(byText('ACK 표시'));
    await waitFor(() => {
      if (!session.querySelector('[data-banner-variant="embedded"]')?.textContent?.includes('실제 정지는 아직 확인되지 않았습니다')) {
        throw new Error('ACK must remain distinct from actual stopped confirmation.');
      }
    });
    await userEvent.click(byText('실제 정지 확인'));
    await waitFor(() => {
      if (!session.querySelector('[data-banner-variant="embedded"]')?.textContent?.includes('운행 정지 확인됨')) {
        throw new Error('Stopped confirmation must be explicit.');
      }
    });
    await userEvent.click(byText('초기화'));
    await waitFor(() => {
      const banner = session.querySelector('[data-banner-variant="embedded"]');
      if (!banner?.textContent?.includes('수동 제어 재활성화 필요') || !session.querySelector('[data-interaction-enabled="false"]')?.hasAttribute('inert')) {
        throw new Error('Returning lifecycle state to idle must not resume controls until disarm is observed.');
      }
    });
    await userEvent.click(byText('요청된 disarm 반영'));
    await waitFor(() => {
      if (!session.querySelector('[data-banner-variant="embedded"]')?.textContent?.includes('수동 제어 잠김') || !session.querySelector('button[aria-pressed="false"]')) {
        throw new Error('After disarm is observed, the session must require an explicit new prepare action.');
      }
    });
  },
};

export const StopRequestUnmount = {
  name: '정지 요청 직후 세션 제거',
  tags: ['!dev'],
  parameters: storyDescription(
    '정지 요청 직후 수동 제어 세션이 화면에서 제거되는 경계 상황입니다. 컴포넌트가 사라져도 안전 해제와 정지 요청이 누락되거나 중복 실행되지 않는지 확인하세요.',
  ),
  render: function Example() {
    const [mounted, setMounted] = React.useState(true);
    const [releaseReasons, setReleaseReasons] = React.useState([]);
    const [stopCount, setStopCount] = React.useState(0);
    return (
      <div style={{ display: 'grid', gap: 'var(--space-3)', width: 620, maxWidth: 'calc(100vw - 48px)' }}>
        {mounted && (
          <ManualControlSession
            data-testid="stop-unmount-session"
            title="AMR 수동 주행"
            linkState="ready"
            authority="granted"
            armed
            deadmanRequired={false}
            onArmedChange={() => {}}
            onSafetyReleaseRequest={(reason) => setReleaseReasons((current) => [...current, reason])}
            onStopRequest={() => {
              setStopCount((count) => count + 1);
              setMounted(false);
            }}
          >
            <Joystick label="이동" />
          </ManualControlSession>
        )}
        <output data-testid="stop-unmount-output" style={RELEASE_LABEL_STYLE}>release: {releaseReasons.join(',') || '없음'} · stop callback: {stopCount}</output>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const session = canvasElement.querySelector('[data-testid="stop-unmount-session"]');
    const stopButton = session && Array.from(session.querySelectorAll('button')).find((button) => button.textContent?.includes('운행 정지 요청'));
    if (!session || !stopButton) throw new Error('Stop-and-unmount fixture did not render.');
    await userEvent.click(stopButton);
    await waitFor(() => {
      const output = canvasElement.querySelector('[data-testid="stop-unmount-output"]');
      if (canvasElement.querySelector('[data-testid="stop-unmount-session"]') || output?.textContent?.trim() !== 'release: stop-requested · stop callback: 1') {
        throw new Error('A stop-triggered unmount must publish exactly one stop-requested release without a duplicate unmount release.');
      }
    });
  },
};

export const StopFocusPreservedContract = {
  name: '정지 요청 후 키보드 포커스 보존 계약',
  tags: ['!dev'],
  parameters: storyDescription(
    '키보드로 운행 정지를 요청한 직후 정지 컨트롤이 진행 상태로 잠기는 순간의 포커스 계약입니다. 정지 버튼이 native disabled로 바뀌어 포커스가 body로 떨어지지 않고, 초점을 유지한 채 aria-disabled + aria-busy로만 중복 요청을 막는지 확인하세요.',
  ),
  render: function Example() {
    const [stopRequestState, setStopRequestState] = React.useState('idle');
    return (
      <div style={{ display: 'grid', gap: 'var(--space-3)', width: 620, maxWidth: 'calc(100vw - 48px)' }}>
        <ManualControlSession
          data-testid="stop-focus-session"
          title="AMR 수동 주행"
          linkState="ready"
          authority="granted"
          armed
          deadmanRequired={false}
          stopRequestState={stopRequestState}
          onArmedChange={() => {}}
          onStopRequest={() => setStopRequestState('requesting')}
        >
          {({ interactionEnabled }) => <Joystick disabled={!interactionEnabled} label="이동" />}
        </ManualControlSession>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const session = canvasElement.querySelector('[data-testid="stop-focus-session"]');
    const stopButton = session && Array.from(session.querySelectorAll('button'))
      .find((button) => button.textContent?.includes('운행 정지 요청'));
    if (!session || !stopButton) throw new Error('Stop-focus fixture did not render.');
    if (stopButton.disabled || stopButton.getAttribute('aria-disabled') === 'true') {
      throw new Error('An authorized idle session must offer an active stop control.');
    }

    stopButton.focus();
    stopButton.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    if (document.activeElement !== stopButton) throw new Error('The stop control must be focusable.');

    await userEvent.keyboard('{Enter}');
    await waitFor(() => {
      const requesting = Array.from(session.querySelectorAll('button'))
        .find((button) => button.textContent?.includes('정지 요청 전송 중'));
      if (!requesting) throw new Error('The stop request state did not advance.');
      if (document.activeElement === document.body || document.activeElement !== requesting) {
        throw new Error('Keyboard focus must stay on the stop control after it locks — it must not fall to <body>.');
      }
      if (requesting.disabled || requesting.getAttribute('aria-disabled') !== 'true' || requesting.getAttribute('aria-busy') !== 'true') {
        throw new Error('A pending stop must block via aria-disabled + aria-busy, not native disabled.');
      }
    });
    document.activeElement?.blur?.();
  },
};

export const LegacyStopRequestAlias = {
  name: '기존 정지 요청 callback 호환',
  tags: ['!dev'],
  parameters: storyDescription(
    '기존 onRequestStop 별칭을 사용하는 제품을 새 세션 계약과 함께 운용하는 호환 상황입니다. 레거시 callback도 한 번만 호출되고 안전 해제 이유가 동일하게 보고되는지 확인하세요.',
  ),
  render: function Example() {
    const [armed, setArmed] = React.useState(true);
    const [releaseReason, setReleaseReason] = React.useState('없음');
    const [requestCount, setRequestCount] = React.useState(0);
    return (
      <div style={{ display: 'grid', gap: 'var(--space-3)', width: 620, maxWidth: 'calc(100vw - 48px)' }}>
        <ManualControlSession
          data-testid="legacy-stop-session"
          title="AMR 수동 주행"
          linkState="ready"
          authority="granted"
          armed={armed}
          deadmanRequired={false}
          onArmedChange={setArmed}
          onSafetyReleaseRequest={setReleaseReason}
          onEmergencyStopRequest={() => setRequestCount((count) => count + 1)}
        >
          {({ interactionEnabled }) => <Joystick disabled={!interactionEnabled} label="이동" />}
        </ManualControlSession>
        <output data-testid="legacy-stop-output" style={RELEASE_LABEL_STYLE}>release: {releaseReason} · callback: {requestCount}</output>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const session = canvasElement.querySelector('[data-testid="legacy-stop-session"]');
    const stopButton = session && Array.from(session.querySelectorAll('button')).find((button) => button.textContent?.includes('운행 정지 요청'));
    if (!session || !stopButton) throw new Error('Legacy stop callback fixture did not render.');
    await userEvent.click(stopButton);
    await waitFor(() => {
      const banner = session.querySelector('[data-banner-variant="embedded"]');
      const output = canvasElement.querySelector('[data-testid="legacy-stop-output"]');
      if (!session.querySelector('button[aria-pressed="false"]') || !banner?.textContent?.includes('수동 제어 잠김') || banner.textContent.includes('전송 중')) {
        throw new Error('A callback-only legacy consumer that honors disarm must return to the safe unarmed state.');
      }
      if (output?.textContent?.trim() !== 'release: stop-requested · callback: 1') {
        throw new Error('The deprecated callback alias must fire once with one release request.');
      }
    });
  },
};

export const AuthorityRevoked = {
  name: '변형·상태 · 권한 회수',
  parameters: storyDescription(
    '연결은 유지되지만 원격 제어 권한이 회수된 세션입니다. 회수 사유가 읽히고 모든 제어 입력과 활성화 동작이 즉시 차단되는지 확인하세요.',
  ),
  args: {
    style: { width: 620, maxWidth: 'calc(100vw - 48px)' },
    title: 'AMR 수동 주행',
    linkState: 'ready',
    authority: 'revoked',
    armed: false,
    onArmedChange: () => {},
    onStopRequest: () => {},
    children: <Joystick disabled label="이동" />,
  },
};

export const LinkLossRelease = {
  name: '상호작용 · 연결 끊김과 재활성화',
  parameters: storyDescription(
    '활성 제어 중 링크가 끊겼다가 복구되는 상황입니다. 연결 손실 시 안전 해제가 즉시 요청되고 복구 후 운영자가 명시적으로 다시 활성화하기 전에는 입력이 재개되지 않는지 확인하세요.',
  ),
  render: function Example() {
    const [linkState, setLinkState] = React.useState('ready');
    const [armed, setArmed] = React.useState(false);
    const [lastRelease, setLastRelease] = React.useState('없음');

    return (
      <div style={{ display: 'grid', gap: 'var(--space-3)', width: 620, maxWidth: 'calc(100vw - 48px)' }}>
        <Button variant="flat" disabled={linkState !== 'ready'} onClick={() => setLinkState('lost')}>연결 끊김 시뮬레이션</Button>
        <ManualControlSession
          data-testid="link-loss-session"
          title="AMR 수동 주행"
          linkState={linkState}
          authority="granted"
          armed={armed}
          deadmanRequired={false}
          onArmedChange={setArmed}
          onSafetyReleaseRequest={setLastRelease}
          onStopRequest={() => {}}
        >
          {({ interactionEnabled }) => <Joystick disabled={!interactionEnabled} label="이동" />}
        </ManualControlSession>
        <output data-testid="link-loss-release-output" style={RELEASE_LABEL_STYLE}>armed: {String(armed)} · 최근 release 요청: {lastRelease}</output>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const session = canvasElement.querySelector('[data-testid="link-loss-session"]');
    const linkLossButton = Array.from(canvasElement.querySelectorAll('button'))
      .find((button) => button.textContent?.trim() === '연결 끊김 시뮬레이션');
    const armButton = session?.querySelector('button[aria-pressed="false"]');
    if (!session || !linkLossButton || !armButton) throw new Error('Link-loss fixture must expose its transition controls.');

    await userEvent.click(armButton);
    await waitFor(() => {
      if (!session.querySelector('[data-interaction-enabled="true"]') || !session.querySelector('button[aria-pressed="true"]')) {
        throw new Error('Arming an authorized session must enable its control region.');
      }
    });
    await userEvent.click(linkLossButton);
    await waitFor(() => {
      const output = canvasElement.querySelector('[data-testid="link-loss-release-output"]');
      const disconnected = session.querySelector('[data-status="offline"]');
      if (!output?.textContent?.includes('armed: false') || !output.textContent.includes('link-unavailable')) {
        throw new Error('Link loss must disarm and publish its release reason.');
      }
      if (disconnected?.textContent?.trim() !== '연결 끊김' || !session.querySelector('[data-interaction-enabled="false"]')?.hasAttribute('inert')) {
        throw new Error('Link loss must update connection state and block controls.');
      }
      if (!session.querySelector('button[aria-pressed="false"]')?.disabled) {
        throw new Error('The session cannot be re-armed while the link is unavailable.');
      }
    });
  },
};

export const ExternalEnablingDevice = {
  name: '시나리오 · 외부 활성화 장치 대기',
  parameters: storyDescription(
    '펜던트나 데드맨 스위치 같은 외부 활성화 장치가 아직 준비되지 않은 세션입니다. 외부 조건의 대기 상태와 필요한 조치가 보이며 UI만으로 제어를 우회할 수 없는지 확인하세요.',
  ),
  args: {
    style: { width: 620, maxWidth: 'calc(100vw - 48px)' },
    title: 'Pendant 연동 수동 주행',
    linkState: 'ready',
    authority: 'granted',
    armed: true,
    deadmanRequired: true,
    deadmanActive: false,
    deadmanControl: <span style={RELEASE_LABEL_STYLE}>물리 활성화 장치 해제됨</span>,
    onArmedChange: () => {},
    onStopRequest: () => {},
    children: <Joystick disabled label="이동" />,
  },
};

export const FocusAndUnmountRelease = {
  name: '상호작용 · 포커스 상실과 화면 제거',
  parameters: storyDescription(
    '활성 세션이 창 포커스를 잃거나 컴포넌트가 제거되는 비정상 종료 상황입니다. 두 종료 경로 모두 안전 해제를 요청하고 같은 경로에서 요청이 중복되지 않는지 확인하세요.',
  ),
  render: function Example() {
    const [mounted, setMounted] = React.useState(true);
    const [lastRelease, setLastRelease] = React.useState('없음');
    return (
      <div style={{ display: 'grid', gap: 'var(--space-3)', width: 620, maxWidth: 'calc(100vw - 48px)' }}>
        <Button variant="flat" onClick={() => setMounted((value) => !value)}>{mounted ? '세션 제거' : '세션 다시 표시'}</Button>
        {mounted && (
          <ManualControlSession
            title="키보드 수동 제어"
            linkState="ready"
            authority="granted"
            armed
            deadmanRequired={false}
            controlMode="keyboard"
            focusRequired
            onArmedChange={() => {}}
            onSafetyReleaseRequest={setLastRelease}
            onStopRequest={() => {}}
          >
            {({ interactionEnabled }) => <Button disabled={!interactionEnabled}>방향 입력</Button>}
          </ManualControlSession>
        )}
        <Button variant="outlined" color="assistive">세션 밖으로 focus 이동</Button>
        <output style={RELEASE_LABEL_STYLE}>최근 release 요청: {lastRelease}</output>
      </div>
    );
  },
};

export const NarrowCompoundStates = {
  name: '반응형 · 좁은 폭 · 점검·제어·정지 실패',
  parameters: storyDescription(
    '320px 폭에서 점검 대기·제어 가능·정지 실패의 복합 상태를 세로로 비교합니다. 긴 안전 문구와 복구 동작이 잘리지 않고 제어 영역보다 상태 판단이 먼저 읽히는지 확인하세요.',
  ),
  render: () => (
    <main data-testid="narrow-manual-control-states" style={{ display: 'grid', gap: 'var(--space-5)', width: 320, maxWidth: '100%' }}>
      <ManualControlSession
        data-testid="cautionary-session"
        title="점검 대기 중인 AMR 수동 주행"
        linkState="stale"
        authority="checking"
        armed={false}
        deadmanRequired={false}
        controlMode="pointer"
        sessionMeta="마지막 연결 확인 18초 전 · 명령 전송 일시 중지"
        onArmedChange={() => {}}
        onStopRequest={() => {}}
      >
        {({ interactionEnabled }) => <Joystick size={112} disabled={!interactionEnabled} label="점검 중 이동" />}
      </ManualControlSession>

      <ManualControlSession
        data-testid="enabled-session"
        title="피킹 구역의 긴 이름을 가진 AMR 수동 주행"
        linkState="ready"
        authority="granted"
        armed
        deadmanRequired={false}
        controlMode="pointer"
        sessionMeta="설정된 제어 한도 0.25 m/s · 근거리 점검 모드"
        onArmedChange={() => {}}
        onStopRequest={() => {}}
      >
        {({ interactionEnabled }) => <ControlSurface interactionEnabled={interactionEnabled} joystickLabel="활성 이동" joystickSize={112} padSize={40} />}
      </ManualControlSession>

      <ManualControlSession
        data-testid="failed-stop-session"
        title="출고 구역 AMR 수동 주행"
        linkState="ready"
        authority="granted"
        armed={false}
        deadmanRequired={false}
        stopRequestState="failed"
        stopRequestMessage="요청 시간이 초과되었습니다. 로봇 상태를 직접 확인한 뒤 다시 요청하세요."
        onArmedChange={() => {}}
        onStopRequest={() => {}}
      >
        {({ interactionEnabled }) => <Joystick size={112} disabled={!interactionEnabled} label="정지 실패 후 이동" />}
      </ManualControlSession>
    </main>
  ),
  play: async ({ canvasElement }) => {
    const fixture = canvasElement.querySelector('[data-testid="narrow-manual-control-states"]');
    const cautionary = canvasElement.querySelector('[data-testid="cautionary-session"]');
    const enabled = canvasElement.querySelector('[data-testid="enabled-session"]');
    const failed = canvasElement.querySelector('[data-testid="failed-stop-session"]');
    if (!fixture || !cautionary || !enabled || !failed || Math.round(fixture.getBoundingClientRect().width) !== 320) {
      throw new Error('The compound fixture must preserve all states at the 320px target width.');
    }

    const stale = cautionary.querySelector('[data-status="stale"]');
    if (stale?.textContent?.trim() !== '연결 정보 오래됨' || !cautionary.querySelector('[data-banner-variant="embedded"]')?.textContent?.includes('연결 상태 점검 필요')) {
      throw new Error('The cautionary fixture must expose stale link and blocking guidance.');
    }
    if (!cautionary.querySelector('[data-interaction-enabled="false"]')?.hasAttribute('inert') || !cautionary.querySelector('button[aria-pressed="false"]')?.disabled) {
      throw new Error('Stale/checking state must block controls and activation.');
    }

    const enabledControls = enabled.querySelector('[data-interaction-enabled="true"]');
    if (!enabledControls || enabled.querySelector('[role="application"]')?.getAttribute('tabindex') !== '0' || !enabled.querySelector('[data-banner-variant="embedded"]')?.textContent?.includes('수동 제어 가능')) {
      throw new Error('The enabled fixture must expose both active controls and aggregate readiness.');
    }
    const failedBanner = failed.querySelector('[data-banner-variant="embedded"]');
    if (failedBanner?.getAttribute('role') !== 'alert' || !failedBanner.textContent?.includes('시간이 초과')) {
      throw new Error('The narrow failure fixture must preserve assertive failure details.');
    }

    const surfaces = [fixture, cautionary, enabled, failed, ...fixture.querySelectorAll('header, footer, [data-interaction-enabled]')];
    if (surfaces.some((surface) => surface.scrollWidth > surface.clientWidth + 1)) {
      throw new Error('ManualControlSession must not introduce horizontal overflow at 320px.');
    }
  },
};
