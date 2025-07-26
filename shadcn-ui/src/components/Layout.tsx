import { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Moon, Sun, LayoutDashboard, Wallet, Tags, BarChart2, Settings, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFinance } from '@/contexts/FinanceContext';
import { ThemeToggle } from './ThemeToggle';

const Layout = () => {
  const { pathname } = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { preferences } = useFinance();

  const navItems = [
    { to: '/', icon: <LayoutDashboard className="h-5 w-5" />, label: 'Dashboard' },
    { to: '/transactions', icon: <Wallet className="h-5 w-5" />, label: 'Transactions' },
    { to: '/categories', icon: <Tags className="h-5 w-5" />, label: 'Categories' },
    { to: '/reports', icon: <BarChart2 className="h-5 w-5" />, label: 'Reports' },
    { to: '/settings', icon: <Settings className="h-5 w-5" />, label: 'Settings' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Mobile Header */}
      <header className="lg:hidden border-b px-4 py-3 flex justify-between items-center sticky top-0 bg-background z-20">
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <h1 className="font-bold text-lg">Finance Tracker</h1>
        </div>
        <ThemeToggle />
      </header>

      <div className="flex flex-1">
        {/* Sidebar for larger screens */}
        <aside 
          className={cn(
            "z-30 border-r bg-background w-64 flex-shrink-0 fixed inset-y-0 flex flex-col",
            "transition-transform duration-300 ease-in-out lg:transform-none lg:opacity-100 lg:pointer-events-auto",
            sidebarOpen ? "transform-none" : "-translate-x-full"
          )}
        >
          <div className="p-4 flex justify-between items-center lg:py-6 border-b">
            <h1 className="font-bold text-xl">Finance Tracker</h1>
            <div className="lg:block hidden">
              <ThemeToggle />
            </div>
          </div>
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  )
                }
              >
                {item.icon}
                <span className="ml-3">{item.label}</span>
              </NavLink>
            ))}
          </nav>
          <div className="p-4 border-t">
            <p className="text-xs text-muted-foreground">
              Your financial data is stored locally
            </p>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-64">
          {/* Backdrop for mobile sidebar */}
          {sidebarOpen && (
            <div 
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-20 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
          
          <div className="container mx-auto p-4 md:p-6 max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;