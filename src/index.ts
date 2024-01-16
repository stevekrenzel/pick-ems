import { closeBrowser } from "./utils";
import { predictWinner } from "./tools";
import { MatchRepo } from "./repos";

(async () => {
  // Get all of the game matches for this week
  const matches = await new MatchRepo().list();

  // Predict the winner of each match
  for (const match of matches) {
    const winner = await predictWinner(match);
    console.log(`${match.away} vs. ${match.home}: ${winner}`);
  }

  // Close up shop
  await closeBrowser();
})();
