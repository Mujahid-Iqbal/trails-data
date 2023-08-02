import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MapboxMapComponent } from './mapbox-map/mapbox-map.component';
import { TrailDetailComponent } from './trail-detail/trail-detail.component';

const routes: Routes = [
  { path: '', redirectTo: 'trails', pathMatch: 'full' },
  { path: 'trails', component: MapboxMapComponent },
  { path: 'trail', component: TrailDetailComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
