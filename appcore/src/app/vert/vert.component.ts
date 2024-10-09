import { Component, Inject, OnInit } from "@angular/core";
import { OPEN_RESOURCE_RESOLVER, OpenResourceResolver } from "../shared/services/links-opener/open-resource-resolver";
import { ActivityService } from "../shared/services/activity/activity.service";
import { DesktopActivityService } from "../shared/services/activity/impl/desktop-activity.service";
import { SportsLibProcessor } from "/Users/colinadams/elevate/elevateExtended/desktop/src/processors/sports-lib.processor"; // Import the SportsLibProcessor
import { Streams } from "@elevate/shared/models/activity-data/streams.model";
import { StreamsService } from "../shared/services/streams/streams.service";
import { ActivityViewService } from "../desktop/activity-view/shared/activity-view.service";
import { Activity } from "@elevate/shared/models/sync/activity.model";
import { ConnectorType } from "@elevate/shared/sync/connectors/connector-type.enum";
import { LoggerService } from "../shared/services/logging/logger.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatDialog } from "@angular/material/dialog";
import { ActivatedRoute, Router } from "@angular/router";
import { WarningException } from "@elevate/shared/exceptions/warning.exception";
import { ProcessStreamMode } from "@elevate/shared/sync/compute/stream-processor";
import _ from "lodash";
import moment from "moment";
import { Location } from "@angular/common";
import { ActivityViewComponent } from "../desktop/activity-view/activity-view.component";
import DesktopUserSettings = UserSettings.DesktopUserSettings;
import { UserSettings } from "@elevate/shared/models/user-settings/user-settings.namespace";
import { UserSettingsService } from "../shared/services/user-settings/user-settings.service";
import { DesktopUserSettingsService } from "../shared/services/user-settings/desktop/desktop-user-settings.service";
import { ActivityViewMapComponent } from "../desktop/activity-view/activity-view-map/activity-view-map.component";
import axios from "axios";
import { getDistance } from "geolib";

@Component({
  selector: "app-donate",
  templateUrl: "./vert.component.html",
  styleUrls: ["./vert.component.scss"]
})
export class VertComponent implements OnInit {
  public static readonly DEFAULT_AMOUNT: number = 25;
  public static readonly DEFAULT_CURRENCY: string = "usd";
  public static readonly PAYPAL_ACCOUNT_BASE_URL: string = "https://www.paypal.me/thomaschampagne";

  constructor(
    @Inject(OPEN_RESOURCE_RESOLVER) private readonly openResourceResolver: OpenResourceResolver,
    @Inject(ActivatedRoute) private readonly route: ActivatedRoute,
    @Inject(ActivityService) protected readonly activityService: DesktopActivityService,
    @Inject(StreamsService) protected readonly streamsService: StreamsService,
    @Inject(ActivityViewService) private readonly activityViewService: ActivityViewService,
    @Inject(Router) protected readonly router: Router,
    @Inject(MatSnackBar) protected readonly snackBar: MatSnackBar,
    @Inject(Location) private location: Location,
    @Inject(MatDialog) private readonly dialog: MatDialog,
    @Inject(LoggerService) private readonly logger: LoggerService,
    @Inject(UserSettingsService) private readonly userSettingsService: DesktopUserSettingsService
  ) {
    this.activity = null;
    this.typeDisplay = null;
    this.startDateDisplay = null;
    this.athleteSnapshotDisplay = null;
    this.streams = null;
    // this.userSettings = null;
    this.hasMapData = false;
    this.displayGraph = false;
    this.displayFlags = true;
  }

  public donateUrl: string;
  public totalActivityTime: number;
  public sortedActivityTypes: string[];
  public streams: Streams;
  activityTypeCounts: { [key: string]: number };

  public readonly ConnectorType = ConnectorType;

  public activity: Activity;
  public typeDisplay: string;
  public startDateDisplay: string;
  public endDateDisplay: string;
  public athleteSnapshotDisplay: string;
  public userSettings: DesktopUserSettings;
  public hasMapData: boolean;
  public deviceIcon: string;
  public displayGraph: boolean;
  public displayFlags: boolean;

