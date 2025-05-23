"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "../ui/Button";
import { useAuth } from "@clerk/nextjs";
import { useUser } from "@clerk/nextjs";
import {
  SignedIn,
  SignedOut,
  UserButton,
  SignInButton,
  SignUpButton,
} from "@clerk/nextjs";
import { useEffect, useState } from "react";

import { useAppDispatch } from "@/app/store/store";
import {
  setToken,
  setUserId,
  setKnowledgeBaseId,
  setS3DataSourceId,
  setWebDataSourceId,
} from "@/app/store/slices/userSlice";
import { getUserDetails } from "@/apis/get-user-details";

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
  const dispatch = useAppDispatch();
  const { signOut, isSignedIn, getToken } = useAuth();
  const { user, isLoaded } = useUser();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeUser = async () => {
      if (isSignedIn && isLoaded) {
        const token = await getToken();
        dispatch(setToken(token || ""));
        dispatch(setUserId(user?.id || ""));
        const userDetails = await getUserDetails(user?.id || "");
        if (userDetails.isError) {
          console.error("Error fetching user details:", userDetails.error);
        } else {
          console.log("User details:", userDetails.data);
          dispatch(setKnowledgeBaseId(userDetails.data.knowledgeBaseId || ""));
          dispatch(setS3DataSourceId(userDetails.data.s3DataSourceId || ""));
          dispatch(
            setWebDataSourceId(userDetails.data.webCrawlerDataSourceId || "")
          );
        }
        setIsInitialized(true);
      } else if (!isSignedIn) {
        setIsInitialized(true);
      }
    };
    initializeUser();
  }, [isSignedIn, getToken, isLoaded, user?.id]);

  if (!isInitialized) {
    return null; // or a loading spinner
  }

  const isActive = (path: string) => {
    return pathname === path;
  };

  const handleSignOut = async () => {
    await signOut();
    dispatch(setToken(""));
    dispatch(setUserId(""));
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
                href={isSignedIn ? "/chatbots" : "/"}
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
