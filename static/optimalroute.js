document.addEventListener('DOMContentLoaded', () => {
    const mapContainer = document.getElementById('mapContainer');
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    const mapContent = document.getElementById('mapContent');
    const sourceDropdown = document.getElementById('source');
    const destinationDropdown = document.getElementById('destination');
    const findRouteButton = document.getElementById('findRouteButton');
    const sourceName = document.getElementById('sourceName');
    const destinationName = document.getElementById('destinationName');
    const emergencyButtonsContainer = document.getElementById('emergencyButtonsContainer');
    const sourceAddress = document.getElementById('sourceAddress');
    const destinationAddress = document.getElementById('destinationAddress');
    const existingRouteButton = document.getElementById('existingRouteButton');
    const previousBtn = document.getElementById('previousBtn');
    const nextBtn = document.getElementById('nextBtn');
    let isFullscreen = false;
    let sourceMarker = null;
    let destinationMarker = null;
    let routeLayer = null;
    let sourcePlacesDropdown = null;
    let destinationPlacesDropdown = null;
    let emergencyData = null;

    // Retrieve the selected purpose from local storage
    const selectedPurpose = JSON.parse(localStorage.getItem('selectedPurpose'));
    if (selectedPurpose) {
        console.log('Selected Purpose:', selectedPurpose.title);
        if (selectedPurpose.title === 'Emergency Evacuation') {
            emergencyButtonsContainer.style.display = 'flex';
        } else {
            emergencyButtonsContainer.style.display = 'none';
        }
    } else {
        console.error('No selected purpose found in localStorage');
    }

    // Function to retrieve coordinates from URL parameters
    const getCoordinates = () => {
        const urlParams = new URLSearchParams(window.location.search);
        console.log('URL Parameters:', urlParams.toString());

        if (
            urlParams.has('lat1') && urlParams.has('lon1') &&
            urlParams.has('lat2') && urlParams.has('lon2') &&
            urlParams.has('lat3') && urlParams.has('lon3') &&
            urlParams.has('lat4') && urlParams.has('lon4')
        ) {
            const coords = {
                latitude1: parseFloat(urlParams.get('lat1')),
                longitude1: parseFloat(urlParams.get('lon1')),
                latitude2: parseFloat(urlParams.get('lat2')),
                longitude2: parseFloat(urlParams.get('lon2')),
                latitude3: parseFloat(urlParams.get('lat3')),
                longitude3: parseFloat(urlParams.get('lon3')),
                latitude4: parseFloat(urlParams.get('lat4')),
                longitude4: parseFloat(urlParams.get('lon4')),
            };
            console.log('Retrieved Coordinates:', coords);
            return coords;
        }

        console.error('Missing coordinates in URL parameters');
        return null;
    };

    const coordinates = getCoordinates();

    if (!coordinates) {
        alert('No coordinates found. Please go back and define a region.');
        return;
    }

    const centerLat = (coordinates.latitude1 + coordinates.latitude2 + coordinates.latitude3 + coordinates.latitude4) / 4;
    const centerLon = (coordinates.longitude1 + coordinates.longitude2 + coordinates.longitude3 + coordinates.longitude4) / 4;

    const map = L.map('map').setView([centerLat, centerLon], 12);

    L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
        attribution: 'Google Satellite',
    }).addTo(map);

    const regionBoundary = L.polygon(
        [
            [coordinates.latitude1, coordinates.longitude1],
            [coordinates.latitude2, coordinates.longitude2],
            [coordinates.latitude3, coordinates.longitude3],
            [coordinates.latitude4, coordinates.longitude4],
        ],
        { color: 'blue', weight: 2, fillOpacity: 0.1 }
    ).addTo(map);

    const clearMarkersAndRoutes = () => {
        if (sourceMarker) {
            map.removeLayer(sourceMarker);
            sourceMarker = null;
        }
        if (destinationMarker) {
            map.removeLayer(destinationMarker);
            destinationMarker = null;
        }
        if (routeLayer) {
            map.removeLayer(routeLayer);
            routeLayer = null;
        }
        map.eachLayer((layer) => {
            if (layer instanceof L.CircleMarker && layer !== regionBoundary) {
                map.removeLayer(layer);
            }
        });
    };

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

    const geocodeAddress = async (address, type) => {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'SafeRoutes/1.0 (prathmeshkl2003@gmail.com)'
                }
            });
            const data = await response.json();
            if (data.length > 0) {
                const { lat, lon } = data[0];
                const coords = { lat: parseFloat(lat), lon: parseFloat(lon) };

                if (type === 'source') {
                    localStorage.setItem('sourceCoords', JSON.stringify(coords));
                    if (sourceMarker) map.removeLayer(sourceMarker);
                    sourceMarker = L.marker([coords.lat, coords.lon], { icon: greenIcon })
                        .addTo(map)
                        .bindPopup(`Source: ${address}`)
                        .openPopup();
                    sourceName.textContent = address;
                    console.log('Source address geocoded and marked with green pin at:', coords);
                    map.setView([coords.lat, coords.lon], 15); // Zoom to source
                } else if (type === 'destination') {
                    localStorage.setItem('destinationCoords', JSON.stringify(coords));
                    if (destinationMarker) map.removeLayer(destinationMarker);
                    destinationMarker = L.marker([coords.lat, coords.lon], { icon: redIcon })
                        .addTo(map)
                        .bindPopup(`Destination: ${address}`)
                        .openPopup();
                    destinationName.textContent = address;
                    console.log('Destination address geocoded and marked with red pin at:', coords);
                    map.setView([coords.lat, coords.lon], 15); // Zoom to destination
                }

                return coords;
            } else {
                console.warn(`No results found for ${type} address: ${address}`);
                alert(`No results found for ${type} address: ${address}`);
                return null;
            }
        } catch (error) {
            console.error(`Error geocoding ${type} address:`, error);
            alert(`Error geocoding ${type} address: ${error.message}. Please try again later.`);
            return null;
        }
    };

    const markPlaceOnMap = (coords, type, name) => {
        if (type === 'source') {
            if (sourceMarker) map.removeLayer(sourceMarker);
            sourceMarker = L.marker([coords.lat, coords.lon], { icon: greenIcon })
                .addTo(map)
                .bindPopup(`Source: ${name}`)
                .openPopup();
            sourceName.textContent = name;
            sourceAddress.value = '';
            console.log('Marked source with green pin at:', coords);
            map.setView([coords.lat, coords.lon], 15); // Zoom to source
        } else if (type === 'destination') {
            if (destinationMarker) map.removeLayer(destinationMarker);
            destinationMarker = L.marker([coords.lat, coords.lon], { icon: redIcon })
                .addTo(map)
                .bindPopup(`Destination: ${name}`)
                .openPopup();
            destinationName.textContent = name;
            destinationAddress.value = '';
            console.log('Marked destination with red pin at:', coords);
            map.setView([coords.lat, coords.lon], 15); // Zoom to destination
        }
    };

    const createSecondaryDropdown = (type, parentElement, places, category) => {
        let secondaryDropdown = type === 'source' ? sourcePlacesDropdown : destinationPlacesDropdown;
        if (secondaryDropdown) {
            secondaryDropdown.remove();
        }

        secondaryDropdown = document.createElement('select');
        secondaryDropdown.id = `${type}Places`;
        secondaryDropdown.innerHTML = '<option value="">Select a place</option>';
        parentElement.insertBefore(secondaryDropdown, parentElement.querySelector(`#${type}Name`));

        if (type === 'source') sourcePlacesDropdown = secondaryDropdown;
        else destinationPlacesDropdown = secondaryDropdown;

        console.log(`Places for category "${category}" (${type}):`, places); // Debugging log

        const uniquePlaces = [...new Map(places.map(p => [p.name, p])).values()];
        if (uniquePlaces.length === 0) {
            secondaryDropdown.innerHTML = '<option value="">No places found</option>';
            console.warn(`No places found for category "${category}" in the selected region.`);
        } else {
            uniquePlaces.forEach(place => {
                const option = document.createElement('option');
                option.value = JSON.stringify({ lat: place.lat, lon: place.lon });
                option.textContent = place.name;
                secondaryDropdown.appendChild(option);
            });
            console.log(`Populated ${uniquePlaces.length} unique places for category "${category}" (${type}).`);
        }

        secondaryDropdown.addEventListener('change', () => {
            const selectedValue = secondaryDropdown.value;
            if (selectedValue) {
                const coords = JSON.parse(selectedValue);
                const name = secondaryDropdown.options[secondaryDropdown.selectedIndex].text;
                markPlaceOnMap(coords, type, name);
                const otherCoords = type === 'source'
                    ? (destinationPlacesDropdown && destinationPlacesDropdown.value ? JSON.parse(destinationPlacesDropdown.value) : null)
                    : (sourcePlacesDropdown && sourcePlacesDropdown.value ? JSON.parse(sourcePlacesDropdown.value) : null);
                if (otherCoords) {
                    drawRoute(type === 'source' ? coords : otherCoords, type === 'source' ? otherCoords : coords);
                }
            } else {
                if (type === 'source' && sourceMarker) {
                    map.removeLayer(sourceMarker);
                    sourceMarker = null;
                    sourceName.textContent = '';
                } else if (type === 'destination' && destinationMarker) {
                    map.removeLayer(destinationMarker);
                    destinationMarker = null;
                    destinationName.textContent = '';
                }
            }
        });

        return secondaryDropdown;
    };

    const populateAdventureDropdowns = (categories) => {
        console.log('Populating Adventure & Trekking dropdowns with categories:', categories);

        const adventureCategories = [
            "Tourism Place",
            "Trekking Place",
            "Adventure Place",
            "Desert Place",
            "Waterbodies",
            "City"
        ];

        sourceDropdown.innerHTML = '<option value="">Select source category</option>';
        destinationDropdown.innerHTML = '<option value="">Select destination category</option>';

        adventureCategories.forEach(category => {
            const optionSource = document.createElement('option');
            optionSource.value = category;
            optionSource.textContent = category.replace(" Place", "");
            sourceDropdown.appendChild(optionSource);

            const optionDestination = document.createElement('option');
            optionDestination.value = category;
            optionDestination.textContent = category.replace(" Place", "");
            destinationDropdown.appendChild(optionDestination);
        });

        sourceDropdown.addEventListener('change', () => {
            const selectedCategory = sourceDropdown.value;
            if (selectedCategory && selectedCategory !== "") {
                const places = categories[selectedCategory] || [];
                console.log(`Source category "${selectedCategory}" selected, available places:`, places); // Debugging log
                createSecondaryDropdown('source', источникDropdown.parentElement, places, selectedCategory);
            } else if (sourcePlacesDropdown) {
                sourcePlacesDropdown.remove();
                sourcePlacesDropdown = null;
                clearMarkersAndRoutes();
                sourceName.textContent = '';
            }
        });

        destinationDropdown.addEventListener('change', () => {
            const selectedCategory = destinationDropdown.value;
            if (selectedCategory && selectedCategory !== "") {
                const places = categories[selectedCategory] || [];
                console.log(`Destination category "${selectedCategory}" selected, available places:`, places); // Debugging log
                createSecondaryDropdown('destination', destinationDropdown.parentElement, places, selectedCategory);
            } else if (destinationPlacesDropdown) {
                destinationPlacesDropdown.remove();
                destinationPlacesDropdown = null;
                clearMarkersAndRoutes();
                destinationName.textContent = '';
            }
        });
    };

    const populateDropdowns = (places) => {
        console.log('Populating dropdowns with places:', places);

        sourceDropdown.innerHTML = '<option value="">Select starting point</option>';
        destinationDropdown.innerHTML = '<option value="">Select destination</option>';

        if (!places || places.length === 0) {
            console.warn('No places provided to populate dropdowns or empty list received');
            sourceDropdown.innerHTML = '<option value="">No places available</option>';
            destinationDropdown.innerHTML = '<option value="">No places available</option>';
            return;
        }

        places.forEach((place) => {
            const optionSource = document.createElement('option');
            optionSource.value = JSON.stringify({ lat: place.lat, lon: place.lon });
            optionSource.textContent = place.name;
            sourceDropdown.appendChild(optionSource);

            const optionDestination = document.createElement('option');
            optionDestination.value = JSON.stringify({ lat: place.lat, lon: place.lon });
            optionDestination.textContent = place.name;
            destinationDropdown.appendChild(optionDestination);
        });
    };

    const populateEmergencyDropdowns = (sourceAll, destinationAll, sourceInRegion, destinationInRegion, color) => {
        console.log('Populating emergency dropdowns with data:', { sourceAll, destinationAll, sourceInRegion, destinationInRegion });

        emergencyData = { sourceAll, destinationAll, sourceInRegion, destinationInRegion };

        sourceDropdown.innerHTML = '<option value="">Select starting point</option>';
        destinationDropdown.innerHTML = '<option value="">Select destination</option>';

        sourceInRegion.forEach((place) => {
            const saferNearbyCity = place['SaferNearbyCity'] || place['Safer Nearby City'] || place['safer_nearby_city'] || place['safeCityName'] || '';
            const safeLat = place['SafeLatitude'] || place['Safe Latitude'] || place['safe_lat'] || '';
            const safeLon = place['SafeLongitude'] || place['Safe Longitude'] || place['safe_lon'] || '';
            
            const optionSource = document.createElement('option');
            optionSource.value = JSON.stringify({ 
                lat: place.lat, 
                lon: place.lon, 
                name: place.name, 
                saferNearbyCity: saferNearbyCity,
                safeLat: safeLat,
                safeLon: safeLon
            });
            optionSource.textContent = place.name;
            sourceDropdown.appendChild(optionSource);
        });

        destinationDropdown.innerHTML = '<option value="">Select a source first</option>';

        clearMarkersAndRoutes();

        sourceInRegion.forEach((place) => {
            L.circleMarker([place.lat, place.lon], {
                radius: 5,
                fillColor: color,
                color: color,
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
            }).addTo(map).bindPopup(`City: ${place.name}`);
        });

        destinationInRegion.forEach((place) => {
            L.circleMarker([place.lat, place.lon], {
                radius: 5,
                fillColor: color,
                color: color,
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
            }).addTo(map).bindPopup(`Safe City: ${place.name}`);
        });
    };

    const updateDestinationDropdown = (selectedSourceValue) => {
        if (!emergencyData || !selectedSourceValue) {
            destinationDropdown.innerHTML = '<option value="">Select a source first</option>';
            return;
        }

        const selectedSource = JSON.parse(selectedSourceValue);
        const saferNearbyCityName = selectedSource.saferNearbyCity;
        const safeLat = parseFloat(selectedSource.safeLat);
        const safeLon = parseFloat(selectedSource.safeLon);

        console.log('Selected Source Data:', selectedSource);

        if (!saferNearbyCityName || isNaN(safeLat) || isNaN(safeLon)) {
            console.error('Missing or invalid safer nearby city data for source:', selectedSource.name);
            destinationDropdown.innerHTML = '<option value="">No safer city specified</option>';
            return;
        }

        const matchingDestination = emergencyData.destinationAll.find(dest => 
            dest.name === saferNearbyCityName && 
            Math.abs(dest.lat - safeLat) < 0.01 && 
            Math.abs(dest.lon - safeLon) < 0.01
        );

        destinationDropdown.innerHTML = '<option value="">Select destination</option>';
        if (matchingDestination) {
            const optionDestination = document.createElement('option');
            optionDestination.value = JSON.stringify({ lat: matchingDestination.lat, lon: matchingDestination.lon });
            optionDestination.textContent = matchingDestination.name;
            destinationDropdown.appendChild(optionDestination);
        } else {
            console.warn('Safer nearby city not found in destinationAll by name and coords:', saferNearbyCityName);
            const optionDestination = document.createElement('option');
            optionDestination.value = JSON.stringify({ lat: safeLat, lon: safeLon });
            optionDestination.textContent = saferNearbyCityName;
            destinationDropdown.appendChild(optionDestination);
        }
    };

    const drawRoute = (sourceCoords, destinationCoords) => {
        fetch('/find-route', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: localStorage.getItem('token'),
            },
            body: JSON.stringify({
                source: sourceCoords,
                destination: destinationCoords
            }),
        })
            .then(response => response.json())
            .then(data => {
                if (data.map_url) {
                    fetch(data.map_url)
                        .then(res => res.text())
                        .then(html => {
                            const parser = new DOMParser();
                            const doc = parser.parseFromString(html, 'text/html');
                            const polylines = doc.querySelectorAll('polyline');
                            if (polylines.length > 0) {
                                const points = polylines[0].getAttribute('points').split(',').map(p => {
                                    const [lat, lon] = p.trim().split(' ').map(Number);
                                    return [lat, lon];
                                });
                                if (routeLayer) map.removeLayer(routeLayer);
                                routeLayer = L.polyline(points, { color: 'red', weight: 3 }).addTo(map);
                                map.fitBounds([[sourceCoords.lat, sourceCoords.lon], [destinationCoords.lat, destinationCoords.lon]]);
                            }
                        });
                } else if (data.error) {
                    console.error('Error fetching route:', data.error);
                    alert(data.error);
                }
            })
            .catch(error => console.error('Error drawing route:', error));
    };

    const populateTransportLogisticsInitialDropdowns = (sourceCategories, destinationCategories) => {
        console.log('Populating Transport & Logistics initial dropdowns');

        sourceDropdown.innerHTML = '<option value="">Select source category</option>';
        destinationDropdown.innerHTML = '<option value="">Select destination category</option>';

        const sourceOptions = [
            "Factories & Manufacturing Product Place",
            "Warehouse",
            "Farms & Agricultural Fields",
            "Ports & Docks",
            "Airports",
            "Railway Stations",
            "Distribution Centers",
            "City"
        ];

        const destinationOptions = [
            "Retail Source & Markets",
            "Warehouse & Distribution Center",
            "Factories & Processing Units",
            "Homes & Business",
            "City"
        ];

        sourceOptions.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            sourceDropdown.appendChild(option);
        });

        destinationOptions.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            destinationDropdown.appendChild(option);
        });

        sourceDropdown.addEventListener('change', () => {
            const selectedCategory = sourceDropdown.value;
            if (selectedCategory && selectedCategory !== "") {
                const places = sourceCategories[selectedCategory] || [];
                createSecondaryDropdown('source', sourceDropdown.parentElement, places, selectedCategory);
            } else if (sourcePlacesDropdown) {
                sourcePlacesDropdown.remove();
                sourcePlacesDropdown = null;
                clearMarkersAndRoutes();
                sourceName.textContent = '';
            }
        });

        destinationDropdown.addEventListener('change', () => {
            const selectedCategory = destinationDropdown.value;
            if (selectedCategory && selectedCategory !== "") {
                const places = destinationCategories[selectedCategory] || [];
                createSecondaryDropdown('destination', destinationDropdown.parentElement, places, selectedCategory);
            } else if (destinationPlacesDropdown) {
                destinationPlacesDropdown.remove();
                destinationPlacesDropdown = null;
                clearMarkersAndRoutes();
                destinationName.textContent = '';
            }
        });
    };

    // Event listeners for address inputs
    sourceAddress.addEventListener('change', async () => {
        const address = sourceAddress.value.trim();
        if (address) {
            const coords = await geocodeAddress(address, 'source');
            if (coords && selectedPurpose.title === 'Emergency Evacuation') {
                updateDestinationDropdown(sourceDropdown.value);
            }
            sourceDropdown.value = '';
        }
    });

    destinationAddress.addEventListener('change', async () => {
        const address = destinationAddress.value.trim();
        if (address) {
            await geocodeAddress(address, 'destination');
            destinationDropdown.value = '';
        }
    });

    if (selectedPurpose) {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No token found in localStorage');
            alert('Authentication token missing. Please log in again.');
            return;
        }

        if (selectedPurpose.title === 'Adventure & Trekking') {
            fetch('/get-places', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token,
                },
                body: JSON.stringify({
                    latitude1: coordinates.latitude1,
                    longitude1: coordinates.longitude1,
                    latitude2: coordinates.latitude2,
                    longitude2: coordinates.longitude2,
                    latitude3: coordinates.latitude3,
                    longitude3: coordinates.longitude3,
                    latitude4: coordinates.latitude4,
                    longitude4: coordinates.longitude4,
                    purpose: 'Adventure & Trekking'
                }),
            })
                .then(response => {
                    console.log('Response Status:', response.status);
                    if (!response.ok) {
                        return response.text().then(text => { throw new Error(`HTTP error! Status: ${response.status}, Body: ${text}`); });
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Raw Response Data from /get-places:', data);
                    if (data.categories) {
                        console.log('Adventure & Trekking Categories:', data.categories);
                        populateAdventureDropdowns(data.categories);
                    } else {
                        console.error('No categories in response:', data);
                        alert('No Adventure & Trekking locations found in the selected region.');
                    }
                })
                .catch(error => {
                    console.error('Detailed Error:', error.message);
                    alert(`Error fetching Adventure & Trekking locations: ${error.message}`);
                });
        } else if (selectedPurpose.title === 'Transport & Logistics') {
            fetch('/get-places', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token,
                },
                body: JSON.stringify({
                    latitude1: coordinates.latitude1,
                    longitude1: coordinates.longitude1,
                    latitude2: coordinates.latitude2,
                    longitude2: coordinates.longitude2,
                    latitude3: coordinates.latitude3,
                    longitude3: coordinates.longitude3,
                    latitude4: coordinates.latitude4,
                    longitude4: coordinates.longitude4,
                    purpose: 'Transport & Logistics'
                }),
            })
                .then(response => {
                    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
                    return response.json();
                })
                .then(data => {
                    if (data.source_categories && data.destination_categories) {
                        console.log('Transport & Logistics Data:', data);
                        populateTransportLogisticsInitialDropdowns(data.source_categories, data.destination_categories);
                    } else {
                        console.error('No Transport & Logistics data found:', data);
                        alert('No Transport & Logistics locations found in the selected region.');
                    }
                })
                .catch(error => {
                    console.error('Error fetching Transport & Logistics places:', error);
                    alert('Error fetching Transport & Logistics locations.');
                });
        } else if (selectedPurpose.title === 'General Use') {
            fetch('/get-places', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token,
                },
                body: JSON.stringify({
                    latitude1: coordinates.latitude1,
                    longitude1: coordinates.longitude1,
                    latitude2: coordinates.latitude2,
                    longitude2: coordinates.longitude2,
                    latitude3: coordinates.latitude3,
                    longitude3: coordinates.longitude3,
                    latitude4: coordinates.latitude4,
                    longitude4: coordinates.longitude4,
                    purpose: 'General Use'
                }),
            })
                .then((response) => {
                    if (!response.ok) {
                        return response.text().then(text => {
                            throw new Error(`HTTP error! Status: ${response.status}, Body: ${text}`);
                        });
                    }
                    return response.json();
                })
                .then((data) => {
                    console.log('Data from /get-places for General Use:', data);
                    if (data.places) {
                        if (data.places.length > 0) {
                            data.places.forEach(place => {
                                if (place.type === 'city' || place.type === 'town' || place.type === 'village') {
                                    console.log(`City/Town/Village found: ${place.name} (${place.lat}, ${place.lon})`);
                                } else if (place.type === 'tourism' || place.type === 'amenity') {
                                    console.log(`Important Spot found: ${place.name} (${place.lat}, ${place.lon}, type: ${place.type})`);
                                }
                            });
                            populateDropdowns(data.places);
                            console.log('Dropdowns populated with', data.places.length, 'places');
                        } else {
                            console.warn('No places found in the selected region.');
                            populateDropdowns([]);
                            alert('No places found in the selected region. Try a different area.');
                        }
                    } else if (data.error) {
                        console.error('Server returned an error:', data.error);
                        alert(`Error from server: ${data.error}`);
                    } else {
                        console.error('Unexpected response format from /get-places:', data);
                        alert('Error fetching places: Invalid data received from server.');
                    }
                })
                .catch((error) => {
                    console.error('Error fetching places for General Use:', error.message);
                    alert(`Error fetching places: ${error.message}. Check the console for details.`);
                });

            sourceDropdown.addEventListener('change', () => {
                const selectedValue = sourceDropdown.value;
                if (selectedValue) {
                    const coords = JSON.parse(selectedValue);
                    const name = sourceDropdown.options[sourceDropdown.selectedIndex].text;
                    markPlaceOnMap(coords, 'source', name);
                    sourceAddress.value = '';
                } else if (sourceMarker) {
                    map.removeLayer(sourceMarker);
                    sourceMarker = null;
                    sourceName.textContent = '';
                }
            });

            destinationDropdown.addEventListener('change', () => {
                const selectedValue = destinationDropdown.value;
                if (selectedValue) {
                    const coords = JSON.parse(selectedValue);
                    const name = destinationDropdown.options[destinationDropdown.selectedIndex].text;
                    markPlaceOnMap(coords, 'destination', name);
                    destinationAddress.value = '';
                } else if (destinationMarker) {
                    map.removeLayer(destinationMarker);
                    destinationMarker = null;
                    destinationName.textContent = '';
                }
            });
        }

        if (selectedPurpose.title === 'Emergency Evacuation') {
            fetch('/get-cities-under-coordinates', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: localStorage.getItem('token'),
                },
                body: JSON.stringify({
                    latitude1: coordinates.latitude1,
                    longitude1: coordinates.longitude1,
                    latitude2: coordinates.latitude2,
                    longitude2: coordinates.longitude2,
                    latitude3: coordinates.latitude3,
                    longitude3: coordinates.longitude3,
                    latitude4: coordinates.latitude4,
                    longitude4: coordinates.longitude4,
                }),
            })
                .then((response) => response.json())
                .then((data) => {
                    if (data.cities) {
                        data.cities.forEach((city) => {
                            L.circleMarker([city.lat, city.lon], {
                                radius: 5,
                                fillColor: 'red',
                                color: 'red',
                                weight: 1,
                                opacity: 1,
                                fillOpacity: 0.8
                            }).addTo(map).bindPopup(`City: ${city.name}`);
                        });
                    }
                })
                .catch((error) => {
                    console.error('Error fetching cities:', error);
                });

            const earthquakeBtn = document.getElementById('earthquakeBtn');
            earthquakeBtn.addEventListener('click', () => {
                fetch('/get-emergency-data', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        type: 'earthquake',
                        latitude1: coordinates.latitude1,
                        longitude1: coordinates.longitude1,
                        latitude2: coordinates.latitude2,
                        longitude2: coordinates.longitude2,
                        latitude3: coordinates.latitude3,
                        longitude3: coordinates.longitude3,
                        latitude4: coordinates.latitude4,
                        longitude4: coordinates.longitude4
                    }),
                })
                    .then((response) => response.json())
                    .then((data) => {
                        console.log("Earthquake Data:", data);
                        populateEmergencyDropdowns(data.source_all, data.destination_all, data.source_in_region, data.destination_in_region, 'red');
                    })
                    .catch((error) => {
                        console.error('Error fetching earthquake data:', error);
                    });
            });

            const landslideBtn = document.getElementById('landslideBtn');
            landslideBtn.addEventListener('click', () => {
                fetch('/get-emergency-data', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        type: 'landslide',
                        latitude1: coordinates.latitude1,
                        longitude1: coordinates.longitude1,
                        latitude2: coordinates.latitude2,
                        longitude2: coordinates.longitude2,
                        latitude3: coordinates.latitude3,
                        longitude3: coordinates.longitude3,
                        latitude4: coordinates.latitude4,
                        longitude4: coordinates.longitude4
                    }),
                })
                    .then((response) => response.json())
                    .then((data) => {
                        console.log("Landslide Data:", data);
                        populateEmergencyDropdowns(data.source_all, data.destination_all, data.source_in_region, data.destination_in_region, 'purple');
                    })
                    .catch((error) => {
                        console.error('Error fetching landslide data:', error);
                    });
            });

            const floodBtn = document.getElementById('floodBtn');
            floodBtn.addEventListener('click', () => {
                fetch('/get-emergency-data', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        type: 'flood',
                        latitude1: coordinates.latitude1,
                        longitude1: coordinates.longitude1,
                        latitude2: coordinates.latitude2,
                        longitude2: coordinates.longitude2,
                        latitude3: coordinates.latitude3,
                        longitude3: coordinates.longitude3,
                        latitude4: coordinates.latitude4,
                        longitude4: coordinates.longitude4
                    }),
                })
                    .then((response) => response.json())
                    .then((data) => {
                        console.log("Flash Flood Data:", data);
                        populateEmergencyDropdowns(data.source_all, data.destination_all, data.source_in_region, data.destination_in_region, 'lightblue');
                    })
                    .catch((error) => {
                        console.error('Error fetching flood data:', error);
                    });
            });

            sourceDropdown.addEventListener('change', () => {
                console.log('Source dropdown changed. Selected value:', sourceDropdown.value);
                const selectedValue = sourceDropdown.value;
                if (selectedValue && selectedValue !== '') {
                    try {
                        const coords = JSON.parse(selectedValue);
                        console.log('Parsed source coords:', coords);
                        markPlaceOnMap(coords, 'source', coords.name);
                        updateDestinationDropdown(selectedValue);
                        sourceAddress.value = '';
                    } catch (e) {
                        console.error('Error parsing source coordinates:', e);
                    }
                } else {
                    if (sourceMarker) {
                        map.removeLayer(sourceMarker);
                        sourceMarker = null;
                        sourceName.textContent = '';
                        console.log('Cleared source marker');
                    }
                    updateDestinationDropdown(null);
                }
            });

            destinationDropdown.addEventListener('change', () => {
                console.log('Destination dropdown changed. Selected value:', destinationDropdown.value);
                const selectedValue = destinationDropdown.value;
                if (selectedValue && selectedValue !== '') {
                    try {
                        const coords = JSON.parse(selectedValue);
                        console.log('Parsed destination coords:', coords);
                        markPlaceOnMap(coords, 'destination', destinationDropdown.options[destinationDropdown.selectedIndex].text);
                        destinationAddress.value = '';
                    } catch (e) {
                        console.error('Error parsing destination coordinates:', e);
                    }
                } else {
                    if (destinationMarker) {
                        map.removeLayer(destinationMarker);
                        destinationMarker = null;
                        destinationName.textContent = '';
                        console.log('Cleared destination marker');
                    }
                }
            });
        }
    }

    fullscreenBtn.addEventListener('click', () => {
        if (!isFullscreen) {
            if (mapContent.requestFullscreen) {
                mapContent.requestFullscreen();
            } else if (mapContent.mozRequestFullScreen) {
                mapContent.mozRequestFullScreen();
            } else if (mapContent.webkitRequestFullscreen) {
                mapContent.webkitRequestFullscreen();
            } else if (mapContent.msRequestFullscreen) {
                mapContent.msRequestFullscreen();
            }
            isFullscreen = true;
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
            isFullscreen = false;
        }
    });

    findRouteButton.addEventListener('click', async () => {
        let source, destination;

        if (selectedPurpose.title === 'Transport & Logistics' || selectedPurpose.title === 'Adventure & Trekking') {
            source = sourcePlacesDropdown && sourcePlacesDropdown.value ? sourcePlacesDropdown.value : null;
            destination = destinationPlacesDropdown && destinationPlacesDropdown.value ? destinationPlacesDropdown.value : null;
        } else {
            source = sourceAddress.value ? JSON.stringify(await geocodeAddress(sourceAddress.value, 'source')) : sourceDropdown.value;
            destination = destinationAddress.value ? JSON.stringify(await geocodeAddress(destinationAddress.value, 'destination')) : destinationDropdown.value;
        }

        if (!source || !destination) {
            alert('Please select or enter both source and destination.');
            return;
        }

        const sourceCoords = JSON.parse(source);
        const destinationCoords = JSON.parse(destination);

        displayPossibleRoutes(sourceCoords, destinationCoords);
    });

    const displayExistingRoutes = async () => {
        let source, destination;

        if (selectedPurpose.title === 'Transport & Logistics' || selectedPurpose.title === 'Adventure & Trekking') {
            source = sourcePlacesDropdown && sourcePlacesDropdown.value ? JSON.parse(sourcePlacesDropdown.value) : null;
            destination = destinationPlacesDropdown && destinationPlacesDropdown.value ? JSON.parse(destinationPlacesDropdown.value) : null;
        } else {
            source = sourceAddress.value ? await geocodeAddress(sourceAddress.value, 'source') : (sourceDropdown.value ? JSON.parse(sourceDropdown.value) : null);
            destination = destinationAddress.value ? await geocodeAddress(destinationAddress.value, 'destination') : (destinationDropdown.value ? JSON.parse(destinationDropdown.value) : null);
        }

        if (!source || !destination) {
            alert('Please select or enter both source and destination.');
            return;
        }

        const sourceCoords = { lat: source.lat, lon: source.lon };
        const destinationCoords = { lat: destination.lat, lon: destination.lon };

        console.log('Source Coordinates:', sourceCoords);
        console.log('Destination Coordinates:', destinationCoords);

        const fetchRoutes = async (useAllRoutes = true) => {
            const body = {
                source: sourceCoords,
                destination: destinationCoords
            };
            if (useAllRoutes) {
                body.find_all_routes = true;
            }

            const response = await fetch('/find-route', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': localStorage.getItem('token')
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`);
            }
            return response.json();
        };

        try {
            let data = await fetchRoutes(true);
            console.log('Response from /find-route (all routes):', data);

            if (data.routes && data.routes.length > 0) {
                if (routeLayer) {
                    map.removeLayer(routeLayer);
                }
                routeLayer = L.layerGroup().addTo(map);

                let hasValidRoute = false;

                data.routes.forEach((routeCoords, index) => {
                    const startPoint = routeCoords[0];
                    const endPoint = routeCoords[routeCoords.length - 1];
                    const tolerance = 0.01;
                    const startsAtSource = Math.abs(startPoint[0] - sourceCoords.lat) < tolerance && Math.abs(startPoint[1] - sourceCoords.lon) < tolerance;
                    const endsAtDestination = Math.abs(endPoint[0] - destinationCoords.lat) < tolerance && Math.abs(endPoint[1] - destinationCoords.lon) < tolerance;

                    if (startsAtSource && endsAtDestination) {
                        L.polyline(routeCoords, { color: 'red', weight: 3 }).addTo(routeLayer)
                            .bindPopup(`Route ${index + 1}`);
                        hasValidRoute = true;
                    }
                });

                if (!hasValidRoute) {
                    alert('No existing routes found between the selected source and destination.');
                } else {
                    map.fitBounds([[sourceCoords.lat, sourceCoords.lon], [destinationCoords.lat, destinationCoords.lon]]);
                }
            } else if (data.error) {
                if (data.error === 'No valid routes found connecting source and destination') {
                    alert('No existing routes found between the selected source and destination.');
                } else {
                    throw new Error(data.error);
                }
            }
        } catch (error) {
            console.error('Error fetching all routes:', error);

            if (error.message.includes('500')) {
                console.log('Falling back to standard route due to server error.');
                try {
                    const data = await fetchRoutes(false);
                    console.log('Response from /find-route (standard route):', data);

                    if (data.routes && data.routes.length > 0) {
                        if (routeLayer) {
                            map.removeLayer(routeLayer);
                        }
                        routeLayer = L.layerGroup().addTo(map);

                        data.routes.forEach((routeCoords) => {
                            L.polyline(routeCoords, { color: 'red', weight: 3 }).addTo(routeLayer);
                        });

                        if (routeLayer.getLayers().length === 0) {
                            alert('No routes found between the selected source and destination.');
                        } else {
                            map.fitBounds([[sourceCoords.lat, sourceCoords.lon], [destinationCoords.lat, destinationCoords.lon]]);
                        }
                    } else if (data.error) {
                        alert(`Error fetching standard route: ${data.error}`);
                    }
                } catch (fallbackError) {
                    console.error('Error fetching standard route:', fallbackError);
                    alert('Error fetching routes: Server issue persists. Please try again later.');
                }
            } else if (error.message.includes('404')) {
                alert('No existing routes found between the selected source and destination.');
            } else {
                alert(`Error fetching existing routes: ${error.message}`);
            }
        }
    };

    existingRouteButton.addEventListener('click', displayExistingRoutes);

    // Helper function to check if a point is within the bounding region
    const isPointInBounds = (lat, lon) => {
        const bounds = [
            [coordinates.latitude1, coordinates.longitude1],
            [coordinates.latitude2, coordinates.longitude2],
            [coordinates.latitude3, coordinates.longitude3],
            [coordinates.latitude4, coordinates.longitude4]
        ];
        const minLat = Math.min(...bounds.map(p => p[0]));
        const maxLat = Math.max(...bounds.map(p => p[0]));
        const minLon = Math.min(...bounds.map(p => p[1]));
        const maxLon = Math.max(...bounds.map(p => p[1]));
        return lat >= minLat && lat <= maxLat && lon >= minLon && lon <= maxLon;
    };

    // Updated function to calculate curve points, constrained within bounding region
    const calculateCurvePoints = (start, end, numPoints, variation) => {
        const lat1 = start.lat;
        const lon1 = start.lon;
        const lat2 = end.lat;
        const lon2 = end.lon;

        const points = [];
        for (let i = 0; i <= numPoints; i++) {
            const fraction = i / numPoints;
            const lat = lat1 + (lat2 - lat1) * fraction;
            const lon = lon1 + (lon2 - lon1) * fraction;

            // Add curvature with variation
            const offset = Math.sin(fraction * Math.PI) * 0.1 * variation;
            let curvedLat = lat + offset;
            let curvedLon = lon + offset;

            // Constrain points within bounding region
            const bounds = [
                [coordinates.latitude1, coordinates.longitude1],
                [coordinates.latitude2, coordinates.longitude2],
                [coordinates.latitude3, coordinates.longitude3],
                [coordinates.latitude4, coordinates.longitude4]
            ];
            const minLat = Math.min(...bounds.map(p => p[0]));
            const maxLat = Math.max(...bounds.map(p => p[0]));
            const minLon = Math.min(...bounds.map(p => p[1]));
            const maxLon = Math.max(...bounds.map(p => p[1]));

            curvedLat = Math.max(minLat, Math.min(maxLat, curvedLat));
            curvedLon = Math.max(minLon, Math.min(maxLon, curvedLon));

            points.push([curvedLat, curvedLon]);
        }
        return points;
    };

    // Updated function to display possible routes, respecting bounding region and storing routes
    const displayPossibleRoutes = (sourceCoords, destinationCoords) => {
        // Validate source and destination are within bounds
        if (!isPointInBounds(sourceCoords.lat, sourceCoords.lon) || !isPointInBounds(destinationCoords.lat, destinationCoords.lon)) {
            alert('Source or destination is outside the selected bounding region.');
            return;
        }

        if (routeLayer) {
            map.removeLayer(routeLayer);
        }
        routeLayer = L.layerGroup().addTo(map);

        // Generate and draw 50 distinct curved routes
        const possibleRoutes = [];
        for (let i = 0; i < 50; i++) {
            const variation = (i - 25) * 0.02; // Variation ranges from -0.5 to 0.48
            const points = calculateCurvePoints(sourceCoords, destinationCoords, 50, variation);
            L.polyline(points, { color: 'red', weight: 2 }).addTo(routeLayer);
            possibleRoutes.push(points);
        }

        // Store the possible routes in the backend
        fetch('/store-possible-routes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': localStorage.getItem('token'),
            },
            body: JSON.stringify({
                routes: possibleRoutes
            }),
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    console.log('Possible routes stored successfully');
                } else {
                    console.error('Error storing possible routes:', data.error);
                }
            })
            .catch(error => {
                console.error('Error storing possible routes:', error);
            });

        // Define bounds including both source/destination and the entire region
        const regionBounds = [
            [coordinates.latitude1, coordinates.longitude1],
            [coordinates.latitude2, coordinates.longitude2],
            [coordinates.latitude3, coordinates.longitude3],
            [coordinates.latitude4, coordinates.longitude4]
        ];
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
    };

    // Event listeners for Previous and Next buttons
    previousBtn.addEventListener('click', (e) => {
        e.preventDefault(); // Prevent any default behavior
        console.log('Previous button clicked, redirecting to userselect page');

        // Check token validity before redirecting
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No authentication token found, redirecting to login');
            alert('Please log in again to continue.');
            window.location.href = '/login'; // Adjust to your login route
            return;
        }

        // Clear map layers to prevent lingering operations
        if (routeLayer) {
            map.removeLayer(routeLayer);
            routeLayer = null;
        }
        if (sourceMarker) {
            map.removeLayer(sourceMarker);
            sourceMarker = null;
        }
        if (destinationMarker) {
            map.removeLayer(destinationMarker);
            destinationMarker = null;
        }

        // Preserve URL parameters for userselect
        const urlParams = new URLSearchParams(window.location.search);
        window.location.href = `/userselect?${urlParams.toString()}`; // Redirect with params
    });

    // Check if nextBtn exists
    if (!nextBtn) {
        console.error('Next button not found in the DOM. Ensure the element with ID "nextBtn" exists.');
        return;
    }

    nextBtn.addEventListener('click', async (e) => {
        e.preventDefault(); // Prevent any default behavior
        console.log('Next button clicked, attempting to redirect to Route Safety Analysis page');
    
        try {
            // Check token validity before redirecting
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('No authentication token found');
                alert('Authentication token missing. Please log in again.');
                window.location.href = '/login'; // Adjust to your login route
                return;
            }
            console.log('Token found:', token);
    
            // Retrieve the selected purpose from local storage
            const selectedPurpose = JSON.parse(localStorage.getItem('selectedPurpose'));
            if (!selectedPurpose || !selectedPurpose.title) {
                console.error('No selected purpose found in localStorage');
                alert('No purpose selected. Please go back and select a purpose.');
                return;
            }
            console.log('Selected purpose:', selectedPurpose.title);
    
            // Retrieve source and destination coordinates based on the purpose
            let source, destination;
    
            if (selectedPurpose.title === 'Transport & Logistics' || selectedPurpose.title === 'Adventure & Trekking') {
                console.log('Source places dropdown value:', sourcePlacesDropdown ? sourcePlacesDropdown.value : 'Not defined');
                console.log('Destination places dropdown value:', destinationPlacesDropdown ? destinationPlacesDropdown.value : 'Not defined');
    
                if (!sourcePlacesDropdown || !sourcePlacesDropdown.value || sourcePlacesDropdown.value === '') {
                    console.error('Source places dropdown is not defined or no value selected');
                    source = null;
                } else {
                    try {
                        source = JSON.parse(sourcePlacesDropdown.value);
                        console.log('Parsed source from dropdown:', source);
                    } catch (error) {
                        console.error('Error parsing sourcePlacesDropdown value:', error, sourcePlacesDropdown.value);
                        source = null;
                    }
                }
    
                if (!destinationPlacesDropdown || !destinationPlacesDropdown.value || destinationPlacesDropdown.value === '') {
                    console.error('Destination places dropdown is not defined or no value selected');
                    destination = null;
                } else {
                    try {
                        destination = JSON.parse(destinationPlacesDropdown.value);
                        console.log('Parsed destination from dropdown:', destination);
                    } catch (error) {
                        console.error('Error parsing destinationPlacesDropdown value:', error, destinationPlacesDropdown.value);
                        destination = null;
                    }
                }
            } else if (selectedPurpose.title === 'Emergency Evacuation') {
                console.log('Source dropdown value:', sourceDropdown ? sourceDropdown.value : 'Not defined');
                console.log('Destination dropdown value:', destinationDropdown ? destinationDropdown.value : 'Not defined');
    
                if (!sourceDropdown || !sourceDropdown.value || sourceDropdown.value === '') {
                    console.error('Source dropdown is not defined or no value selected');
                    source = null;
                } else {
                    try {
                        const parsedSource = JSON.parse(sourceDropdown.value);
                        source = { lat: parsedSource.lat, lon: parsedSource.lon };
                        console.log('Parsed source from dropdown:', source);
                    } catch (error) {
                        console.error('Error parsing sourceDropdown value:', error, sourceDropdown.value);
                        source = null;
                    }
                }
    
                if (!destinationDropdown || !destinationDropdown.value || destinationDropdown.value === '') {
                    console.error('Destination dropdown is not defined or no value selected');
                    destination = null;
                } else {
                    try {
                        const parsedDestination = JSON.parse(destinationDropdown.value);
                        destination = { lat: parsedDestination.lat, lon: parsedDestination.lon };
                        console.log('Parsed destination from dropdown:', destination);
                    } catch (error) {
                        console.error('Error parsing destinationDropdown value:', error, destinationDropdown.value);
                        destination = null;
                    }
                }
            } else if (selectedPurpose.title === 'General Use') {
                console.log('Source address value:', sourceAddress ? sourceAddress.value : 'Not defined');
                console.log('Destination address value:', destinationAddress ? destinationAddress.value : 'Not defined');
                console.log('Source dropdown value:', sourceDropdown ? sourceDropdown.value : 'Not defined');
                console.log('Destination dropdown value:', destinationDropdown ? destinationDropdown.value : 'Not defined');
    
                if (sourceAddress && sourceAddress.value) {
                    try {
                        source = await geocodeAddress(sourceAddress.value, 'source');
                        if (!source) {
                            console.error('Geocoding source address failed');
                            alert('Failed to geocode source address. Please check the address and try again.');
                            return;
                        }
                        console.log('Geocoded source:', source);
                    } catch (error) {
                        console.error('Error geocoding source address:', error);
                        alert(`Failed to geocode source address: ${error.message}. Please try again.`);
                        return;
                    }
                } else {
                    if (!sourceDropdown || !sourceDropdown.value || sourceDropdown.value === '') {
                        console.error('Source dropdown is not defined or no value selected');
                        source = null;
                    } else {
                        try {
                            source = JSON.parse(sourceDropdown.value);
                            console.log('Parsed source from dropdown:', source);
                        } catch (error) {
                            console.error('Error parsing sourceDropdown value:', error, sourceDropdown.value);
                            source = null;
                        }
                    }
                }
    
                if (destinationAddress && destinationAddress.value) {
                    try {
                        destination = await geocodeAddress(destinationAddress.value, 'destination');
                        if (!destination) {
                            console.error('Geocoding destination address failed');
                            alert('Failed to geocode destination address. Please check the address and try again.');
                            return;
                        }
                        console.log('Geocoded destination:', destination);
                    } catch (error) {
                        console.error('Error geocoding destination address:', error);
                        alert(`Failed to geocode destination address: ${error.message}. Please try again.`);
                        return;
                    }
                } else {
                    if (!destinationDropdown || !destinationDropdown.value || destinationDropdown.value === '') {
                        console.error('Destination dropdown is not defined or no value selected');
                        destination = null;
                    } else {
                        try {
                            destination = JSON.parse(destinationDropdown.value);
                            console.log('Parsed destination from dropdown:', destination);
                        } catch (error) {
                            console.error('Error parsing destinationDropdown value:', error, destinationDropdown.value);
                            destination = null;
                        }
                    }
                }
            }
    
            // Validate that source and destination are selected
            console.log('Final source:', source);
            console.log('Final destination:', destination);
            if (!source || !source.lat || !source.lon || !destination || !destination.lat || !destination.lon) {
                console.error('Source or destination is missing or invalid:', { source, destination });
                alert('Please select or enter valid source and destination coordinates before proceeding.');
                return;
            }
    
            // Validate map and related variables
            if (typeof map === 'undefined' || !map.getCenter) {
                console.error('Map object is undefined or invalid. Ensure the map is initialized.');
                alert('Map not initialized properly. Please refresh the page and try again.');
                return;
            }
    
            if (typeof coordinates === 'undefined' || !coordinates.latitude1) {
                console.error('Coordinates object is undefined or invalid.');
                alert('Region coordinates not found. Please go back and define a region.');
                return;
            }
    
            // Store map state in localStorage with safer popup handling
            const mapState = {
                center: map.getCenter(), // {lat, lng}
                zoom: map.getZoom(),
                tileLayer: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', // Google Satellite
                tileLayerAttribution: 'Google Satellite',
                regionBoundary: [
                    [coordinates.latitude1, coordinates.longitude1],
                    [coordinates.latitude2, coordinates.longitude2],
                    [coordinates.latitude3, coordinates.longitude3],
                    [coordinates.latitude4, coordinates.longitude4],
                ],
                sourceMarker: sourceMarker ? {
                    lat: sourceMarker.getLatLng().lat,
                    lng: sourceMarker.getLatLng().lng,
                    popup: sourceMarker.getPopup() ? sourceMarker.getPopup().getContent() : 'Source',
                    icon: 'green'
                } : null,
                destinationMarker: destinationMarker ? {
                    lat: destinationMarker.getLatLng().lat,
                    lng: destinationMarker.getLatLng().lng,
                    popup: destinationMarker.getPopup() ? destinationMarker.getPopup().getContent() : 'Destination',
                    icon: 'red'
                } : null,
                routes: routeLayer ? routeLayer.getLayers().map(layer => {
                    const popup = layer.getPopup && typeof layer.getPopup === 'function' ? layer.getPopup() : null;
                    return {
                        coords: layer.getLatLngs(),
                        color: layer.options.color,
                        weight: layer.options.weight,
                        popup: popup ? popup.getContent() : null
                    };
                }) : []
            };
    
            // Validate map state before storing
            if (!mapState.center || !mapState.center.lat || !mapState.center.lng || !mapState.zoom) {
                console.error('Invalid map state:', mapState);
                alert('Failed to capture valid map state. Please try again.');
                return;
            }
            console.log('Map state to be stored:', mapState);
    
            try {
                localStorage.setItem('mapState', JSON.stringify(mapState));
                console.log('Map state stored successfully in localStorage');
            } catch (error) {
                console.error('Error storing map state in localStorage:', error);
                alert('Failed to store map state: ' + error.message);
                return;
            }
    
            // Clear map layers to prevent lingering operations
            if (routeLayer) {
                map.removeLayer(routeLayer);
                routeLayer = null;
                console.log('Route layer cleared');
            }
            if (sourceMarker) {
                map.removeLayer(sourceMarker);
                sourceMarker = null;
                console.log('Source marker cleared');
            }
            if (destinationMarker) {
                map.removeLayer(destinationMarker);
                destinationMarker = null;
                console.log('Destination marker cleared');
            }
    
            // Preserve URL parameters and include token, source, and destination for route-safety-analysis
            const urlParams = new URLSearchParams(window.location.search);
            urlParams.set('token', token);
            urlParams.set('sourceLat', source.lat);
            urlParams.set('sourceLon', source.lon);
            urlParams.set('destLat', destination.lat);
            urlParams.set('destLon', destination.lon);
    
            const redirectUrl = `/route-safety-analysis?${urlParams.toString()}`;
            console.log('Redirecting to:', redirectUrl);
    
            // Attempt redirection
            window.location.href = redirectUrl;
    
            // Fallback in case the redirect doesn't work
            setTimeout(() => {
                if (window.location.href !== redirectUrl) {
                    console.error('Redirection failed, attempting alternative method');
                    window.location.assign(redirectUrl);
                } else {
                    console.log('Redirection successful');
                }
            }, 500);
    
        } catch (error) {
            console.error('Detailed error in nextBtn event handler:', error);
            alert(`An error occurred: ${error.message}. Check the console for details and try again.`);
        }
    });
});