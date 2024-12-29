// src/components/Layout.jsx
import { Outlet, Link, useLocation } from 'react-router-dom';

export default function Layout() {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="flex flex-col h-screen">
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex h-14 justify-between items-center">
            <div className="flex space-x-8">
              <Link 
                to="/" 
                className={`inline-flex items-center px-4 py-2 text-sm font-medium ${
                  isActive('/') 
                    ? 'text-blue-600 border-b-2 border-blue-600' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                주간 업무 현황
              </Link>
              <Link 
                to="/tasks" 
                className={`inline-flex items-center px-4 py-2 text-sm font-medium ${
                  isActive('/tasks') 
                    ? 'text-blue-600 border-b-2 border-blue-600' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                업무 관리
              </Link>
            </div>
            <Link 
              to="/members" 
              className={`inline-flex items-center px-3 py-2 text-sm ${
                isActive('/members') 
                  ? 'text-blue-600' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
            </Link>
          </div>
        </div>
      </nav>
      <main className="flex-grow max-w-7xl w-full mx-auto py-4 px-4 sm:px-6 lg:px-8 bg-white">
        <Outlet />
      </main>
    </div>
  );
}