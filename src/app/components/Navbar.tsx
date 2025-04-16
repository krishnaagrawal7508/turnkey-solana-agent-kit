import React from "react";

const Navbar = () => {
  return (
    <div className="fixed top-0 left-0 w-full z-[1000] bg-[#282c3a] flex items-center h-12 px-4">
      <div className="flex items-center">
        <a href="/" className="flex items-center gap-2">
          <div className="bg-white rounded-md p-1 flex items-center justify-center">
            <svg 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              className="text-[#282c3a]"
            >
              <rect width="24" height="24" rx="4" fill="currentColor" />
              <path d="M16 8.5C16 10.9853 13.9853 13 11.5 13C9.01472 13 7 10.9853 7 8.5C7 6.01472 9.01472 4 11.5 4C13.9853 4 16 6.01472 16 8.5Z" fill="#ffffff" />
              <path d="M11.5 14C7.35786 14 4 17.3579 4 21.5H19C19 17.3579 15.6421 14 11.5 14Z" fill="#ffffff" />
            </svg>
          </div>
          <span className="text-white font-bold text-lg">Sense AI</span>
        </a>
      </div>
      <div className="ml-auto">
        <button className="text-white rounded-full bg-gray-700 p-2">
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="text-white"
          >
            <path d="M4 4h16v16H4z"></path>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Navbar;
