import type { ReactNode } from "react";
import { usePermission, type Permission } from "./permissions";

interface Props {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
}

export default function ProtectedSection({ permission, children, fallback }: Props) {
  const { can } = usePermission();
  if (can(permission)) return <>{children}</>;
  return fallback ?? null;
}
