import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Leaf, ArrowLeft, FileText, Coins, Shield, Recycle, Users, BarChart3, Globe } from "lucide-react";

const Whitepaper = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl gradient-eco flex items-center justify-center group-hover:scale-110 transition-transform">
                <Leaf className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-gradient-eco">Trash2Pay</span>
            </Link>
            <Button variant="ghost" asChild>
              <Link to="/" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="pt-28 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Title */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
              <FileText className="w-4 h-4" />
              <span className="text-sm font-semibold">Whitepaper v1.0</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Trash2Pay Whitepaper
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A Decentralized Waste Management Protocol Powered by BSV Blockchain
            </p>
            <p className="text-sm text-muted-foreground mt-3">Last updated: April 2026</p>
          </div>

          {/* Table of Contents */}
          <div className="bg-card rounded-2xl border border-border p-8 mb-12">
            <h2 className="text-xl font-bold mb-4 text-foreground">Table of Contents</h2>
            <nav className="space-y-2">
              {[
                { id: "abstract", label: "1. Abstract" },
                { id: "problem", label: "2. The Problem" },
                { id: "solution", label: "3. The Trash2Pay Solution" },
                { id: "tokenomics", label: "4. Tokenomics (T2P)" },
                { id: "architecture", label: "5. Technical Architecture" },
                { id: "roles", label: "6. Ecosystem Roles" },
                { id: "qr-verification", label: "7. QR Verification System" },
                { id: "payments", label: "8. Payment & Redemption Flow" },
                { id: "roadmap", label: "9. Roadmap" },
                { id: "conclusion", label: "10. Conclusion" },
              ].map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="block text-muted-foreground hover:text-primary transition-colors text-sm pl-2 border-l-2 border-transparent hover:border-primary"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>

          {/* Sections */}
          <div className="space-y-16 prose-custom">
            {/* Abstract */}
            <Section id="abstract" icon={<FileText className="w-5 h-5" />} title="1. Abstract">
              <p>
                Trash2Pay is a decentralized application (dApp) that incentivizes proper waste disposal
                and recycling by rewarding participants with T2P Units (Trash2Pay) tokens on the BSV blockchain.
                The platform connects waste generators (users), waste collectors, and waste processors
                in a transparent, verifiable ecosystem where every disposal event is recorded on-chain.
              </p>
              <p>
                By leveraging blockchain technology, QR-code-based verification, and a multi-currency
                payment system, Trash2Pay creates economic incentives for sustainable waste management
                while providing full traceability from bin to recycling plant.
              </p>
            </Section>

            {/* Problem */}
            <Section id="problem" icon={<Globe className="w-5 h-5" />} title="2. The Problem">
              <p>
                Global waste management faces critical challenges: over 2 billion tonnes of municipal
                solid waste is generated annually, with at least 33% not managed in an environmentally
                safe manner. Key issues include:
              </p>
              <ul>
                <li><strong>Lack of incentives</strong> — Citizens have little motivation to sort or dispose of waste properly.</li>
                <li><strong>Opaque supply chains</strong> — Waste movement from generation to processing is poorly tracked.</li>
                <li><strong>Informal sector exclusion</strong> — Waste collectors in developing economies lack formal recognition and payment infrastructure.</li>
                <li><strong>Fraud and double-counting</strong> — Without verification, recycling claims can be falsified.</li>
              </ul>
            </Section>

            {/* Solution */}
            <Section id="solution" icon={<Recycle className="w-5 h-5" />} title="3. The Trash2Pay Solution">
              <p>
                Trash2Pay addresses these challenges through a three-pillar approach:
              </p>
              <div className="grid md:grid-cols-3 gap-4 not-prose my-6">
                <PillarCard
                  title="Verify"
                  description="Unique QR codes on waste bins create tamper-proof disposal records verified by collectors."
                />
                <PillarCard
                  title="Reward"
                  description="T2P Units are automatically minted and distributed for every verified disposal event."
                />
                <PillarCard
                  title="Redeem"
                  description="Tokens are redeemable for Satoshis (SAT) or BSV through integrated payment rails."
                />
              </div>
              <p>
                The platform uses BSV blockchain for its low transaction fees, high throughput, and
                ability to store data on-chain, making it ideal for microtransaction-heavy waste
                management workflows.
              </p>
            </Section>

            {/* Tokenomics */}
            <Section id="tokenomics" icon={<Coins className="w-5 h-5" />} title="4. Tokenomics (T2P Units)">
              <p>
                T2P Units is the native utility token of the Trash2Pay ecosystem. It serves
                as both a reward mechanism and a medium of exchange within the platform.
              </p>
              <div className="not-prose my-6 bg-muted/50 rounded-xl p-6 space-y-4">
                <div className="flex justify-between items-center border-b border-border pb-3">
                  <span className="text-sm font-medium text-muted-foreground">Token Name</span>
                  <span className="font-semibold text-foreground">Trash2Pay (T2P Units)</span>
                </div>
                <div className="flex justify-between items-center border-b border-border pb-3">
                  <span className="text-sm font-medium text-muted-foreground">Blockchain</span>
                  <span className="font-semibold text-foreground">BSV (Bitcoin SV)</span>
                </div>
                <div className="flex justify-between items-center border-b border-border pb-3">
                  <span className="text-sm font-medium text-muted-foreground">Earn Rate</span>
                  <span className="font-semibold text-foreground">Dynamic (based on waste type & weight)</span>
                </div>
                <div className="flex justify-between items-center border-b border-border pb-3">
                  <span className="text-sm font-medium text-muted-foreground">Redemption</span>
                  <span className="font-semibold text-foreground">SAT, BSV</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">Exchange Rate</span>
                  <span className="font-semibold text-foreground">Dynamic (market-driven)</span>
                </div>
              </div>
              <p>
                T2P Units are earned through verified waste disposal and can be purchased with BSV, USDT or Solana via 
                Nigerian Naira through Paystack integration. The dynamic exchange rate ensures the
                token value reflects real market conditions.
              </p>
            </Section>

            {/* Architecture */}
            <Section id="architecture" icon={<Shield className="w-5 h-5" />} title="5. Technical Architecture">
              <p>
                Trash2Pay is built on a modern, scalable architecture:
              </p>
              <ul>
                <li><strong>Frontend</strong> — React 18 + TypeScript SPA with Tailwind CSS, optimized for mobile-first usage in the field.</li>
                <li><strong>Backend</strong> — Supabase for authentication, database, and serverless edge functions.</li>
                <li><strong>Blockchain</strong> — BSV for immutable transaction records, token issuance, and wallet integration (HandCash, ElectrumSV).</li>
                <li><strong>Payments</strong> — Paystack for fiat on-ramp (NGN), with BSV/SAT off-ramp for token redemption.</li>
                <li><strong>Verification</strong> — Cryptographically signed QR codes with HMAC-SHA256 preventing forgery and replay attacks.</li>
              </ul>
            </Section>

            {/* Roles */}
            <Section id="roles" icon={<Users className="w-5 h-5" />} title="6. Ecosystem Roles">
              <div className="not-prose my-6 space-y-4">
                <RoleCard
                  role="User (Waste Generator)"
                  description="Individuals or households who dispose of waste. They receive a unique QR code for their bin, earn T2P Units for verified disposals, and can redeem tokens for currency."
                />
                <RoleCard
                  role="Collector"
                  description="Waste collection agents who scan user QR codes to verify pickups, transport waste to processing facilities, and earn T2P tokens for completed collections."
                />
                <RoleCard
                  role="Processor"
                  description="Recycling plants and waste processing facilities that receive collected waste, process and recycle materials, and pay collectors via the platform."
                />
                <RoleCard
                  role="Admin"
                  description="Platform administrators who manage the platform, oversee dispute resolution, and maintain system integrity."
                />
              </div>
            </Section>

            {/* QR Verification */}
            <Section id="qr-verification" icon={<Shield className="w-5 h-5" />} title="7. QR Verification System">
              <p>
                Each user receives a unique, cryptographically secured QR code that serves as
                proof of waste disposal. The system prevents fraud through multiple layers:
              </p>
              <ul>
                <li><strong>HMAC-SHA256 Signing</strong> — QR tokens are signed with a server-side secret, preventing forgery.</li>
                <li><strong>User Binding</strong> — Each QR code is bound to a specific user ID and cannot be transferred.</li>
                <li><strong>Revocation</strong> — Lost or stolen QR codes can be instantly deactivated and replaced.</li>
                <li><strong>Scan Logging</strong> — Every scan attempt (successful or failed) is logged with timestamp and location.</li>
                <li><strong>Rate Limiting</strong> — Prevents rapid-fire scanning abuse.</li>
              </ul>
            </Section>

            {/* Payments */}
            <Section id="payments" icon={<BarChart3 className="w-5 h-5" />} title="8. Payment & Redemption Flow">
              <p>
                The multi-currency payment system supports the full lifecycle of value in the ecosystem:
              </p>
              <div className="not-prose my-6 space-y-3">
                <FlowStep step="1" title="Fiat On-Ramp" description="Users purchase T2P tokens with NGN via Paystack popup checkout." />
                <FlowStep step="2" title="Token Distribution" description="Verified waste disposals automatically credit T2P Units to user and collector balances." />
                <FlowStep step="3" title="Redemption" description="T2P Units can be redeemed for SAT or BSV at dynamic exchange rates." />
                <FlowStep step="4" title="Settlement" description="Crypto redemptions are processed and sent to the user's connected BSV wallet." />
              </div>
            </Section>

            {/* Roadmap */}
            <Section id="roadmap" icon={<BarChart3 className="w-5 h-5" />} title="9. Roadmap">
               <div className="not-prose my-6 space-y-4">
                  <RoadmapItem 
                  phase="Phase 1 — MVP" 
                  status="In Progress" 
                    items={[
                  "User & collector onboarding", 
                  "Pickup requests and payments", 
                  "Proof-of-pickup verification"
                     ]} 
                />
            <RoadmapItem 
                phase="Phase 2 — Incentives & Marketplace" 
                status="Planned" 
                items={[
                "T2P Units launch", 
                "Collector bidding system", 
                "Reputation scoring"
                     ]} 
                />
            <RoadmapItem 
               phase="Phase 3 — Scale & Integration" 
               status="Planned" 
               items={[
               "Municipal partnerships", 
               "Recycling traceability", 
               "Advanced analytics dashboards"
                      ]} 
               />
             </div>
            </Section>

            {/* Conclusion */}
            <Section id="conclusion" icon={<Leaf className="w-5 h-5" />} title="10. Conclusion">
              <p>
                Trash2Pay represents a paradigm shift in waste management — transforming an environmental
                burden into an economic opportunity. By combining blockchain transparency, cryptographic
                verification, and financial incentives, we create a self-sustaining ecosystem where
                doing good for the planet is also good for your wallet.
              </p>
              <p>
                Join us in building a cleaner, more sustainable future — one verified disposal at a time.
              </p>
              <div className="not-prose mt-8 flex flex-col sm:flex-row gap-4">
                <Button asChild className="gradient-eco border-0 hover:opacity-90">
                  <Link to="/select-role">Get Started</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/">Back to Home</Link>
                </Button>
              </div>
            </Section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            © 2026 Trash2Pay. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

/* Sub-components */

const Section = ({ id, icon, title, children }: { id: string; icon: React.ReactNode; title: string; children: React.ReactNode }) => (
  <section id={id} className="scroll-mt-28">
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">{icon}</div>
      <h2 className="text-2xl md:text-3xl font-bold text-foreground">{title}</h2>
    </div>
    <div className="space-y-4 text-muted-foreground leading-relaxed">{children}</div>
  </section>
);

const PillarCard = ({ title, description }: { title: string; description: string }) => (
  <div className="bg-card rounded-xl border border-border p-5">
    <h3 className="font-bold text-foreground mb-2">{title}</h3>
    <p className="text-sm text-muted-foreground">{description}</p>
  </div>
);

const RoleCard = ({ role, description }: { role: string; description: string }) => (
  <div className="bg-card rounded-xl border border-border p-5">
    <h3 className="font-semibold text-foreground mb-1">{role}</h3>
    <p className="text-sm text-muted-foreground">{description}</p>
  </div>
);

const FlowStep = ({ step, title, description }: { step: string; title: string; description: string }) => (
  <div className="flex items-start gap-4 bg-card rounded-xl border border-border p-4">
    <div className="w-8 h-8 rounded-full gradient-eco flex items-center justify-center text-primary-foreground text-sm font-bold shrink-0">{step}</div>
    <div>
      <h4 className="font-semibold text-foreground">{title}</h4>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  </div>
);

const RoadmapItem = ({ phase, status, items }: { phase: string; status: string; items: string[] }) => (
  <div className="bg-card rounded-xl border border-border p-5">
    <div className="flex items-center justify-between mb-3">
      <h3 className="font-semibold text-foreground">{phase}</h3>
      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${status === "Complete" ? "bg-primary/10 text-primary" : status === "In Progress" ? "bg-accent/20 text-accent-foreground" : "bg-muted text-muted-foreground"}`}>
        {status}
      </span>
    </div>
    <ul className="space-y-1">
      {items.map((item, i) => (
        <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-primary/50" />
          {item}
        </li>
      ))}
    </ul>
  </div>
);

export default Whitepaper;
