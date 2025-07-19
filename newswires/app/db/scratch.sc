import conf.SearchTerm.Simple
import db.{QueryParams, QueryParams}
import scalikejdbc.{
  SQLToTraversableImpl,
  scalikejdbcSQLInterpolationImplicitDef
}

//val a = sql"""
//  SELECT 1 as successes
//"""
//
//val b = sql"""
//  SELECT 1 as successes
//"""

val a = QueryParams(
  searchParams = QueryParams(text = Some(Simple("example"))),
  savedSearchParamList = Nil,
  maybeSearchTerm = Some(Simple("example")),
  maybeBeforeId = None,
  maybeSinceId = None,
  pageSize = 30
)

val b = QueryParams(
  searchParams = QueryParams(text = Some(Simple("example"))),
  savedSearchParamList = Nil,
  maybeSearchTerm = Some(Simple("example")),
  maybeBeforeId = None,
  maybeSinceId = None,
  pageSize = 30
)

a == b
