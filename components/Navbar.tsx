'use client'

import { useState } from 'react'
import Link from 'next/link'
import { SignOut } from './Buttons/SignOut'
import type { NavbarProps } from '@/types'

export function Navbar({ user, quota }: NavbarProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const userName: string = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'User'

    return (
        <nav className="fixed top-4 left-1/2 -translate-x-1/2 w-[95%] md:w-[85%] lg:w-[80%] z-50 rounded-2xl border border-white/10 bg-midnight-void/80 backdrop-blur-xl shadow-2xl">
            <div className="px-4 md:px-6 py-3 flex items-center justify-between">
                {/* Logo */}
                <Link
                    href="/"
                    className="text-lg md:text-xl font-bold text-starlight-white flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                    <span className="text-2xl">⚖️</span>
                    <span className="bg-gradient-to-r from-electric-violet to-cyber-blue bg-clip-text text-transparent">
                        Right It Up
                    </span>
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-3 lg:gap-4">
                    {user ? (
                        <>
                            {/* User Avatar & Name */}
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-charcoal-layer/50 rounded-xl border border-white/5">
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-electric-violet to-cyber-blue flex items-center justify-center text-xs font-bold text-white">
                                    {userName.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-steel-grey text-sm font-medium max-w-[100px] truncate">
                                    {userName}
                                </span>
                            </div>

                            {/* Rate Limit Badge */}
                            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${quota && quota.remaining > 2
                                ? 'bg-verdict-green/10 border-verdict-green/20'
                                : quota && quota.remaining > 0
                                    ? 'bg-caution-amber/10 border-caution-amber/20'
                                    : 'bg-objection-red/10 border-objection-red/20'
                                }`}>
                                <div className={`w-2 h-2 rounded-full animate-pulse ${quota && quota.remaining > 2
                                    ? 'bg-verdict-green'
                                    : quota && quota.remaining > 0
                                        ? 'bg-caution-amber'
                                        : 'bg-objection-red'
                                    }`}></div>
                                <span className={`text-xs font-bold ${quota && quota.remaining > 2
                                    ? 'text-verdict-green'
                                    : quota && quota.remaining > 0
                                        ? 'text-caution-amber'
                                        : 'text-objection-red'
                                    }`}>
                                    {quota ? `${quota.remaining}/5` : '5/5'}
                                </span>
                            </div>

                            <SignOut />
                        </>
                    ) : (
                        <>
                            <Link
                                href="/login"
                                className="group relative px-5 py-2 bg-gradient-to-r from-electric-violet to-cyber-blue text-white rounded-xl text-sm font-bold overflow-hidden transition-all hover:shadow-electric-glow"
                            >
                                <span className="relative z-10">Sign In</span>
                                <div className="absolute inset-0 bg-gradient-to-r from-cyber-blue to-electric-violet opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </Link>
                        </>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="md:hidden relative w-10 h-10 flex items-center justify-center rounded-xl bg-charcoal-layer/50 border border-white/10 hover:border-electric-violet/50 transition-colors"
                    aria-label="Toggle menu"
                >
                    <div className="w-5 h-4 flex flex-col justify-between">
                        <span className={`block h-0.5 w-full bg-starlight-white rounded-full transition-all duration-300 ${isMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
                        <span className={`block h-0.5 w-full bg-starlight-white rounded-full transition-all duration-300 ${isMenuOpen ? 'opacity-0 scale-0' : ''}`} />
                        <span className={`block h-0.5 w-full bg-starlight-white rounded-full transition-all duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
                    </div>
                </button>
            </div>

            {/* Mobile Menu Dropdown */}
            <div className={`md:hidden overflow-hidden transition-all duration-300 ease-out ${isMenuOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="px-4 pb-4 pt-2 border-t border-white/5">
                    {user ? (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-charcoal-layer/30 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-electric-violet to-cyber-blue flex items-center justify-center text-sm font-bold text-white">
                                        {userName.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="text-starlight-white text-sm font-medium">{userName}</div>
                                        <div className="text-steel-grey text-xs">Logged in</div>
                                    </div>
                                </div>
                                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${quota && quota.remaining > 2 ? 'bg-verdict-green/10 border-verdict-green/20'
                                    : quota && quota.remaining > 0 ? 'bg-caution-amber/10 border-caution-amber/20'
                                        : 'bg-objection-red/10 border-objection-red/20'
                                    }`}>
                                    <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${quota && quota.remaining > 2 ? 'bg-verdict-green'
                                        : quota && quota.remaining > 0 ? 'bg-caution-amber'
                                            : 'bg-objection-red'
                                        }`}></div>
                                    <span className={`text-xs font-bold ${quota && quota.remaining > 2 ? 'text-verdict-green'
                                        : quota && quota.remaining > 0 ? 'text-caution-amber'
                                            : 'text-objection-red'
                                        }`}>{quota ? `${quota.remaining}/5` : '5/5'}</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Link href="/submit" className="flex-1 py-2.5 bg-gradient-to-r from-electric-violet to-cyber-blue text-white text-center rounded-xl text-sm font-bold" onClick={() => setIsMenuOpen(false)}>
                                    ⚖️ New Case
                                </Link>
                                <div className="flex-1"><SignOut /></div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex items-center justify-center gap-2 p-3 rounded-xl border bg-electric-violet/10 border-electric-violet/20">
                                <span className="text-2xl">⚖️</span>
                                <span className="text-sm font-medium text-electric-violet">
                                    Sign in to get 5 verdicts/day
                                </span>
                            </div>
                            <Link
                                href="/login"
                                className="block w-full py-2.5 bg-gradient-to-r from-electric-violet to-cyber-blue text-white text-center rounded-xl text-sm font-bold"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Sign In
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    )
}