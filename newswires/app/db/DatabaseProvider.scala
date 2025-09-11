package db

import models.{QueryParams, QueryResponse}

trait DatabaseProvider {
  def query(
      params: QueryParams
  ): QueryResponse
}

class FakeDatabaseProvider(fakeQueryFunction: QueryParams => QueryResponse)
    extends DatabaseProvider {
  override def query(
      params: QueryParams
  ): QueryResponse = {
    fakeQueryFunction(params)
  }
}
