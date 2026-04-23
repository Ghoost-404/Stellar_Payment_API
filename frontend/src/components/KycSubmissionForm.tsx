"use client";

import { useReducer, type FormEvent, type ChangeEvent } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  kycFlowReducer,
  initialKycFlowState,
  type KycStep,
} from "@/lib/kyc-flow";
import { Button } from "./ui/Button";

const STEPS: KycStep[] = ["personal", "address", "documents", "review"];

export default function KycSubmissionForm() {
  const t = useTranslations("kycForm");
  const [state, dispatch] = useReducer(kycFlowReducer, initialKycFlowState);

  const currentStepIndex = STEPS.indexOf(state.currentStep);
  const isLastStep = currentStepIndex === STEPS.length - 1;

  const handleNext = () => {
    if (!isLastStep) {
      dispatch({ type: "SET_STEP", step: STEPS[currentStepIndex + 1] });
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      dispatch({ type: "SET_STEP", step: STEPS[currentStepIndex - 1] });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    dispatch({ type: "SUBMIT" });

    try {
      const formData = new FormData();
      formData.append("firstName", state.personal.firstName);
      formData.append("lastName", state.personal.lastName);
      formData.append("dateOfBirth", state.personal.dateOfBirth);
      formData.append("nationality", state.personal.nationality);
      formData.append("street", state.address.street);
      formData.append("city", state.address.city);
      formData.append("state", state.address.state);
      formData.append("postalCode", state.address.postalCode);
      formData.append("country", state.address.country);
      formData.append("idType", state.documents.idType);
      formData.append("idNumber", state.documents.idNumber);
      if (state.documents.idFrontFile) formData.append("idFront", state.documents.idFrontFile);
      if (state.documents.idBackFile) formData.append("idBack", state.documents.idBackFile);
      if (state.documents.selfieFile) formData.append("selfie", state.documents.selfieFile);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const response = await fetch(`${apiUrl}/api/kyc/submit`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Submission failed");
      }

      dispatch({ type: "SUBMIT_SUCCESS", submittedAt: new Date().toISOString() });
      toast.success(t("submitSuccess"));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      dispatch({ type: "SUBMIT_FAILURE", error: message });
      toast.error(message);
    }
  };

  const handleFileChange = (field: "idFrontFile" | "idBackFile" | "selfieFile") => (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    dispatch({ type: "UPDATE_DOCUMENTS", data: { [field]: file } });
  };

  if (state.submittedAt) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-xl border border-accent/25 bg-accent/5 p-8 text-center"
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/20">
          <svg className="h-8 w-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="mb-2 text-xl font-bold text-white">{t("successTitle")}</h2>
        <p className="text-slate-400">{t("successMessage")}</p>
        <Button onClick={() => dispatch({ type: "RESET" })} className="mt-6">
          {t("submitAnother")}
        </Button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-between">
        {STEPS.map((step, idx) => (
          <div key={step} className="flex flex-1 items-center">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${idx <= currentStepIndex ? "bg-accent text-black" : "bg-white/10 text-slate-500"}`}>
              {idx + 1}
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`mx-2 h-0.5 flex-1 ${idx < currentStepIndex ? "bg-accent" : "bg-white/10"}`} />
            )}
          </div>
        ))}
      </div>

      {state.error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {state.error}
        </div>
      )}

      <AnimatePresence mode="wait">
        {state.currentStep === "personal" && (
          <motion.div key="personal" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            <h3 className="text-lg font-bold text-white">{t("personalInfo")}</h3>
            <input
              type="text"
              placeholder={t("firstName")}
              value={state.personal.firstName}
              onChange={(e) => dispatch({ type: "UPDATE_PERSONAL", data: { firstName: e.target.value } })}
              className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white"
              required
            />
            <input
              type="text"
              placeholder={t("lastName")}
              value={state.personal.lastName}
              onChange={(e) => dispatch({ type: "UPDATE_PERSONAL", data: { lastName: e.target.value } })}
              className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white"
              required
            />
            <input
              type="date"
              value={state.personal.dateOfBirth}
              onChange={(e) => dispatch({ type: "UPDATE_PERSONAL", data: { dateOfBirth: e.target.value } })}
              className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white"
              required
            />
            <input
              type="text"
              placeholder={t("nationality")}
              value={state.personal.nationality}
              onChange={(e) => dispatch({ type: "UPDATE_PERSONAL", data: { nationality: e.target.value } })}
              className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white"
              required
            />
          </motion.div>
        )}

        {state.currentStep === "address" && (
          <motion.div key="address" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            <h3 className="text-lg font-bold text-white">{t("addressInfo")}</h3>
            <input
              type="text"
              placeholder={t("street")}
              value={state.address.street}
              onChange={(e) => dispatch({ type: "UPDATE_ADDRESS", data: { street: e.target.value } })}
              className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white"
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder={t("city")}
                value={state.address.city}
                onChange={(e) => dispatch({ type: "UPDATE_ADDRESS", data: { city: e.target.value } })}
                className="rounded-xl border border-white/10 bg-white/5 p-3 text-white"
                required
              />
              <input
                type="text"
                placeholder={t("state")}
                value={state.address.state}
                onChange={(e) => dispatch({ type: "UPDATE_ADDRESS", data: { state: e.target.value } })}
                className="rounded-xl border border-white/10 bg-white/5 p-3 text-white"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder={t("postalCode")}
                value={state.address.postalCode}
                onChange={(e) => dispatch({ type: "UPDATE_ADDRESS", data: { postalCode: e.target.value } })}
                className="rounded-xl border border-white/10 bg-white/5 p-3 text-white"
                required
              />
              <input
                type="text"
                placeholder={t("country")}
                value={state.address.country}
                onChange={(e) => dispatch({ type: "UPDATE_ADDRESS", data: { country: e.target.value } })}
                className="rounded-xl border border-white/10 bg-white/5 p-3 text-white"
                required
              />
            </div>
          </motion.div>
        )}

        {state.currentStep === "documents" && (
          <motion.div key="documents" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            <h3 className="text-lg font-bold text-white">{t("documents")}</h3>
            <select
              value={state.documents.idType}
              onChange={(e) => dispatch({ type: "UPDATE_DOCUMENTS", data: { idType: e.target.value as "" | "passport" | "drivers_license" | "national_id" } })}
              className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white"
              required
            >
              <option value="">{t("selectIdType")}</option>
              <option value="passport">{t("passport")}</option>
              <option value="drivers_license">{t("driversLicense")}</option>
              <option value="national_id">{t("nationalId")}</option>
            </select>
            <input
              type="text"
              placeholder={t("idNumber")}
              value={state.documents.idNumber}
              onChange={(e) => dispatch({ type: "UPDATE_DOCUMENTS", data: { idNumber: e.target.value } })}
              className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white"
              required
            />
            <div className="space-y-2">
              <label className="block text-sm text-slate-400">{t("idFront")}</label>
              <input type="file" accept="image/*" onChange={handleFileChange("idFrontFile")} className="w-full text-white" required />
            </div>
            <div className="space-y-2">
              <label className="block text-sm text-slate-400">{t("idBack")}</label>
              <input type="file" accept="image/*" onChange={handleFileChange("idBackFile")} className="w-full text-white" />
            </div>
            <div className="space-y-2">
              <label className="block text-sm text-slate-400">{t("selfie")}</label>
              <input type="file" accept="image/*" onChange={handleFileChange("selfieFile")} className="w-full text-white" required />
            </div>
          </motion.div>
        )}

        {state.currentStep === "review" && (
          <motion.div key="review" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            <h3 className="text-lg font-bold text-white">{t("review")}</h3>
            <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
              <div>
                <p className="text-xs text-slate-400">{t("name")}</p>
                <p className="text-white">{state.personal.firstName} {state.personal.lastName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">{t("dateOfBirth")}</p>
                <p className="text-white">{state.personal.dateOfBirth}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">{t("address")}</p>
                <p className="text-white">{state.address.street}, {state.address.city}, {state.address.state} {state.address.postalCode}, {state.address.country}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">{t("idType")}</p>
                <p className="text-white">{state.documents.idType}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-4">
        {currentStepIndex > 0 && (
          <Button type="button" onClick={handleBack} variant="secondary" className="flex-1">
            {t("back")}
          </Button>
        )}
        {!isLastStep ? (
          <Button type="button" onClick={handleNext} className="flex-1">
            {t("next")}
          </Button>
        ) : (
          <Button type="submit" isLoading={state.isSubmitting} className="flex-1">
            {t("submit")}
          </Button>
        )}
      </div>
    </form>
  );
}
