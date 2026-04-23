import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import ThemeToggle from "./ThemeToggle";
import { ThemeProvider } from "@/lib/theme-context";

describe("ThemeToggle Component", () => {
  const renderWithThemeContext = (props = {}) => {
    return render(
      <ThemeProvider {...props}>
        <ThemeToggle />
      </ThemeProvider>
    );
  };

  beforeEach(() => {
    Object.defineProperty(globalThis, "localStorage", {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });

    Object.defineProperty(globalThis, "window", {
      value: {
        matchMedia: jest.fn(() => ({
          matches: false,
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        })),
      },
      writable: true,
    });

    Object.defineProperty(globalThis, "document", {
      value: {
        documentElement: {
          classList: {
            remove: jest.fn(),
            add: jest.fn(),
          },
        },
        querySelector: jest.fn(() => null),
      },
      writable: true,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Loading State", () => {
    it("shows loading state when not mounted", () => {
      renderWithThemeContext();
      
      const loadingButton = screen.getByLabelText("Loading theme settings");
      expect(loadingButton).toBeInTheDocument();
      expect(loadingButton).toBeDisabled();
      
      const pulseElement = screen.getByText(/./).closest(".animate-pulse");
      expect(pulseElement).toBeInTheDocument();
    });

    it("shows loading state when loading", async () => {
      renderWithThemeContext();
      
      await waitFor(() => {
        const button = screen.getByRole("button");
        expect(button).not.toBeDisabled();
      });
    });
  });

  describe("Theme Icons", () => {
    it("displays light theme icon when theme is light", async () => {
      renderWithThemeContext({ defaultTheme: "light" });

      await waitFor(() => {
        const button = screen.getByRole("button");
        expect(button).toBeInTheDocument();
        expect(button).not.toBeDisabled();
      });

      const lightIcon = screen.getByTitle("Theme: light");
      expect(lightIcon).toBeInTheDocument();
      
      const sunIcon = lightIcon.querySelector(".text-amber-500");
      expect(sunIcon).toBeInTheDocument();
    });

    it("displays dark theme icon when theme is dark", async () => {
      renderWithThemeContext({ defaultTheme: "dark" });

      await waitFor(() => {
        const button = screen.getByRole("button");
        expect(button).toBeInTheDocument();
        expect(button).not.toBeDisabled();
      });

      const darkIcon = screen.getByTitle("Theme: dark");
      expect(darkIcon).toBeInTheDocument();
      
      const moonIcon = darkIcon.querySelector(".text-accent");
      expect(moonIcon).toBeInTheDocument();
    });

    it("displays system theme icon when theme is system", async () => {
      renderWithThemeContext({ defaultTheme: "system" });

      await waitFor(() => {
        const button = screen.getByRole("button");
        expect(button).toBeInTheDocument();
        expect(button).not.toBeDisabled();
      });

      const systemIcon = screen.getByTitle(/Theme: System/);
      expect(systemIcon).toBeInTheDocument();
      
      const monitorIcon = systemIcon.querySelector(".text-slate-400");
      expect(monitorIcon).toBeInTheDocument();
    });
  });

  describe("Theme Toggle Functionality", () => {
    it("toggles theme when clicked", async () => {
      renderWithThemeContext({ defaultTheme: "system" });

      await waitFor(() => {
        const button = screen.getByRole("button");
        expect(button).toBeInTheDocument();
      });

      const button = screen.getByRole("button");
      fireEvent.click(button);

      await waitFor(() => {
        expect(globalThis.localStorage.setItem).toHaveBeenCalledWith(
          "merchant-theme-preference",
          "light"
        );
      });
    });

    it("has correct accessibility labels", async () => {
      renderWithThemeContext({ defaultTheme: "light" });

      await waitFor(() => {
        const button = screen.getByRole("button");
        expect(button).toBeInTheDocument();
      });

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-label", "Current theme: light, click to switch theme");
    });

    it("has correct title attributes", async () => {
      renderWithThemeContext({ defaultTheme: "system" });

      await waitFor(() => {
        const button = screen.getByRole("button");
        expect(button).toBeInTheDocument();
      });

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("title", "Theme: System (light)");
    });
  });

  describe("Error State", () => {
    it("displays error icon when error occurs", async () => {
      const mockSetItem = globalThis.localStorage.setItem as jest.Mock;
      mockSetItem.mockImplementation(() => {
        throw new Error("Storage error");
      });

      renderWithThemeContext({ defaultTheme: "light" });

      await waitFor(() => {
        const button = screen.getByRole("button");
        expect(button).toBeInTheDocument();
      });

      const button = screen.getByRole("button");
      fireEvent.click(button);

      await waitFor(() => {
        const errorIcon = button.querySelector(".text-red-500");
        expect(errorIcon).toBeInTheDocument();
      });

      expect(button).toHaveAttribute("aria-label", "Theme toggle with error, click to retry");
      expect(button).toHaveAttribute("title", "Theme error: Storage error. Click to retry.");
    });

    it("has error styling when error occurs", async () => {
      const mockSetItem = globalThis.localStorage.setItem as jest.Mock;
      mockSetItem.mockImplementation(() => {
        throw new Error("Storage error");
      });

      renderWithThemeContext({ defaultTheme: "light" });

      await waitFor(() => {
        const button = screen.getByRole("button");
        expect(button).toBeInTheDocument();
      });

      const button = screen.getByRole("button");
      fireEvent.click(button);

      await waitFor(() => {
        expect(button).toHaveClass("border-red-500/50", "bg-red-500/10", "hover:bg-red-500/20");
      });
    });

    it("clears error when clicked in error state", async () => {
      let setErrorCallCount = 0;
      const mockSetItem = globalThis.localStorage.setItem as jest.Mock;
      mockSetItem.mockImplementation(() => {
        if (setErrorCallCount === 0) {
          setErrorCallCount++;
          throw new Error("Storage error");
        }
      });

      renderWithThemeContext({ defaultTheme: "light" });

      await waitFor(() => {
        const button = screen.getByRole("button");
        expect(button).toBeInTheDocument();
      });

      const button = screen.getByRole("button");
      
      fireEvent.click(button);

      await waitFor(() => {
        const errorIcon = button.querySelector(".text-red-500");
        expect(errorIcon).toBeInTheDocument();
      });

      fireEvent.click(button);

      await waitFor(() => {
        const errorIcon = button.querySelector(".text-red-500");
        expect(errorIcon).not.toBeInTheDocument();
      });
    });
  });

  describe("Visual Feedback", () => {
    it("has transition classes", async () => {
      renderWithThemeContext();

      await waitFor(() => {
        const button = screen.getByRole("button");
        expect(button).toBeInTheDocument();
      });

      const button = screen.getByRole("button");
      expect(button).toHaveClass("transition-all", "active:scale-95");
    });

    it("has hover effects", async () => {
      renderWithThemeContext({ defaultTheme: "light" });

      await waitFor(() => {
        const button = screen.getByRole("button");
        expect(button).toBeInTheDocument();
      });

      const button = screen.getByRole("button");
      expect(button).toHaveClass("hover:bg-white/10");
    });

    it("icons have transition classes", async () => {
      renderWithThemeContext({ defaultTheme: "light" });

      await waitFor(() => {
        const button = screen.getByRole("button");
        expect(button).toBeInTheDocument();
      });

      const sunIcon = screen.getByTitle("Theme: light").querySelector(".text-amber-500");
      expect(sunIcon).toHaveClass("transition-colors");
    });
  });

  describe("Responsive Design", () => {
    it("has correct size classes", async () => {
      renderWithThemeContext();

      await waitFor(() => {
        const button = screen.getByRole("button");
        expect(button).toBeInTheDocument();
      });

      const button = screen.getByRole("button");
      expect(button).toHaveClass("h-9", "w-9");
    });

    it("has correct layout classes", async () => {
      renderWithThemeContext();

      await waitFor(() => {
        const button = screen.getByRole("button");
        expect(button).toBeInTheDocument();
      });

      const button = screen.getByRole("button");
      expect(button).toHaveClass("flex", "items-center", "justify-center");
    });
  });

  describe("System Theme Indicator", () => {
    it("shows resolved theme indicator for system theme", async () => {
      const mockMatchMedia = globalThis.window.matchMedia as jest.Mock;
      mockMatchMedia.mockReturnValue({
        matches: true,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      });

      renderWithThemeContext({ defaultTheme: "system" });

      await waitFor(() => {
        const button = screen.getByRole("button");
        expect(button).toBeInTheDocument();
      });

      const systemIcon = screen.getByTitle(/Theme: System/);
      const indicator = systemIcon.querySelector(".bg-accent");
      expect(indicator).toBeInTheDocument();
    });
  });
});
