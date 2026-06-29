import { TrackingTag } from '@guardian/cdk/lib/constants/tracking-tag';

// `TrackingTag.Value` proxies `LibraryInfo.VERSION`, which would otherwise leak
// the installed @guardian/cdk version into stack snapshots and cause trivial
// snapshot changes on every dependency bump.
// Overriding TrackingTag.Value here sets the `gu:cdk:version` tag to "TEST" for all tests.
TrackingTag.Value = 'TEST';
