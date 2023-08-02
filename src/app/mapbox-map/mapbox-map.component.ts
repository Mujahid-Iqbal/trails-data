import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
// @ts-ignore
import * as toGeoJSON from 'togeojson';
import * as mapboxgl from 'mapbox-gl';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-mapbox-map',
  templateUrl: './mapbox-map.component.html',
  styleUrls: ['./mapbox-map.component.scss']
})
export class MapboxMapComponent implements OnInit {
  map!: mapboxgl.Map;
  gpxData: any;
  FinalData: any
  coordinatesData: any;
  domainName: any
  accessToken = 'pk.eyJ1IjoibXVqYWhpZC1pcWJhbCIsImEiOiJjbGtnaHc5NmgwMGliM2RtcXFoeGNkbHk0In0.XMNzzTI2nHCObuDa8qaNlQ';
  gpxFiles = ['assets/gpx-files/Stage-1-Route-1.gpx', 'assets/gpx-files/Stage-1-Route-2-FINAL-stiched-Pretzel.gpx'];
  

  constructor(private http: HttpClient, public router: Router) {
   }

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
    this.map.on('load', () => {
      for (let i = 0; i < this.gpxFiles.length; i++) {
        const element = this.gpxFiles[i];
        this.http.get(element, { responseType: 'text' }).subscribe(gpxData => {
          const parser = new DOMParser();
          const gpxDocument = parser.parseFromString(gpxData, 'text/xml');
          const gpxDataGeoJSON = toGeoJSON.gpx(gpxDocument);
          this.gpxData = gpxDataGeoJSON
          this.drawGPX(gpxDataGeoJSON, i);
        });
      }
    });

  }

  drawGPX(gpxDataGeoJSON: any, index: number): void {
    const sourceId = 'earthquakes-' + index;
    this.map.addSource(sourceId, {
      type: 'geojson',
      data: gpxDataGeoJSON,
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50
    });

    this.map.addLayer({
      id: 'line-' + index,
      type: 'line',
      source: sourceId,
      paint: {
        'line-color': 'red',
        'line-width': 2,
      },
    });

    this.map.addLayer({
      id: 'clusters-' + index,
      type: 'circle',
      source: sourceId,
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': ['step', ['get', 'point_count'], '#51bbd6', 100, '#f1f075', 750, '#f28cb1'],
        'circle-radius': ['step', ['get', 'point_count'], 20, 100, 30, 750, 40]
      }
    });

    this.map.addLayer({
      id: 'cluster-count-' + index,
      type: 'symbol',
      source: sourceId,
      filter: ['has', 'point_count'],
      layout: {
        'text-field': ['get', 'point_count_abbreviated'],
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': 12
      }
    });

    this.map.addLayer({
      id: 'unclustered-point-' + index,
      type: 'symbol',
      source: sourceId,
      filter: ['!', ['has', 'point_count']],
      layout: {
        'icon-image': 'custom-marker',
        'icon-size': 0.5,
        'icon-anchor': 'bottom'
      }
    });

    // Add a custom marker image
    this.map.loadImage(
      'assets/marker.png',
      (error, image: any) => {
        if (error) throw error;
        this.map.addImage('custom-marker', image, {
          pixelRatio: 1,
          sdf: false,
        });
      }
    );
    this.map.fitBounds(gpxDataGeoJSON.features[0].geometry.coordinates, {
      padding: 20,
      maxZoom: 6,
    });

    this.map.on('click', 'clusters-' + index, (e: any) => {
      const features: any = this.map.queryRenderedFeatures(e.point, {
        layers: ['clusters-' + index]
      });
  
      if (features.length > 0) {
        const clusterId = features[0].properties.cluster_id;
        const source = this.map.getSource('earthquakes-' + index) as mapboxgl.GeoJSONSource;
        source.getClusterExpansionZoom(clusterId, (err: any, clusterExpansionZoom: any) => {
          if (err) return;
  
          this.map.easeTo({
            center: features[0].geometry.coordinates,
            zoom: clusterExpansionZoom
          });
        });
      }
    });

    this.map.on('click', 'unclustered-point-' + index, (e: any) => {
      const features: any = this.map.queryRenderedFeatures(e.point, {
        layers: ['unclustered-point-' + index]
      });
      if (features.length > 0) {
        const coordinates = features[0].geometry.coordinates.slice();
        const mag = features[0].properties.name;
        localStorage.setItem('propertiesName', JSON.stringify(mag) )
        const description = features[0].properties.desc;
  
        let foundFeature = null;
        for (const feature of gpxDataGeoJSON.features) { // Use the correct GeoJSON data
          if (feature.properties.name === mag) {
            foundFeature = feature;
            break;
          }
        }
  
        // Output the found feature, if any
        if (foundFeature) {
          localStorage.setItem("Found_Feature", JSON.stringify(foundFeature));
        } else {
          console.log("Feature not found with the required name.");
        }
  
// Ensure that if the map is zoomed out such that
      // multiple copies of the feature are visible, the
      // popup appears over the copy being pointed to.
      while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
      }

      const cardContent = `
            <article class="card card-trail card-trail--popup" >
                <div class="card-trail__hero">
                    <img src="https://trailswa.com.au/storage/media/n07428304dzx/conversions/Wannamal-(16)-crop-329x188.JPG" alt="Wannamal Walk, Chittering image" class="card-image" style="width: 100%;">
                </div>
                <div class="card-trail__copy" id="title">
                    <h3 class="card__title">
                        <a class="card__link-cover">${mag}</a>
                    </h3>
                    <div class="card-trail__types">
                        <span class="card-trail__types-type">${description}</span>
                    </div>
                    <ul class="card-trail__meta">
                        <li>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 16" width="14" height="16">
                                <!-- SVG path for the clock icon -->
                            </svg>
                            <span>1-3 hours</span>
                        </li>
                        <li>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16">
                                <!-- SVG path for the distance icon -->
                            </svg>
                            <span>3.2km</span>
                        </li>
                    </ul>
                </div>
            </article>`;
      const divElement = document.createElement('div');
      const assignBtn = document.createElement('div');
      assignBtn.innerHTML = `${cardContent}`;
      divElement.appendChild(assignBtn);

      assignBtn.addEventListener('click', (e) => {
        this.router.navigate(['/trail']);
      });

      new mapboxgl.Popup()
        .setLngLat(coordinates)
        .setDOMContent(divElement).addTo(this.map);      }

      
    });
  }


  createKMLFromGeoJSON() {
    // Convert GeoJSON to KML format
    let kml = '<?xml version="1.0" encoding="UTF-8"?>' +
      '<kml xmlns="http://www.opengis.net/kml/2.2">' +
      '<Document>' +
      '<Placemark>' +
      '<name>Drawn Line</name>' +
      '<LineString>' +
      '<coordinates>';
    this.gpxData.features[0].geometry.coordinates.forEach((coord: any) => {
      kml += `${coord[0]},${coord[1]},0\n`;
    });

    kml += '</coordinates>' +
      '</LineString>' +
      '</Placemark>' +
      '</Document>' +
      '</kml>';

    return kml;
  }

  downloadKML() {
    const kmlData = this.createKMLFromGeoJSON();
    const fileName = 'feature.kml'
   // Create a Blob from the KML data
   const blob = new Blob([kmlData], { type: 'application/vnd.google-earth.kml+xml' });

   // Create a download link and click it programmatically to trigger the download
   const url = window.URL.createObjectURL(blob);
   const a = document.createElement('a');
   a.href = url;
   a.download = fileName;
   a.click();
   window.URL.revokeObjectURL(url);
  }
}
