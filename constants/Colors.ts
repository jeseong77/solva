/**
 * Updated colors for a black-and-white theme.
 */

const tintColorLight = "#000000";
const tintColorDark = "#ffffff";

export const Colors = {
  light: {
    text: "#000000", // Black text
    background: "#ffffff", // White background
    cardBackground: "#ffffff", // White card background
    tint: tintColorLight, // Black tint
    icon: "#000000", // Black icons
    tabIconDefault: "#000000", // Black default tab icon
    tabIconSelected: "#000000", // Black selected tab icon
  },
  dark: {
    text: "#ffffff", // White text
    background: "#000000", // Black background
    cardBackground: "#000000", // Black card background
    tint: tintColorDark, // White tint
    icon: "#ffffff", // White icons
    tabIconDefault: "#ffffff", // White default tab icon
    tabIconSelected: tintColorDark, // White selected tab icon
  },
};
