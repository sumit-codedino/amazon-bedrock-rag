"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "../ui/Button";
import { useAuth } from "@clerk/nextjs";
import {
  SignedIn,
  SignedOut,
  UserButton,
  SignInButton,
  SignUpButton,
} from "@clerk/nextjs";

interface HeaderProps {
  navigationItems?: {
    label: string;
    href: string;
  }[];
}

const publicNavigationItems = [
  { label: "Home", href: "/" },
  { label: "Features", href: "/#features" },
  { label: "Pricing", href: "/#pricing" },
];

const privateNavigationItems = [
  { label: "Chatbots", href: "/chatbots" },
  { label: "Documents", href: "/documents" },
];

export const Header = ({ navigationItems = [] }: HeaderProps) => {
  const pathname = usePathname();
  const { signOut, isSignedIn } = useAuth();

  const isActive = (path: string) => {
    return pathname === path;
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const currentNavigationItems = isSignedIn
    ? privateNavigationItems
    : publicNavigationItems;

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left side - Logo and Navigation Links */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link
                href="/"
                className="text-xl font-bold text-blue-600 dark:text-blue-400"
              >
                CodeDino
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {currentNavigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    isActive(item.href)
                      ? "border-blue-500 text-gray-900 dark:text-white"
                      : "border-transparent text-gray-500 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-700"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right side - User Actions */}
          <div className="flex items-center space-x-4">
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                Sign Out
              </Button>
            </SignedIn>
            <SignedOut>
              <SignInButton>
                <Button variant="primary" size="sm">
                  Sign In
                </Button>
              </SignInButton>
              <SignUpButton>
                <Button variant="outline" size="sm">
                  Sign Up
                </Button>
              </SignUpButton>
            </SignedOut>
          </div>
        </div>
      </div>
    </header>
  );
};
