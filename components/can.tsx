"use client";
import type { ReactNode } from "react";
import { useSession } from "@/components/session";
import { can, type Action } from "@/lib/rbac";

export function Can({
  action,
  children,
  fallback = null,
}: {
  action: Action;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { data, loading } = useSession();
  if (loading) return <>{fallback}</>;
  if (!data) return <>{fallback}</>;
  return can(data.role, action) ? <>{children}</> : <>{fallback}</>;
}
