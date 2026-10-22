import { userInitials } from "../utils/userDisplay";

export default function UserAvatar({ name, className = "h-9 w-9" }) {
  const initials = userInitials(name);
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full bg-[#d9f5e3] text-xs font-bold text-[#14532d] ring-1 ring-[#b7dcc6] ${className}`}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}
