# ADR 04: Precomputation of search presets

## Context

As described in the ADR on [Filter and Search](./02-filter-and-search.md), all views in Newswires will initially be implemented via a single combined search/filter mechanism. We are using Postgres for storage, which supports combining e.g. category code conditions and full text search in a single query.

In order to create a more familiar and easily adoptable experience for users, we plan to recreate many of the lists/feeds that were provided by the Fingerpost UI (e.g. 'UK News', 'Cricket scores'). Under the hood, these will be saved searches which can be combined with other user-defined filters and search terms. We've sometimes referred to these internally as 'buckets', but in the UI we've gone for 'presets'.

The searches underlying the familiar presets are often very complex (as they were in the Fingerpost implementation) because different agencies provide different metadata and none of them map precisely onto the categories our users are interested in. As an example, we might need to add inclusions and exclusions based on category code and 'slug' text. For example, in order to differentiate Rugby League from Rugby Union, and to differentiate rugby _stories_ from rugby _results_, we need to look for `"RUGBYL" / "RUGBYU" / "RUGBY UNION"` in the slug, and exclude any of a number of category codes which are applied to results only:

```
"paCat:RRG",
"paCat:RRE",
"paCat:RRI",
"paCat:RRL",
"paCat:RRF",
"paCat:RRU",
"paCat:RDJ",
"paCat:SDF",
"paCat:SDT",
"paCat:SFU",
"paCat:STE",
"paCat:SSD",
"paCat:STF",
"paCat:SSF"
```

Conditions are also typically different for each agency within a preset. So preset queries can get very complex. Postgres supports these complex queries, but running them at request time can be relatively slow (generally still <1s, but in some cases it can be multiple seconds to retrieve only one page of results).

We started off by implementing the presets in the SQL queries that we run in response to each user request, but at various points we have noticed slowness and considered options for some kind of precomputation. It's worth noting that it's in the initial load that we tend to see slower performance; querying for updates once the initial page has loaded tends to perform fine because we're looking for 'stories since (recent) time T' at that point.

## Options

### Materialised view

Postgres allows for the creation of 'materialised views', which are essentially the cached outputs of queries, which can in turn be used in further queries. Creating a materialised view of a preset and then searching/filtering within it would work for our use-case on a logical level. It is also very likely to improve performance.

The drawback here is that the data in the materialised view will become stale after creation until it's refreshed. Users will often be watching a feed 'live' to monitor for updates, so we want to minimise the chance of serving stale data or introducing a lag between ingestion and visibility of a story.[^1] Importantly, while initial page load could be sped up using an MV, any delay due to staleness would affect update queries as well as initial queries.

We'd also potentially have the problem that a story might show up in multiple presets, but at different times depending on the refresh schedule for the relevant MV. It's possible that these problems with an MV are solveable with the right structure and refresh conditions, but from our understanding it is not trivial to balance performance and staleness using an MV when there are regular writes.

### Precompute preset membership and persist it in the database

For each preset we have accumulated a set of conditions for membership, based on data which is available at ingestion time. Given this, we could compute which preset(s) a given story belongs to at ingestion time, and persist this in the database, e.g. via a many-to-many relation table:

| item_id (fk to item.id) | preset_id (fk to preset table.id) |
| ----------------------- | --------------------------------- |
| 1                       | 1                                 |
| 1                       | 5                                 |
| 2                       | 5                                 |

This would make the SQL query to fetch items belonging to a given preset much more straightforward, e.g.:

```sql
SELECT i.headline
FROM item i
JOIN item_presets ip ON ip.item_id = i.id
WHERE ip.preset_id = $1
ORDER BY i.first_created DESC
LIMIT 100;
```

There are good reasons to think that this would be quicker to execute at query time than the complex queries we currently have. If it worked as expected, then it would also unlock the possibility of combining presets in a given user query (e.g. 'all sports stories that aren't in the cricket presets').

### Keep the preset logic in the SQL query

Currently, we have most of our preset logic in the SQL queries. Executing these at query time can be slower, but it does provide benefits.

The main benefits are:

1. SQL provides a robust, declarative paradigm for expressing inclusion and exclusion criteria.
2. Changes in the query can be tested immediately, across the corpus of existing ingested stories. This makes it easier to iterate on preset criteria and compare with `main` across a large sample.
3. If we fix a problem with a preset definition (e.g. American tennis scores showing up in UK News), it will automatically be applied retrospectively to items that have already been ingested, without us needing to go back and edit existing database entries.

## Decision

While there are some performance issues with defining the presets via SQL, it has the big advantage of being, as it were, 'stateless' in the sense of points (2) and (3) in the section above. This means that changes to the preset definitions can be tested and applied easily and safely, without the mutation of any stored data.

Whilst there's still a need to iterate on the definition of the presets, it makes sense to apply the logic largely at query time. We can still take advantage of precomputation [for some preset-relevant conditions](https://github.com/guardian/newswires/pull/496) as and when we need to for performance reasons.

The balance between flexibility and performance might change over time. If it does, then precomputation seems like the best fit, although we should be conscious that translating the declarative SQL definitions into a logically equivalent decision method in the ingestion code is unlikely to be trivial.

<!-- footnotes -->

[^1]: See ADR on [post-ingestment enhancement](03-post-ingestion-enhancement.md) for more on this.
