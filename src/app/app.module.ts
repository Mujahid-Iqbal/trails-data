import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MapboxMapComponent } from './mapbox-map/mapbox-map.component';
import { TrailDetailComponent } from './trail-detail/trail-detail.component';

@NgModule({
  declarations: [
    AppComponent,
    MapboxMapComponent,
    TrailDetailComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
