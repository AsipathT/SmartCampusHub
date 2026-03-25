import React, { useState } from 'react';
import FacilitiesList from './components/facilities/FacilitiesList';

const Navigation = [
  {
    name: 'Overview',
    subMenus: ['Dashboard']
  },
  {
    name: 'Facilities & Assets',
    subMenus: ['All Facilities', 'Maintenance Requests', 'Asset Inventory']
  },
  {
    name: 'Student Management',
    subMenus: ['Student Profiles', 'Enrollment', 'Grades']
  },
  {
    name: 'Course Management',
    subMenus: ['All Courses', 'Schedules', 'Assignments']
  },
  {
    name: 'Library & Resources',
    subMenus: ['Catalog', 'Borrowing', 'E-Resources']
  }
];

const App: React.FC = () => {
  const [activeMenu, setActiveMenu] = useState('Facilities & Assets');
  const [activeSubMenu, setActiveSubMenu] = useState('All Facilities');

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Left Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col h-full shadow-sm z-20">
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-white">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-md">
            SC
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-slate-800 leading-none">Smart Campus</h1>
            <span className="text-xs text-blue-600 font-semibold tracking-wide uppercase">Operations Hub</span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
          {Navigation.map((menu) => (
            <div key={menu.name} className="mb-1">
              {/* Main Menu Button */}
              <button
                onClick={() => setActiveMenu(activeMenu === menu.name ? '' : menu.name)}
                className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  activeMenu === menu.name
                    ? 'bg-slate-50 text-blue-700 shadow-sm border border-slate-100'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-base ${activeMenu === menu.name ? 'text-blue-500' : 'text-slate-400'}`}>
                    {menu.name === 'Overview' && '📊'}
                    {menu.name === 'Facilities & Assets' && '🏢'}
                    {menu.name === 'Student Management' && '🎓'}
                    {menu.name === 'Course Management' && '📚'}
                    {menu.name === 'Library & Resources' && '📖'}
                  </span>
                  <span>{menu.name}</span>
                </div>
                <span className={`text-xs transition-transform duration-300 ${activeMenu === menu.name ? 'rotate-180 text-blue-500' : 'rotate-0 text-slate-400'}`}>
                  ▼
                </span>
              </button>

              {/* Sub Menus - Collapsible */}
              <div 
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  activeMenu === menu.name ? 'max-h-60 opacity-100 mt-2' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="pl-4 py-1 space-y-1 ml-4 border-l-2 border-slate-100">
                  {menu.subMenus.map((sub) => (
                    <button
                      key={sub}
                      onClick={() => setActiveSubMenu(sub)}
                      className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-all duration-200 relative ${
                        activeMenu === menu.name && activeSubMenu === sub
                          ? 'bg-blue-600 text-white font-medium shadow-md'
                          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                      }`}
                    >
                      {activeMenu === menu.name && activeSubMenu === sub && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1.5 w-3 h-3 bg-blue-600 rounded-full border-2 border-slate-50 hidden md:block"></span>
                      )}
                      {sub}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </nav>

        {/* User Profile Footer */}
        <div className="p-5 border-t border-slate-200 bg-slate-50">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center font-bold shadow-sm">
               A
             </div>
             <div className="flex-1 truncate">
               <p className="text-sm font-bold text-slate-800 truncate">Admin User</p>
               <p className="text-xs text-slate-500 truncate">admin@smartcampus.edu</p>
             </div>
           </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full bg-slate-50 relative overflow-y-auto">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{activeSubMenu}</h2>
            <div className="text-sm text-slate-500 flex items-center gap-2 mt-1">
              <span className="font-medium">{activeMenu}</span>
              <span className="text-[10px] text-slate-400">▶</span>
              <span className="text-slate-600">{activeSubMenu}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 rounded-full hover:bg-slate-100">
               🔔
               <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
             </button>
             <button className="bg-white border text-sm font-medium border-slate-300 text-slate-700 rounded-lg px-4 py-2 hover:bg-slate-50 shadow-sm transition-all focus:ring-2 focus:ring-blue-500 focus:outline-none">
               Sign Out
             </button>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="p-8">
          {activeMenu === 'Facilities & Assets' && activeSubMenu === 'All Facilities' ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <FacilitiesList />
            </div>
          ) : (
            /* Placeholder for Friends' Modules */
            <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-slate-200 shadow-sm animate-in fade-in zoom-in-95 duration-500">
               <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-indigo-100 text-blue-500 rounded-3xl flex items-center justify-center mb-6 text-3xl shadow-sm border border-blue-100">
                  ⚡
               </div>
               <h3 className="text-2xl font-bold text-slate-800 mb-3 text-center">Development in Progress</h3>
               <p className="text-slate-500 max-w-md text-center text-sm leading-relaxed mb-6">
                 The <span className="font-semibold text-blue-600 px-1">{activeSubMenu}</span> function under the <span className="font-semibold text-slate-800">{activeMenu}</span> module will be integrated here by your team members.
               </p>
               <button onClick={() => { setActiveMenu('Facilities & Assets'); setActiveSubMenu('All Facilities'); }} className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-md">
                 Return to Facilities
               </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
