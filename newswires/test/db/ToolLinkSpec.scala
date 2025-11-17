package db

import org.scalatest.flatspec.AnyFlatSpec
import org.scalatest.matchers.should.Matchers
import org.scalatest.matchers.should.Matchers.convertToAnyShouldWrapper

import java.time.Instant

class ToolLinkSpec extends AnyFlatSpec with Matchers {

  behavior of "displayToolLinks"

  val toolLink1: ToolLink = ToolLink(
    1L,
    1L,
    "tool",
    "user",
    Instant.ofEpochSecond(1622000000L),
    None
  )

  val toolLink2: ToolLink = ToolLink(
    1L,
    1L,
    "tool",
    "user",
    Instant.ofEpochSecond(1722000000L),
    None
  )
  it should "should order the tool links with the most recent at the beginning" in {
    ToolLink.display(
      List(toolLink1, toolLink2),
      None
    ) shouldEqual List(toolLink2, toolLink1)
  }

  it should "replace the username with you if the requesting user matches" in {
    ToolLink.display(List(toolLink1), Some("user")) shouldEqual List(
      toolLink1.copy(sentBy = "you")
    )
  }
}
