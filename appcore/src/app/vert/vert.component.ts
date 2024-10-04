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
  public sortedActivityTypes: string[];
  activityTypeCounts: { [key: string]: number };

  constructor(
    @Inject(OPEN_RESOURCE_RESOLVER) private readonly openResourceResolver: OpenResourceResolver,
    @Inject(ActivityService) protected readonly activityService: DesktopActivityService
  ) {}

  public ngOnInit() {
    this.donateUrl =
      VertComponent.PAYPAL_ACCOUNT_BASE_URL + "/" + VertComponent.DEFAULT_AMOUNT + VertComponent.DEFAULT_CURRENCY;
  }

  public async onCalculateClicked() {
    // this.openResourceResolver.openLink(this.donateUrl);
    const x = await this.activityService.fetch();
    console.log(x);
    this.totalActivityTime = 0;

    // Initialize the dictionary/map
    this.activityTypeCounts = {};

    // Iterate over the activities and count each type
    for (const activity of x) {
      const activityType = activity.type;
      if (this.activityTypeCounts[activityType]) {
        this.activityTypeCounts[activityType]++;
      } else {
        this.activityTypeCounts[activityType] = 1;
      }
    }

    // Sort the keys by their counts in descending order
    this.sortedActivityTypes = Object.keys(this.activityTypeCounts).sort(
      (a, b) => this.activityTypeCounts[b] - this.activityTypeCounts[a]
    );

    console.log("Activity Type Counts:", this.activityTypeCounts);
    console.log("Sorted Activity Types:", this.sortedActivityTypes);

    for (const activity of x) {
      this.totalActivityTime += (activity.endTimestamp - activity.startTimestamp) / 3600;
    }
    console.log(this.totalActivityTime);
  }
}
