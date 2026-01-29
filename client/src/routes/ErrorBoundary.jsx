import React from "react";

export function ErrorBoundaryPage({ error }) {
  // React Router v6 passes error to errorElement via useRouteError typically,
  // but we'll make a simple generic fallback.
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-white border rounded p-4 shadow">
        <h1 className="text-xl font-semibold mb-2">Something went wrong</h1>
        <p className="text-sm text-gray-700 mb-3">
          An unexpected error occurred. Please try again or go back.
        </p>
        {error && (
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
            {typeof error === "string" ? error : JSON.stringify(error, null, 2)}
          </pre>
        )}
        <div className="mt-3">
          <a href="/" className="text-blue-600 hover:underline">
            Go Home
          </a>
        </div>
      </div>
    </div>
  );
}
