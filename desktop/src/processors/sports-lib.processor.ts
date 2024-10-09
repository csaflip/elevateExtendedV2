/* eslint-disable prettier/prettier */
import xmldom from "@xmldom/xmldom";
import fs from "fs";
import _ from "lodash";
import { EventInterface } from "@thomaschampagne/sports-lib/lib/events/event.interface";
import { DataSpeed } from "@thomaschampagne/sports-lib/lib/data/data.speed";
import { DataEnergy } from "@thomaschampagne/sports-lib/lib/data/data.energy";
import { DataPowerAvg } from "@thomaschampagne/sports-lib/lib/data/data.power-avg";
import { DataAltitude } from "@thomaschampagne/sports-lib/lib/data/data.altitude";
import { DataAscent } from "@thomaschampagne/sports-lib/lib/data/data.ascent";
import { DataDistance } from "@thomaschampagne/sports-lib/lib/data/data.distance";
import { DataPosition } from "@thomaschampagne/sports-lib/lib/data/data.position";
import { DataHeartRate } from "@thomaschampagne/sports-lib/lib/data/data.heart-rate";
import { DataSpeedAvg } from "@thomaschampagne/sports-lib/lib/data/data.speed-avg";
import { DataHeartRateMax } from "@thomaschampagne/sports-lib/lib/data/data.heart-rate-max";
import { DataPower } from "@thomaschampagne/sports-lib/lib/data/data.power";
import { DataHeartRateAvg } from "@thomaschampagne/sports-lib/lib/data/data.heart-rate-avg";
import { DataDuration } from "@thomaschampagne/sports-lib/lib/data/data.duration";
import { DataCadenceAvg } from "@thomaschampagne/sports-lib/lib/data/data.cadence-avg";
import { DataCadence } from "@thomaschampagne/sports-lib/lib/data/data.cadence";
import { DataSpeedMax } from "@thomaschampagne/sports-lib/lib/data/data.speed-max";
import { LapJSONInterface } from "@thomaschampagne/sports-lib/lib/laps/lap.json.interface";
import { DataTemperature } from "@thomaschampagne/sports-lib/lib/data/data.temperature";
import { StreamJSONInterface } from "@thomaschampagne/sports-lib/lib/streams/stream";
import { DataMovingTime } from "@thomaschampagne/sports-lib/lib/data/data.moving-time";
import { ActivityJSONInterface } from "@thomaschampagne/sports-lib/lib/activities/activity.json.interface";
import { SportsLib } from "@thomaschampagne/sports-lib";
import { EventJSONInterface } from "@thomaschampagne/sports-lib/lib/events/event.json.interface";
import { DataLatitudeDegrees } from "@thomaschampagne/sports-lib/lib/data/data.latitude-degrees";
import { DataLongitudeDegrees } from "@thomaschampagne/sports-lib/lib/data/data.longitude-degrees";
import { DataTime } from "@thomaschampagne/sports-lib/lib/data/data.time";
import { extension } from "@elevate/shared/tools/extension";
import { FileType } from "@thomaschampagne/sports-lib/lib/events/adapters/file-type.enum";
import { ActivityParsingOptions } from "@thomaschampagne/sports-lib/lib/activities/activity-parsing-options";

