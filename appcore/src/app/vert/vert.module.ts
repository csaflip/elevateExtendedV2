import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { CoreModule } from "../core/core.module";
import { VertComponent } from "./vert.component";
import { ActivityViewService } from "../desktop/activity-view/shared/activity-view.service";
import { ActivitySensorsService } from "../desktop/activity-view/shared/activity-sensors.service";
import { ActivityStatsService } from "../desktop/activity-view/shared/activity-stats.service";
import { TimeInZonesService } from "../desktop/activity-view/activity-view-time-in-zones/services/time-in-zones.service";

const routes: Routes = [
  {
    path: "",
    component: VertComponent
  }
];

@NgModule({
  imports: [CoreModule, RouterModule.forChild(routes)],
  declarations: [VertComponent],
  providers: [ActivityViewService, ActivitySensorsService, ActivityStatsService, TimeInZonesService]
})
export class VertModule {}
