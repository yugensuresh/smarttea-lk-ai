/** @param {string | undefined | null} fullName */
export function userInitials(fullName) {
  const parts = String(fullName ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function userRoleLabel(user) {
  if (user?.role && String(user.role).trim()) return String(user.role).trim();
  return "Plantation user";
}
