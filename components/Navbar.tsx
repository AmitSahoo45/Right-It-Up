import { SignOut } from './Buttons/SignOut';

export function Navbar({ user }: NavbarProps) {
    const userName: string = user?.user_metadata?.full_name.split(' ')[0] || user?.email?.split('@')[0];

    return (
        <nav className="fixed top-4 left-1/2 -translate-x-1/2 w-[80%] z-50 rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md shadow-xl">
            <div className="px-6 py-3 flex items-center justify-between">
                <a href="/" className="text-xl font-bold text-white flex items-center gap-2">
                    ⚖️ Right It Up
                </a>

                <div className="flex items-center gap-4">
                    {user ? (
                        <>
                            <span className="text-gray-300 text-sm hidden sm:block">
                                {userName}
                            </span>
                            <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded-full">
                                3/hr
                            </span>
                            <SignOut />
                        </>
                    ) : (
                        <>
                            <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded-full whitespace-nowrap">
                                Guest: 1 free
                            </span>
                            <a
                                href="/login"
                                className="bg-electric-violet text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-electric-violet/90 transition-all shadow-electric-glow hover:shadow-2xl uppercase tracking-wide"
                            >
                                Sign In
                            </a>
                        </>
                    )}
                </div>
            </div>
        </nav>
    )
}