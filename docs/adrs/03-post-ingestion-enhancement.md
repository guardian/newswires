# ADR 03: Post-ingestion enhancement of wire items

## Context

One advantage of having our own persistent storage for wire items (see [ADR 01](./01-newswires-overview.md)) is that it gives us more opportunities to enhance the metadata that's available for a given wire item. Example use-cases include:

- Mapping Fingerpost's 'source feed' field [to our 'supplier' field](https://github.com/guardian/newswires/blob/2c9a5e2c735f4455195b8d2fdd290bb18a89e6ca/ingestion-lambda/src/processContentObject.ts#L254)
- Inferring whether a story is pertinent to the UK desk (https://github.com/guardian/newswires/pull/235)
- Adding a TS vector index to enable better full text search

Any such enhancement needs to either:

1. block the story from being initially persisted in our database, or
2. take place in a non-blocking way, either asynchronously or triggered after ingestion

## Options

### Enhancement blocks ingestion

If enhancement steps block ingestion, then it follows that ingestion will be delayed by the amount of time it takes to run enhancements. Not all stories are consumed 'live', but our user research has shown clearly that users sometimes monitor the wires from moment to moment to receive new updates on a story which might affect the filing of a story to the site/app. It is therefore important to minimise the amount of blocking in our ingestion pipeline as a whole, including enhancement.

### Asynchronous or post-ingestion enhancement

If we apply enhancements asynchronously, or post-ingestion, we can spend more time on the computation without blocking ingestion. A possible example would be running more complex natural language processing to supplement our categorisation of stories.

Post-ingestion enhancement introduces a significant complication, however. Imagine that the enhancement of a story S affects how S is categorised by preset or user-defined filters. On ingestion at time T1, it fits the criteria for preset P1, and then some time later at T2 an enhancement is added which means it also fits the criteria for P2. Now imagine that users are watching feeds of P1 and P2.

The user who has P1 open from T0 to T2 will see story S show up just after T1.

What about the user who has P2 open?

a. We could just say they don't get to see it in their feed, although it will naturally show if they freshly load P2 after T2, but this seems like poor service.
b. We could load S into their feed at T2, but then where should we place it in their feed?
i. At the top, in which case it will potentially be out of chronological order with other items (sorted by ingestion time).
ii. In its chronological place, in which case it might not be at the top of the list, or even visible in the user's viewport at the time it loads.

Neither (b.i) nor (b.ii) feels ideal, and either option would also introduce a difference between the experience of P1 and P2 which would be impossible for end-users to diagnose.

## Decision

We have decided not to do asynchronous or post-ingestion enhancements of wire items if the enhancement concerns attributes which we use for constructing live feeds. Given that, as per [the ADR on Filter and Search](./02-filter-and-search.md), we are aiming to model everything via the idea of a unified filter/search view presented to the user, this effectively means that we aren't doing asynchronous enhancement at the moment. However, there's no reason in principle why we couldn't add asynchronous enhancement in the future if we add other discovery/browsing features ('trending topics' might be a good example).

At the same time, we also want to limit the amount of pre-ingestion enhancement that we're doing, because it blocks ingestion. As things stand, this is left to judgement rather than firm rules, as we don't have an SLO governing time to ingestion.
