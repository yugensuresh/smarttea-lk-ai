import CommandCentreHeader from "../components/commandCentre/CommandCentreHeader";
import MemberSummaryCards from "../components/commandCentre/MemberSummaryCards";
import MemberWorkspaceRow from "../components/commandCentre/MemberWorkspaceRow";
import PriorityActionsPanel from "../components/commandCentre/PriorityActionsPanel";
import TrendsPanel from "../components/commandCentre/TrendsPanel";
import PriorityTable from "../components/PriorityTable";

export default function EstateOverview() {
  return (
    <div className="mx-auto max-w-[1440px] space-y-6 pb-6 sm:space-y-8">
      <CommandCentreHeader />
      <MemberSummaryCards />
      <MemberWorkspaceRow />
      <TrendsPanel />
      <PriorityActionsPanel />
      <PriorityTable />

      <p className="px-1 text-center text-[11px] text-[#b0bab4]">
        SmartTea-LK Plantation Command Centre · Integrated dashboard layer only; module pages run authoritative models.
      </p>
    </div>
  );
}
