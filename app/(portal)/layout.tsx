/** 인증 후 운영 포털 공통 레이아웃 (T-006 AppShell로 확장)입니다. */

import { AppShell } from "@/components/layout";

type PortalLayoutProps = {
  children: React.ReactNode;
};

const PortalLayout = ({ children }: PortalLayoutProps) => {
  return <AppShell>{children}</AppShell>;
};

export default PortalLayout;
