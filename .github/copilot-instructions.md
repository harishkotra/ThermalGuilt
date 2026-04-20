# Thermal Guilt Copilot Instructions

## Product context
Thermal Guilt is a competitive energy-efficiency dashboard. Keep tone playful but production-minded.

## Engineering constraints
- Shared scoring logic must live in `packages/shared`.
- API routes must use Express and keep endpoint shapes stable with the README.
- Preserve Auth0 scope model: `read:energy`, `read:neighborhood`, `write:thermostat`.
- Thermostat changes must return async CIBA-style approval state before mutating.
- Solana rewards follow fixed tiers from score.

## Code generation preferences
- Prefer small pure functions for score/z-score/reward logic.
- Use strict TypeScript and avoid `any`.
- For AI outputs, return structured JSON that can be rendered directly in UI cards.
- For frontend animations, favor Framer Motion variants instead of ad hoc inline keyframes when possible.

## Testing priorities
- Score boundary tests (49/50, 69/70, 84/85, 94/95)
- Z-score and shame-red threshold behavior (>2σ)
- API contract tests for `/api/energy/current`, `/api/ai/ghost-analysis`, `/api/solana/claim`
