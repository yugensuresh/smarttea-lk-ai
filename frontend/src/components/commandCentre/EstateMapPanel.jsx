import { MapPinOff } from "lucide-react";
import { Link } from "react-router-dom";

export default function EstateMapPanel() {
  return (
    <section className="panel flex flex-col items-center justify-center px-6 py-12 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-[#eef1ef] text-[#5f7368]">
        <MapPinOff className="h-6 w-6" aria-hidden="true" />
      </span>
      <h2 className="mt-4 text-base font-semibold text-[#1b2a22]">Estate &amp; field map</h2>
      <p className="mt-2 max-w-md text-sm text-[#7d8b83]">
        Geographic map view is not enabled in this build. The dashboard does not expose geodetic coordinates or a
        shared map layer across modules. Use field drawers and module pages for supported detail.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-3 text-[13px] font-semibold">
        <Link to="/" className="text-[#178a45] hover:underline">
          Priority fields (dashboard)
        </Link>
        <Link to="/harvest/readiness" className="text-[#178a45] hover:underline">
          Harvest Readiness
        </Link>
        <Link to="/disease" className="text-[#178a45] hover:underline">
          Disease Detection
        </Link>
      </div>
    </section>
  );
}
