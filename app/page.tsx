"use client";

import { useEffect, useState } from "react";
import { Assignments, ItemWeights, ParsedReceipt, Person, WizardStep } from "@/lib/types";
import { parseShareHash, SharePayload } from "@/lib/share";
import ReceiptUpload from "@/components/ReceiptUpload";
import QuickSplitEntry from "@/components/QuickSplitEntry";
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
  // True when the receipt came from the "split a total evenly" shortcut
  // rather than a scan — skips the item-assignment step entirely since
  // there's only one implicit item, shared equally by everyone.
  const [quickMode, setQuickMode] = useState(false);
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
    setQuickMode(false);
  }

  function handlePeopleNext() {
    if (quickMode && receipt) {
      const [onlyItem] = receipt.items;
      setAssignments({ [onlyItem.id]: people.map((p) => p.id) });
      setStep("summary");
    } else {
      setStep("assign");
    }
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
          onQuickSplit={() => {
            setQuickMode(true);
            setStep("quick-entry");
          }}
        />
      )}
      {step === "quick-entry" && (
        <QuickSplitEntry
          onNext={(parsed) => {
            setReceipt(parsed);
            setStep("people");
          }}
          onBack={() => {
            setQuickMode(false);
            setStep("upload");
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
          onNext={handlePeopleNext}
          onBack={() => setStep(quickMode ? "quick-entry" : "review-items")}
          nextLabel={quickMode ? "Next: See split" : "Next: Assign items"}
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
          onBack={() => setStep(quickMode ? "people" : "assign")}
        />
      )}
    </>
  );
}
