
export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
        <h1 className="text-2xl font-bold text-red-600">
          Access Denied
        </h1>

        <p className="mt-4 text-slate-600">
          You do not have administrator permission to access this ERP dashboard.
        </p>

        <p className="mt-3 text-sm text-slate-500">
          Please contact your ERP administrator.
        </p>

        <a
          href="/login"
          className="mt-6 inline-block rounded-lg bg-blue-700 px-6 py-3 font-semibold text-white"
        >
          Return to Login
        </a>
      </div>
    </main>
  );
}