export class SportsLibProcessor {
  public static getEvent(path: string): Promise<{
    event: EventJSONInterface;
    logsInfo: string[];
  }> {
    let parseSportsLibActivity: Promise<EventInterface> = null;

    const parsingOptions = new ActivityParsingOptions({
      streams: {
        smooth: { altitudeSmooth: true, grade: true, gradeSmooth: true },
        fixAbnormal: { speed: true }
      },
      maxActivityDurationDays: 30
    });

    const srcFileType = extension(path) as FileType;

    const activityFileBuffer = fs.readFileSync(path);

    switch (srcFileType) {
      case FileType.GPX:
        parseSportsLibActivity = SportsLib.importFromGPX(
          activityFileBuffer.toString(),
          xmldom.DOMParser,
          parsingOptions
        );
        break;

      case FileType.TCX:
        const doc = new xmldom.DOMParser().parseFromString(activityFileBuffer.toString(), "application/xml");
        parseSportsLibActivity = SportsLib.importFromTCX(doc, parsingOptions);
        break;

      case FileType.FIT:
        parseSportsLibActivity = SportsLib.importFromFit(activityFileBuffer, parsingOptions);
        break;

      default:
        const errorMessage = `Type ${srcFileType} not supported. Failed to parse ${path}`;
        return Promise.reject(errorMessage);
    }

    return parseSportsLibActivity.then(eventInterface => {
      const event = eventInterface.toJSON();
      let logsInfo: string[] = [];

      event.activities = event.activities.map(activity => {
        // Pre process laps
        activity.laps = this.processLaps(activity);

        // Pre process streams
        const extractedStreams = this.processStreams(activity);
        activity.streams = extractedStreams.data;
        logsInfo = _.union(logsInfo, extractedStreams.logsInfo);

        return activity;
      });

      return Promise.resolve({ event: event, logsInfo: logsInfo });
    });
  }

  private static filterSportsLibsStream(streams: StreamJSONInterface[], type: string): number[] | null {
    return this.getSportsLibStream(streams, type)?.filter(value => Number.isFinite(value)) || null;
  }

  private static getSportsLibStream(streams: StreamJSONInterface[], type: string) {
    return streams.find(stream => stream.type === type)?.data;
  }

  private static processStreams(sportsLibActivity: ActivityJSONInterface): {
    data: { [key: string]: number[] };
    logsInfo: string[];
  } {
    const sportsLibStreams = sportsLibActivity.streams as StreamJSONInterface[];
    const squashedStreams = {};
    const logsInfo = [];

    // Time
    try {
      squashedStreams[DataTime.type] = this.filterSportsLibsStream(sportsLibStreams, DataTime.type);
    } catch (err) {
      logsInfo.push("No distance stream found for activity starting at " + sportsLibActivity.startDate);
    }

    // Lat long
    try {
      const longitudes = this.filterSportsLibsStream(sportsLibStreams, DataLongitudeDegrees.type);
      const latitudes = this.filterSportsLibsStream(sportsLibStreams, DataLatitudeDegrees.type);

      squashedStreams[DataPosition.type] = latitudes.map((latitude, index) => {
        return [_.floor(latitude, 8), _.floor(longitudes[index], 8)];
      });
    } catch (err) {
      logsInfo.push("No lat or lon streams found for activity starting at " + sportsLibActivity.startDate);
    }

    // Distance
    try {
      const distanceStream = this.filterSportsLibsStream(sportsLibStreams, DataDistance.type);
      if (_.mean(distanceStream) !== 0) {
        squashedStreams[DataDistance.type] = distanceStream;
      }
    } catch (err) {
      logsInfo.push("No distance stream found for activity starting at " + sportsLibActivity.startDate);
    }

    // Speed
    try {
      const velocityStream = this.filterSportsLibsStream(sportsLibStreams, DataSpeed.type);
      if (_.mean(velocityStream) !== 0) {
        squashedStreams[DataSpeed.type] = velocityStream;
      }
    } catch (err) {
      logsInfo.push("No speed stream found for activity starting at " + sportsLibActivity.startDate);
    }

    // HeartRate
    try {
      squashedStreams[DataHeartRate.type] = this.filterSportsLibsStream(sportsLibStreams, DataHeartRate.type);
    } catch (err) {
      logsInfo.push("No heartrate stream found for activity starting at " + sportsLibActivity.startDate);
    }

    // Altitude
    try {
      squashedStreams[DataAltitude.type] = this.filterSportsLibsStream(sportsLibStreams, DataAltitude.type);
    } catch (err) {
      logsInfo.push("No altitude stream found for activity starting at " + sportsLibActivity.startDate);
    }

    // Cadence
    try {
      squashedStreams[DataCadence.type] = this.filterSportsLibsStream(sportsLibStreams, DataCadence.type);
    } catch (err) {
      logsInfo.push("No cadence stream found for activity starting at " + sportsLibActivity.startDate);
    }

    // Watts
    try {
      if (sportsLibActivity.powerMeter) {
        squashedStreams[DataPower.type] = this.filterSportsLibsStream(sportsLibStreams, DataPower.type);
      }
    } catch (err) {
      logsInfo.push("No power stream found for activity starting at " + sportsLibActivity.startDate);
    }

    // Temperature
    try {
      squashedStreams[DataTemperature.type] = this.filterSportsLibsStream(sportsLibStreams, DataTemperature.type);
    } catch (err) {
      logsInfo.push("No temperature stream found for activity starting at " + sportsLibActivity.startDate);
    }

    return {
      data: squashedStreams,
      logsInfo: logsInfo
    };
  }

