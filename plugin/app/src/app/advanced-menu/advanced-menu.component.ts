import { Component, OnInit } from '@angular/core';
import { UserSettingsService } from "../shared/services/user-settings/user-settings.service";
import { ConfirmDialogDataModel } from "../shared/dialogs/confirm-dialog/confirm-dialog-data.model";
import { ConfirmDialogComponent } from "../shared/dialogs/confirm-dialog/confirm-dialog.component";
import { MatDialog, MatSnackBar } from "@angular/material";
import { AthleteHistoryService } from "../shared/services/athlete-history/athlete-history.service";

@Component({
	selector: 'app-advanced-menu',
	templateUrl: './advanced-menu.component.html',
	styleUrls: ['./advanced-menu.component.scss']
})
export class AdvancedMenuComponent implements OnInit {

	constructor(public userSettingsService: UserSettingsService,
				public athleteHistoryService: AthleteHistoryService,
				public dialog: MatDialog,
				public snackBar: MatSnackBar) {
	}

	public ngOnInit(): void {
	}

	public onAthleteHistoryClear(): void {

		const data: ConfirmDialogDataModel = {
			title: "Clear your athlete history",
			content: "Are you sure to perform this action? You will be able to re-import history through backup file " +
			"or a new re-synchronization."
		};

		const dialogRef = this.dialog.open(ConfirmDialogComponent, {
			minWidth: ConfirmDialogComponent.MIN_WIDTH,
			maxWidth: ConfirmDialogComponent.MAX_WIDTH,
			data: data
		});

		const afterClosedSubscription = dialogRef.afterClosed().subscribe((confirm: boolean) => {

			if (confirm) {
				this.athleteHistoryService.remove().then(() => {
					afterClosedSubscription.unsubscribe();
					location.reload();
				}, error => {
					this.snackBar.open(error, "Close");
				});
			}
		});

	}

	public onPluginCacheClear(): void {

		const data: ConfirmDialogDataModel = {
			title: "Clear the plugin cache",
			content: "This will remove caches of the plugin including saved feature preferences. You will not loose your history or athlete settings."
		};

		const dialogRef = this.dialog.open(ConfirmDialogComponent, {
			minWidth: ConfirmDialogComponent.MIN_WIDTH,
			maxWidth: ConfirmDialogComponent.MAX_WIDTH,
			data: data
		});

		const afterClosedSubscription = dialogRef.afterClosed().subscribe((confirm: boolean) => {
			if (confirm) {
				localStorage.clear();
				this.userSettingsService.markLocalStorageClear().then(() => {
					this.snackBar.open("Plugin cache as been cleared", "Reload App").afterDismissed().toPromise().then(() => {
						location.reload();
					});
					afterClosedSubscription.unsubscribe();
				});
			}
		});
	}

	public onUserSettingsReset(): void {

		const data: ConfirmDialogDataModel = {
			title: "TODO",
			content: "TODO"
		};

		const dialogRef = this.dialog.open(ConfirmDialogComponent, {
			minWidth: ConfirmDialogComponent.MIN_WIDTH,
			maxWidth: ConfirmDialogComponent.MAX_WIDTH,
			data: data
		});

		const afterClosedSubscription = dialogRef.afterClosed().subscribe((confirm: boolean) => {
			if (confirm) {
				alert("TO BE DONE");
				// TODO UserSettingsService::reset()
				// TODO UserSettingsDao::reset()
			}
		});

	}
}
