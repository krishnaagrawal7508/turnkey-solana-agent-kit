import React from "react";
import { Icon } from "@iconify/react";

const Navbar = () => {
  return (
    <div className="fixed top-0 left-0 w-full z-[1000] bg-transparent backdrop-blur-sm flex items-center h-24 px-12">
      <div className="flex items-center">
        <a href="/" className="flex items-center gap-2">
          <div className="rounded-2xl flex items-center justify-center">
            <Icon 
              icon="solar:key-minimalistic-square-3-bold-duotone"
              width="40" 
              height="40"
              className="text-[#282c3a] bg-[#94959D] rounded-xl"
            />
          </div>
          <span className="text-white font-bold text-lg">Turnkey AI</span>
        </a>
      </div>
      <div className="ml-auto">
        <button className="text-white rounded-full bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.2)] p-2 transition-colors">
          <Icon 
            icon="solar:box-minimalistic-broken"
            width="20" 
            height="20"
            className="text-white"
          />
        </button>
      </div>
    </div>
  );
};

export default Navbar;
