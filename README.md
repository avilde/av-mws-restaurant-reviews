# Mobile Web Specialist Certification Course
#### _Three Stage Course Material Project - Restaurant Reviews_
---
## Project Overview

### Tasks
- Offline use of application (add review & sync when online)
- User interface updates - favorite/unfavorite a restaurant
- Results of audit should all now be over 90 points:
    * **Progressive Web App: > 90**
    * Performance: > 90
    * Accessibility: > 90


## Code Owners
Initial:
* @forbiddenvoid @richardkalehoff @asparr

Modified: 
* avilde <Andris Vilde 'vilde.andris@gmail.com'>

My signature:
* `av-rr`

## Notes For Reviewer

* Restructured whole project into `public` and `src` (source) folders where automation tool `gulp` is used to generate resulting application.

* Created 2 `gulp` configurations for development & testing - `prod` and `dev` code.

* For serving public files I switched from `gulp-serve` to `browsersync` so I can add middleware `connect-gzip-static` to serve static pre-gzipped files from `public` directory.

* To run `localhost` server with `public` directory files, type:
```js
gulp server
```

* Links to access application:
    * http://localhost:8000/index.html
    * http://localhost:8000/restaurant.html?id={restaurant_id}

* To automatically build whole project, type:
    * Product ready code (**`used for final tests`**)
    ```js
    gulp build-prod
    ```
    * Development ready code with `gulp-watch`
    ```js
    gulp build-dev
    ```

## Modifications
done to project:
* `images` - converted images to .webp + added code to lazy load them
* `html`, `js` and `css` - minified, uglified, inlined and gzipped to resulting HTML files to improve load times
* `manifest` - created application icons
* `favicon` - created favorite icon for bookmarks
* `service worker` - added code to only cache `GET` requests
* `automation tools` - check `gulpfile.js` for whole configuration

## Implemented

* added `favorite buttons` for each restaurant in list & details view
* created form controls to `post new review` to server
* added `review validation` before posting
* added `data sync` feature for `reviews` and `restaurants` modified/created in `offline` mode which will synchronize any `pending` data to server
* added `accesibility` attributes to create review controls and favorite buttons
* `google map` loading scripts replaced with `static maps` to drastically improve performance as it gave the biggest impact on performance:
    * `restaurant details` - google map replaced with `static` google map integration to retrieve only image. Moved map bellow the fold and load it only when visible (used `IntersectionObserver`)
    * `restaurant list` - to increase app performance replaced the google map with `responsive` image screenshots
    * In both above cases when user clicks on static map it will only then load the real `interactive` map


## Lighthouse Results
For both pages all 3 criteria exceed **90** points.

`Restaurant list`
* Progressive Web App: = 91
* Performance: ~ 97
* Accessibility: = 100

`Restaurant details`
* Progressive Web App: = 91
* Performance: ~ 94
* Accessibility: = 94

## How to contribute?
Contact me through mail `vilde.andris@gmail.com` with suggestions.

## License
MIT License

Copyright (c) 2018 Andris Vilde

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
