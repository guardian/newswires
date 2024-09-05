package controllers

import com.gu.pandomainauth.action.UserRequest
import com.gu.permissions.{PermissionDefinition, PermissionsProvider}
import play.api.mvc.Results.Forbidden
import play.api.mvc.{ActionFilter, Result}

import scala.concurrent.{ExecutionContext, Future}

trait PermissionsCheck {
  def permissionsProvider: PermissionsProvider
  private val app = "newswires"

  def hasAccessPermission(email: String): Boolean =
    // permissionsProvider.hasPermission(CrosswordsAccess, email)
    true

  def checkPermission(
      permission: PermissionDefinition
  )(implicit ec: ExecutionContext): ActionFilter[UserRequest] =
    new ActionFilter[UserRequest] {
      override protected def executionContext: ExecutionContext = ec

      override protected def filter[A](
          request: UserRequest[A]
      ): Future[Option[Result]] = Future.successful {
        if (permissionsProvider.hasPermission(permission, request.user.email)) {
          None
        } else {
          Some(Forbidden)
        }
      }
    }
}
