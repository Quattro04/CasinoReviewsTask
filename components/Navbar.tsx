import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { signOut } from "@/app/actions/auth";

export default async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-green-700 tracking-tight">
          ReviewHub
        </Link>
        <nav className="flex items-center gap-1">
          <Link
            href="/companies"
            className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50"
          >
            Companies
          </Link>
          {user ? (
            <>
              <Link
                href="/companies/new"
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50"
              >
                + Add company
              </Link>
              <Link
                href="/account"
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50"
              >
                Account
              </Link>
              <form action={signOut}>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50"
              >
                Sign in
              </Link>
              <Link
                href="/auth/signup"
                className="px-4 py-1.5 text-sm font-medium text-white bg-green-700 rounded-full hover:bg-green-800"
              >
                Sign up free
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
