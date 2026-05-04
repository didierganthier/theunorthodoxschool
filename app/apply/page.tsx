import type { Metadata } from "next";
import ApplyForm from "./ApplyForm";

export const metadata: Metadata = {
  title: "Apply — The Unorthodox School Cohort 1",
  description: "Apply to the first cohort of The Unorthodox School.",
};

export default function ApplyPage() {
  return <ApplyForm />;
}
