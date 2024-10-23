package db

import scalikejdbc.Binders

import java.sql.{PreparedStatement, ResultSet}

object CustomMappers {

  // no built-in scala->SQL binding for arrays :(
  //
  // https://github.com/scalikejdbc/scalikejdbc/issues/933#issuecomment-412015675
  implicit val textArray: Binders[List[String]] = {
    def sqlArrayToStringList(arr: java.sql.Array): List[String] =
      arr.getArray
        .asInstanceOf[Array[AnyRef]]
        .map(_.asInstanceOf[String])
        .toList

    def fromResultSetIndex(resultSet: ResultSet, i: Int): List[String] =
      sqlArrayToStringList(resultSet.getArray(i))

    def fromResultSetLabel(resultSet: ResultSet, column: String): List[String] =
      sqlArrayToStringList(resultSet.getArray(column))

    def prepare(
        list: List[String]
    )(statement: PreparedStatement, i: Int): Unit = {
      val array = statement.getConnection
        .createArrayOf("text", list.map(_.asInstanceOf[AnyRef]).toArray)
      statement.setArray(i, array)
    }

    Binders[List[String]](fromResultSetIndex)(fromResultSetLabel)(
      prepare
    )
  }

}
