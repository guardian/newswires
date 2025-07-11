package lib

import org.scalatest.flatspec.AnyFlatSpec
import org.scalatest.matchers.must.Matchers

import java.io.ByteArrayInputStream
import java.nio.charset.StandardCharsets
import scala.sys.process._

class Base64EncoderSpec extends AnyFlatSpec with Matchers {

  it should "compress and encode small data" in {
    val in = "eeeeee"

    val encoded = Base64Encoder.compressAndEncode(in)
    encoded must equal("H4sIAAAAAAAA/0tNBQEAuMOf3wYAAAA=")

    val streamed =
      new ByteArrayInputStream(encoded.getBytes(StandardCharsets.UTF_8))
    // test by reversing with shell utils
    val reversed = ("base64 --decode" #< streamed #| "gunzip").!!.trim

    reversed must equal(in)
  }
}
