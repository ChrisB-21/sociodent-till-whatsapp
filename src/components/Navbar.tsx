import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, X, LogOut, UserCircle, ShoppingCart, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useInterest } from "@/context/InterestContext";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, logout, isLoading } = useAuth();
  const { getTotalItems } = useCart();
  const { interests } = useInterest();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully",
    });
    navigate("/auth?mode=login");
  };

  const commonLinks = [
    { name: "Home", path: "/" },
    { name: "Products", path: "/products" },
    { name: "About Us", path: "/about" },
  ];

  const userLinks = [{ name: "Find Dentist", path: "/consultation" }];
  const doctorLinks = [{ name: "My Appointments", path: "/doctor-portal" }];
  const adminLinks = [{ name: "Admin Portal", path: "/admin-portal" }];

  // Detect if on login or signup page
  const isAuthPage = location.pathname.startsWith('/auth') || location.pathname.startsWith('/signup');

  // Get user role from multiple sources for consistency and force admin detection
  const userRole = user?.role || localStorage.getItem('userRole') || '';
  const currentPath = location.pathname;
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  
  // Force admin detection with multiple checks
  const isAdmin = (
    userRole === 'admin' || 
    localStorage.getItem('userRole') === 'admin' ||
    currentPath.includes('/admin-portal') ||
    currentPath.includes('/admin')
  );
  
  const isDoctor = !isAdmin && (userRole === 'doctor' || currentPath.includes('/doctor-portal'));
  const isUser = !isAdmin && !isDoctor;

  // Remove all links if on login/signup page
  let activeLinks = isAuthPage ? [] : [...commonLinks];
  
  // Only show navigation if authenticated and not on auth pages
  if (!isAuthPage && isAuthenticated && user) {
    if (isAdmin) {
      // Admin gets: Admin Portal, Home, Products, About Us
      activeLinks = [adminLinks[0], ...commonLinks];
    } else if (isDoctor) {
      // Doctor gets: Home, My Appointments, Products, About Us
      activeLinks = [commonLinks[0], ...doctorLinks, ...commonLinks.slice(1)];
    } else {
      // User gets: Home, Find Dentist, Products, About Us  
      activeLinks = [commonLinks[0], ...userLinks, ...commonLinks.slice(1)];
    }
  }

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 backdrop-blur-md transition-all duration-300 shadow-sm",
        scrolled || isOpen ? "bg-white/80 py-4" : "bg-transparent py-6"
      )}
    >
      <div className="container-custom flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2 text-3xl font-bold no-underline"
        >
          <img
            src="/logo.png"
            alt="SocioDent Logo"
            className="h-14 w-auto object-contain"
          />
        </Link>

        <nav className="hidden lg:flex items-center gap-10">
          {activeLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={cn(
                "text-base font-medium no-underline transition-colors hover:text-black",
                location.pathname === link.path
                  ? "text-[#0e5d9f]"
                  : "text-gray-700"
              )}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-4">
          {/* Cart and Wishlist Icons are hidden on login/signup (auth) page */}
          {user && !isAuthPage && (
            <>
              {/* Wishlist Icon */}
              <Link 
                to="/wishlist" 
                className="relative p-2 text-gray-700 hover:text-coral-500 transition-colors"
                title="Wishlist"
              >
                <Heart size={20} />
                {interests.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-coral-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {interests.length}
                  </span>
                )}
              </Link>
              {/* Cart Icon */}
              <Link 
                to="/cart" 
                className="relative p-2 text-gray-700 hover:text-sociodent-600 transition-colors"
                title="Shopping Cart"
              >
                <ShoppingCart size={20} />
                {getTotalItems() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-sociodent-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {getTotalItems()}
                  </span>
                )}
              </Link>
            </>
          )}

          {/* Auth buttons remain as is */}
          {isAuthPage ? (
            <>
              <Link to="/auth?mode=login" className="button-text">
                Log in
              </Link>
              <Link to="/signup" className="button-primary py-2">
                Sign up
              </Link>
            </>
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-2 cursor-pointer p-2 text-gray-700 hover:text-black">
                  <UserCircle size={20} />
                  <span className="text-sm font-medium">{user.name}</span>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isUser && (
                  <DropdownMenuItem onClick={() => navigate("/my-profile")}>
                    <UserCircle className="mr-2 h-4 w-4" />
                    My Profile
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link to="/auth?mode=login" className="button-text">
                Log in
              </Link>
              <Link to="/signup" className="button-primary py-2">
                Sign up
              </Link>
            </>
          )}
        </div>

        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <button className="lg:hidden text-gray-700 hover:text-black">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </SheetTrigger>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle className="text-lg font-semibold">Menu</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-4 mt-6">
              {activeLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "text-base font-medium",
                    location.pathname === link.path
                      ? "text-[#0e5d9f]"
                      : "text-gray-700"
                  )}
                >
                  {link.name}
                </Link>
              ))}
              {isAuthPage ? (
                <>
                  <Link
                    to="/auth?mode=login"
                    onClick={() => setIsOpen(false)}
                    className="text-gray-700 hover:text-black"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setIsOpen(false)}
                    className="text-gray-700 hover:text-black"
                  >
                    Signup
                  </Link>
                </>
              ) : user ? (
                <>
                  {isUser && (
                    <Link
                      to="/my-profile"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2 text-gray-700 hover:text-black no-underline"
                    >
                      <UserCircle size={20} />
                      <span className="text-sm font-medium">My Profile</span>
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      handleLogout();
                    }}
                    className="flex items-center gap-2 text-gray-700 hover:text-black"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Log Out</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/auth?mode=login"
                    onClick={() => setIsOpen(false)}
                    className="text-gray-700 hover:text-black"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setIsOpen(false)}
                    className="text-gray-700 hover:text-black"
                  >
                    Signup
                  </Link>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};

export default Navbar;