  private static processLaps(sportsLibActivity: ActivityJSONInterface): LapJSONInterface[] {
    if (!sportsLibActivity.laps || sportsLibActivity.laps.length <= 1 || !sportsLibActivity.streams?.length) {
      return null;
    }

    const streams = sportsLibActivity.streams as StreamJSONInterface[];
    const timeStreamFull = this.getSportsLibStream(streams, DataTime.type);
    const timeStreamSquashed = this.filterSportsLibsStream(streams, DataTime.type);

    return sportsLibActivity.laps.map((lapObj: LapJSONInterface, lapIndex: number) => {
      // From start/end lap indexes, get associated times values on the non-squashed time stream
      const startLapTimeValue = timeStreamFull.find((time, index) => {
        return index >= lapObj.startIndex && time !== null;
      });
      const endLapTimeValue = timeStreamFull.find((time, index) => {
        return index >= lapObj.endIndex && time !== null;
      });

      // From start/end lap values try to find the indexes back od squashed time stream
      // Append +1 to start index if not first lap
      const startLapIndexSquash =
        timeStreamSquashed.findIndex(value => value === startLapTimeValue) + (lapIndex > 0 ? 1 : 0);

      // So for the end. If no indexes found
      const endLapIndexSquash = endLapTimeValue
        ? timeStreamSquashed.findIndex(value => value === endLapTimeValue)
        : timeStreamSquashed.length - 1;

      // Update indexes in line with squashed streams
      lapObj.startIndex = startLapIndexSquash;
      lapObj.endIndex = endLapIndexSquash;

      if (lapObj.stats[DataDistance.type]) {
        lapObj.stats[DataDistance.type] = _.round(lapObj.stats[DataDistance.type] as number, 3);
      }

      if (lapObj.stats[DataAscent.type]) {
        lapObj.stats[DataAscent.type] = _.round(lapObj.stats[DataAscent.type] as number, 3);
      }

      if (lapObj.stats[DataDuration.type]) {
        lapObj.stats[DataDuration.type] = _.round(lapObj.stats[DataDuration.type] as number, 3);
      }

      if (lapObj.stats[DataMovingTime.type]) {
        lapObj.stats[DataMovingTime.type] = _.round(lapObj.stats[DataMovingTime.type] as number, 3);
      }

      if (lapObj.stats[DataSpeedAvg.type]) {
        lapObj.stats[DataSpeedAvg.type] = _.round(lapObj.stats[DataSpeedAvg.type] as number, 3);
      }

      if (lapObj.stats[DataSpeedMax.type]) {
        lapObj.stats[DataSpeedMax.type] = _.round(lapObj.stats[DataSpeedMax.type] as number, 3);
      }

      if (lapObj.stats[DataCadenceAvg.type]) {
        lapObj.stats[DataCadenceAvg.type] = _.round(lapObj.stats[DataCadenceAvg.type] as number, 3);
      }

      if (lapObj.stats[DataHeartRateAvg.type]) {
        lapObj.stats[DataHeartRateAvg.type] = _.round(lapObj.stats[DataHeartRateAvg.type] as number, 3);
      }

      if (lapObj.stats[DataHeartRateMax.type]) {
        lapObj.stats[DataHeartRateMax.type] = _.round(lapObj.stats[DataHeartRateMax.type] as number, 3);
      }

      if (lapObj.stats[DataPowerAvg.type]) {
        lapObj.stats[DataPowerAvg.type] = _.round(lapObj.stats[DataPowerAvg.type] as number, 3);
      }

      if (lapObj.stats[DataEnergy.type]) {
        lapObj.stats[DataEnergy.type] = _.round(lapObj.stats[DataEnergy.type] as number, 3);
      }

      return lapObj;
    });
  }

