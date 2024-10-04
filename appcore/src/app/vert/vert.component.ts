import { Component, Inject, OnInit } from "@angular/core";
import { OPEN_RESOURCE_RESOLVER, OpenResourceResolver } from "../shared/services/links-opener/open-resource-resolver";
import { ActivityService } from "../shared/services/activity/activity.service";
import { DesktopActivityService } from "../shared/services/activity/impl/desktop-activity.service";

@Component({
  selector: "app-donate",
  templateUrl: "./vert.component.html",
  styleUrls: ["./vert.component.scss"]
})
export class VertComponent implements OnInit {
  public static readonly DEFAULT_AMOUNT: number = 25;
  public static readonly DEFAULT_CURRENCY: string = "usd";
  public static readonly PAYPAL_ACCOUNT_BASE_URL: string = "https://www.paypal.me/thomaschampagne";

  public donateUrl: string;

  constructor(
    @Inject(OPEN_RESOURCE_RESOLVER) private readonly openResourceResolver: OpenResourceResolver,
    @Inject(ActivityService) protected readonly activityService: DesktopActivityService
  ) {}

  public ngOnInit() {
    this.donateUrl =
      VertComponent.PAYPAL_ACCOUNT_BASE_URL + "/" + VertComponent.DEFAULT_AMOUNT + VertComponent.DEFAULT_CURRENCY;

    const x = this.activityService.fetch().then(data => {
      console.log(data);
    });
    console.log(x);
  }

  public onDonateClicked() {
    this.openResourceResolver.openLink(this.donateUrl);
  }
}
