# ADR 01: Newswires service overview

_nb. This ADR was written after the fact. It aims to capture the decision as we made it in ~September 2024._

## Context

'Wires' are feeds of data from a range of news agencies, and they are used in a range of different areas of production at The Guardian.

Most agencies provide a UI for interacting with their own feeds, but for a long time we've also used a service from Fingerpost that aggregates and standardises feeds from different sources, as well as providing integrations with some of our internal tooling (e.g. providing the ability to send copy to InCopy or Composer from the wires UI). The [most recent incarnation of our Fingerpost service](https://github.com/guardian/editorial-wires/) is hosted in our AWS estate.

We've received an increasing number of feature requests from users in recent years, for example relating to the searching and filtering functionality provided by the UI.

## Options

### Work with Fingerpost to make changes

The server and client code for the existing service is managed by Fingerpost, but we could potentially work with them to implement changes. This has been done before, but the bar for making changes ourselves is fairly high given the large codebase and unfamiliar technology and patterns used in it. Our budget for change requests to Fingerpost themselves is limited, and our dependency on this 3rd party would deepen if we weren't involved in implementing changes ourselves.

### Create a whole new service

We typically have contracts directly with the news agencies themselves, and they generally expose APIs that we could access, in order to create our own wires aggregator entirely independently of Fingerpost. In many respects this is a familiar sort of service for P&E to create and support. However, there are a number of points in the existing service where Fingerpost provide real value over and above aggregating feeds. In particular, the service encodes a lot of domain-specific knowledge about how different providers operate and Fingerpost also provide integrations which transform agency data feeds into Guardian-specific print templates. It would take a lot of investment for us to recreate all of this work.

### Consume a data feed from Fingerpost, and write our own storage + UI layer

In discussion with Fingerpost, they have said that they could provide an aggregated feed of different agencies, along with Guardian-specific pre-processing where relevant, via an SNS topic or similar. If we consume this feed, we could persist the data in our own storage and write our own UI on top of this. This would allow us to address some of the feature requests from users in-house, without needing to recreate the whole Fingerpost service.

## Decision

As the first step, we will create a new service which consumes a data feed from Fingerpost. We will persist the data from the feed in our own storage, meaning that our service has only this ingestion-time coupling with Fingerpost. This will allow us to address user requests relating to search, UI, etc. We will be able to deliver value from the new service sooner, because we don't need to recreate all of business logic of aggregation, pre-processing, etc.

This will also give us an opportunity to learn more about the domain as we go, allowing us to assess whether there is value in creating our own direct integrations with agencies at a later date, or not.

nb. In making this decision, we are assuming that the reliability of the data feed will be at least as good as the existing Fingerpost service. (Generally speaking existing service is very reliable, which is part of the reason why we are happy to keep this dependency.) If this assumption is unfounded, then we might need to re-visit this question.
