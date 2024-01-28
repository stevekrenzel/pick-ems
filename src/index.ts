import { closeBrowser } from "./utils";
import { predictWinner } from "./tools";
import { MatchRepo } from "./repos";

(async () => {
  // Get all of the game matches for this week
  const matches = await new MatchRepo().list();
  const winners = await Promise.all(matches.map(predictWinner));

  // Print out each match and winner
  matches.forEach((match, i) => {
    console.log(`${match.away} vs. ${match.home}: ${winners[i]}`);
  });

  // Close up shop
  await closeBrowser();
})();
