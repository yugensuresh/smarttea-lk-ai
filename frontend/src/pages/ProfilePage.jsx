import { Link } from "react-router-dom";
import UserAvatar from "../components/UserAvatar";
import { useAuth } from "../context/AuthContext";
import { userRoleLabel } from "../utils/userDisplay";
import PageHeader from "../components/PageHeader";

function ReadOnlyField({ label, value }) {
  return (
    <div>
      <p className="text-sm font-semibold text-[#1c2b24]">{label}</p>
      <p className="mt-1.5 rounded-xl border border-[#e3ebe6] bg-[#fafbfa] px-3 py-2.5 text-sm text-[#24352c]">
        {value || "—"}
      </p>
    </div>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  const displayName = user?.fullName?.trim() || user?.email || "Account";

  return (
    <div>
      <PageHeader
        title="My Profile"
        subtitle="Account details from your SmartTea-LK sign-in. Profile updates are not available yet on the server."
      />
      <div className="panel max-w-xl space-y-6 p-5">
        <div className="flex items-center gap-4">
          <UserAvatar name={displayName} className="h-14 w-14 text-sm" />
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold text-[#1c2b24]">{displayName}</p>
            <p className="truncate text-sm text-[#7d8b83]">{user?.email}</p>
          </div>
        </div>

        <ReadOnlyField label="Full name" value={user?.fullName} />
        <ReadOnlyField label="Email" value={user?.email} />
        <ReadOnlyField label="Role" value={userRoleLabel(user)} />
        <ReadOnlyField label="User ID" value={user?.id} />

        <p className="text-sm text-[#7d8b83]">
          Dashboard preferences such as telemetry and alerts are in{" "}
          <Link to="/settings" className="font-semibold text-[#178a45] hover:underline">
            Account Settings
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