  // processSummits(url: string): Promise<any> {
  //   url = "/Users/colinadams/Downloads/export_14653597/activities";

  //   return url;
  // }
  // 1. Parse GPX Data to extract coordinates
  // private static parseGPX = (gpxFile: string) => {
  //   const gpxData = fs.readFileSync(gpxFile).toString();
  //   const gpx = new GPXParser();
  //   gpx.parse(gpxData);

  //   const trackPoints = gpx.tracks[0].points.map((point: any) => ({
  //     lat: point.lat,
  //     lon: point.lon
  //   }));

  //   return trackPoints;
  // };

  // // 2. Query OSM for Summits using Overpass API
  // private static querySummitsFromOSM = async (bbox: string) => {
  //   const overpassQuery = `
  // [out:json];
  // node["natural"="peak"]${bbox};
  // out body;
  // `;

  //   try {
  //     const response = await axios.post("https://overpass-api.de/api/interpreter", overpassQuery);
  //     const summits = response.data.elements.map((element: any) => ({
  //       lat: element.lat,
  //       lon: element.lon,
  //       name: element.tags.name
  //     }));
  //     return summits;
  //   } catch (error) {
  //     console.error("Error querying OSM:", error);
  //     return [];
  //   }
  // };

  // // 3. Function to calculate proximity
  // private static withinRange = (trackPoints: any[], summits: any[], maxDistanceInMeters: number) => {
  //   const closeSummits: any[] = [];

  //   trackPoints.forEach(trackPoint => {
  //     summits.forEach(summit => {
  //       const distance = getDistance(
  //         { latitude: trackPoint.lat, longitude: trackPoint.lon },
  //         { latitude: summit.lat, longitude: summit.lon }
  //       );
  //       if (distance <= maxDistanceInMeters) {
  //         closeSummits.push({
  //           summitName: summit.name,
  //           summitLat: summit.lat,
  //           summitLon: summit.lon,
  //           distance: distance
  //         });
  //       }
  //     });
  //   });

  //   return closeSummits;
  // };

  // // 4. Main Function to Check Proximity of GPX Track to Summits
  // public static async checkProximityToSummits(gpxFile: string): Promise<void> {
  //   // a. Parse the GPX file
  //   const x = await this.getEvent(gpxFile);
  //   const trackPoints = this.parseGPX(gpxFile);

  //   // b. Define the bounding box around your GPX track (minLat, minLon, maxLat, maxLon)
  //   const bbox = "[minLat,minLon,maxLat,maxLon]"; // Adjust the bounding box accordingly

  //   // c. Query OSM for summits in the bounding box
  //   const summits = await this.querySummitsFromOSM(bbox);

  //   // d. Calculate proximity (0.2 miles = 322 meters)
  //   const closeSummits = this.withinRange(trackPoints, summits, 322);

  //   // e. Output the summits within 0.2 miles
  //   if (closeSummits.length > 0) {
  //     console.log("Summits within 0.2 miles:", closeSummits);
  //   } else {
  //     console.log("No summits found within 0.2 miles of your GPX track.");
  //   }
  // }
}
