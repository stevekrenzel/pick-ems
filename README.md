# :football: Pick-Em's LLM Bot

This is an LLM agent built on top of OpenAI that predicts winners for [ESPN's
Pick-Em's game](https://fantasy.espn.com/games/nfl-pigskin-pickem-2023).

## How Does It Work?

At a high-level, the agent crawls a bunch of statistics and news articles on
ESPN's website. For each match in a given week it will feed the LLM
stats and news relevant to that match and have it predict a winner.

The data retrieval is done by scraping ESPN pages (built using
[Playwright](https://playwright.dev/)).

The data analysis is done by the LLM.

The general division here is that anything that can be done more-or-less
deterministically in code, we should do in code. And fallback to the LLM for
very specific tasks that are fuzzy, non-deterministic, and don't lend
themselves to code due to their ambiguous or difficult-to-code nature.

### Scrapers

The scrapers know how to retrieve:

- [The list of all NFL teams.](https://www.espn.com/nfl/teams)
- [The list of all matches for the week.](https://fantasy.espn.com/games/nfl-pigskin-pickem-2023/make-picks)
- [Offense, Defense, Turnover, and Special statistics for all teams.](https://www.espn.com/nfl/stats/team)
- [Headlines from the front page](https://www.espn.com/nfl/) and the content of the articles for those headlines.

## Agents

The agents know how to:

- **Analyze News**: Take a news article and extract:

  1. The primary team it is written about
  2. A summary of the article
  3. Whether it refers to the NFL, College, or Fantasy Football.

  We need that last bit because on ESPN's NFL site, a lot of articles get
  written about things that have nothing to do with the NFL regular season and
  we want to filter that content out prior to giving it to the LLM.

- **Predict a Winner**: Given offense, defense, special, and turnover stats
  along with any relevant news we could find (e.g. injuries), for any
  given match up we give the LLM the stats and news for the two teams, and
  have it analyze that data to make a prediction about who will win.

## Getting Started

To get started, you first need to clone the code and install your dependencies.

```sh
$ git clone git@github.com:stevekrenzel/pick-ems.git
$ npm install
```

And then **update the `.env` file to have a valid OpenAI API key**.

And then you can run the agent with:

```
$ npm run start
```

It may take several minutes to complete. It analyzes many articles and matches
and each call to the LLM may take upwards of ~30 seconds to complete. So be
patient.

## Architectural Patterns

There are a few key architectural patterns we use in this repo. One for data
retrieval, one for working with LLMs, and one for managing the flow of data
between the two.

### Data Access

Web scraping can be messy business, so we attempt to hide the browser from the
rest of our code as quickly as possible. The end goal is to basically access
the content from the various webpages the same way we would access data from
an API or a database. To that end, we use a [Data Mapper Pattern](https://en.wikipedia.org/wiki/Data_mapper_pattern)
where each kind of data (e.g. `Article`, `Match`, `Team`, etc...) has a `Repo`
and an `Entity`. The `Entity` contains all of the fields of data that we want
that domain object to have. The `Repo` is how we retrieve and access the data.

The `repos` are structured in such a way that if you just use the objects
without peeking behind the scenes, you'd have no idea that you weren't
querying a database of some sort (though, an admittedly slow database).

### Agents

Bridging the gap between nice well-defined data and fuzzy natural language can
be a bit tricky. To help address this, we rely on OpenAI's ability to call
[tools/functions](https://platform.openai.com/docs/guides/function-calling).
We don't actually care about the tool itself. We pass OpenAI exactly one tool,
force it to use that tool, and the only bit of the tool we care about are the
parameters of the tool. This is the data that we are seeking from the LLM. The
tool definition is just a means for us to provide OpenAI a nice
[JSONSchema](https://json-schema.org/) that will influence the shape of the
data the LLM returns to us.

Note: The LLM may return something that doesn't match our schema, but with
GPT-4 this is exceedingly uncommon (at least for our use case).

Each agent is broken up into 3 parts: `Prompt`, `Schema`, `Tool`.

- The `Prompt` instructs the LLM on what its task is and how it should
  achieve it.
- The `Schema` instructs the LLM on what data we expect it to return to us.
- The `Tool` retrieves any data the LLM might need for its task and calls
  the LLM with the prompt, data, and schema and wraps it all in a nice
  function that abstracts away the details. A user can call a tool just like
  any other function and they can be oblivious to the fact that the `string`
  or `boolean` they got back required the processing power of 1,000 remote
  GPUs.

#### Analysis and Conclusions

One other pattern we use, that may be non-obvious, is that we wrap the
`tool`'s schema in a parent schema that has a field called `analysis` and a
field called `conclusion`. The `conclusion` field isn't particularly notable
and simply maps to the `tool`'s schema. The `analysis` is the notable one
here. Importantly, The field is generated **first** by the LLM and is a way
for the LLM to "think" out loud and reference that thinking in the subsequent
generation of the data in the `conclusion`.

A lot of LLM techniques, like [Chain-of-Thought
(CoT)](https://en.wikipedia.org/wiki/Prompt_engineering#Chain-of-thought)
require that the LLM generates a sequence of tokens that it can then reference
on for its final answer. If your `Prompt` to the `Tool` asks the LLM to use
any strategy like this, and you don't give it a scratchpad of sorts to write
in, then it won't be able to use that pattern. So this `analysis` field is a
scratchpad that we offer to the LLM to write whatever it needs to before
answering our prompt.

tl;dr; If you ask the LLM to return `true` or `false`, and you instruct it to
think carefully about the choice beforehand, but you don't give it space to
do that thinking then it won't be able to and instead will just return a boolean
without thinking carefully about it.

**This pattern meaningfully improves the results of the payloads.**

### Model-View-Controller

Finally, we've got data retrieval and we've got agents, but how do we think about
the interplay between the two? We draw inspiration from the
[Model-View-Controller (MVC)](https://en.wikipedia.org/wiki/Model-view-controller) pattern.

In this case, our:

- `Models` map to `Repos`
- `Views` map to `Prompts`
- `Controllers` map to `Tools`

The `Tool` is the thing that coordinates retrieving data from the `Repos` and
then rendering that data into a `Prompt` prior to sending it to our "client", the
LLM.

The analogy is not perfect, and starts to stretch under scrutiny, but as a
rough guide on how to think about the division of labor between the
components, I find it useful.
