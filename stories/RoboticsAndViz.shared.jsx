import React from 'react';
import { Joystick, RobotStatusCard, TopicTree } from '../src/index.js';

export const RobotStatusCardCard = {
  name: 'RobotStatusCard card parity',
  tags: ['!dev', 'visual-parity'],
  render: () => {
    const [selected, setSelected] = React.useState('t1');
    return (
      <div
        data-visual-crop-root
        style={{
          width: 700,
          height: 160,
          background: 'var(--color-semantic-background-normal-normal)',
          padding: 24,
          boxSizing: 'border-box',
          fontFamily: 'var(--font-sans)',
          color: 'var(--color-semantic-label-normal)',
        }}
      >
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <RobotStatusCard name="LKR-T1" status="online" battery={82} mode="자동" selected={selected === 't1'} onClick={() => setSelected('t1')} />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <RobotStatusCard name="LKR-CP" status="reconnecting" battery={38} mode="수동" selected={selected === 'cp'} onClick={() => setSelected('cp')} />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <RobotStatusCard name="OMO-01" status="offline" battery={14} selected={selected === 'om'} onClick={() => setSelected('om')} />
          </div>
        </div>
      </div>
    );
  },
};

export const JoystickCard = {
  name: 'Joystick card parity',
  tags: ['!dev', 'visual-parity'],
  render: () => {
    const [vector, setVector] = React.useState({ x: 0, y: 0 });
    return (
      <div
        data-visual-crop-root
        style={{
          width: 420,
          height: 330,
          background: 'var(--color-semantic-background-normal-normal)',
          padding: 24,
          boxSizing: 'border-box',
          fontFamily: 'var(--font-sans)',
          color: 'var(--color-semantic-label-normal)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 282,
        }}
      >
        <Joystick size={180} label={`x ${vector.x.toFixed(2)} · y ${vector.y.toFixed(2)}`} onChange={setVector} />
      </div>
    );
  },
};

export const TopicTreeCard = {
  name: 'TopicTree card parity',
  tags: ['!dev', 'visual-parity'],
  render: () => {
    const [subscriptions, setSubscriptions] = React.useState({ '/scan': true, '/odom': false });
    const topics = [
      { name: '/scan', type: 'sensor_msgs/LaserScan', hz: 10, subscribable: true, subscribed: subscriptions['/scan'] },
      { name: '/odom', type: 'nav_msgs/Odometry', hz: 50, subscribable: true, subscribed: subscriptions['/odom'] },
      { name: 'tf', children: [{ name: 'map' }, { name: 'odom' }, { name: 'base_link' }] },
    ];
    return (
      <div
        data-visual-crop-root
        style={{
          width: 480,
          height: 360,
          background: 'var(--color-semantic-background-normal-normal)',
          padding: 24,
          boxSizing: 'border-box',
          fontFamily: 'var(--font-sans)',
          color: 'var(--color-semantic-label-normal)',
        }}
      >
        <div
          style={{
            border: '1px solid var(--color-semantic-line-normal-normal)',
            borderRadius: 'var(--radius-lg)',
            padding: '6px 4px',
            background: 'var(--color-semantic-background-elevated-normal)',
          }}
        >
          <TopicTree
            nodes={topics}
            onToggleSubscribe={(node) =>
              setSubscriptions((current) => ({ ...current, [node.name]: !current[node.name] }))
            }
          />
        </div>
      </div>
    );
  },
};
