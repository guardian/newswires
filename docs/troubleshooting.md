# Troubleshooting

This document contains various pieces of information which may be useful when
troubleshooting an issue in development.

## Cookie works locally but appears to be ignored on CODE/PROD

The Cloudfront distribution for Newswires has an allowlist of which cookies
should be passed onwards to the backend app. If you’ve added a new cookie (or
one has been added to a shared service like panda), then you should make sure
to add it to the list in the CDK definition, in the “Origin Request Policy”’s
“cookieBehavior” element.
