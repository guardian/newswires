package controllers

import org.scalatest.flatspec.AnyFlatSpec
import org.scalatest.matchers.should.Matchers

class QueryControllerSpec extends AnyFlatSpec with Matchers {

  behavior of "QueryController.effectiveSuppliersToExclude"

  it should "exclude UNAUTHED_EMAIL_FEED and the Gu supplier feeds by default if 'showGuSuppliers' is false" in {
    val suppliersExcl = QueryController.effectiveSuppliersToExclude(
      suppliersExclFromRequest = Nil,
      suppliersToInclude = Nil,
      showGuSuppliers = false
    )

    suppliersExcl should contain allOf (
      "UNAUTHED_EMAIL_FEED",
      "GuReuters",
      "GuAP"
    )
    suppliersExcl.length shouldBe 3
  }

  it should "not exclude GuReuters and GuAP if showGuSuppliers is true" in {
    val suppliersExcl = QueryController.effectiveSuppliersToExclude(
      suppliersExclFromRequest = Nil,
      suppliersToInclude = Nil,
      showGuSuppliers = true
    )
    suppliersExcl.length shouldBe 1
    suppliersExcl should contain("UNAUTHED_EMAIL_FEED")
  }

  it should "exclude suppliers if specified in the request" in {
    val suppliersExcl = QueryController.effectiveSuppliersToExclude(
      suppliersExclFromRequest = List("Reuters"),
      suppliersToInclude = Nil,
      showGuSuppliers = true
    )
    suppliersExcl should contain allOf ("Reuters", "UNAUTHED_EMAIL_FEED")
    suppliersExcl.length shouldBe 2
  }

  it should "allow default exclusions to be overridden by explicit inclusion" in {
    val suppliersExcl = QueryController.effectiveSuppliersToExclude(
      suppliersExclFromRequest = Nil,
      suppliersToInclude = List("UNAUTHED_EMAIL_FEED", "GuReuters"),
      showGuSuppliers = false
    )
    suppliersExcl should not contain "UNAUTHED_EMAIL_FEED"
    suppliersExcl should not contain "GuReuters"
    suppliersExcl should contain("GuAP")
  }

  it should "not allow *explicit* exclusions to be overridden by explicit inclusion" in {

    /** Including and excluding the same supplier is pointless, but if both
      * settings have been set explicitly by the caller, it's not really the
      * business of this function to try and reconcile them. It will just return
      * the suppliers to exclude as specified.
      */
    val suppliersExcl = QueryController.effectiveSuppliersToExclude(
      suppliersExclFromRequest = List("ABC"),
      suppliersToInclude = List("ABC"),
      showGuSuppliers = false
    )
    suppliersExcl should contain("ABC")
  }

}
