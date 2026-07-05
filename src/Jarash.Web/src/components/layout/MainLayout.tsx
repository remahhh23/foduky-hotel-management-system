import { Outlet } from "react-router-dom";
import { Topbar } from "./Topbar";
import { RightSidebar } from "./RightSidebar";
import { LeftSidebar } from "./LeftSidebar";
import { MobileNav } from "./MobileNav";

export function MainLayout() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-main-bg">
      <Topbar />
      <div className="flex flex-1 overflow-hidden">
        <div className="hidden md:flex">
          <RightSidebar />
        </div>
        <main className="flex flex-1 flex-col overflow-auto pb-16 md:pb-0">
          <Outlet />
        </main>
        <div className="hidden md:flex">
          <LeftSidebar />
        </div>
      </div>
      <MobileNav />
    </div>
  );
}
