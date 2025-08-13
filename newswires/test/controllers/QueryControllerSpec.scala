package controllers

import org.scalatest.flatspec.AnyFlatSpec
import org.scalatest.matchers.should.Matchers

class QueryControllerSpec extends AnyFlatSpec with Matchers {

  behavior of "QueryController.effectiveSuppliersToExclude"

  it should "exclude UNAUTHED_EMAIL_FEED by default" in {
    val suppliersExcl = QueryController.effectiveSuppliersToExclude(
      suppliersExclFromRequest = Nil,
      suppliersToInclude = Nil,
      showGuSuppliers = false
    )
    suppliersExcl should contain("UNAUTHED_EMAIL_FEED")
  }

  it should "exclude GuReuters and GuAP if showGuSuppliers is false" in {
    val suppliersExcl = QueryController.effectiveSuppliersToExclude(
      suppliersExclFromRequest = Nil,
      suppliersToInclude = Nil,
      showGuSuppliers = false
    )
    suppliersExcl should contain("GuReuters")
    suppliersExcl should contain("GuAP")
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
      showGuSuppliers = false
    )
    suppliersExcl should contain("Reuters")
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

  it should "not currently try to reconcile explicit inclusions and exclusions" in {
    val suppliersExcl = QueryController.effectiveSuppliersToExclude(
      suppliersExclFromRequest = List("ABC"),
      suppliersToInclude = List("ABC"),
      showGuSuppliers = false
    )
    suppliersExcl should contain("ABC")
  }

}
