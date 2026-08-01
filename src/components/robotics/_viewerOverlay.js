import { VIEWER_OVERLAY_SURFACE } from '@lk-design-system/lds-product/components/viz/_viewerOverlaySurface';

/**
 * LK ROBOTICS — viewer-overlay treatment shared by manual controls that float
 * on a viewer surface (video, dark map): DirectionalPad and Joystick.
 *
 * The recipe now lives upstream in lds-product's viewer-overlay surface family
 * (one source, two levels: `strong` 94% for toolbar chrome, `soft` 72% + blur
 * for over-footage controls). Robotics consumes the `soft` level — an
 * over-video control keeps the footage readable through itself, and the blur,
 * not the opacity, carries ink legibility. This module stays as the local
 * alias so consumers keep one import site and the level choice is made once.
 */
export const VIEWER_OVERLAY = VIEWER_OVERLAY_SURFACE.soft;
