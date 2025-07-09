package lib

import java.io.ByteArrayOutputStream
import java.nio.charset.StandardCharsets
import java.util.Base64
import java.util.zip.GZIPOutputStream
import scala.util.Using

object Base64Encoder {
  def compressAndEncode(s: String): String = {
    Using.resource(new ByteArrayOutputStream()) { output =>
      Using.resource(new GZIPOutputStream(Base64.getEncoder.wrap(output))) {
        gzipper =>
          gzipper.write(s.getBytes(StandardCharsets.UTF_8))
      }
      output.flush()
      output.toString(StandardCharsets.UTF_8)
    }
  }
}
