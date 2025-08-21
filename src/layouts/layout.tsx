
import { Footer } from "@/pages";
import Navbar from "@/pages/Navbar";

import { Outlet } from "react-router";

export function Layout() {
  return (
    <div className="flex flex-col min-h-screen">
    
    <Navbar/>

      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>

    <Footer/>
    </div>
  );
}
