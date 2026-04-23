/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import KycSubmissionForm from "./KycSubmissionForm";

const { mockToastSuccess, mockToastError } = vi.hoisted(() => ({
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("framer-motion", async () => {
  const React = await import("react");
  const motion = new Proxy(
    {},
    {
      get: (_, tag: string) =>
        React.forwardRef(function MockMotion({ children, ...props }: any, ref) {
          return React.createElement(tag, { ...props, ref }, children);
        }),
    },
  );
  return {
    motion,
    AnimatePresence: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
  };
});

vi.mock("sonner", () => ({
  toast: {
    success: mockToastSuccess,
    error: mockToastError,
  },
}));

describe("KycSubmissionForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("renders personal info step initially", () => {
    render(React.createElement(KycSubmissionForm));
    expect(screen.getByText("personalInfo")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("firstName")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("lastName")).toBeInTheDocument();
  });

  it("navigates to address step when next is clicked", () => {
    render(React.createElement(KycSubmissionForm));
    const nextButton = screen.getByText("next");
    fireEvent.click(nextButton);
    expect(screen.getByText("addressInfo")).toBeInTheDocument();
  });

  it("navigates back to personal step", () => {
    render(React.createElement(KycSubmissionForm));
    fireEvent.click(screen.getByText("next"));
    expect(screen.getByText("addressInfo")).toBeInTheDocument();
    fireEvent.click(screen.getByText("back"));
    expect(screen.getByText("personalInfo")).toBeInTheDocument();
  });

  it("updates personal info fields", () => {
    render(React.createElement(KycSubmissionForm));
    const firstNameInput = screen.getByPlaceholderText("firstName") as HTMLInputElement;
    fireEvent.change(firstNameInput, { target: { value: "John" } });
    expect(firstNameInput.value).toBe("John");
  });

  it("shows all four steps in progress indicator", () => {
    const { container } = render(React.createElement(KycSubmissionForm));
    const stepIndicators = container.querySelectorAll('[class*="rounded-full"]');
    expect(stepIndicators.length).toBeGreaterThanOrEqual(4);
  });

  it("displays error message when submission fails", async () => {
    (global.fetch as any).mockRejectedValue(new Error("Network error"));

    render(React.createElement(KycSubmissionForm));

    // Navigate to review step
    fireEvent.click(screen.getByText("next")); // to address
    fireEvent.click(screen.getByText("next")); // to documents
    fireEvent.click(screen.getByText("next")); // to review

    const submitButton = screen.getByText("submit");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalled();
    });
  });

  it("shows success message after successful submission", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(React.createElement(KycSubmissionForm));

    // Navigate to review step
    fireEvent.click(screen.getByText("next"));
    fireEvent.click(screen.getByText("next"));
    fireEvent.click(screen.getByText("next"));

    const submitButton = screen.getByText("submit");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("successTitle")).toBeInTheDocument();
      expect(mockToastSuccess).toHaveBeenCalled();
    });
  });

  it("allows resetting form after successful submission", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(React.createElement(KycSubmissionForm));

    // Navigate and submit
    fireEvent.click(screen.getByText("next"));
    fireEvent.click(screen.getByText("next"));
    fireEvent.click(screen.getByText("next"));
    fireEvent.click(screen.getByText("submit"));

    await waitFor(() => {
      expect(screen.getByText("successTitle")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("submitAnother"));

    await waitFor(() => {
      expect(screen.getByText("personalInfo")).toBeInTheDocument();
    });
  });

  it("updates address fields correctly", () => {
    render(React.createElement(KycSubmissionForm));
    fireEvent.click(screen.getByText("next"));

    const cityInput = screen.getByPlaceholderText("city") as HTMLInputElement;
    fireEvent.change(cityInput, { target: { value: "New York" } });
    expect(cityInput.value).toBe("New York");
  });

  it("shows document upload fields on documents step", () => {
    render(React.createElement(KycSubmissionForm));
    fireEvent.click(screen.getByText("next"));
    fireEvent.click(screen.getByText("next"));

    expect(screen.getByText("documents")).toBeInTheDocument();
    expect(screen.getByText("idFront")).toBeInTheDocument();
    expect(screen.getByText("selfie")).toBeInTheDocument();
  });

  it("displays review summary on final step", () => {
    render(React.createElement(KycSubmissionForm));

    // Fill personal info
    fireEvent.change(screen.getByPlaceholderText("firstName"), { target: { value: "John" } });
    fireEvent.change(screen.getByPlaceholderText("lastName"), { target: { value: "Doe" } });
    fireEvent.click(screen.getByText("next"));

    // Fill address
    fireEvent.change(screen.getByPlaceholderText("city"), { target: { value: "NYC" } });
    fireEvent.click(screen.getByText("next"));

    // Skip documents
    fireEvent.click(screen.getByText("next"));

    expect(screen.getByText("review")).toBeInTheDocument();
  });
});
