#!/usr/bin/env -S scala-cli shebang -S 3.3

//> using jvm corretto:17

//> using dep software.amazon.awssdk:sqs:2.30.34

import software.amazon.awssdk.services.sqs.model.DeleteMessageBatchRequestEntry
import software.amazon.awssdk.services.sqs.model.DeleteMessageBatchRequest
import software.amazon.awssdk.services.sqs.model.DeleteMessageRequest
import software.amazon.awssdk.services.sqs.model.ReceiveMessageRequest

import scala.jdk.CollectionConverters._
import software.amazon.awssdk.services.sqs.SqsClient
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider
import software.amazon.awssdk.regions.Region

val queueUrl = if (args.isDefinedAt(1)) {
  args(1)
} else {
  println(s"Usage: ${args(0)} <queue_url>")
  sys.exit(1)
}

val credentials =
  DefaultCredentialsProvider.builder().profileName("editorial-feeds").build()
val sqs = SqsClient
  .builder()
  .credentialsProvider(credentials)
  .region(Region.EU_WEST_1)
  .build()

val rcv = ReceiveMessageRequest
  .builder()
  .queueUrl(queueUrl)
  .maxNumberOfMessages(10)
  .visibilityTimeout(30)
  .messageAttributeNames("Feed-Id")
  .build()

var runningTot = 0
var seen = 0
var iterations = 0

while (iterations < 2500) {
  iterations += 1

  val page = sqs.receiveMessage(rcv).messages().asScala

  if (page.isEmpty) {
    println("all done!")
    sys.exit()
  }
  seen += page.length

  val deletable = page
    .filter(msg => false
      // your condition here:
      // eg.
      // msg.body().take(150).contains(""""source-feed"	: "AFP",""")
      // msg.messageAttributes().asScala.get("Feed-Id").exists(v => v.stringValue() == "UNKNOWN")
    )
    .map(msg =>
      DeleteMessageBatchRequestEntry
        .builder()
        .receiptHandle(msg.receiptHandle())
        .id { runningTot += 1; runningTot.toString }
        .build()
    )
  if (deletable.nonEmpty) {
    val dmr =
      DeleteMessageBatchRequest
        .builder()
        .queueUrl(queueUrl)
        .entries(deletable.asJava)
        .build()
    sqs.deleteMessageBatch(dmr)
  }

  println(s"Deleted $runningTot / $seen messages")

}

println("exiting because we've looped 2500 times; is there an infinite loop here?")
