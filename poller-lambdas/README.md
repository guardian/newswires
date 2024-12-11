This directory/module contains the logic for each of out pollers and an abstraction for running them. Configured pollers also have their infrastructure generated automatically via CDK 🎉

Poller lambdas have their own SQS queues to facilitate long-polling and to allow invoking on a frequency faster than the once per minute allowed by CloudWatch/EventBridge rules.

## Adding a new poller lambda

1. add an entry to `POLLERS_CONFIG` in `shared/pollers.ts`, which allows you to specify, **optionally**...
    - `idealFrequencyInSeconds` if it's a fixed frequency poller (as opposed to long polling)
    - `overrideLambdaMemoryMB` should this specific poller lambda need more memory than the default (currently 128MB)
    - `overrideLambdaTimeoutSeconds` should this specific poller lambda need a different timeout than the default (currently 60s)
2. add a new file in `poller-lambdas/src/pollers` which exports a named function with a `satisfies LongPollFunction` or `satisfies FixedFrequencyPollFunction` on the end. The initial implementation should be as minimal as possible, but does compile, so you can deploy to CODE to generate the secrets in Secrets Manager (which you can subsequently set to the real value).
3. the TS compiler should enforce that you reference your new function at the bottom of `poller-lambdas/src/index.ts` (wrapped in `pollerWrapper(  )`)
4. deploy to CODE, to generate the secrets in Secrets Manager, which you should then populate with real value (ideally CODE & PROD should use different secrets, if the agency/supplier has provided)
5. iteratively implement your poller, making use of the run command:
    ```sh
    npm run dev -w poller-lambdas
    ```
   ...to run/test your poll logic locally.
