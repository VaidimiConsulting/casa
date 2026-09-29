import React from "react";
import { Link, useLocation } from "wouter";
import { getCurrentUser } from "@/api/auth";

interface ReceptionGuardProps {
  children: React.ReactNode;
}

export default function ReceptionGuard({ children }: ReceptionGuardProps) {
  const [, setLocation] = useLocation();
  const token = localStorage.getItem("casanest_token");
  const user = getCurrentUser();

  if (!token || !user) {
    setLocation("/reception/login");
    return null;
  }

  if (user.role !== "receptionist" && user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f0e8] p-6 text-[#20352b]">
        <div className="bg-[#fbf8f1] border border-[#20352b]/15 rounded-3xl p-8 max-w-md w-full text-center shadow-lg">
          <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
            !
          </div>
          <h2 className="text-2xl font-serif mb-2">Access Denied</h2>
          <p className="text-sm text-[#77766c] mb-6">
            You do not have permission to access the Reception Panel.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/" className="button button-dark px-6 py-2">
              Go to Website
            </Link>
            <button
              onClick={() => {
                localStorage.removeItem("casanest_token");
                localStorage.removeItem("casanest_user");
                setLocation("/reception/login");
              }}
              className="button button-light border border-[#20352b]/15 px-6 py-2"
            >
              Sign in as Receptionist
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
