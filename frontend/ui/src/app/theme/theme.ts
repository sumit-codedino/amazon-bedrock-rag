export const theme = {
  colors: {
    primary: {
      main: "#3B82F6", // blue-500
      light: "#60A5FA", // blue-400
      dark: "#2563EB", // blue-600
      hover: "#1D4ED8", // blue-700
    },
    background: {
      light: {
        primary: "#FFFFFF",
        secondary: "#F9FAFB",
        gradient: "from-gray-50 to-white",
      },
      dark: {
        primary: "#1F2937",
        secondary: "#111827",
        gradient: "from-gray-900 to-gray-800",
      },
    },
    text: {
      light: {
        primary: "#111827",
        secondary: "#4B5563",
        tertiary: "#6B7280",
      },
      dark: {
        primary: "#F9FAFB",
        secondary: "#D1D5DB",
        tertiary: "#9CA3AF",
      },
    },
    chat: {
      light: {
        user: "#F3F4F6",
        bot: "#DBEAFE",
      },
      dark: {
        user: "#374151",
        bot: "#1E3A8A",
      },
    },
  },
  spacing: {
    xs: "0.25rem", // 4px
    sm: "0.5rem", // 8px
    md: "1rem", // 16px
    lg: "1.5rem", // 24px
    xl: "2rem", // 32px
    "2xl": "3rem", // 48px
  },
  borderRadius: {
    sm: "0.375rem", // 6px
    md: "0.5rem", // 8px
    lg: "0.75rem", // 12px
    xl: "1rem", // 16px
  },
  typography: {
    h1: "text-4xl font-bold",
    h2: "text-2xl font-semibold",
    h3: "text-xl font-semibold",
    body: "text-base",
    small: "text-sm",
  },
  shadows: {
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
  },
  transitions: {
    default: "transition-colors duration-200",
  },
} as const;

export type Theme = typeof theme;
