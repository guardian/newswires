package controllers

import com.gu.pandomainauth.PanDomain
import com.gu.pandomainauth.action.{AuthActions, UserRequest}
import com.gu.pandomainauth.model.AuthenticatedUser
import com.gu.permissions.PermissionDefinition
import play.api.mvc._
import play.api.{Configuration, Logging}

import scala.concurrent.{ExecutionContext, Future}

trait AppAuthActions extends AuthActions with Logging with PermissionsCheck {
  self: BaseController =>
  def configuration: Configuration

  implicit private val ec: ExecutionContext =
    controllerComponents.executionContext

  val authAction: ActionBuilder[UserRequest, AnyContent] = AuthAction
  def authAction(
      requiredPermission: PermissionDefinition
  ): ActionBuilder[UserRequest, AnyContent] =
    authActionWithPermission(AuthAction)(
      requiredPermission
    )

  val apiAuthAction: ActionBuilder[UserRequest, AnyContent] = APIAuthAction
  def apiAuthAction(
      requiredPermission: PermissionDefinition
  ): ActionBuilder[UserRequest, AnyContent] =
    authActionWithPermission(APIAuthAction)(
      requiredPermission
    )

  override def validateUser(authedUser: AuthenticatedUser): Boolean = {
    logger.info(s"validating user $authedUser")
    PanDomain.guardianValidation(authedUser) && hasAccessPermission(
      authedUser.user.email
    )
  }

  private def authActionWithPermission(
      authActionBuilder: ActionBuilder[UserRequest, AnyContent]
  )(
      requiredPermission: PermissionDefinition
  ): ActionBuilder[UserRequest, AnyContent] =
    new ActionBuilder[UserRequest, AnyContent] {
      override def parser: BodyParser[AnyContent] =
        controllerComponents.parsers.defaultBodyParser

      override def invokeBlock[A](
          request: Request[A],
          block: UserRequest[A] => Future[Result]
      ): Future[Result] = {

        (authActionBuilder andThen checkPermission(requiredPermission))
          .invokeBlock(request, block)
      }

      override protected def executionContext: ExecutionContext =
        controllerComponents.executionContext
    }

  /** By default, the user validation method is called every request. If your
    * validation method has side-effects or is expensive (perhaps hitting a
    * database), setting this to true will ensure that validateUser is only
    * called when the OAuth session is refreshed
    */
  override def cacheValidation = false

  override def authCallbackUrl: String =
    "https://" + configuration.get[String]("host") + "/oauthCallback"
}
