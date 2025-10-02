package models

import org.scalatest.flatspec.AnyFlatSpec
import org.scalatest.matchers.should.Matchers.convertToAnyShouldWrapper
import io.circe.parser.decode
import io.circe.syntax.EncoderOps

class FingerpostWireSubjectsSpec extends AnyFlatSpec {
  val exampleFingerpostWireSubjects =
    FingerpostWireSubjects(code = List("a", "b"))
  val exampleJson = """{
                      |  "code" : [
                      |    "a",
                      |    "b"
                      |  ]
                      |}""".stripMargin
  ignore should "serialise json" in {
    exampleFingerpostWireSubjects.asJson.spaces2 shouldEqual exampleJson
  }

  ignore should "deserialise json" in {
    decode[FingerpostWireSubjects](
      exampleJson
    ) shouldEqual Right(exampleFingerpostWireSubjects)
  }

  ignore should "deserialise json with an empty code" in {
    decode[FingerpostWireSubjects]("""{
        | "code": ""
        |}""".stripMargin) shouldEqual Right(
      FingerpostWireSubjects(code = List())
    )
  }

}
