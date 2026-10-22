import PageHeader from "../../components/PageHeader";

function Stub({ title, subtitle }) {
  return (
    <div className="mx-auto max-w-[1180px]">
      <PageHeader title={title} subtitle={subtitle} />
      <div className="rounded-2xl border border-[#e8ece9] bg-white px-5 py-12 text-center text-sm text-[#7d8b83]">
        This Plantation Intel view is ready for backend integration.
      </div>
    </div>
  );
}

export function IntelDashboard() {
  return <Stub title="Dashboard" subtitle="Unified overview of quality, sustainability, and intelligence metrics." />;
}

export function IntelRecommendations() {
  return <Stub title="Recommendations" subtitle="AI-curated actions for quality and sustainability optimization." />;
}

export function IntelSupport() {
  return <Stub title="Support" subtitle="Plantation Intel module documentation and analytics desk." />;
}
