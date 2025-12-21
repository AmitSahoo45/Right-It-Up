import Link from 'next/link';

export const metadata = {
    title: 'Privacy Policy | Right It Up',
    description: 'Privacy Policy for Right It Up - AI-powered dispute resolution platform',
};

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen">
            <main className="pt-28 md:pt-32 px-4 md:px-10 pb-20">
                <div className="max-w-3xl mx-auto">
                    <div className="mb-10">
                        <Link href="/" className="text-electric-violet hover:text-cyber-blue transition-colors text-sm">
                            ← Back to Home
                        </Link>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-black text-starlight-white mb-4">
                        Privacy Policy
                    </h1>
                    <p className="text-steel-grey mb-10">
                        Last updated: December 2024
                    </p>

                    <div className="prose prose-invert max-w-none space-y-8">
                        <section>
                            <h2 className="text-2xl font-bold text-starlight-white mb-4">1. Introduction</h2>
                            <p className="text-steel-grey leading-relaxed">
                                Right It Up (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) respects your privacy and is committed to protecting your personal data.
                                This Privacy Policy explains how we collect, use, store, and protect your information when you use our AI-powered dispute resolution platform.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-starlight-white mb-4">2. Information We Collect</h2>

                            <h3 className="text-lg font-semibold text-starlight-white mb-2 mt-6">Account Information</h3>
                            <p className="text-steel-grey leading-relaxed mb-4">
                                When you sign in with Google, we receive your email address, name, and profile picture from Google OAuth.
                                We do not have access to your Google password.
                            </p>

                            <h3 className="text-lg font-semibold text-starlight-white mb-2">Case Submissions</h3>
                            <p className="text-steel-grey leading-relaxed mb-4">
                                We collect the arguments, names/handles, and evidence you submit when creating or responding to a case.
                                This includes text content and any images you upload.
                            </p>

                            <h3 className="text-lg font-semibold text-starlight-white mb-2">Usage Data</h3>
                            <p className="text-steel-grey leading-relaxed mb-4">
                                We automatically collect IP addresses for rate limiting, fraud prevention, and guest user identification.
                                We also track verdict usage to enforce daily limits.
                            </p>

                            <h3 className="text-lg font-semibold text-starlight-white mb-2">Technical Data</h3>
                            <p className="text-steel-grey leading-relaxed">
                                Standard server logs including browser type, device information, and access timestamps may be collected for security and analytics purposes.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-starlight-white mb-4">3. How We Use Your Information</h2>
                            <ul className="list-disc list-inside text-steel-grey space-y-2 ml-4">
                                <li>To provide and operate the dispute resolution service</li>
                                <li>To process your arguments through our AI systems and generate verdicts</li>
                                <li>To authenticate users and manage accounts</li>
                                <li>To enforce usage limits and prevent abuse</li>
                                <li>To improve our AI models and service quality</li>
                                <li>To communicate important service updates</li>
                                <li>To comply with legal obligations</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-starlight-white mb-4">4. AI Processing</h2>
                            <p className="text-steel-grey leading-relaxed">
                                Your submitted arguments are processed by third-party AI services (including Google Gemini, Anthropic Claude, and Groq) to generate verdicts.
                                These providers have their own privacy policies governing data handling.
                                We transmit only the necessary case information to generate verdicts and do not share your identity with these providers.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-starlight-white mb-4">5. Data Storage & Security</h2>
                            <p className="text-steel-grey leading-relaxed">
                                Your data is stored securely using Supabase (PostgreSQL) with encryption at rest and in transit.
                                Uploaded images are stored in secure cloud storage with access controls.
                                We implement industry-standard security measures including input sanitization, rate limiting, and secure authentication.
                                However, no system is completely secure, and we cannot guarantee absolute security.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-starlight-white mb-4">6. Data Retention</h2>
                            <p className="text-steel-grey leading-relaxed">
                                Cases and verdicts are retained indefinitely unless you request deletion.
                                Pending cases expire after 48 hours if no response is received.
                                Usage tracking data for rate limiting is retained for 24 hours.
                                Account information is retained until you delete your account or request removal.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-starlight-white mb-4">7. Data Sharing</h2>
                            <p className="text-steel-grey leading-relaxed mb-4">
                                We do not sell your personal data. We may share information with:
                            </p>
                            <ul className="list-disc list-inside text-steel-grey space-y-2 ml-4">
                                <li><strong>AI Providers:</strong> Case content (anonymized) for verdict generation</li>
                                <li><strong>Infrastructure Partners:</strong> Supabase, Vercel, Upstash for hosting and services</li>
                                <li><strong>Other Party:</strong> Your arguments become visible to the other party after verdict delivery</li>
                                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-starlight-white mb-4">8. Cookies & Tracking</h2>
                            <p className="text-steel-grey leading-relaxed">
                                We use essential cookies for authentication and session management.
                                We do not use third-party advertising cookies.
                                Session cookies are cleared when you close your browser; authentication tokens persist for convenience.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-starlight-white mb-4">9. Your Rights</h2>
                            <p className="text-steel-grey leading-relaxed mb-4">
                                Depending on your jurisdiction, you may have the right to:
                            </p>
                            <ul className="list-disc list-inside text-steel-grey space-y-2 ml-4">
                                <li>Access the personal data we hold about you</li>
                                <li>Request correction of inaccurate data</li>
                                <li>Request deletion of your data</li>
                                <li>Object to or restrict certain processing</li>
                                <li>Data portability (receive your data in a structured format)</li>
                                <li>Withdraw consent where processing is based on consent</li>
                            </ul>
                            <p className="text-steel-grey leading-relaxed mt-4">
                                To exercise these rights, please contact us through our platform.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-starlight-white mb-4">10. Guest Users</h2>
                            <p className="text-steel-grey leading-relaxed">
                                If you use the Service without creating an account, we identify you by IP address for rate limiting purposes.
                                Your submitted content is still stored and processed, but is not linked to a persistent account.
                                Guest usage data may be retained for fraud prevention.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-starlight-white mb-4">11. Children&apos;s Privacy</h2>
                            <p className="text-steel-grey leading-relaxed">
                                Right It Up is not intended for users under 13 years of age.
                                We do not knowingly collect personal information from children under 13.
                                If you believe a child has provided us with personal data, please contact us for removal.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-starlight-white mb-4">12. International Transfers</h2>
                            <p className="text-steel-grey leading-relaxed">
                                Your data may be processed in countries outside your residence, including the United States.
                                We ensure appropriate safeguards are in place for international data transfers in compliance with applicable laws.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-starlight-white mb-4">13. Changes to This Policy</h2>
                            <p className="text-steel-grey leading-relaxed">
                                We may update this Privacy Policy periodically.
                                Significant changes will be communicated through the Service or via email for registered users.
                                Continued use after changes constitutes acceptance of the updated policy.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-starlight-white mb-4">14. Contact Us</h2>
                            <p className="text-steel-grey leading-relaxed">
                                For privacy-related inquiries, data requests, or concerns, please contact us through our platform.
                                We aim to respond to all legitimate requests within 30 days.
                            </p>
                        </section>
                    </div>

                    <div className="mt-12 pt-8 border-t border-white/10">
                        <Link href="/tos" className="text-electric-violet hover:text-cyber-blue transition-colors">
                            View Terms of Service →
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}