  public ngOnInit() {
    this.donateUrl =
      VertComponent.PAYPAL_ACCOUNT_BASE_URL + "/" + VertComponent.DEFAULT_AMOUNT + VertComponent.DEFAULT_CURRENCY;

    // Fetch activity to display from id
    const activityId = "35afe81eeb2c0a56b34d8f6d";
    this.activityService
      .getById(activityId)
      .then((activity: Activity) => {
        if (!activity) {
          // this.onBack();
          return Promise.reject(new WarningException("Unknown activity"));
        }

        this.activity = activity;
        this.typeDisplay = _.startCase(this.activity.type);
        this.startDateDisplay = moment(this.activity.startTime).format("LLLL");
        this.endDateDisplay = moment(this.activity.endTime).format("LLLL");

        // this.deviceIcon =
        //   ActivityViewComponent.DEVICE_WATCH_SPORTS.indexOf(this.activity.type) !== -1 ? "watch" : "smartphone";

        return this.userSettingsService.fetch();
      })
      .then((userSettings: DesktopUserSettings) => {
        this.userSettings = userSettings;
        // this.athleteSnapshotDisplay = this.formatAthleteSnapshot(this.activity, this.userSettings.systemUnit);

        // Fetch associated stream if exists
        return this.streamsService.getProcessedById(ProcessStreamMode.DISPLAY, this.activity.id, {
          type: this.activity.type,
          hasPowerMeter: this.activity.hasPowerMeter,
          isSwimPool: this.activity.isSwimPool,
          athleteSnapshot: this.activity.athleteSnapshot
        });
      })
      .then((streams: Streams) => {
        this.streams = streams;
        this.hasMapData = streams?.latlng?.length > 0;

        this.logger.debug("Activity", this.activity);
        this.logger.debug("Streams", this.streams);
      })
      .catch(err => {
        if (!(err instanceof WarningException)) {
          throw err;
        }
      });
  }

  public async onRunStats() {
    await SportsLibProcessor.checkProximityToSummits(
      "/Users/colinadams/Downloads/export_14653597/activities/1102805536.gpx"
    );
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

  // 2. Query OSM for Summits using Overpass API
  private querySummitsFromOSM = async (bbox: string) => {
    const bbox2 = "(37.7749,-122.4194,37.8049,-122.3894)";
    const overpassQuery = `
  [out:json];
  node["natural"="peak"]${bbox2};
  out body;
  `;

    try {
      const response = await axios.post("https://overpass-api.de/api/interpreter", overpassQuery);
      // const response = await fetch("https://overpass-api.de/api/interpreter", {
      //   method: "POST",
      //   body: overpassQuery,
      // });
      const summits = response.data.elements.map((element: any) => ({
        lat: element.lat,
        lon: element.lon,
        name: element.tags.name
      }));
      return summits;
    } catch (error) {
      console.error("Error querying OSM:", error);
      return [];
    }
  };

  // 3. Function to calculate proximity
  private withinRange = (trackPoints: any[], summits: any[], maxDistanceInMeters: number) => {
    const closeSummits: any[] = [];

    trackPoints.forEach(trackPoint => {
      summits.forEach(summit => {
        const distance = getDistance(
          { latitude: trackPoint.lat, longitude: trackPoint.lon },
          { latitude: summit.lat, longitude: summit.lon }
        );
        if (distance <= maxDistanceInMeters) {
          closeSummits.push({
            summitName: summit.name,
            summitLat: summit.lat,
            summitLon: summit.lon,
            distance: distance
          });
        }
      });
    });

    return closeSummits;
  };

  // 4. Main Function to Check Proximity of GPX Track to Summits
  public async checkProximityToSummits(): Promise<void> {
    // a. Parse the GPX file
    const trackPoints = this.streams.latlng;

    // b. Define the bounding box around your GPX track (minLat, minLon, maxLat, maxLon)
    const bbox = "[minLat,minLon,maxLat,maxLon]"; // Adjust the bounding box accordingly

    // c. Query OSM for summits in the bounding box
    const summits = await this.querySummitsFromOSM(bbox);

    // d. Calculate proximity (0.2 miles = 322 meters)
    const closeSummits = this.withinRange(trackPoints, summits, 322);

    // e. Output the summits within 0.2 miles
    if (closeSummits.length > 0) {
      console.log("Summits within 0.2 miles:", closeSummits);
    } else {
      console.log("No summits found within 0.2 miles of your GPX track.");
    }
  }
}
