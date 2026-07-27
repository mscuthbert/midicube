/**
 * Safari as of 18.5 is claiming to be able to be able to play ogg files but
 * still cannot.  It also applies to Webkit browsers that are skinned differently
 * like Chrome on iPad.  This seems to be the best detection I know of for now.
 *
 * When OGG support is confirmed from elsewhere, will remove this file.
 */
export const IS_SAFARI_DESKTOP = typeof window.safari !== 'undefined';
// a regex test rather than .includes() -- babel cannot tell String.includes from
// Array.includes, so .includes() drags the whole core-js polyfill into the bundle.
export const IS_FIREFOX = /firefox/i.test(window.navigator.userAgent);
export const SUPPORTS_SHADOW_SELECTION = typeof window.ShadowRoot.prototype.getSelection === 'function';
export const SUPPORTS_BEFORE_INPUT = typeof window.InputEvent.prototype.getTargetRanges === 'function';
export const IS_SAFARI = (
    !SUPPORTS_SHADOW_SELECTION && SUPPORTS_BEFORE_INPUT && !IS_FIREFOX
) || IS_SAFARI_DESKTOP;
