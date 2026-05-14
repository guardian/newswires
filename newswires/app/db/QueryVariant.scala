package db

import io.circe.{Decoder, Encoder}

sealed abstract class QueryVariant(
    val name: String,
    val description: String
)

object QueryVariant {
  implicit val encoder: Encoder[QueryVariant] =
    Encoder.forProduct2("name", "description")(v => (v.name, v.description))

  implicit val decoder: Decoder[QueryVariant] =
    Decoder[String].emap {
      case "not_exists" => Right(NotExists)
      case "plain_not"  => Right(PlainNot)
      case other        => Left(s"Unknown QueryVariant: $other")
    }
}

object NotExists
    extends QueryVariant(
      name = "not_exists",
      description =
        "Uses a 'NOT EXISTS (...)' clause to exclude results that match the search term"
    )

object PlainNot
    extends QueryVariant(
      name = "plain_not",
      description =
        "Uses a plain NOT clause to exclude results that match the search term"
    )
