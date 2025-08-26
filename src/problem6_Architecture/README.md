## Leaderboard Architecture Analysis

This document outlines different architectural approaches for a quiz app leaderboard, based on the required update frequency and real-time needs.

### Update Frequency Considerations

*   **> 5 minutes:** For scoreboards that update infrequently (e.g., every 5 minutes or more), a simple client-side polling mechanism is sufficient.
*   **< 1 minute:** If updates are needed more frequently (e.g., under a minute), a combination of Redis Pub/Sub and Server-Sent Events (SSE) provides an efficient solution.
*   **~5 seconds:** For near real-time updates (e.g., every 5 seconds), a more complex architecture involving event streaming and WebSockets is recommended to handle the high volume of data and connections.

### Proposed Architecture

For our application, we will adopt the Redis Pub/Sub and SSE architecture. This approach offers a good balance between simplicity and real-time capability.

For more details, see the [project Baseline-Architecture.md](./Baseline-Architecture.md).

## Real-World Application: Community Chess Project

While the above analysis covers theoretical approaches, I have practical experience implementing a real-time leaderboard system for **Cotulenh** (https://github.com/mnoyd/cotulenh-monorepo), a community chess-like game project. This implementation addresses two critical challenges that relate directly to the assignment requirements:

### Challenge 1: Action Verification in Distributed Systems

**Problem:** How do you validate player actions (chess moves) without expensive server-side computation while preventing cheating?

**Solution Implemented:**
- **Client-side move generation:** Players calculate legal moves locally, reducing server computational load
- **Peer validation system:** When Player A submits a move to Firebase, Player B's client independently validates the move legality
- **Community-driven security:** Invalid moves can be reported to auditors via Discord bot integration
- **Audit trail:** Complete game history maintained for investigation

This approach parallels the assignment's action verification requirements (similar to the `/v1/actions/start` and `/v1/actions/complete` endpoints in the typical REST implementation) but distributes the validation workload.

### Challenge 2: Efficient Leaderboard Updates

**Problem:** How do you maintain real-time leaderboard updates while controlling costs for a community project?

**Solution Implemented:**
- **Immediate ELO updates:** Cloud function triggers immediately when games complete without malicious actions, updating individual player ratings
- **Periodic leaderboard recalculation:** Separate scheduled cloud function runs every 10 minutes to sort/rank all players and update the leaderboard display
- **Two-phase update strategy:** Player scores update in real-time, but leaderboard rankings refresh periodically

This directly relates to the assignment's leaderboard update frequency considerations, demonstrating practical implementation of the "< 1 minute" category using Firebase real-time database instead of Redis Pub/Sub + SSE.

### Architecture Benefits for Early-Stage Development

**Cost Optimization:**
- **Client-side computation:** Eliminates expensive server-side move validation during gameplay
- **Immediate ELO updates:** Cloud functions trigger only when games complete (~144 daily vs thousands)
- **Periodic leaderboard sorting:** Batch processing every 10 minutes reduces computational overhead
- **Flat-rate deep analysis:** Weekly EC2/Google Compute Engine instance for comprehensive game analysis
- **Firebase real-time database:** Efficient notification system without custom WebSocket management

**Development Efficiency:**
- Game logic changes require only client updates, not server deployments
- Distributed validation naturally scales with user base
- Minimal backend infrastructure allows focus on core game features
- Separation of real-time operations from batch analytics

**Security & Analytics Model:**
- **Real-time peer validation:** Immediate cheat detection during gameplay
- **Community oversight:** Discord integration for dispute resolution
- **Weekly deep analysis:** Flat-rate compute instance performs comprehensive validation by:
  - Replaying complete game states to verify move legality
  - Detecting sophisticated cheating patterns missed in real-time
  - Analyzing trending openings and gameplay patterns for community insights
- **Cost-efficient intensive computation:** Computing-heavy tasks (legal move generation, game state analysis) relegated to predictable flat-rate infrastructure

**Multi-Layered Validation Strategy:**
1. **Real-time layer:** Peer validation catches obvious cheating immediately
2. **Periodic layer:** Leaderboard recalculation maintains ranking accuracy
3. **Deep analysis layer:** Weekly comprehensive validation ensures long-term integrity

This implementation demonstrates how the theoretical approaches discussed above can be adapted for resource-constrained community projects while maintaining security and real-time capabilities. The three-tier architecture (real-time, periodic, deep analysis) reflects practical trade-offs between immediate responsiveness, cost efficiency, and comprehensive security that are directly relevant to the assignment's architectural considerations.