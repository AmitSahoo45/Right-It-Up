import { createClient } from '@/utils/supabase/server'
import { Navbar } from '@/components/Navbar'
import Link from 'next/link'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen overflow-x-hidden">
      <Navbar user={user} />

      {/* Hero Section */}
      <main className="pt-28 md:pt-32 px-4 md:px-10">
        <section className="max-w-6xl mx-auto">
          {/* Floating badges */}
          <div className="flex flex-wrap justify-center gap-3 mb-8 animate-fade-in">
            <span className="px-3 py-1.5 bg-electric-violet/20 text-electric-violet text-xs font-bold rounded-full border border-electric-violet/30 backdrop-blur-sm">
              🤖 AI-POWERED
            </span>
            <span className="px-3 py-1.5 bg-verdict-green/20 text-verdict-green text-xs font-bold rounded-full border border-verdict-green/30 backdrop-blur-sm">
              ⚡ INSTANT VERDICTS
            </span>
            <span className="px-3 py-1.5 bg-cyber-blue/20 text-cyber-blue text-xs font-bold rounded-full border border-cyber-blue/30 backdrop-blur-sm">
              🎯 100% UNBIASED
            </span>
          </div>

          {/* Main headline */}
          <div className="text-center mb-8">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-6 leading-[0.9]">
              <span className="block text-starlight-white">SETTLE THE</span>
              <span className="block bg-gradient-to-r from-electric-violet via-cyber-blue to-verdict-green bg-clip-text text-transparent animate-gradient-shift">
                ARGUMENT
              </span>
              <span className="block text-starlight-white">FOR GOOD</span>
            </h1>
            <p className="text-steel-grey text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              Submit your side. Share the link. Let AI be the judge.
              <span className="text-caution-amber font-semibold"> No cap, just facts.</span>
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              href="/submit"
              className="group relative px-8 py-4 bg-gradient-to-r from-electric-violet to-cyber-blue text-white font-bold text-lg rounded-2xl shadow-electric-glow hover:shadow-[0_0_50px_rgba(124,58,237,0.8)] transition-all duration-300 hover:scale-105"
            >
              <span className="relative z-10 flex items-center gap-2">
                ⚖️ Start a Case
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </Link>
            <Link
              href="#how-it-works"
              className="px-8 py-4 text-steel-grey hover:text-starlight-white font-semibold text-lg transition-colors border border-white/10 rounded-2xl hover:border-white/30 hover:bg-white/5"
            >
              See How It Works
            </Link>
          </div>

          {/* Stats bar */}
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 mb-20 py-6 px-8 bg-charcoal-layer/50 rounded-3xl border border-white/5 backdrop-blur-sm">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-black text-electric-violet">50K+</div>
              <div className="text-steel-grey text-sm">Cases Settled</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-black text-verdict-green">89%</div>
              <div className="text-steel-grey text-sm">Accept the Verdict</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-black text-cyber-blue">&lt;30s</div>
              <div className="text-steel-grey text-sm">Average Verdict Time</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-black text-caution-amber">4.9★</div>
              <div className="text-steel-grey text-sm">User Rating</div>
            </div>
          </div>
        </section>

        {/* Receipt Preview Section */}
        <section className="max-w-6xl mx-auto mb-24">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Left - Sample Receipt */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-electric-violet/20 via-cyber-blue/20 to-verdict-green/20 rounded-3xl blur-xl"></div>
              <div className="relative bg-[#1a1a2e] rounded-2xl p-6 font-mono text-sm border border-white/10 shadow-2xl transform hover:rotate-1 transition-transform duration-500">
                {/* Receipt header */}
                <div className="text-center border-b border-dashed border-white/20 pb-4 mb-4">
                  <div className="text-2xl mb-1">⚖️</div>
                  <div className="text-starlight-white font-bold text-lg tracking-wider">RIGHT IT UP</div>
                  <div className="text-steel-grey text-xs">OFFICIAL VERDICT RECEIPT</div>
                  <div className="text-steel-grey text-xs mt-1">Case #WR-2024-0847</div>
                </div>

                {/* Parties */}
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between">
                    <span className="text-steel-grey">Party A:</span>
                    <span className="text-cyber-blue">@akansha_vibes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-steel-grey">Party B:</span>
                    <span className="text-objection-red">@amit_actually</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-steel-grey">Category:</span>
                    <span className="text-caution-amber">💕 Relationship</span>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-dashed border-white/20 my-4"></div>

                {/* Scores */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-steel-grey">Akansha&apos;s Score:</span>
                    <span className="text-verdict-green font-bold">78/100</span>
                  </div>
                  <div className="w-full bg-charcoal-layer rounded-full h-2">
                    <div className="bg-gradient-to-r from-verdict-green to-cyber-blue h-2 rounded-full" style={{ width: '78%' }}></div>
                  </div>
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-steel-grey">Amit&apos;s Score:</span>
                    <span className="text-objection-red font-bold">52/100</span>
                  </div>
                  <div className="w-full bg-charcoal-layer rounded-full h-2">
                    <div className="bg-gradient-to-r from-objection-red to-caution-amber h-2 rounded-full" style={{ width: '52%' }}></div>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-dashed border-white/20 my-4"></div>

                {/* Verdict */}
                <div className="text-center py-4 bg-verdict-green/10 rounded-xl border border-verdict-green/30 mb-4">
                  <div className="text-steel-grey text-xs mb-1">THE VERDICT IS IN</div>
                  <div className="text-verdict-green font-black text-2xl">🏆 Akansha WINS</div>
                  <div className="text-steel-grey text-xs mt-1">Confidence: 87%</div>
                </div>

                {/* Summary */}
                <div className="text-steel-grey text-xs leading-relaxed mb-4">
                  &quot;Akansha presented clear evidence of prior agreement. Amit&apos;s argument relied heavily on assumptions without supporting documentation.&quot;
                </div>

                {/* Footer */}
                <div className="text-center border-t border-dashed border-white/20 pt-4">
                  <div className="text-steel-grey text-xs">════════════════════</div>
                  <div className="text-steel-grey text-[10px] mt-2">Processed by AI Judge • Dec 10, 2024</div>
                  <div className="text-steel-grey text-[10px]">
                    rightitup.vercel.app
                  </div>
                </div>
              </div>
            </div>

            {/* Right - Feature text */}
            <div className="space-y-6">
              <div className="inline-block px-3 py-1 bg-caution-amber/20 text-caution-amber text-xs font-bold rounded-full">
                📜 RECEIPT-STYLE VERDICTS
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-starlight-white leading-tight">
                Get your verdict.
                <span className="text-electric-violet"> Screenshot it.</span>
                <span className="text-cyber-blue"> Flex it.</span>
              </h2>
              <p className="text-steel-grey text-lg leading-relaxed">
                Every verdict comes as a shareable receipt card. Perfect for group chats, stories, or that sweet &quot;I told you so&quot; moment.
                <span className="text-verdict-green font-semibold"> The receipts don&apos;t lie.</span>
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="px-4 py-2 bg-charcoal-layer text-steel-grey text-sm rounded-full border border-white/10">📊 Score Breakdown</span>
                <span className="px-4 py-2 bg-charcoal-layer text-steel-grey text-sm rounded-full border border-white/10">🎯 Confidence Level</span>
                <span className="px-4 py-2 bg-charcoal-layer text-steel-grey text-sm rounded-full border border-white/10">💡 AI Reasoning</span>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="max-w-6xl mx-auto mb-24 scroll-mt-24">
          <div className="text-center mb-12">
            <span className="px-3 py-1 bg-cyber-blue/20 text-cyber-blue text-xs font-bold rounded-full">
              🔄 THE PROCESS
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-starlight-white mt-4">
              Three steps to <span className="text-electric-violet">justice</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-electric-violet/20 to-transparent rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative bg-charcoal-layer/50 backdrop-blur-sm border border-white/10 rounded-3xl p-8 hover:border-electric-violet/50 transition-all h-full">
                <div className="w-16 h-16 bg-electric-violet/20 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">
                  ✍️
                </div>
                <div className="text-electric-violet font-mono text-sm mb-2">STEP 01</div>
                <h3 className="text-2xl font-bold text-starlight-white mb-3">State Your Case</h3>
                <p className="text-steel-grey leading-relaxed">
                  Describe the argument from your POV. Add evidence, screenshots, receipts - whatever backs you up.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-cyber-blue/20 to-transparent rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative bg-charcoal-layer/50 backdrop-blur-sm border border-white/10 rounded-3xl p-8 hover:border-cyber-blue/50 transition-all h-full">
                <div className="w-16 h-16 bg-cyber-blue/20 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">
                  🔗
                </div>
                <div className="text-cyber-blue font-mono text-sm mb-2">STEP 02</div>
                <h3 className="text-2xl font-bold text-starlight-white mb-3">Share the Link</h3>
                <p className="text-steel-grey leading-relaxed">
                  Send the case link to the other party. They submit their side. No peeking at each other&apos;s arguments.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-verdict-green/20 to-transparent rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative bg-charcoal-layer/50 backdrop-blur-sm border border-white/10 rounded-3xl p-8 hover:border-verdict-green/50 transition-all h-full">
                <div className="w-16 h-16 bg-verdict-green/20 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">
                  ⚖️
                </div>
                <div className="text-verdict-green font-mono text-sm mb-2">STEP 03</div>
                <h3 className="text-2xl font-bold text-starlight-white mb-3">Get the Verdict</h3>
                <p className="text-steel-grey leading-relaxed">
                  AI analyzes both sides, identifies BS, and delivers an unbiased verdict. Case closed.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Judge Personas */}
        <section className="max-w-6xl mx-auto mb-24">
          <div className="text-center mb-12">
            <span className="px-3 py-1 bg-caution-amber/20 text-caution-amber text-xs font-bold rounded-full">
              👨‍⚖️ SPECIALIZED JUDGES
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-starlight-white mt-4">
              Pick your <span className="text-caution-amber">judge</span>
            </h2>
            <p className="text-steel-grey mt-4 max-w-xl mx-auto">
              Different arguments need different expertise. Choose the AI persona that fits your case.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { emoji: '💕', name: 'Dr. Harmony', type: 'Relationships', color: 'from-pink-500/20 to-red-500/20 border-pink-500/30 hover:border-pink-500/60' },
              { emoji: '🏠', name: 'Judge Flatmate', type: 'Roommates', color: 'from-orange-500/20 to-yellow-500/20 border-orange-500/30 hover:border-orange-500/60' },
              { emoji: '🏆', name: 'Referee Rex', type: 'Sports', color: 'from-green-500/20 to-emerald-500/20 border-green-500/30 hover:border-green-500/60' },
              { emoji: '💻', name: 'Silicon Judge', type: 'Tech/Gaming', color: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30 hover:border-blue-500/60' },
              { emoji: '⚖️', name: 'Judge Fairness', type: 'General', color: 'from-purple-500/20 to-violet-500/20 border-purple-500/30 hover:border-purple-500/60' },
            ].map((judge, i) => (
              <div key={i} className={`bg-gradient-to-br ${judge.color} backdrop-blur-sm border rounded-2xl p-6 text-center hover:scale-105 transition-all cursor-pointer`}>
                <div className="text-4xl mb-3">{judge.emoji}</div>
                <div className="text-starlight-white font-bold text-sm">{judge.name}</div>
                <div className="text-steel-grey text-xs mt-1">{judge.type}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Features Bento Grid */}
        <section className="max-w-6xl mx-auto mb-24">
          <div className="text-center mb-12">
            <span className="px-3 py-1 bg-verdict-green/20 text-verdict-green text-xs font-bold rounded-full">
              ✨ FEATURES
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-starlight-white mt-4">
              Built <span className="text-verdict-green">different</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {/* Large card */}
            <div className="md:col-span-2 bg-gradient-to-br from-electric-violet/10 to-cyber-blue/10 border border-white/10 rounded-3xl p-8 hover:border-electric-violet/30 transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-4xl mb-4">🧠</div>
                  <h3 className="text-2xl font-bold text-starlight-white mb-2">Multi-Model Intelligence</h3>
                  <p className="text-steel-grey max-w-md">
                    Powered by Claude, Gemini & Groq. We pick the best model for your case type - emotional intelligence for relationships, logical rigor for tech debates.
                  </p>
                </div>
                <div className="hidden md:flex gap-2">
                  <span className="px-2 py-1 bg-[#D97757]/20 text-[#D97757] text-xs rounded-lg">Claude</span>
                  <span className="px-2 py-1 bg-[#1A73E8]/20 text-[#1A73E8] text-xs rounded-lg">Gemini</span>
                  <span className="px-2 py-1 bg-[#F55036]/20 text-[#F55036] text-xs rounded-lg">Groq</span>
                </div>
              </div>
            </div>

            {/* Small card */}
            <div className="bg-charcoal-layer/50 border border-white/10 rounded-3xl p-6 hover:border-caution-amber/30 transition-all">
              <div className="text-3xl mb-3">📎</div>
              <h3 className="text-xl font-bold text-starlight-white mb-2">Evidence Upload</h3>
              <p className="text-steel-grey text-sm">Screenshots, receipts, chat logs - upload your proof.</p>
            </div>

            {/* Small card */}
            <div className="bg-charcoal-layer/50 border border-white/10 rounded-3xl p-6 hover:border-objection-red/30 transition-all">
              <div className="text-3xl mb-3">🔄</div>
              <h3 className="text-xl font-bold text-starlight-white mb-2">Appeal System</h3>
              <p className="text-steel-grey text-sm">Don&apos;t agree? Submit new evidence and appeal once.</p>
            </div>

            {/* Medium card */}
            <div className="md:col-span-2 bg-gradient-to-br from-verdict-green/10 to-caution-amber/10 border border-white/10 rounded-3xl p-6 hover:border-verdict-green/30 transition-all flex items-center gap-6">
              <div className="text-5xl">🎯</div>
              <div>
                <h3 className="text-xl font-bold text-starlight-white mb-1">Confidence Scoring</h3>
                <p className="text-steel-grey text-sm">Every verdict shows how confident the AI is - from &quot;pretty sure&quot; to &quot;slam dunk case.&quot;</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-4xl mx-auto mb-24">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-electric-violet/30 via-cyber-blue/30 to-verdict-green/30 rounded-3xl blur-2xl"></div>
            <div className="relative bg-charcoal-layer/80 backdrop-blur-xl border border-white/10 rounded-3xl p-12 text-center">
              <div className="text-6xl mb-6">🔥</div>
              <h2 className="text-4xl md:text-5xl font-black text-starlight-white mb-4">
                Ready to settle it?
              </h2>
              <p className="text-steel-grey text-lg mb-8 max-w-xl mx-auto">
                Stop arguing in circles. Get an unbiased verdict in under 30 seconds. Your first case is free - no signup needed.
              </p>
              <Link
                href="/submit"
                className="inline-flex items-center gap-2 px-10 py-5 bg-gradient-to-r from-electric-violet to-cyber-blue text-white font-bold text-xl rounded-2xl shadow-electric-glow hover:shadow-[0_0_60px_rgba(124,58,237,0.9)] transition-all hover:scale-105"
              >
                ⚖️ Start Your Case Now
              </Link>
              <p className="text-steel-grey text-sm mt-6">
                No credit card • No signup for first verdict • Takes 30 seconds
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10 py-12">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2 text-xl font-bold">
              ⚖️ Right It Up
            </div>
            <div className="flex gap-6 text-steel-grey text-sm">
              <a href="#" className="hover:text-starlight-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-starlight-white transition-colors">Terms</a>
              <a href="#" className="hover:text-starlight-white transition-colors">Contact</a>
            </div>
            <div className="text-steel-grey text-sm">
              © {new Date().getFullYear()} Right It Up. All verdicts final (kinda).
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
