# Win Probability Visualizer

See it in action here: [https://kennyjackelen.com/winprob](https://kennyjackelen.com/winprob)

## Problems and Goals
There's no shortage of win probability calculators online, but they generally just provide a single value. I wanted to build something that could provide some additional context.

One opportunity that stood out to me was to go beyond a binary "will they win or will they lose" probability, and compute probabilities for outcomes more granular than that. How likely is it that the home team wins by one run? How likely is the game to become a blowout? It would be interesting to watch the shape of that distribution change as the game progressed.

## Methodology
### Building the Database
I started by pulling play-by-play data from MLB's Stats API for the 2017 and worked backwards from there. Ultimately I included 2015 through 2017, for two reasons:
1. While pulling data for 2014, I encountered a lot of games whose play-by-play data was formatted differently (particularly that the plays were not in order), so I would need to update my script to handle those.
1. Major League Baseball has seen quite a shift in recent years, particularly an increase in the incidence of home runs and strikeouts, so it seemed like 2015 was a good enough place to stop anyway if I want the probabilities reported by my tool to be meaningful for games in 2018.
I took the play-by-play data and put it in a PouchDB database. There is one document per individual game state encountered form 2015 to 2017, indexed strategically for easy retrieval of all instances of a game state. For example, a simple query could pull all times the bases were loaded with no outs in the bottom of the fifth inning of a tie game.

## Computing a Naïve Win Probability and Score Distribution
I began with a naïve approach for computing the win probability:
1. Query the database for all instances of the specified game state
1. Count how many times the home team won the game in question
1. Divide that by the total number of documents retrieved from the database

Similarly for the score distribution, I queried the database and counted how many times each run margin occurred.

This is okay, but over a relatively short period of time like the three seasons I was using, this can produce a lot of small samples. This became especially apparent when visualizing the score distributions, because there is a lot of choppiness along the curve.

## Refining the Win Probability and Score Distribution
To start with an (admittedly simple) example, let's assume the following:
- We want to compute the win probability for the situation where the bases are loaded with two outs in the bottom of the fifth inning of a tie game
- Within our sample of games, half the time this situation occurred, the batter homered.  The other half of the time, the batter struck out.
- We know the win probability for the two resultant states. (Don't worry about the specific numbers here.)
  - After the home run (clearing the bases and putting the home team up four), the home team's win probability is 0.9.
  - After the strikeout (ending the inning with the game tied), the home team's win probability is 0.5.

From these assumptions, what can we say about the win probability of our initial situation? Using some (still pretty naïve) Bayesian inference, we can say that the home team's win probability there is 0.5 * 0.9 + 0.5 * 0.5 = 0.7.

Expanding on this idea, I wrote a new function to compute win probability using the data I had gathered. The new function would:
1. Query the database for all instances of the specified game state
1. For each instance found, query the database to find which game state followed this one. Counting up the incidence of the subsequent game states and dividing by the number of instances found above provides us with probabilities of which game state follows.
1. For each subsequent game state, calculate the win probability.
1. Use Bayesian inference as described above to calculate the win probability for the original game state.

For performance's sake, I've limited the depth of the recursion to ten.
