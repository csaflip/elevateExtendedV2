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
  public totalActivityTime: number;

  constructor(
    @Inject(OPEN_RESOURCE_RESOLVER) private readonly openResourceResolver: OpenResourceResolver,
    @Inject(ActivityService) protected readonly activityService: DesktopActivityService
  ) {}

  public ngOnInit() {
    this.donateUrl =
      VertComponent.PAYPAL_ACCOUNT_BASE_URL + "/" + VertComponent.DEFAULT_AMOUNT + VertComponent.DEFAULT_CURRENCY;
  }

  public async onDonateClicked() {
    // this.openResourceResolver.openLink(this.donateUrl);
    const x = await this.activityService.fetch();
    console.log(x);
    this.totalActivityTime = 0;
    for (const activity of x) {
      this.totalActivityTime += (activity.endTimestamp - activity.startTimestamp) / 3600;
    }
    console.log(this.totalActivityTime);
  }
}
