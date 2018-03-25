# Mobile Web Specialist Certification Course
#### _Three Stage Course Material Project - Restaurant Reviews_
---
## Project Overview: Stage 2

For the **Restaurant Reviews** projects, you will incrementally convert a static webpage to a mobile-ready web application. In **Stage One**, you will take a static design that lacks accessibility and convert the design to be responsive on different sized displays and accessible for screen reader use. You will also add a service worker to begin the process of creating a seamless offline experience for your users.


## Code Owners
Initial:
* @forbiddenvoid @richardkalehoff @asparr

Modified: 
* avilde <Andris Vilde 'vilde.andris@gmail.com'>

## Notes For Reviewer

* Restructured whole project into `public` and `src` (source) folders where automation tool `gulp` is used to generate resulting application.

* For serving `public` folder I used `gulp-serve` instead of `python http.server` because when auditing page the python simple HTTP server tends to choke quite often.

* To run `localhost` server with `public` directory files, type:
```
gulp serve
```

* To automatically build whole project & run server, type:
```
gulp build
```

* Modifications done to files:
    * `images` - converted images to .webp + added code to lazy load them
    * `js` - concatenated, minified, uglified & generated source maps
    * `html` - minified, inlined basic CSS
    * `css` - using Sass pre-processor, minified
    * `manifest` - created application icons
    * `favicon` - created favorite icon for bookmarks
    * `service worker` - minified code
    * `gitignore` - added `node_modules` directory to be ignored
    * `automation tools` - check `gulpfile.js` for whole configuration

## Lighthouse Results
>Notes: 
> * results would have been way better if `Google Maps API` would use properly sized images & latest standarts like .webp, not to mention the time it blocks intereaction
> * used 4 different audit configurations to test my page
> * `restaurant.html` (restaurant details) page had similar results therefore have not created extra images and same goes for `Desktop` audit profiles

### 1) mobile - no throttling - clear storage 
![](./results/mobile-no_throttling-clear_storage.png)

### 2) mobile - no throttling - preserve storage
![](./results/mobile-no_throttling-preserve_storage.png)

### 3) mobile - slowdown - clear storage 
![](./results/mobile-slowdown-clear_storage.png)

### 4) mobile - slowdown - preserve storage 
![](./results/mobile-no_throttling-preserve_storage.png)
