document.addEventListener('DOMContentLoaded', () => {
    const resultButton = document.getElementById('resultButton');
    const resultsContainer = document.getElementById('resultsContainer');
    const loadingOverlay = document.getElementById('loadingOverlay');

    // Retrieve coordinates from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const coordinates = {
        latitude1: parseFloat(urlParams.get('lat1')),
        longitude1: parseFloat(urlParams.get('lon1')),
        latitude2: parseFloat(urlParams.get('lat2')),
        longitude2: parseFloat(urlParams.get('lon2')),
        latitude3: parseFloat(urlParams.get('lat3')),
        longitude3: parseFloat(urlParams.get('lon3')),
        latitude4: parseFloat(urlParams.get('lat4')),
        longitude4: parseFloat(urlParams.get('lon4')),
    };

    const sourceCoords = {
        lat: parseFloat(urlParams.get('sourceLat')),
        lon: parseFloat(urlParams.get('sourceLon')),
    };
    const destinationCoords = {
        lat: parseFloat(urlParams.get('destLat')),
        lon: parseFloat(urlParams.get('destLon')),
    };

    // Validate coordinates
    if (!coordinates.latitude1 || !coordinates.longitude1 || !coordinates.latitude2 || !coordinates.longitude2 || 
        !coordinates.latitude3 || !coordinates.longitude3 || !coordinates.latitude4 || !coordinates.longitude4) {
        showNotification('No region coordinates found. Please go back and define a region.', 'error');
        console.error('Invalid region coordinates:', coordinates);
        return;
    }
    console.log('Region coordinates:', coordinates);

    if (!sourceCoords.lat || !sourceCoords.lon || !destinationCoords.lat || !destinationCoords.lon) {
        showNotification('Source or destination coordinates missing. Please go back and select points.', 'error');
        console.error('Invalid source/destination coordinates:', { sourceCoords, destinationCoords });
        return;
    }
    console.log('Source coordinates:', sourceCoords);
    console.log('Destination coordinates:', destinationCoords);

    // Retrieve map state from localStorage
    const mapStateStr = localStorage.getItem('mapState');
    if (!mapStateStr) {
        showNotification('Map state not found. Please go back and generate the map again.', 'error');
        console.error('No map state in localStorage');
        return;
    }

    let mapState;
    try {
        mapState = JSON.parse(mapStateStr);
        console.log('Map state loaded:', mapState);
    } catch (error) {
        showNotification('Failed to parse map state. Please try again.', 'error');
        console.error('Error parsing map state:', error);
        return;
    }

    // Validate map state for essential properties
    if (!mapState.center || !mapState.zoom || !mapState.regionBoundary || !mapState.tileLayer) {
        showNotification('Invalid map state data. Please go back and try again.', 'error');
        console.error('Invalid map state structure:', mapState);
        return;
    }

    // Initialize map with the stored state (center and zoom)
    const map = L.map('map').setView([mapState.center.lat, mapState.center.lng], mapState.zoom);
    console.log('Map initialized with center:', mapState.center, 'zoom:', mapState.zoom);

    // Add the same tile layer as in optimalroute
    L.tileLayer(mapState.tileLayer, {
        attribution: mapState.tileLayerAttribution,
    }).addTo(map);
    console.log('Tile layer added:', mapState.tileLayer);

    // Add the region boundary
    const regionBoundary = L.polygon(
        mapState.regionBoundary,
        {
            color: 'blue',
            weight: 2,
            fillOpacity: 0.1
        }
    ).addTo(map);
    console.log('Region boundary added:', mapState.regionBoundary);

    // Define custom icons for markers
    const greenIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.3/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    const redIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.3/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    // Add source marker using URL parameters
    let sourceMarker = L.marker([sourceCoords.lat, sourceCoords.lon], { icon: greenIcon })
        .addTo(map)
        .bindPopup(mapState.sourceMarker?.popup || 'Source')
        .openPopup();
    console.log('Source marker added at:', sourceCoords);

    // Add destination marker using URL parameters
    let destinationMarker = L.marker([destinationCoords.lat, destinationCoords.lon], { icon: redIcon })
        .addTo(map)
        .bindPopup(mapState.destinationMarker?.popup || 'Destination')
        .openPopup();
    console.log('Destination marker added at:', destinationCoords);

    // Create route layer (empty initially)
    let routeLayer = L.layerGroup().addTo(map);
    console.log('Route layer initialized (empty)');

    // Adjust map bounds to include source, destination, and region boundary
    const initialBounds = [
        [sourceCoords.lat, sourceCoords.lon],
        [destinationCoords.lat, destinationCoords.lon],
        ...mapState.regionBoundary
    ];
    map.fitBounds(initialBounds);
    console.log('Initial map bounds set:', initialBounds);

    // Ensure map renders correctly after load
    setTimeout(() => {
        map.invalidateSize();
        console.log('Map size invalidated for proper rendering');
    }, 100);

    // Function to analyze routes using existing /get-routes-for-analysis endpoint
    const analyzeRoutes = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            showNotification('Authentication required. Please log in again.', 'error');
            console.error('No token found');
            return [];
        }
        console.log('Token found:', token);

        // Since coordinates is an object with 8 numbers, it's small, but let's assume the server might expect or return large data
        // We'll send the request as is, but handle potential large responses or misinterpretation
        try {
            // Log payload size to debug
            const payload = JSON.stringify(coordinates);
            console.log('Payload size:', new Blob([payload]).size, 'bytes');

            const response = await fetch('/get-routes-for-analysis', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token,
                },
                body: payload,
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to analyze routes: ${response.status} - ${errorText}`);
            }
            const data = await response.json();
            console.log('Analysis response:', data);

            if (data.routes && data.routes.length > 0) {
                routeLayer.clearLayers();
                console.log('Cleared existing routes');

                data.routes.forEach((route, index) => {
                    const coords = route.coords;
                    if (Array.isArray(coords) && coords.length > 0 && Array.isArray(coords[0])) {
                        const polyline = L.polyline(coords, { color: 'red', weight: 2 })
                            .addTo(routeLayer)
                            .bindPopup(route.name || `Route ${index + 1}`);
                        console.log(`Analyzed route ${index + 1} added with ${coords.length} points`);
                    } else {
                        console.warn(`Invalid route coords at index ${index}:`, route);
                    }
                });

                const regionBounds = mapState.regionBoundary;
                const routeBounds = [
                    [sourceCoords.lat, sourceCoords.lon],
                    [destinationCoords.lat, destinationCoords.lon]
                ];
                const combinedBounds = [
                    [
                        Math.min(...regionBounds.map(p => p[0]), sourceCoords.lat, destinationCoords.lat),
                        Math.min(...regionBounds.map(p => p[1]), sourceCoords.lon, destinationCoords.lon)
                    ],
                    [
                        Math.max(...regionBounds.map(p => p[0]), sourceCoords.lat, destinationCoords.lat),
                        Math.max(...regionBounds.map(p => p[1]), sourceCoords.lon, destinationCoords.lon)
                    ]
                ];
                map.fitBounds(combinedBounds);
                console.log('Map bounds adjusted after analysis:', combinedBounds);

                return data.routes;
            } else {
                throw new Error('No analyzed routes returned');
            }
        } catch (error) {
            console.error('Error analyzing routes:', error);
            showNotification('Failed to analyze routes. Using mock data.', 'warning');
            const routesToAnalyze = mapState.routes && mapState.routes.length > 0
                ? mapState.routes.map((route, index) => ({
                    name: `Route ${index + 1}`,
                    coords: route.coords
                }))
                : [];
            return routesToAnalyze;
        }
    };

    const evaluateRouteSafety = (route) => {
        return {
            elevationSlope: Math.random() > 0.2,
            terrainType: Math.random() > 0.3,
            weatherImpact: Math.random() > 0.1,
            obstacles: Math.random() > 0.4,
            landslideRisk: Math.random() > 0.25,
            wildlifeThreats: Math.random() > 0.15
        };
    };

    const factorNames = {
        elevationSlope: "Elevation & Slope",
        terrainType: "Terrain Type",
        weatherImpact: "Weather Impact",
        obstacles: "Obstacles",
        landslideRisk: "Landslide Risk",
        wildlifeThreats: "Wildlife Threats"
    };

    const factorDescriptions = {
        elevationSlope: {
            safe: "The elevation and slope are gentle, making the route easy to traverse with minimal risk of fatigue or injury.",
            unsafe: "Steep slopes and significant elevation changes pose risks of fatigue, falls, or difficulty navigating."
        },
        terrainType: {
            safe: "The terrain is smooth and stable, ideal for safe passage without unexpected challenges.",
            unsafe: "Rough, uneven, or unstable terrain increases the risk of tripping or vehicle damage."
        },
        weatherImpact: {
            safe: "Current and forecasted weather conditions are favorable, ensuring clear visibility and safe travel.",
            unsafe: "Adverse weather such as heavy rain, fog, or storms could reduce visibility and make the route hazardous."
        },
        obstacles: {
            safe: "No significant obstacles detected, allowing for an unobstructed journey.",
            unsafe: "Obstacles like fallen trees, rocks, or narrow passages may impede progress or require detours."
        },
        landslideRisk: {
            safe: "Geological conditions indicate a low risk of landslides, ensuring route stability.",
            unsafe: "High landslide risk due to unstable soil or recent seismic activity could endanger travelers."
        },
        wildlifeThreats: {
            safe: "Minimal wildlife activity detected, posing no significant threat to safety.",
            unsafe: "Presence of dangerous wildlife or frequent animal crossings increases the risk of encounters."
        }
    };

    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    }

    // Store analyzed routes globally
    let analyzedRoutesData = [];

    // Function to display routes
    const displayRoutes = (routes) => {
        resultsContainer.innerHTML = '';

        routes.forEach((route, index) => {
            const safety = route.safety || evaluateRouteSafety(route);
            route.safety = safety; // Store safety data
            const resultItem = document.createElement('div');
            resultItem.className = 'result-item';
            resultItem.style.animation = `slideUp ${0.3 + index * 0.1}s ease-out forwards`;

            const routeName = document.createElement('div');
            routeName.className = 'route-name';
            routeName.textContent = route.name;
            resultItem.appendChild(routeName);

            const factorsContainer = document.createElement('div');
            factorsContainer.className = 'factors-container';

            Object.entries(safety).forEach(([factorKey, isSafe], factorIndex) => {
                const factorItem = document.createElement('div');
                factorItem.className = 'factor-item';
                factorItem.style.animation = `fadeIn ${0.3 + factorIndex * 0.1}s ease-out forwards`;

                const checkbox = document.createElement('div');
                checkbox.className = `factor-checkbox ${isSafe ? 'safe' : 'unsafe'}`;
                checkbox.innerHTML = isSafe
                    ? `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`
                    : `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;

                const factorName = document.createElement('span');
                factorName.className = 'factor-name';
                factorName.textContent = factorNames[factorKey];

                const viewBtn = document.createElement('button');
                viewBtn.className = 'view-factor-btn';
                viewBtn.textContent = 'View Details';
                viewBtn.onclick = () => showFactorDescription(route.name, factorKey, isSafe);

                factorItem.appendChild(checkbox);
                factorItem.appendChild(factorName);
                factorItem.appendChild(viewBtn);

                if (factorIndex === Object.keys(safety).length - 1) {
                    const goThroughBtn = document.createElement('button');
                    goThroughBtn.className = 'go-through-btn';
                    goThroughBtn.textContent = 'Navigate';
                    goThroughBtn.onclick = () => {
                        // Clear existing routes and show selected route on map
                        routeLayer.clearLayers();
                        if (route.coords && Array.isArray(route.coords) && route.coords.length > 0) {
                            const polyline = L.polyline(route.coords, { color: 'green', weight: 3 })
                                .addTo(routeLayer)
                                .bindPopup(`Navigating ${route.name}`);
                            map.fitBounds(polyline.getBounds());
                            console.log(`Navigating route ${route.name} displayed on map`);
                        } else {
                            console.warn(`No valid coordinates for route ${route.name}`);
                            showNotification(`No valid path data for ${route.name}`, 'warning');
                        }
                        showNotification(`Navigating ${route.name}`, 'success');
                    };
                    factorItem.appendChild(goThroughBtn);
                }

                factorsContainer.appendChild(factorItem);
            });

            resultItem.appendChild(factorsContainer);
            resultsContainer.appendChild(resultItem);
        });
    };

    // Function to display only safe routes
    const displaySafeRoutes = () => {
        console.log('Safe Route button clicked');
        const safeRoutes = analyzedRoutesData.filter(route => {
            const safety = route.safety || evaluateRouteSafety(route);
            route.safety = safety;
            return Object.values(safety).every(isSAFE => isSAFE === true);
        });

        if (safeRoutes.length === 0) {
            showNotification('No fully safe routes found.', 'warning');
            resultsContainer.innerHTML = '<p>No safe routes available.</p>';
            return;
        }

        displayRoutes(safeRoutes);
        showNotification(`Displaying ${safeRoutes.length} safe route(s).`, 'success');
    };

    // Function to show factor description
    const showFactorDescription = (routeName, factorKey, isSafe) => {
        const existingBox = document.getElementById('factorDescriptionBox');
        if (existingBox) existingBox.remove();

        const descriptionBox = document.createElement('div');
        descriptionBox.id = 'factorDescriptionBox';
        descriptionBox.className = 'factor-description-box';
        descriptionBox.style.position = 'absolute';
        descriptionBox.style.top = '50%';
        descriptionBox.style.left = '50%';
        descriptionBox.style.transform = 'translate(-50%, -50%)';
        descriptionBox.style.backgroundColor = 'white';
        descriptionBox.style.padding = '20px';
        descriptionBox.style.border = '2px solid #333';
        descriptionBox.style.borderRadius = '8px';
        descriptionBox.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
        descriptionBox.style.zIndex = '1000';
        descriptionBox.style.maxWidth = '400px';
        descriptionBox.style.fontFamily = 'Arial, sans-serif';
        descriptionBox.style.color = '#000000'; // Dark black text

        const title = document.createElement('h3');
        title.textContent = `${factorNames[factorKey]} - ${routeName}`;
        title.style.margin = '0 0 10px 0';
        title.style.color = '#000000'; // Dark black text
        descriptionBox.appendChild(title);

        const description = document.createElement('p');
        description.textContent = isSafe
            ? factorDescriptions[factorKey].safe
            : factorDescriptions[factorKey].unsafe;
        description.style.margin = '0 0 15px 0';
        description.style.color = '#000000'; // Dark black text
        descriptionBox.appendChild(description);

        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Close';
        closeBtn.style.backgroundColor = '#ff4444';
        closeBtn.style.color = 'white';
        closeBtn.style.border = 'none';
        closeBtn.style.padding = '8px 16px';
        closeBtn.style.borderRadius = '4px';
        closeBtn.style.cursor = 'pointer';
        closeBtn.onclick = () => descriptionBox.remove();
        descriptionBox.appendChild(closeBtn);

        document.body.appendChild(descriptionBox);
        console.log(`Displayed description for ${factorNames[factorKey]} in ${routeName}`);
    };

    resultButton.addEventListener('click', async () => {
        loadingOverlay.classList.add('active');
        console.log('Analyze Routes button clicked');
        
        try {
            analyzedRoutesData = await analyzeRoutes();
            resultsContainer.innerHTML = '';
            resultsContainer.style.display = 'block';
            console.log('Analyzed routes:', analyzedRoutesData);

            if (analyzedRoutesData.length === 0) {
                showNotification('No routes available to analyze.', 'warning');
                return;
            }

            displayRoutes(analyzedRoutesData);

            // Add Safe Route button
            const existingSafeRouteBtn = document.getElementById('safeRouteButton');
            if (!existingSafeRouteBtn) {
                const safeRouteButton = document.createElement('button');
                safeRouteButton.id = 'safeRouteButton';
                safeRouteButton.className = 'result-btn pulse-animation';
                safeRouteButton.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                    Safe Route
                `;
                safeRouteButton.addEventListener('click', displaySafeRoutes);
                const actionPanel = document.querySelector('.action-panel');
                actionPanel.appendChild(safeRouteButton);
                console.log('Safe Route button added');
            }

        } catch (error) {
            showNotification('Error analyzing routes. Please try again.', 'error');
            console.error('Error in route analysis:', error);
        } finally {
            loadingOverlay.classList.remove('active');
            console.log('Loading overlay deactivated');
        }
    });

    console.log('Page loaded, waiting for user to click Analyze Routes');
});