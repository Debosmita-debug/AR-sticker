import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 dark:bg-black p-4 text-center">
            <h2 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">404 - Page Not Found</h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-8 max-w-md">
                The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
            </p>
            <Link
                href="/"
                className="px-6 py-3 bg-zinc-900 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-900 rounded-full font-medium transition-transform hover:scale-105"
            >
                Go back home
            </Link>
        </div>
    );
}
