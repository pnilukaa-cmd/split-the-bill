"use client";

import { useState } from "react";
import { Assignments, ParsedReceipt, Person, WizardStep } from "@/lib/types";
import ReceiptUpload from "@/components/ReceiptUpload";
import ItemsReview from "@/components/ItemsReview";
import PeopleManager from "@/components/PeopleManager";
import ItemAssignment from "@/components/ItemAssignment";
import SplitSummary from "@/components/SplitSummary";

export default function Home() {
  const [step, setStep] = useState<WizardStep>("upload");
  const [receipt, setReceipt] = useState<ParsedReceipt | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [assignments, setAssignments] = useState<Assignments>({});

  function reset() {
    setStep("upload");
    setReceipt(null);
    setPeople([]);
    setAssignments({});
  }

  return (
    <>
      {step === "upload" && (
        <ReceiptUpload
          onParsed={(parsed) => {
            setReceipt(parsed);
            setStep("review-items");
          }}
        />
      )}
      {step === "review-items" && receipt && (
        <ItemsReview
          receipt={receipt}
          onChange={setReceipt}
          onNext={() => setStep("people")}
          onBack={() => setStep("upload")}
        />
      )}
      {step === "people" && (
        <PeopleManager
          people={people}
          onChange={setPeople}
          onNext={() => setStep("assign")}
          onBack={() => setStep("review-items")}
        />
      )}
      {step === "assign" && receipt && (
        <ItemAssignment
          receipt={receipt}
          people={people}
          assignments={assignments}
          onChange={setAssignments}
          onNext={() => setStep("summary")}
          onBack={() => setStep("people")}
        />
      )}
      {step === "summary" && receipt && (
        <SplitSummary
          receipt={receipt}
          people={people}
          assignments={assignments}
          onStartOver={reset}
          onBack={() => setStep("assign")}
        />
      )}
    </>
  );
}
