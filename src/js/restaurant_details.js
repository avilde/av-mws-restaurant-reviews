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
  addRatingHandler();
  DBHelper.syncData();
});

/**
 * Draw restaurant DOM
 */
drawRestaurant = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    self.restaurant = restaurant;

    if (error) d(error);
    else {
      fillBreadcrumb();
      lazyLoadStaticGoogleMap();
    }
  });
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
      if (!restaurant) return d(error);

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
  if (self.restaurant.reviews)
    drawReviews(self.restaurant.reviews);
  else {
    DBHelper.fetchReviewsByRestaurantId(restaurant.id, (error, reviews) => {
      if (!reviews) return d(error);

      self.restaurant.reviews = reviews;

      drawReviews(self.restaurant.reviews);
    });
  }
};

/**
 * Draw reviews DOM
 * @param {Array} reviewsList - array of restaurant reviews
 */
drawReviews = (reviewsList) => {
  // sort reviews by latest
  reviewsList = reviewsList.sort((r1, r2) => r2.createdAt - r1.createdAt);

  const ul = document.getElementById('reviews-list'),
    fragment = document.createDocumentFragment();

  if (!reviewsList || reviewsList && reviewsList.length === 0) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    ul.appendChild(noReviews);
    return;
  }

  reviewsList.forEach(review => {
    fragment.append(createReviewHTML(review));
  });

  ul.appendChild(fragment);
}

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
 * Async add dynamic google map
 */
loadDynamicGoogleMap = () => {
  let script = document.createElement('script');

  script.type = 'text/javascript';
  script.src = `https://maps.googleapis.com/maps/api/js?key=${MAP_API_KEY}&callback=initMap`;
  document.body.appendChild(script);
};

/**
 * Initialize dynamic Google map & add marker
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
 * Generate static map URL and add image
 * @param {Object} restaurant
 */
loadStaticGoogleMap = (restaurant = self.restaurant) => {
  if (!restaurant) return;

  const SIZE = 400,
    ZOOM = 16,
    MARKER_COLOR = 'red';

  let coord = (Object.values(restaurant.latlng)).toString(),
    map = document.getElementById('map'),
    url = `https://maps.googleapis.com/maps/api/staticmap?size=${SIZE}x${SIZE}&zoom=${ZOOM}&key=${STATIC_MAP_API_KEY}&center=${coord}&markers=color:${MARKER_COLOR}|${coord}`,
    img = document.createElement('img');

  img.classList.add('static-google-map');
  img.src = url;
  img.alt = 'Static Google Map';
  img.addEventListener('click', loadDynamicGoogleMap);
  map.appendChild(img);
}

/**
 * Load google map only when it's container becomes visible
 */
lazyLoadStaticGoogleMap = () => {
  const observerOptions = {
      threshold: [1.0]
    },
    map = document.getElementById('map'),
    observer = new IntersectionObserver(
      entry => {
        entry.forEach(change => {
          if (change.isIntersecting) {
            loadStaticGoogleMap(self.restaurant);

            observer.unobserve(map);
          }
        });
      }, observerOptions);

  observer.observe(map);
}

/**
 * Load page images after restaurant DOM has been added
 */
lazyLoadImages = () => {
  const observer = lozad();
  observer.observe();
};

/**
 * Validate if review is correct before posting
 */
validateReview = () => {
  const NAME_EMPTY = '- your name is not provided',
    NAME_TOO_SHORT = '- your name should be more than 3 symbols',
    COMMENT_EMPTY = '- your review is empty',
    COMMENT_TOO_SHORT = '- your review is too short (100 minimum characters)',
    RATING_EMPTY = '- rating is not set',
    SUCCESS = 'Review succesfully posted.',
    NL = '\r\n',
    EMPTY = '';

  let btn = document.getElementById('my-review-btn'),
    name = document.getElementById('my-review-name'),
    comment = document.getElementById('my-review-comment'),
    rating = document.getElementById('my-review-rating'),
    msg = document.getElementById('my-review-msg'),
    ratingMsg = document.getElementById('rating-msg'),
    ul = document.getElementById('reviews-list'),
    errMsg = '',
    review,
    el;


  if (!name.value)
    errMsg += (errMsg ? NL : EMPTY) + NAME_EMPTY;

  if (name.value.length < 4)
    errMsg += (errMsg ? NL : EMPTY) + NAME_TOO_SHORT;

  if (!comment.value)
    errMsg += (errMsg ? NL : EMPTY) + COMMENT_EMPTY;

  if (comment.value.length < 100)
    errMsg += (errMsg ? NL : EMPTY) + COMMENT_TOO_SHORT;

  if (!rating.getAttribute('rating'))
    errMsg += (errMsg ? NL : EMPTY) + RATING_EMPTY;

  if (errMsg) {
    msg.innerHTML = errMsg;
    msg.classList.add('error');
    msg.classList.remove('success');
    msg.style.display = 'block';
  } else {
    msg.style.display = 'none';
    msg.innerHTML = SUCCESS;
    msg.classList.add('success');
    msg.classList.remove('error');

    // create new review obj
    review = {
      restaurant_id: self.restaurant.id,
      name: name.value,
      rating: parseInt(rating.getAttribute('rating')),
      comments: comment.value,
      createdAt: new Date()
    };

    // insert review in db
    review = DBHelper.insertReview(review);

    // cleanup
    name.value = '';
    comment.value = '';
    rating.removeAttribute('rating');
    ratingMsg.innerHTML = '';
    // clear radio group
    document.querySelectorAll('input[name="rating"]').forEach((rating, idx) => {
      rating.checked = false;
    });

    // create new review node
    el = createReviewHTML(review);

    // success message
    setTimeout(_ => {
      msg.style.display = 'block';
      el.classList.add('temp');
      ul.insertBefore(el, ul.firstChild);
    }, 300);

    setTimeout(_ => {
      msg.style.display = 'none';
      el.classList.remove('temp');
    }, 1500);
  }
}

/**
 * Add rating handlers 
 */
addRatingHandler = () => {
  let labels = document.querySelectorAll('label.rating-label'),
    rating = document.getElementById('my-review-rating'),
    ratingMsg = document.getElementById('rating-msg');

  labels.forEach((label, idx) => {
    label.addEventListener('mouseover', () => {
      ratingMsg.innerHTML = label.getAttribute('title');
    });

    label.addEventListener('mouseout', () => {
      let ratingValue = rating.getAttribute('rating'),
        selectedStar = document.querySelector(`label.rating-label[value="${ratingValue}"]`);

      if (ratingValue && selectedStar)
        ratingMsg.innerHTML = selectedStar.getAttribute('title');
      else if (!ratingValue)
        ratingMsg.innerHTML = '';
    });

    label.addEventListener('click', () => {
      ratingMsg.innerHTML = label.getAttribute('title');
      rating.setAttribute('rating', label.getAttribute('value'));
    });
  });
}