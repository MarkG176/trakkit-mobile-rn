export { colors, radius, spacing, tabBar, typography } from './tokens';
export { font, text } from './typography';
export { button, buttonHeights, card, badge, input, iconButton, pageHeader } from './components';

import { tabBar } from './tokens';

export const tabBarStyle = {
  backgroundColor: tabBar.backgroundColor,
  borderTopColor: tabBar.borderTopColor,
  borderTopWidth: 1,
  height: tabBar.height,
};
