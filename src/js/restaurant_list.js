let restaurants = [],
  neighborhoods = [],
  cuisines = [],
  map,
  markers = [];

/**
 * Register service worker for caching static assets
 */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js', {
    scope: './'
  });

  navigator.serviceWorker.ready.then(swRegistration => {
    return swRegistration.sync.register('syncUp');
  });
}

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded
 */
document.addEventListener('DOMContentLoaded', event => {
  fetchNeighborhoods();
  fetchCuisines();
  updateRestaurants();
});

/**
 * Async add google map
 */
addGoogleMap = () => {
  let script = document.createElement('script');

  script.type = 'text/javascript';
  script.src = `https://maps.googleapis.com/maps/api/js?key=${MAP_API_KEY}&callback=initMap`;
  document.body.appendChild(script);
};

/**
 * Fetch all neighborhoods and set their HTML
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) {
      // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
};

/**
 * Set neighborhoods HTML
 * @param {Array} neighborhoods
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
};

/**
 * Fetch all cuisines and set their HTML
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) {
      // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
};

/**
 * Set cuisines HTML
 * @param {Array} cuisines
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
};

/**
 * Initialize Google map
 */
window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });

  if (typeof google !== 'undefined') addMarkersToMap();
};

/**
 * Update page and map for current restaurants
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) console.error(error);
    else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
      lazyLoadImages();
    }
  });
};

/**
 * Load page images after restaurant DOM has been added
 */
lazyLoadImages = () => {
  const observer = lozad();
  observer.observe();
};

/**
 * Clear current restaurants, their HTML and remove their map markers
 * @param {Array} restaurants - list of restaurants
 */
resetRestaurants = restaurants => {
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  if (self.markers && self.markers.length > 0) {
    self.markers.forEach(m => m.setMap(null));
    self.markers = [];
  }
  self.restaurants = restaurants;
};

/**
 * Create all restaurants HTML and add them to the webpage
 * @param {Array} restaurants - list of restaurants
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const fragment = document.createDocumentFragment();
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    fragment.append(createRestaurantHTML(restaurant));
  });

  ul.appendChild(fragment);
};

/**
 * Create restaurant HTML
 * @param {Object} restaurant - restaurant
 */
createRestaurantHTML = restaurant => {
  const li = document.createElement('li');
  li.setAttribute('restaurant-id', restaurant.id);

  const image = document.createElement('img');
  image.className = 'restaurant-img lozad';
  image.setAttribute('data-src', DBHelper.imageUrlForRestaurant(restaurant));
  image.alt = `Restaurant ${restaurant.name} - cuisine ${restaurant.cuisine_type}`;
  li.append(image);

  const name = document.createElement('h2');
  name.classList.add('restaurant-name');
  name.innerHTML = restaurant.name;
  li.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  li.append(more);

  const favToggle = document.createElement('span');
  favToggle.innerHTML = `&#x2605;`;
  favToggle.title = 'Favorite restaurant';
  favToggle.classList.add('favorite-restaurant');
  if (stringToBoolean(restaurant.is_favorite)) favToggle.classList.add('is-favorite');
  favToggle.addEventListener('click', event => {
    favoriteRestaurant(event.target, restaurant);
  });

  li.append(favToggle);

  return li;
};

/**
 * Add markers for current restaurants to the map
 * @param {Array} restaurants - list of restaurants
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url;
    });
    if (self.markers) self.markers.push(marker);
  });
};

/**
 * Favorite/unfavorite restaurant
 * @param {Object} target - event target
 * @param {Object} restaurant
 */
favoriteRestaurant = (target, restaurant) => {
  if (target.className.indexOf('is-favorite') > -1) {
    target.classList.remove('is-favorite');
    DBHelper.favoriteRestaurant(restaurant, false);
  } else {
    target.classList.add('is-favorite');
    DBHelper.favoriteRestaurant(restaurant, true);
  }
};
