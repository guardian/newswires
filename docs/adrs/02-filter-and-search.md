# ADR 02: Filtering and searching

## Context

The most common use case for the existing wires app that we're aware of is to monitor incoming stories on a given topic. This can be thought of as a 'feed' model, where the user is by default shown the most recent stories as they arrive, with the option to filter that feed in various ways.

There are also use-cases that are a bit more like searching an archive of content. For instance, a user might want to find a particular story that they remembered from earlier in the week, or to find all recent stories on a given topic.

## Options

### Specialised 'views' for each use-case

To support these two use-cases, one option is to have separate 'views' in the UI that are specialised to each. The typical 'feed' use-case doesn't involve detailed text searching on particular fields, for instance. And for the search use-case it can be helpful to treat the results of the search at a particular point in time as a fixed data set that we can provide more structure over (e.g. fixed pagination, overviews of how the results break down by supplier, tag, etc.)

Creating two specialised 'views' would allow us to tailor the experience to these two use-cases. This is also how the experience is presented in the existing Fingerpost UI that most users will be familiar with.

### A single 'view', balancing the two

Alternatively, we can try to combine filtering and searching in a single user-facing view.

## Decision

We will aim to preserve a single 'view' in the UI as much as possible, until the point where we feel that there is a compelling and well-understood use-case that can't be effectively served by this approach.

We believe that there is no fundamental need to distinguish at the level of data modelling between filtering and searching, for the wires data. We can present an automatically updating 'feed' of results even if the user is applying complex custom filters via text search, for example. If a user wants to view a fixed set of results, we can support this by allowing them to turn off auto-update in the UI, and/or setting a fixed 'end' date as one of the filter/search parameters.

This approach may initially be less familiar to users, given that they are used to more of a separation between feed lists on the one hand, and searches on the other. However we believe that there is value for users in us adopting a UX that is more closely aligned with the underlying data model. This is because from discussion with users we have seen the need for complex custom feeds, and softening the distinction between search and feeds will help empower users to curate these feeds for themselves.

This decision also reduces the complexity of trying to maintain two specialised views, which is likely to require two sets of back- and front-end code that are parallel but subtly different, increasing cognitive complexity and maintenance burden in the future.
