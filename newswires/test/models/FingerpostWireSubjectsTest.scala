package models

import org.scalatest.flatspec.AnyFlatSpec
import org.scalatest.matchers.should.Matchers.convertToAnyShouldWrapper
import play.api.libs.json.{JsSuccess, Json}

class FingerpostWireSubjectsTest extends AnyFlatSpec {
  val exampleFingerpostWireSubjects =
    FingerpostWireSubjects(code = List("a", "b"))
  val exampleJson = """{
                      |  "code" : [ "a", "b" ]
                      |}""".stripMargin
  it should "serialise json" in {
    Json.prettyPrint(
      Json.toJson(exampleFingerpostWireSubjects)
    ) shouldEqual exampleJson

  }

  it should "deserialise json" in {
    Json.fromJson[FingerpostWireSubjects](
      Json.parse(exampleJson)
    ) shouldEqual JsSuccess(exampleFingerpostWireSubjects)
  }

  it should "deserialise json with an empty code" in {
    Json.fromJson[FingerpostWireSubjects](Json.parse("""{
        | "code": ""
        |}""".stripMargin)) shouldEqual JsSuccess(
      FingerpostWireSubjects(code = List())
    )
  }

}
