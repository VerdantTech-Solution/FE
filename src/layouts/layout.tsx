
import { Footer } from "@/pages";
import Navbar from "@/pages/Navbar";

import { Outlet } from "react-router";

export function Layout() {
  return (
    <div className="flex flex-col min-h-screen bg-green-50">
    
    <Navbar/>

      <main className="flex-1 overflow-hidden pt-20">
        <Outlet />
      </main>

    <Footer/>
    </div>
  );
}
