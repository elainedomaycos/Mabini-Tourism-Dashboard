import { Building2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFilters } from "@/routes/index";
import { OperatorMgmt } from "@/routes/index";
import { Establishments } from "@/components/sections/Establishments";
import { Reveal, StatCard } from "@/components/shared";

export function EstablishmentsPage() {
  const { search, setFilters } = useFilters();
  // OperatorMgmt uses the same `tab` param for "applications" vs "active".
  // If we use the raw tab value for the outer Tabs, setting tab="active"
  // hides the outer <TabsContent value="applications"> that contains
  // OperatorMgmt, resulting in a blank page. Keep the outer Tabs mounted
  // on "applications" whenever the inner tab is "active".
  const rawTab = search.tab || "applications";
  const outerTab = rawTab === "registered" ? "registered" : "applications";

  return (
    <div className="space-y-4">
      <Tabs value={outerTab} onValueChange={(v) => setFilters({ tab: v })}>
        <div className="flex justify-end">
          <TabsList className="bg-secondary">
            <TabsTrigger value="applications">
              Operator Applications
            </TabsTrigger>
            <TabsTrigger value="registered">
              Registered Establishments
            </TabsTrigger>
          </TabsList>
        </div>
        <Reveal>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            <button
              type="button"
              onClick={() => setFilters({ tab: "registered" })}
              className="text-left w-full h-full"
            >
              <StatCard
                icon={Building2}
                label="Registered Establishments"
                value="12"
                delta="+1"
              />
            </button>
            <button
              type="button"
              onClick={() => setFilters({ tab: "applications" })}
              className="text-left w-full h-full"
            >
              <StatCard
                icon={Building2}
                label="Pending Applications"
                value="5"
                delta="+2"
              />
            </button>
            <button
              type="button"
              onClick={() => setFilters({ tab: "active" })}
              className="text-left w-full h-full"
            >
              <StatCard
                icon={Building2}
                label="Active Operators"
                value="8"
                delta=""
              />
            </button>
          </div>
        </Reveal>
        <TabsContent value="applications" className="mt-4">
          <OperatorMgmt />
        </TabsContent>
        <TabsContent value="registered" className="mt-4">
          <Establishments />
        </TabsContent>
      </Tabs>
    </div>
  );
}
