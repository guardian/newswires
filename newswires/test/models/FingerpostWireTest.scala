package models

import helpers.models
import org.scalatest.flatspec.AnyFlatSpec
import org.scalatest.matchers.should.Matchers.convertToAnyShouldWrapper
import play.api.libs.json.{JsSuccess, Json}
import io.circe.parser.decode
import io.circe.syntax.EncoderOps

class FingerpostWireTest extends AnyFlatSpec with models {

  it should "serialise json" in {
    exampleWire.asJson.spaces2 shouldEqual exampleWireJson
  }

  it should "deserialise json" in {
    decode[FingerpostWire](exampleWireJson) shouldEqual Right(exampleWire)
  }

  it should "transform source-feed to sourceFeed" in {
    decode[FingerpostWire](
      """{
        |"source-feed": "newswire-feed"
        |}""".stripMargin
    ) shouldEqual Right(emptyWire.copy(sourceFeed = Some("newswire-feed")))
  }

  it should "transform body_text to bodyText" in {
    decode[FingerpostWire](
      """{
        |"body_text": "body text"
        |}""".stripMargin
    ) shouldEqual Right(emptyWire.copy(bodyText = Some("body text")))
  }
}
