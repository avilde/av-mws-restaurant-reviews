let restaurant, map;

/**
 * Register service worker for caching static assets
 */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js', {
    scope: './'
  });
}

/**
 * Load Google Map & Restaurant data
 */
document.addEventListener('DOMContentLoaded', event => {
  drawRestaurant();

  // do not add google map until visible
  const observer = new IntersectionObserver(
    entry => {
      entry.forEach(change => {
        if (change.isIntersecting) {
          addGoogleMap();
          observer.unobserve(document.getElementById('map'));
        }
      });
    }, {
      threshold: [1.0]
    }
  );

  observer.observe(document.getElementById('map'));
});

drawRestaurant = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    self.restaurant = restaurant;
    if (error) console.error(error);
    else fillBreadcrumb();
  });
};

/**
 * Initialize Google map & load restaurant details
 */
initMap = () => {
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 16,
    center: self.restaurant.latlng,
    scrollwheel: false
  });

  DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
};

/**
 * Get current restaurant from page URL
 * @param {Function} callback - calback to be executed
 */
fetchRestaurantFromURL = callback => {
  if (self.restaurant) {
    return callback(null, self.restaurant);
  }

  const id = getParameterByName('id');
  if (!id) callback('No restaurant id found in URL', null);
  else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) return console.error(error);

      fillRestaurantHTML();
      callback(null, restaurant);
    });
  }
};

/**
 * Build restaurant HTML and add it to the webpage
 * @param {Object} restaurant
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.classList.add('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img lozad';
  image.alt = `Restaurant ${restaurant.name} - cuisine ${restaurant.cuisine_type}`;
  image.setAttribute('data-src', DBHelper.imageUrlForRestaurant(restaurant));

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  const favToggle = document.getElementById('favorite');
  if (stringToBoolean(restaurant.is_favorite)) favToggle.classList.add('is-favorite');
  favToggle.addEventListener('click', event => {
    favoriteRestaurant(event.target, restaurant);
  });

  if (restaurant.operating_hours) fillRestaurantHoursHTML();

  if (restaurant) fillReviewsHTML(restaurant);

  lazyLoadImages();
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

/**
 * Setup restaurant operating hours HTML table and add it to the webpage
 * @param {Object} operatingHours
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
};

/**
 * Get restaurant reviews and build HTML for them
 * @param {Object} restaurant
 */
fillReviewsHTML = (restaurant = self.restaurant) => {
  let reviewsList;

  if (self.restaurant.reviews) reviewsList = self.restaurant.reviews;
  else
    DBHelper.fetchReviewsByRestaurantId(restaurant.id, (error, reviews) => {
      if (!reviews) return console.error(error);

      reviewsList = self.restaurant.reviews = reviews;

      const container = document.getElementById('reviews-container');

      if (!reviewsList) {
        const noReviews = document.createElement('p');
        noReviews.innerHTML = 'No reviews yet!';
        container.appendChild(noReviews);
        return;
      }
      const ul = document.getElementById('reviews-list');
      reviewsList.forEach(review => {
        ul.appendChild(createReviewHTML(review));
      });
      container.appendChild(ul);
    });
};

/**
 * Create review HTML and add it to the webpage
 * @param {Object} review - individual review for restaurant
 */
createReviewHTML = review => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.classList.add('review-name');
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('span');
  date.classList.add('review-date');
  date.innerHTML = new Date(review.createdAt).toDateString();
  name.appendChild(date);

  const rating = document.createElement('p');
  rating.classList.add('review-rating');
  rating.innerHTML = `Rating: ${'<span>&#x2605;</span>'.repeat(parseInt(review.rating))}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.classList.add('review-comment'); 
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
};

/**
 * Add restaurant name to the breadcrumb navigation menu
 * @param {Object} restaurant
 */
fillBreadcrumb = (restaurant = self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  li.setAttribute('aria-current', 'page');
  breadcrumb.appendChild(li);
};

/**
 * Get a parameter by name from page URL
 * @param {String} name - name of param
 * @param {String} url - URL
 */
getParameterByName = (name, url) => {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
};

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
 * Load page images after restaurant DOM has been added
 */
lazyLoadImages = () => {
  const observer = lozad();
  observer.observe();
};