import { CreditCard, CheckCircle2, Clock } from "lucide-react";
import { ReceiptVerification } from "@/routes/index";
import { Reveal, StatCard } from "@/components/shared";

export function DivePassPage() {
  return (
    <div className="space-y-4">
      <Reveal>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard
            icon={CreditCard}
            label="Total Passes"
            value="25"
            delta="+3"
          />
          <StatCard
            icon={CheckCircle2}
            label="Active Passes"
            value="17"
            delta="+1"
          />
          <StatCard
            icon={Clock}
            label="Expiring Soon"
            value="4"
            delta="-1"
            up={false}
          />
        </div>
      </Reveal>
      <ReceiptVerification />
    </div>
  );
}
