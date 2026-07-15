export { colors, radius, spacing, tabBar } from './tokens';
export { font, text } from './typography';
export { button, card, badge, input, iconButton } from './components';

import { tabBar } from './tokens';

export const tabBarStyle = {
  backgroundColor: tabBar.backgroundColor,
  borderTopColor: tabBar.borderTopColor,
  borderTopWidth: 1,
  height: tabBar.height,
};
