import { Outlet } from "react-router";

export function Layout() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Thanh thông báo trên cùng */}
      <div className="border-b border-[#E6E6FA] bg-white">
        <div className="w-full flex justify-center items-center bg-gradient-to-r from-indigo-500 to-purple-500 py-2 md:py-1">
          <p className="text-white text-xs md:text-base font-medium">
            Don&apos;t wait – this exclusive offer is available for a limited
            time!
          </p>
        </div>
      </div>

      {/* Nội dung chính */}
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t py-4 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} My Company. All rights reserved.
      </footer>
    </div>
  );
}
