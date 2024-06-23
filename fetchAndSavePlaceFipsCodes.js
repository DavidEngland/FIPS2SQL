const axios = require('axios');
const fs = require('fs').promises;

const commonPlaceTypes = [
    "city", "town", "village", "CDP", "borough", "township", "municipality", "unincorporated",
    "metropolitan government (balance)", "County consolidated government (balance)",
    "County metropolitan government", "County unified government (balance)", "County"
].sort((a, b) => b.length - a.length);

async function fetchAndSavePlaceFipsCodes() {
    const stateFipsCodes = ['01', '13', '47']; // Example: Alabama, Georgia, Tennessee
    const API_BASE_URL = 'https://api.census.gov/data/2022/acs/acs5/profile?get=NAME,GEO_ID&for=place:*&in=state:';
    let allFormattedData = [];

    for (const stateCode of stateFipsCodes) {
        try {
            const response = await axios.get(`${API_BASE_URL}${stateCode}`);
            const formattedData = response.data.slice(1).map(item => formatPlaceData(item));
            allFormattedData.push(...formattedData);
        } catch (error) {
            console.error(`Error fetching FIPS codes for state ${stateCode}:`, error);
        }
    }

    try {
        await fs.writeFile('./data/placeFipsCodes.json', JSON.stringify(allFormattedData, null, 2), 'utf8');
        console.log('FIPS codes have been written to file successfully.');
    } catch (error) {
        console.error('Error writing FIPS codes to file:', error);
    }
}

function formatPlaceData([placeNameWithState, geoId, stateCode, placeCode]) {
    const fipsCode = geoId.substring(geoId.indexOf('US') + 2);
    const parts = placeNameWithState.split(',').map(part => part.trim());
    const state = parts.pop();
    const placeName = parts.join(', ');
    const type = commonPlaceTypes.find(placeType => new RegExp(`\\b${placeType}\\b`).test(placeName)) || '';
    const name = type ? placeName.replace(new RegExp(`\\b${type}\\b`, 'i'), '').trim() : placeName;

    return { fipsCode, name, type, stateCode, placeCode };
}

fetchAndSavePlaceFipsCodes();