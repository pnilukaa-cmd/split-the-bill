"use client";

import { useEffect, useState } from "react";
import { Assignments, ItemWeights, ParsedReceipt, Person, WizardStep } from "@/lib/types";
import { parseShareHash, SharePayload } from "@/lib/share";
import ReceiptUpload from "@/components/ReceiptUpload";
import ItemsReview from "@/components/ItemsReview";
import PeopleManager from "@/components/PeopleManager";
import ItemAssignment from "@/components/ItemAssignment";
import SplitSummary from "@/components/SplitSummary";
import ShareView from "@/components/ShareView";

type SharedLink = { payload: SharePayload; personId: string | null };

export default function Home() {
  const [step, setStep] = useState<WizardStep>("upload");
  const [receipt, setReceipt] = useState<ParsedReceipt | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [assignments, setAssignments] = useState<Assignments>({});
  const [itemWeights, setItemWeights] = useState<ItemWeights>({});
  // undefined = still checking the URL hash (avoids a flash of the upload screen or a hydration mismatch).
  const [sharedLink, setSharedLink] = useState<SharedLink | null | undefined>(undefined);

  useEffect(() => {
    setSharedLink(parseShareHash(window.location.hash));
  }, []);

  function reset() {
    setStep("upload");
    setReceipt(null);
    setPeople([]);
    setAssignments({});
    setItemWeights({});
  }

  function startOwnBill() {
    window.history.replaceState(null, "", window.location.pathname);
    setSharedLink(null);
    reset();
  }

  if (sharedLink === undefined) return null;

  if (sharedLink) {
    return (
      <ShareView payload={sharedLink.payload} highlightPersonId={sharedLink.personId} onStartOwn={startOwnBill} />
    );
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
          itemWeights={itemWeights}
          onWeightsChange={setItemWeights}
          onNext={() => setStep("summary")}
          onBack={() => setStep("people")}
        />
      )}
      {step === "summary" && receipt && (
        <SplitSummary
          receipt={receipt}
          people={people}
          assignments={assignments}
          itemWeights={itemWeights}
          onStartOver={reset}
          onBack={() => setStep("assign")}
        />
      )}
    </>
  );
}
