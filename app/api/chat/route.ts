import { streamText } from "ai"
import { openai } from "@ai-sdk/openai"
import type { NextRequest } from "next/server"

// Website knowledge base - comprehensive information about HOLLOWVOX and The Hollow
const WEBSITE_KNOWLEDGE = `
# HOLLOWVOX & The Hollow - Complete Knowledge Base

## Overview
HOLLOWVOX is an Action Token built on the Stellar blockchain that powers The Hollow - a digital sanctuary for Hollowers (token holders). It's part of the ACTIONverse ecosystem created by Action Tokens.

## Key Facts
- **Token Name**: HOLLOWVOX (HVX)
- **Blockchain**: Stellar
- **Type**: Action Token (purpose-driven cryptocurrency)
- **Creator**: Jose Urquiza / Action Tokens
- **Launch**: 2021
- **Website**: The Hollow (HOLLOWVOX HQ)

## Token Details
- **Asset Code**: HOLLOWVOX
- **Recognized Issuers**:
  - HVX-1: GBPC4LULQFYZ3C5UD4C7ALAYIOXZ3L7I77XBTXQ7PLSUOXQUUZAVLMAX (green #00ff76)
  - HVX-2: GAUDPOA3YKO35IWSA4CMQPKE3MQSK53RPNFWTTP7UCP7QYTMSMEIEJLF (orange #ff6b00)
- **Trading**: Available on Stellar DEX, BandCoin, Lu.Meme
- **Liquidity Pool**: XLM/HOLLOWVOX pool available

## Hollower Tiers
Token holders are called "Hollowers" and have different tier levels:
- **Tier 1**: 50,000,000+ HOLLOWVOX tokens (Void Walker - Highest tier)
- **Tier 2**: 10,000,000+ HOLLOWVOX tokens (Deep Hollower - Medium tier)
- **Tier 3**: 1,000,000+ HOLLOWVOX tokens (Hollower - Entry tier)

Higher tiers unlock exclusive rewards, experiences, and voting power.

## Action Token Commitment (20% Total)
HOLLOWVOX commits 20% of all profits to good causes:

### $ACTION Fund (10%)
- 10% of profits used to purchase $ACTION tokens
- $ACTION tokens distributed through community giveaways
- Supports the broader ACTIONverse ecosystem
- Community votes on distribution methods

### Impact Fund (10%) 
- 10% of profits donated to charitable causes
- Community votes monthly on recipient organizations
- Focus areas: youth programs, mental health, animal rescue, disaster relief
- Transparent reporting on all donations

## The Hollow Features

### Balance Checker
- Enter any Stellar public key to check HOLLOWVOX holdings
- Shows token balances from all recognized issuers
- Displays Hollower tier status
- Works for any wallet address, not just connected wallets

### Token Performance Tracker
- Real-time price data from Stellar network
- Historical trading data and charts
- Volume tracking across both token issuers
- StellarExpert widget integration
- Live market data from DEX trades

### Profit Tracker
- Tracks revenue from monitored wallets
- Shows real-time profit calculations
- Displays $ACTION Fund and Impact Fund allocations
- Monitors liquidity pool contributions
- Live streaming of new transactions
- Transparent breakdown of all trading activity

### Rewards System
- Digital, physical, and real-world asset (RWA) rewards
- Tier-gated access based on token holdings
- Exclusive experiences for higher-tier Hollowers
- Booking access to community assets
- Currently in development

### Monthly Raffle
- Free entry for everyone (no purchase required)
- Additional entries based on token holdings (1 entry per 1M tokens)
- Prizes include merchandise, NFTs, and digital art
- Legal compliance with "no purchase necessary" rules
- Monthly drawings with transparent winner selection

### Wallet Integration
- Stellar wallet support (Freighter, Albedo planned)
- Non-custodial connection
- Real-time balance and tier verification
- Currently in development phase

## Lore & Background
HOLLOWVOX has a rich backstory based on true events:

### Chapter 1: The Spark (2021)
- Created by Jose Urquiza during a shifting world
- Born from Action Tokens platform concept
- Mission: verify and reward real-world actions using blockchain
- Started in Midwest studio, grew into movement

### Chapter 2: Enter HOLLOWVOX
- Emerged as symbolic force during Action Tokens development
- Minted on Stellar, later expanded to BandCoin and Lu.Meme
- Represents voice for those feeling unseen
- Digital identity for people with something real to say

### Chapter 3: The Awakening
- Community growth led to infrastructure development
- Integration with BandTogether and ActionTokens platforms
- Utilities added, wallets became access keys
- Real value creation for builders, fans, and creatives

### Chapter 4: A New Kind of Token
- Prototype for Action Token concept
- Monthly profit commitment to causes
- Community-driven decision making
- Tool for collective direction and shared intention

### Chapter 5: The Hollowers Rise
- Active community participation
- Living network of action-minded people
- Each transaction adds to growing ecosystem
- Commitment to making digital world more real

## Technical Infrastructure

### Stellar Integration
- Built on Stellar blockchain for fast, low-cost transactions
- Multiple token issuers for redundancy and growth
- DEX integration for trading
- Liquidity pool participation

### Real-time Data
- Live transaction monitoring
- Streaming updates for new trades
- Automatic profit calculations
- Transparent fund allocations

### Security & Privacy
- Non-custodial wallet connections
- Privacy-first approach
- Minimal data collection
- User-controlled access

## Legal & Compliance

### Terms of Use
- HOLLOWVOX is utility token, not investment security
- No ownership rights or profit sharing
- Access-based utility for features and experiences
- Real-world asset access subject to availability
- User responsibility for wallet security

### Privacy Policy
- Privacy-first, non-custodial design
- Minimal data collection
- Public blockchain data only
- Optional info for physical rewards/bookings
- No private key storage ever

### Raffle Compliance
- No purchase necessary to enter or win
- Free email entry available to all
- Additional entries for token holders
- Legal compliance across jurisdictions
- Transparent winner selection

## Community & Governance

### Voting System
- Monthly community votes on fund distributions
- Token holder participation in decisions
- Transparent proposal and voting process
- Democratic allocation of charitable funds

### Communication
- Contact: jose@action-tokens.com
- Social media presence
- Community-driven discussions
- Regular updates and transparency reports

## Future Development

### Planned Features
- Full wallet integration (Freighter, Albedo)
- Enhanced rewards system
- Expanded RWA access
- Advanced governance features
- Mobile app development

### Roadmap
- Q1 2025: Wallet integration completion
- Ongoing: Monthly raffle and fund distributions
- Continuous: Community growth and engagement
- Future: Expanded ACTIONverse integration

## Getting Started

### For New Users
1. Learn about HOLLOWVOX and Action Tokens
2. Use Balance Checker to explore token holdings
3. Follow lore and community updates
4. Participate in monthly raffles
5. Consider acquiring tokens for tier benefits

### For Token Holders
1. Connect wallet when available
2. Check tier status and available rewards
3. Participate in monthly voting
4. Engage with community decisions
5. Access exclusive Hollower benefits

### For Developers
- Built with Next.js and Stellar SDK
- Open to community contributions
- Integration opportunities available
- Contact for custom experiences

This knowledge base covers all aspects of HOLLOWVOX, The Hollow, and the broader ecosystem. The project represents a new model for purpose-driven cryptocurrency that combines community governance, charitable giving, and real utility.
`

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()

    const result = await streamText({
      model: openai("gpt-4o"),
      system: `You are the official HOLLOWVOX AI assistant for The Hollow website. You have comprehensive knowledge about HOLLOWVOX tokens, The Hollow platform, Action Tokens, and everything related to the ecosystem.

Key guidelines:
- Be helpful, friendly, and knowledgeable about all HOLLOWVOX/The Hollow topics
- Use the provided knowledge base to answer questions accurately
- If asked about features "coming soon" or "in development", acknowledge this and provide context
- For wallet connection questions, mention it's currently in development
- For specific token prices, direct users to the live charts on the site
- For balance checks, direct users to the Balance Checker tool
- Be enthusiastic about the Action Token mission and community impact
- Use emojis occasionally to be friendly but remain professional
- If you don't know something specific, be honest and suggest contacting jose@action-tokens.com

IMPORTANT BUG REPORTING:
- If a user mentions "bug", "error", "broken", "not working", "issue", "problem", "report", or similar terms related to technical issues, respond with: "I'll help you report this bug! Let me show you the bug report form so you can provide details about the issue you're experiencing."
- When you detect bug reporting intent, your response should trigger the bug report form to appear
- Be supportive and encouraging when users want to report issues
- Thank them for helping improve the platform

Knowledge Base:
${WEBSITE_KNOWLEDGE}

Remember: You represent the HOLLOWVOX community and should embody the values of transparency, community-driven decision making, and positive impact.`,
      messages,
      temperature: 0.7,
      maxTokens: 1000,
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error("Chat API error:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}
