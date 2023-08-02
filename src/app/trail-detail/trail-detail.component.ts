import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import * as mapboxgl from 'mapbox-gl';
// @ts-ignore
import * as toGeoJSON from 'togeojson';
@Component({
  selector: 'app-trail-detail',
  templateUrl: './trail-detail.component.html',
  styleUrls: ['./trail-detail.component.scss']
})
export class TrailDetailComponent implements OnInit {
  map!: mapboxgl.Map;
  accessToken = 'pk.eyJ1IjoibXVqYWhpZC1pcWJhbCIsImEiOiJjbGtnaHc5NmgwMGliM2RtcXFoeGNkbHk0In0.XMNzzTI2nHCObuDa8qaNlQ';
  gpxData: any
  gpxFiles = ['assets/gpx-files/Stage-1-Route-1.gpx', 'assets/gpx-files/Stage-1-Route-2-FINAL-stiched-Pretzel.gpx'];
  constructor(private http: HttpClient,) { }

  ngOnInit(): void {
    this.initializeMap();
  }
  initializeMap(): void {
    this.map = new mapboxgl.Map({
      accessToken: this.accessToken,
      container: 'map', // Replace 'map' with the ID of your map container element in the template
      style: 'mapbox://styles/mapbox/outdoors-v11',
      center: [133.775136, -25.274398], // Set the initial map center coordinates
      zoom: 4 // Set the initial zoom level
    });
    // Add the line string to the map
    this.map.on('load', () => {
      var downloadButton = document.createElement('button');
      downloadButton.textContent = 'Download KML';
      
      this.loadGPXFiles();


      // Add popups for start and end markers
      // this.addPopup(this.startMarker, 'Start', YOUR_START_LONGITUDE, YOUR_START_LATITUDE);
      // this.addPopup(this.endMarker, 'End', YOUR_END_LONGITUDE, YOUR_END_LATITUDE);
    });

  }

  loadGPXFiles(): void {
    for (let i = 0; i < this.gpxFiles.length; i++) {
      const element = this.gpxFiles[i];
      this.http.get(element, { responseType: 'text' })
        .subscribe(
          gpxData => {
            const parser = new DOMParser();
            const gpxDocument = parser.parseFromString(gpxData, 'text/xml');
            const gpxDataGeoJSON = toGeoJSON.gpx(gpxDocument);
            console.log(gpxDataGeoJSON);
            this.drawGPX(gpxDataGeoJSON, i); // Pass index i as a unique identifier for each GPX file
          },
          error => {
            console.error('Error fetching GPX data:', error);
          }
        );
    }
  }
  
  drawGPX(gpxDataGeoJSON: any, index: number) {
    const lineFeatures: any[] = [];
    const pointFeatures: any[] = [];
  
    gpxDataGeoJSON.features.forEach((feature: any) => {
      if (feature.geometry.type === 'LineString') {
        lineFeatures.push(feature);
      } else if (feature.geometry.type === 'Point') {
        pointFeatures.push(feature);
      }
    });
  
    const propName: any = localStorage.getItem('propertiesName');
    const includedNames: string = propName ? JSON.parse(propName) : '';
  
    if (pointFeatures.some((point) => point.properties.name === includedNames)) {
      this.map.addLayer({
        id: 'line-selected-' + index,
        type: 'line',
        source: {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: lineFeatures,
          },
        },
        paint: {
          'line-color': 'red',
          'line-width': 2,
        },
      });
  
      this.map.addLayer({
        id: 'point-selected-' + index,
        type: 'symbol',
        source: {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: pointFeatures,
          },
        },
        layout: {
          'icon-image': 'custom-marker', // Specify the icon image for the marker
          'icon-size': 0.5,
          'icon-anchor': 'bottom',
        },
      });
  
      this.map?.loadImage(
        'assets/marker.png', // Replace with the URL of your custom marker image
        (error, image: any) => {
          if (error) throw error;
          this.map?.addImage('custom-marker', image, {
            pixelRatio: 1, // Adjust this value if you have high-resolution images
            sdf: false, // Replace with the actual height of your custom marker image
          });
        }
      );
  
      // Fit the map to the bounds of the selected GPX data
      this.map?.fitBounds(gpxDataGeoJSON.features[0].geometry.coordinates, {
        padding: 20,
        maxZoom: 9,
      });
  
    } else {
      // Remove the layers if not matching the name
      this.map?.removeLayer('line-selected-' + index);
      this.map?.removeLayer('point-selected-' + index);
  
      // Remove the sources as well to prevent potential issues
      this.map?.removeSource('line-selected-' + index);
      this.map?.removeSource('point-selected-' + index);
    }
  }
    
  downloadKML() {
    const kml = toGeoJSON.kml(this.gpxData);
    const blob = new Blob([kml], { type: 'application/vnd.google-earth.kml+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'line_data.kml';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  private addPopup(marker: mapboxgl.Marker, text: string, lng: number, lat: number) {
    const popup = new mapboxgl.Popup({
      closeButton: false,
    }).setLngLat([lng, lat]).setHTML(`<p>${text}</p><p>Longitude: ${lng}</p><p>Latitude: ${lat}</p>`);

    marker.setPopup(popup);
  }
}
